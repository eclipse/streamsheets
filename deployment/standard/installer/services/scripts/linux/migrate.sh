#!/usr/bin/env bash

if [ "$(docker volume ls | grep streamsheets-data)" ]; then
	if [ "$1" != "--quiet" ]; then
		echo "Already migrated"
	fi
	exit 0
fi

docker volume create streamsheets-data

if [ -z "$(docker ps -aqf name=streamsheets-internal-database)" ]; then
	if [ "$1" != "--quiet" ]; then
		echo "Nothing to migrate"
	fi
	exit 0
fi

docker start streamsheets-internal-database \
	&& docker run \
		-e "MONGO_HOST=streamsheets-internal-mongodb" \
		-e "MONGO_PORT=27017" \
		-e "MONGO_DATABASE=streamsheets" \
		--network="streamsheets" \
		cedalo/streamsheets-migrate \
	&& docker stop streamsheets-internal-database \
	&& docker cp streamsheets-internal-database:/data/db/. ./.tmp \
	&& docker container create --name streamsheets-temp -v streamsheets-data:/data busybox \
	&& docker cp ./.tmp/. streamsheets-temp:/data \
	&& docker rm -f streamsheets-temp streamsheets-internal-database
	&& rm -rf .tmp
