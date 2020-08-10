#!/usr/bin/env bash
VERSION="${1:-2.0-milestone}"

docker build -t cedalo/streamsheets-installer:$VERSION-rpi -f Dockerfile.rpi .
docker push cedalo/streamsheets-installer:$VERSION-rpi
