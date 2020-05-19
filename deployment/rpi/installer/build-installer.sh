#!/usr/bin/env bash
VERSION="${1:-1.6-milestone}"

docker build -t cedalo/streamsheets-installer:$VERSION-rpi -f Dockerfile.rpi .
docker push cedalo/streamsheets-installer:$VERSION-rpi
