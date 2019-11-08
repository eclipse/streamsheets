#!/usr/bin/env bash
docker run \
  -p 8080:8080 \
  -p 8081:8081 \
  -p 8083:8083 \
  -p 8088:8088 \
  --env-file streamsheets.env \
  cedalo/streamsheets:1.5-alpha
