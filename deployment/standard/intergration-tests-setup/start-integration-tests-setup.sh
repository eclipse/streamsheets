#!/usr/bin/env bash

CMD="${1:-up}"

echo "docker-compose ${CMD} on defaults services..."

docker-compose \
	-f ../installer/services/docker-compose/docker-compose.dev.ext.yml \
	-f ../installer/services/docker-compose/docker-compose.dev.yml \
	-f ../installer/services/docker-compose/docker-compose.mongodb.yml \
	-f ../installer/services/docker-compose/docker-compose.mosquitto.yml \
	-f ../installer/services/docker-compose/docker-compose.integration.tests.yml \
	$CMD
