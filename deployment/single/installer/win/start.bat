@echo off

docker network ls | findstr streamsheets || docker network create streamsheets

docker volume ls | findstr streamsheets-data || docker volume create streamsheets-data

set SCRIPT_LOCATION="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
set STREAMSHEETS_CONTAINER_EXISTS="$(docker ps -a -q --no-trunc --filter name=^/streamsheets$)"

if not %STREAMSHEETS_CONTAINER_EXISTS%
	echo "Creating and starting Streamsheets Docker container"
	docker run \
		-p 8081:8081 \
		-p 8083:8083 \
		-p 1883:1883 \
		-v %SCRIPT_LOCATION%/settings/mosquitto:/etc/mosquitto-default-credentials \
		-v streamsheets-data:/var/lib/mongodb \
		--name streamsheets \
		--network streamsheets \
		cedalo/streamsheets:1.5
else
	echo "Starting Streamsheets Docker container"
	docker start streamsheets -a
