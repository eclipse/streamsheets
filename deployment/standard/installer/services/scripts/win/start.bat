@echo off

docker network ls | findstr streamsheets || docker network create streamsheets

set CMD=%*
IF ["%CMD%"] == [""] set CMD=up

CALL "%~dp0migrate.bat" --quiet

echo "docker-compose %CMD% on base services..."

docker-compose ^
	-f "%~dp0..\..\docker-compose\docker-compose.prod.yml" ^
	%CMD%
