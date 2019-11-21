#!/usr/bin/env bash
docker run \
  -p 8081:8081 \
  --env-file streamsheets.env \
  cedalo/streamsheets:1.5-alpha
