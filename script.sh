#!/usr/bin/env bash

# Author: Frank Hoogmoed & Stefan Fluit
# Target: <Insert target here>

# Set bash behaviour
set -o errexit      	# Exit on uncaught errors
set -o nounset      	# Dont allow unset variables
set -o pipefail     	# Fail pipe on first error

# Variables
declare git_location=$(ls /sys/class/net)
declare docker_volume="/var/puppeteer-tableau/src:/src"

# Functions
check_sudo() {
	if [ `/usr/bin/whoami` != 'root' ];then
		echo 'Error: run script with sudo'
		exit 1;
	fi
}


docker run --name puppeteer-tableau --network="puppeteer-tableau_default" --volume="/var/puppeteer-tableau/src:/src" --ipc="shareable" -d nodejs:image npm run start -- 64.rpm
sleep 8 && wget $(docker logs puppeteer-tableau | grep downloads)
#docker rm -f puppeteer-tableau
