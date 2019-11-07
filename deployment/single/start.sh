#!/usr/bin/env bash
docker run \
  -p 27017:27017 \
  -p 1883:1883 \
  -p 6379:6379 \
  cedalo/streamsheets
