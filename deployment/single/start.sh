#!/usr/bin/env bash
docker run \
  -p 8081:8081 \
  -p 1883:1883 \
  -v /tmp/streamsheets/mosquitto:/etc/mosquitto-default-credentials \
  -v /tmp/streamsheets/db:/var/lib/mongodb \
  cedalo/streamsheets:1.5-alpha.1
