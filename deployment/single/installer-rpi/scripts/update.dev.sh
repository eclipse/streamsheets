#!/usr/bin/env bash

docker-compose \
	-f ./docker-compose/docker-compose.dev.yml \
	pull
