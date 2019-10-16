#!/usr/bin/env bash
SCRIPTPATH="$(cd "$(dirname "$0")" ; pwd -P )"
cd $SCRIPTPATH
sudo docker network ls | grep streamsheets > /dev/null || sudo docker network create streamsheets
sudo rm /internal-mongo/data/db/mongod.lock
sudo docker-compose up
