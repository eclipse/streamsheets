#!/usr/bin/env sh

rm -rf ./packagejsons*
mkdir -p packagejsons
tar cf packagejsons.tar packages/*/package.json packages/*/*/package.json
tar xf packagejsons.tar -C packagejsons
docker build . -f scripts/Dockerfile.contextholder -t contextholder
rm -rf ./packagejsons
