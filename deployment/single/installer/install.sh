#!/bin/sh

NAME="streamsheets"
VERSION=$1

echo "--> Installing Streamsheets"

rsync -r installer/ "/streamsheets"

if [ "$VERSION" = "dev" ]
  then
	echo "--> Installing development version"
	rsync -r installer/ "/streamsheets"
  else
	rsync -r installer/ "/streamsheets" --exclude *.dev.*
fi

echo "--> Successfully installed Streamsheets"
