#!/bin/sh

echo "deploying webui"
echo "building docker image using tag $1"
docker build -t cedalo/webui:$1 .
echo "logging into docker hub"
docker login -u $DOCKER_USER -p $DOCKER_PASSWORD
echo "pushing image \"cedalo/webui:$1\""
docker push cedalo/webui:$1
echo "done"

if [ $TRAVIS_TAG ]
  then
  	echo "building docker image using tag $TRAVIS_TAG"
	docker build -t cedalo/webui:$TRAVIS_TAG .
	echo "logging into docker hub"
	docker login -u $DOCKER_USER -p $DOCKER_PASSWORD
	echo "pushing image \"cedalo/webui:$TRAVIS_TAG\""
	docker push cedalo/webui:$TRAVIS_TAG
	echo "done"
fi
