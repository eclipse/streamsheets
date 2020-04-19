#!/bin/sh

until nc -z $MONGO_HOST $MONGO_PORT
do
    echo "Waiting for MongoDB ($MONGO_HOST:$MONGO_PORT) to start..."
    sleep 0.5
done

eval $*
