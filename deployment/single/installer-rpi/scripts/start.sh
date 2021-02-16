#!/usr/bin/env bash

CMD="${@:-up}"

rm -f ./data/mongo/mongod.lock

docker network ls --format={{.Name}} | grep '^streamsheets$' > /dev/null || docker network create streamsheets

docker-compose \
	-f ./docker-compose/docker-compose.prod.yml \
	$CMD
