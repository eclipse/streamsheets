#!/usr/bin/env bash
docker run \
  -p 27017:27017 \
  -p 1883:1883 \
  -p 6379:6379 \
  -p 8080:8080 \
  -p 8081:8081 \
  -p 8083:8083 \
  -p 8090:8090 \
  -p 8091:8091 \
  -p 9000:9000 \
  --env-file streamsheets.env \
  cedalo/streamsheets:2.0-milestone
