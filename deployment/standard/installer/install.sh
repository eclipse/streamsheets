#!/bin/sh

NAME="streamsheets"
VERSION=$1

echo "--> Installing Streamsheets"

echo "--> Preparing docker-compose files"
mkdir -p "/streamsheets/services/docker-compose"
mkdir -p "/streamsheets/services/docker-compose/license"

if [ "$VERSION" = "dev" ]
  then
	echo "--> Installing development version"
	rsync -r services "/streamsheets"
  else
	rsync -r services/docker-compose/docker-compose.prod.yml "/streamsheets/services/docker-compose/docker-compose.prod.yml"
	rsync -r services/scripts "/streamsheets/services" --exclude *.dev.*
fi

echo "--> Successfully installed Streamsheets"
