## puppeteer-tableau

# What does it do?
This might be a very useful container/script for DevOps/Sysadmin people who want to automate the installation of Tableau with their own scripts. I had a tough time figuring out how to fetch the latest .deb or .rpm file for Tableau Server and we ended up building this. It will use wget to download the latest version of Tableau server.

# Assumptions:
We assume you have Docker and Docker compose installed. If not, you can use this repo: https://github.com/stefanfluit/docker
We also assume you have Wget installed and are running Linux. Windows works to but, basically you only need to change the volume mappings. 

# Stack
- Docker
- Docker-Compose
- JavaScript
- Wget
- Bash
- Puppeteer

# How do i use it?
- Clone this repository
- Download it in /var and run the .sh script like: 
- sudo ./fetch_tableau.sh deb. So "deb" is a parameter. This might also be rpm, depending on your OS. 
  
The script will search for nodejs image, and will fetch it if not available. 
Feel free to post questions or contact me. 

Written by Frank Hoogmoed & Stefan Fluit
