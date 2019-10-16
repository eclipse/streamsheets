@echo off

docker network ls | findstr streamsheets || docker network create streamsheets

set CMD=%*
IF ["%CMD%"] == [""] set CMD=up

CALL "%~dp0migrate.bat" --quiet

docker volume ls | findstr streamsheets-data || docker volume create streamsheets-data

echo "docker-compose %CMD% on all services..."

docker-compose ^
	-f "%~dp0..\..\docker-compose\docker-compose.dev.yml" ^
	-f "%~dp0..\..\docker-compose\docker-compose.dev.ext.yml" ^
	-f "%~dp0..\..\docker-compose\docker-compose.dev.database-ui.yml" ^
	-f "%~dp0..\..\docker-compose\docker-compose.dev.mongodb.yml" ^
	-f "%~dp0..\..\docker-compose\docker-compose.dev.mosquitto.yml" ^
	-f "%~dp0..\..\docker-compose\docker-compose.dev.node-red.yml" ^
	%CMD%
