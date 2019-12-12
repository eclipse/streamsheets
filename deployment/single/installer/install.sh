#!/bin/sh

NAME="streamsheets"
VERSION=$1

echo "--> Installing Streamsheets"

mkdir -p "/streamsheets/license"
rsync -r installer/ "/streamsheets"

echo "--> Successfully installed Streamsheets"
