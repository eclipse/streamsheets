#!/usr/bin/env bash

STREAMSHEETS_CONTAINER_EXISTS="$(docker ps -a -q --no-trunc --filter name=^streamsheets-dev$)"
STREAMSHEETS_RUNNING="$(docker ps -q --no-trunc --filter name=^streamsheets-dev$)"

echo "Checking for updates..."
PULL_RESULT="$(docker pull cedalo/streamsheets-dev)"
NO_UPDATE="$(echo $PULL_RESULT | grep 'Image is up to date')"

if [ ! -z "$NO_UPDATE" ]
then
	echo "Already up-to-date"
	exit 0
fi

echo "Updated Streamsheets to the latest version"

if [ ! -z $STREAMSHEETS_CONTAINER_EXISTS ]
then
	if [ ! -z $STREAMSHEETS_RUNNING ]
	then
		echo "Stopping Streamsheets. Restart Streamsheets to finish the update"
		docker stop streamsheets-dev
	fi
	docker rm streamsheets-dev
fi
