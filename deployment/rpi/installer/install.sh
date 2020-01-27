#!/bin/sh

NAME="streamsheets"
VERSION=$1

NOCOLOR='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
ORANGE='\033[0;33m'
YELLOW='\033[1;33m'

echo -e "${GREEN}---------------------------------------------------------------------"
echo -e "Streamsheets"
echo -e "---------------------------------------------------------------------${NOCOLOR}"

echo "--> Installing Streamsheets Personal Version"

echo "--> Creating directories"
mkdir -p "/streamsheets/settings/mosquitto"
touch "/streamsheets/settings/mosquitto/pw.txt"
echo "--> Copy scripts and files"

if [ "$VERSION" = "dev" ]
  then
	echo "--> Installing development version"
	rsync -r installer/ "/streamsheets"
  else
	rsync -r installer/ "/streamsheets" --exclude *.dev.*
	rsync -r installer/docker-compose/docker-compose.prod.yml "/streamsheets/docker-compose/docker-compose.prod.yml"
fi

echo -e "--> Successfully installed Streamsheets Pro Version"

