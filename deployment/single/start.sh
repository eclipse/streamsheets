#!/usr/bin/env bash
docker run \
  -p 8081:8081 \
  -v /tmp/db:/var/lib/mongodb \
  cedalo/streamsheets:1.5-alpha
