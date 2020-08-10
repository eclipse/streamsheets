#!/usr/bin/env bash
VERSION="${1:-2.0-milestone}"

docker build -t cedalo/streamsheets-installer:$VERSION-linux . --build-arg os=linux
docker push cedalo/streamsheets-installer:$VERSION-linux

docker build -t cedalo/streamsheets-installer:$VERSION-win . --build-arg os=win
docker push cedalo/streamsheets-installer:$VERSION-win

docker build -t cedalo/streamsheets-installer:$VERSION-macos . --build-arg os=macos
docker push cedalo/streamsheets-installer:$VERSION-macos
