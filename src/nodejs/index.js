const puppeteer = require('puppeteer');

//docker run --name gayboi --network="puppeteer-tableau_default" --volume="/host_mnt/c/repos/puppeteer-tableau/src:/src" --ipc="shareable" -d nodejs:image npm run start:dev

process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
}); 

const args = process.argv.slice(2);

(async () => {
  const browser = await puppeteer.launch({
    defaultViewport: {width:1920,height:1080},
    args: [ '--no-sandbox', '--disable-setuid-sandbox','--lang=en-US,en'],
    ignoreHTTPSErrors: true,
    dumpio: false
  });
  url =' https://www.tableau.com/support/releases/server';

  //console.log("testing the console.");

  const page = await browser.newPage();
  //page.on('console', consoleObj => console.log(consoleObj.text()));
  try {
    //await page.setUserAgent(useragent);
    await page.setExtraHTTPHeaders({'Accept-Language': 'en-US,en'});
    await page.goto(url, {waitUntil: 'networkidle0'});
  } catch (err) {
    console.log(err);
    await page.close();
    await browser.close();
  }

  /*-------------------------------------------pagecheck-------------------------------------*/
  try {
    await page.waitForSelector('div[class*="view-content"]', {timeout: 10000});
  } catch (err) {
    console.log(err);
  }

  /* ---------------------------------------Get the download page--------------------------- */
    url = await page.evaluate(() => document.querySelector('div[class*="view-content"]').children[0].querySelector('a[class*="text--medium-body"]').getAttribute('href')); 
  console.log("The download page is: "+ url);

  console.log("Navigating to the downloadpage...");
  await page.goto(url, {waitUntil: 'networkidle0'});

  try {
    await page.waitForSelector('*[class="link-list"]', {timeout: 10000});
  } catch (err) {
    console.log(err);
  }

  var version = await page.evaluate((args) => {
    versions = document.querySelectorAll('*[class="link-list"]')[1].querySelectorAll('a');
    for(i = 0; i < versions.length; i++){
      let name = versions[i].innerText;
      if(name.includes(args)){
        return versions[i].getAttribute('href');
      }
    }
  }, args);    
  
  if(version == undefined) {
    console.log('version not found');
  } else {
    console.log(version);
  }
  
  //await page.screenshot({path: '/src/example.png'});


  await browser.close();
})();

//document.querySelectorAll('*[class="link-list"]')[1].children