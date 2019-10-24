//docker run --rm --name node_fb --network="facebook-fetcher_default" --ipc="shareable" --volume="/home/frank/repos/facebook-fetcher/src:/src" -d nodejs:image npm run startfb:dev


const puppeteer = require('puppeteer');
const mariadb = require('mariadb');
const testing = false;
/* let proxyhost = '185.93.245.216'
let proxyport = '9339';
let username = 'ict@datlinq.com';
let password = '5XYiGPZftS'; */
let proxyhost;
let proxyport;
let username; 
let password; 
let proxytries = 0;
let correctTries = 0;
const useragent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36';
const pool = mariadb.createPool({
  host: 'db.data-constructor.com',
  user: 'frank',
  password: '8MQJdugSHU6M!',
  database: 'www_facebook'});
CleanseDB();
MainLoop();

async function MainLoop(){
  let i = 0;
  fullProxy = await GetProxy();
  if(testing){
    url='https://www.whatsmyip.org/';
    data = await getData(url);
  } else {
    while(i == 0){
      console.log("Active connections: " + pool.activeConnections());
      console.log("Amount of times this proxy had a 30 sec timeout: " + proxytries);
      if(proxytries >=5 || correctTries > 5){
        verbindung = await pool.getConnection();
        if(fullProxy.id != undefined && proxytries >= 5){
          await verbindung.query("UPDATE _proxy_facebook SET state='good', failed = failed + 1 WHERE id = " + fullProxy.id);
        } else if (fullProxy.id != undefined && correctTries > 5) {
          await verbindung.query("UPDATE _proxy_facebook SET state='good' WHERE id = " + fullProxy.id);
        }
        verbindung.end();
        await GetProxy();
        proxytries = 0; correctTries = 0;
      }

      await toString(await getUrl());//console.log(record);
      data = await getData(record.url);
      if(data == null) {
        console.log("No data found, probably wrong page.")
        connection = await pool.getConnection();
        await connection.query("UPDATE url_queue SET state='todo', retry= retry + 1 WHERE url_id='" + record.url_id + "'");
        connection.end();
      } else {
        await pushData(data, record);
        correctTries++;
      }
      console.log('please proceed');
    }
  }
}

async function getUrl(){
  let conn;
  try{
    conn = await pool.getConnection(); //console.log("connection made, querying for url.");
    let row = await conn.query("SELECT * FROM url_queue WHERE state='todo' AND retry<10 ORDER BY modified ASC LIMIT 1 FOR UPDATE");
    //console.log("The record is of type: " + typeof row[0]);
    //console.log("locking the url that needs to be done.");
    var beginQ = "UPDATE url_queue SET state='inprogress' WHERE url_id='";
    var midQ = row[0].url_id;
    var endQ = "'";
    let updatequery = beginQ.concat(midQ ,endQ);
    await conn.query(updatequery);
    console.log("Fetching...");
    record = row[0];
    return record;
  } catch (err) {
    console.log(err);
  } finally {
    if (conn) conn.end();
  }
}

