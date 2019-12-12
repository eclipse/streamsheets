#!/bin/sh

NAME="streamsheets"
VERSION=$1

echo "--> Installing Streamsheets"

rsync -r installer/ "/streamsheets"

echo "--> Successfully installed Streamsheets"
