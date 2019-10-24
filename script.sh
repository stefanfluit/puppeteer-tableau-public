#!/bin/bash

docker run --name puppeteer-tableau --network="puppeteer-tableau_default" --volume="/var/puppeteer-tableau/src:/src" --ipc="shareable" -d nodejs:image npm run start -- 64.rpm
sleep 8 && wget $(docker logs puppeteer-tableau | grep downloads)
#docker rm -f puppeteer-tableau
