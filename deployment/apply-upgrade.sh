#!/bin/sh

VERSION_FROM=$1
VERSION_TO=$2

if [ $# -eq 2 ]
	then 
		echo "upgrade"
		echo "from:\t" $VERSION_FROM
		echo "to:\t" $VERSION_TO
		docker tag cedalo/streamsheets-webui:$VERSION_FROM cedalo/streamsheets-webui:$VERSION_TO
		docker tag cedalo/streamsheets-gateway:$VERSION_FROM cedalo/streamsheets-gateway:$VERSION_TO
		docker tag cedalo/streamsheets-service-graphs:$VERSION_FROM cedalo/streamsheets-service-graphs:$VERSION_TO
		docker tag cedalo/streamsheets-service-streams:$VERSION_FROM cedalo/streamsheets-service-streams:$VERSION_TO
		docker tag cedalo/streamsheets-service-machines:$VERSION_FROM cedalo/streamsheets-service-machines:$VERSION_TO
		docker tag cedalo/reverseproxy:$VERSION_FROM cedalo/reverseproxy:$VERSION_TO

		docker push cedalo/streamsheets-webui:$VERSION_TO
		docker push cedalo/streamsheets-gateway:$VERSION_TO
		docker push cedalo/streamsheets-service-graphs:$VERSION_TO
		docker push cedalo/streamsheets-service-streams:$VERSION_TO
		docker push cedalo/streamsheets-service-machines:$VERSION_TO
		docker push cedalo/reverseproxy:$VERSION_TO
	else
		echo "Please provide version numbers"
fi