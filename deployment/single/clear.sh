#!/usr/bin/env bash

docker kill streamsheets
docker rm streamsheets
docker network rm streamsheets
docker volume rm streamsheets-data
