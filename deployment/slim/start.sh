#!/usr/bin/env bash

docker rm streamsheets-slim 

docker run \
	-p 8081:8081 \
	-p 8083:8083 \
	-v streamsheets-data:/var/lib/mongodb \
	--name streamsheets-slim \
	--network streamsheets \
	cedalo/streamsheets-slim:1.5
