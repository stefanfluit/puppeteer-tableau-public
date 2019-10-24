#!/usr/bin/env bash

# Author: Frank Hoogmoed & Stefan Fluit
# Target: Downloads the latest Tableau server .deb or .rpm file

# Set bash behaviour
set -o errexit      	# Exit on uncaught errors
set -o nounset      	# Dont allow unset variables
set -o pipefail     	# Fail pipe on first error

# Functions
check_sudo() {
	if [ `/usr/bin/whoami` != 'root' ];then
		echo 'Error: run script with sudo'
		exit 1;
	fi
}

fetch_tableau_server() {
    local distro="${1}"
    local final_url=$(docker logs puppeteer-tableau | grep downloads)
    declare docker_volume="/var/puppeteer-tableau/src:/src"
    docker run --name "puppeteer-tableau" --network="puppeteer-tableau_default" --volume="${docker_volume}" --ipc="shareable" -d nodejs:image npm run start -- 64."${distro}" && sleep 8
    wget "${final_url}" && docker rm -f puppeteer-tableau
}

main() {
    check_sudo && fetch_tableau_server "${1}"
}

main
