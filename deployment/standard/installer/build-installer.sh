#!/usr/bin/env bash
VERSION="${1:-1.5}"

docker build -t cedalo/streamsheets-installer:$VERSION-standard-linux . --build-arg os=linux
docker push cedalo/streamsheets-installer:$VERSION-standard-linux

docker build -t cedalo/streamsheets-installer:$VERSION-standard-win . --build-arg os=win
docker push cedalo/streamsheets-installer:$VERSION-standard-win

docker build -t cedalo/streamsheets-installer:$VERSION-standard-macos . --build-arg os=macos
docker push cedalo/streamsheets-installer:$VERSION-standard-macos