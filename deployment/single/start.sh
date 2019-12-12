#!/usr/bin/env bash

docker network ls | grep streamsheets > /dev/null || docker network create streamsheets

if [ ! "$(docker ps -a -q --no-trunc --filter name=^/streamsheets$)" ]
then
	echo "Creating and starting Streamsheets Docker container"
	docker run \
		-p 8081:8081 \
		-p 8083:8083 \
		-p 1883:1883 \
		-v /tmp/streamsheets/mosquitto:/etc/mosquitto-default-credentials \
		-v /tmp/streamsheets/db:/var/lib/mongodb \
		--name streamsheets \
		--network streamsheets \
		cedalo/streamsheets:1.5-alpha.1
else
	echo "Starting Streamsheets Docker container"
	docker start streamsheets -a
fi