async function getData(url){
  var data = {};
  urls = url.match(/(pages)/); if(urls != undefined){return null;}
  url = url.replace(/(?<=https\:\/\/)(.*?)(?=\.facebook)/, "nl-nl");
  url = url.match(/([^/]*\/){3}[^/]*/)[0];
  console.log(url);
  
  const browser = await puppeteer.launch({
    defaultViewport: {width:1920,height:1080},
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=en-US,en', '--proxy-server=http://' + proxyhost + ":" + proxyport],
    ignoreHTTPSErrors: true,
    dumpio: false
  });
  
  const page = await browser.newPage();
  //const numberOfOpenPages = (await browser.pages()).length;
  //console.log(numberOfOpenPages);
  //page.on('console', consoleObj => console.log(consoleObj.text()));
  try{
    await page.setUserAgent(useragent);
    await page.authenticate({
      username: username,
      password: password
    });
    await page.setExtraHTTPHeaders({'Accept-Language': 'en-US,en'});
    await page.goto(url, {waitUntil: 'networkidle0'});
  } catch (err) {
    console.log(err);
    proxytries++;
    await page.close();
    await browser.close();
    return null;
  } 
  
  /*-------------------------------------------pagecheck-------------------------------------*/
  try{
    await page.waitForSelector('script[type*="application/ld+json"]', {timeout: 10000});
  } catch (err) {
    console.log(err);
    name = url.replace(/[:\/\\*?"|<>]+/g, "");
    await page.screenshot({path: '/src/wwwroot/debug/img/facebook/' + name +'.png'});
    proxytries++;
    await page.close();
    await browser.close();
    return null;
  }
  
  //await page.click('*[data-key="tab_home"]').catch(); ///////fixxxxxx
  //console.log(response.headers);
  //await page.screenshot({path: '/src/wwwroot/debug/img/example.png'});
  /*--------------------------------------------address---------------------------------------*/
  
  script = await page.evaluate(() => document.querySelector('script[type*="application/ld+json"]').innerText.trim());
  script = JSON.parse(script);
  if(script.address != null){

   data.id_name = script.name.replace(/["']/,"");
   data.address_streetHouseNumber = script.address.streetAddress;
   data.address_postalCode = script.address.postalCode;
   var addresses = script.address.addressLocality.split(",");
   i = addresses.length - 1;
   if(i != 0) {
     data.address_country = addresses[i].trim();
   }
   data.address_locality = addresses[0];
  } else {
    name = url.replace(/[:\/\\*?"|<>]+/g, "");
    await page.screenshot({path: '/src/wwwroot/debug/img/facebook/' + name +'.png'});
    page.close();
    browser.close();
    return null;
  }
  if(script.aggregateRating !== undefined){
    data.average_rating = script.aggregateRating.ratingValue
  } else {
    data.average_rating = null;
  }

  /* ------------------------------------------reviews--------------------------------------*/
  data.reviews = await page.evaluate(() => {
    let reviewlist = document.querySelectorAll('script[type*="application/ld+json"]');
    //console.log(reviewlist);
    if(reviewlist.length > 1) {
      let reviews = [reviewlist.length];
      for(i = 1; i < reviewlist.length; i++){
        var reviewdata = {};
        indreview = JSON.parse(reviewlist[i].innerText);
        //console.log(indreview);
        if(indreview.reviewRating != undefined){
          reviewdata.date = null;
          reviewdata.language = null;
          reviewdata.rating = indreview.reviewRating.ratingValue;
          reviewdata.text = indreview.reviewBody.replace(/"|"/g,"");
          reviewdata.title = null;
          reviewdata.username = indreview.author.name;
          reviews.push(reviewdata);
        }
      }
      return reviews;
    } else {
      return null;
    }
    
    
  });

  /*--------------------------------------------tags----------------------------------------*/
  data.tags = {};
  data.tags.latest_date = await page.evaluate(() => {
    var oldtime = 0;
    let datelist = document.querySelectorAll('abbr');
    datelist.forEach(element => { 
      var time = element.getAttribute('data-utime');
      if (time > oldtime){
        oldtime = time;
      }
    });
    return oldtime;
  });
  data.tags.likes = await page.evaluate(() => {
    let altimages = document.querySelectorAll('img[alt="Highlights info row image"]'); //console.log(altimages[0].parentNode.nextSibling.innerText);
    if(altimages != null) {
      if(altimages.length > 0){
        let likes = altimages[0].parentNode.nextSibling.innerText.replace(".","");
        var matches = likes.match(/[0-9.,]+/g);
        if(matches != null) {
          if(matches.length > 0) {
            var like = matches[0];
            if(like !=null){
              return like;
            }  
          }
        }
      }
      return null;
    }
  });
  data.tags.followers = await page.evaluate(() => {
    let altimages = document.querySelectorAll('img[alt="Highlights info row image"]');
    if(altimages != null) {
      if(altimages.length > 1){
        var followers = altimages[1].parentNode.nextSibling.innerText.replace(".","");
        var matches = followers.match(/[0-9.,]+/g);
        if(matches != null) {
          if(matches.length > 0) {
            follower = matches[0];
            if(follower != null) {
              return follower;
            }
          }
        }  
      }
      return null;
    }
  });
 
  //console.log(data);
  console.log("Amount of likes:" + data.tags.likes);
  await page.close();
  browser.close();
  return data;
}

async function pushData(data, record){
  //push the general data:
  try{
    pushdata = [record.url, data.address_country, data.address_locality, data.address_postalCode, data.address_streetHouseNumber, data.id_name, record.do_klantnr, data.average_rating].join('","'); //console.log(pushData);
    generaldataQuery = 'INSERT INTO com_facebook (fetched_url, address_country, address_locality, address_postalCode, address_streetHouseNumber, id_name, do_klantnr, average_rating) VALUES ("' + pushdata + '")'; //console.log(generaldataQuery);
    conn = await pool.getConnection();
    await conn.query(generaldataQuery); 
    
    //push the extra data like reviews and tags:
    idquery = 'SELECT id FROM com_facebook WHERE do_klantnr="'+ record.do_klantnr + '" AND id_name="' + data.id_name + '" ORDER BY id DESC LIMIT 1'; //console.log(idquery);
    let idrow = await conn.query(idquery); 
    let fid = idrow[0].id;
    console.log("the id is: " + fid + ". <--Use this as fid");
    if(data.reviews != null) { 
      multireviewquery = 'INSERT INTO com_facebook_reviews (rating, text, username, fid) VALUES ';
      //console.log(data.reviews.length);
      let reviewarray = [];
      for (let index = 0; index < data.reviews.length; index++) {
        if(data.reviews[index].username != undefined || data.reviews[index].username != null || data.reviews[index].username != ""){
          reviewarray.push('("' + data.reviews[index].rating + '","' + data.reviews[index].text + '","' + data.reviews[index].username + '","' + fid + '")');
        }
      }
      multireviewquery += reviewarray.join(","); //console.log(multireviewquery);
      await conn.query(multireviewquery);
    }
    //push the tags
    tagsData = [record.do_klantnr, fid, data.tags.likes, data.tags.followers, data.tags.latest_date].join('","');
    tagsquery = 'INSERT INTO com_facebook_tags (do_klantnr, fid, likes, followers, latest_date) VALUES ("'+ tagsData + '")';
    await conn.query(tagsquery);
  
    await conn.query("UPDATE url_queue SET state='done' WHERE url_id='" + record.url_id + "'");

  } catch (err) {
    console.log(err);
    conn.query("UPDATE url_queue SET state='todo', retry=retry + 1 WHERE url_id='" + record.url_id + "'");
  } finally {
    if(conn) {
      conn.end();
    }
  }
}

async function GetProxy(){
  connect = await pool.getConnection();
  fullProxy = await connect.query("SELECT * FROM _proxy_facebook NATURAL JOIN proxy.credentials WHERE _proxy_facebook.type='http' AND state<>'inuse' ORDER BY id ASC LIMIT 1 FOR UPDATE");
  connect.query("UPDATE _proxy_facebook SET state='inuse' WHERE id = " + fullProxy[0].id);
  proxyhost = fullProxy[0].ip4;
  proxyport = fullProxy[0].port;
  username = fullProxy[0].username;
  password = fullProxy[0].password;
  connect.end();
  return fullProxy[0];
}

async function CleanseDB() {
  db = await pool.getConnection();
  await db.query('UPDATE url_queue SET state="todo" where state="inprogress"');
  db.end();
}