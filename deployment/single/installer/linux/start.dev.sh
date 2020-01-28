#!/usr/bin/env bash

docker network ls | grep streamsheets > /dev/null || docker network create streamsheets

docker volume ls | grep streamsheets-data-dev > /dev/null || docker volume create streamsheets-data-dev

CMD=$1
STREAMSHEETS_CONTAINER_EXISTS="$(docker ps -a -q --no-trunc --filter name=^streamsheets-dev$)"
STREAMSHEETS_RUNNING="$(docker ps -q --no-trunc --filter name=^streamsheets-dev$)"
SCRIPT_LOCATION="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

if [[ $CMD = "update" ]]
  then
	"$SCRIPT_LOCATION/update.dev.sh"
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
		-v streamsheets-data-dev:/var/lib/mongodb \
		--name streamsheets-dev \
		--network streamsheets \
		cedalo/streamsheets-dev
else
	echo "Starting Streamsheets Docker container"
	docker start streamsheets-dev -a
fi
