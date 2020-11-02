#!/usr/bin/env bash
set -uex
VERSION="${1}"

docker build . -t cedalo/streamsheets-installer:$VERSION-rpi --build-arg version="$VERSION"
docker push cedalo/streamsheets-installer:$VERSION-rpi

