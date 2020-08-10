#!/usr/bin/env bash

docker network ls | grep streamsheets > /dev/null || docker network create streamsheets

docker volume ls | grep streamsheets-data > /dev/null || docker volume create streamsheets-data

CMD=$1
STREAMSHEETS_CONTAINER_EXISTS="$(docker ps -a -q --no-trunc --filter name=^streamsheets$)"
STREAMSHEETS_RUNNING="$(docker ps -q --no-trunc --filter name=^streamsheets$)"
SCRIPT_LOCATION="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

if [[ $CMD = "update" ]]
  then
	"$SCRIPT_LOCATION/update.sh"
	exit 0
fi

if [ ! $STREAMSHEETS_CONTAINER_EXISTS ]
then
	echo "Creating and starting Streamsheets Docker container"
	mkdir -p "$SCRIPT_LOCATION/settings/mosquitto"
	docker run \
		-p 8081:8081 \
		-p 8083:8083 \
		-p 1883:1883 \
		-v "$SCRIPT_LOCATION/settings/mosquitto":/etc/mosquitto-default-credentials \
		-v streamsheets-data:/var/lib/mongodb \
		--name streamsheets \
		--network streamsheets \
		cedalo/streamsheets:2.0-milestone
else
	echo "Starting Streamsheets Docker container"
	docker start streamsheets -a
fi
