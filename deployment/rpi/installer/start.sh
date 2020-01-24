#!/usr/bin/env bash
SCRIPTPATH="$(cd "$(dirname "$0")" ; pwd -P )"
cd $SCRIPTPATH
sudo docker network ls | grep streamsheets > /dev/null || sudo docker network create streamsheets
sudo rm -f /internal-mongo/data/db/mongod.lock

SCRIPT_LOCATION="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

docker volume ls | grep streamsheets-data > /dev/null || docker volume create streamsheets-data

sudo docker-compose \
	-f ./docker-compose/docker-compose.yml \
	up