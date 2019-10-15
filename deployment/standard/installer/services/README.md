# Usage

## Start application with multiple machine service instances

Example: start application with 5 machine service instances
```
#!/usr/bin/env bash
docker-compose \
	-f ./docker-compose/docker-compose.dev.ext.yml \
	-f ./docker-compose/docker-compose.dev.yml \
	-f ./docker-compose/docker-compose.mongodb.yml \
	-f ./docker-compose/docker-compose.mosquitto.yml \
	up \
	--scale service-machines=5
```
