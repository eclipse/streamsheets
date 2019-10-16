#!/usr/bin/env bash

docker network ls | grep streamsheets > /dev/null || docker network create streamsheets

CMD="${@:-up}"
SCRIPT_LOCATION="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

"${SCRIPT_LOCATION}/migrate.sh" --quiet

docker volume ls | grep streamsheets-data > /dev/null || docker volume create streamsheets-data

echo "docker-compose ${CMD} on base services..."

	# -f ../../docker-compose/docker-compose.dev.node-red.yml \
	# -f ../../docker-compose/docker-compose.dev.database-ui.yml \

docker-compose \
	-f ../../docker-compose/docker-compose.dev.ext.yml \
	-f ../../docker-compose/docker-compose.dev.yml \
	-f ../../docker-compose/docker-compose.dev.mongodb.yml \
	-f ../../docker-compose/docker-compose.dev.mosquitto.yml \
	$CMD
