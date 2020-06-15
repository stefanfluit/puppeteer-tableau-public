#!/usr/bin/env bash

# Author: Frank Hoogmoed & Stefan Fluit
# Target: Downloads the latest Tableau server .deb or .rpm file

# Set bash behaviour
set -o errexit      	# Exit on uncaught errors
set -o pipefail     	# Fail pipe on first error

declare git_location="/var/puppeteer-tableau-public"
declare distro="${1}"

# Functions
check_sudo() {
	if [ `/usr/bin/whoami` != 'root' ];then
		echo 'Error: run script with sudo'
		exit 1;
	fi
}

fetch_tableau_server() {
    local docker_volume="/var/puppeteer-tableau-public/src:/src"
    docker run --name "puppeteer-tableau" --network="puppeteer-tableau_default" --volume="${docker_volume}" --ipc="shareable" -d nodejs:image npm run start -- 64."${distro}" && sleep 10
    echo $(docker logs puppeteer-tableau | grep downloads)
    docker rm -f puppeteer-tableau
}

main() {
    # You can uncomment this compose up command if this is not the first time running it. 
    cd "${git_location}"; docker-compose up;
    check_sudo && fetch_tableau_server "${distro}"
}

main
