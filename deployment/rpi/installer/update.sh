#!/usr/bin/env bash

docker-compose \
	-f ./docker-compose/docker-compose.prod.yml \
	pull
