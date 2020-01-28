@echo off

docker network ls | findstr streamsheets || docker network create streamsheets

docker volume ls | findstr streamsheets-data-dev || docker volume create streamsheets-data-dev

SETLOCAL enableextensions

FOR /f "tokens=*" %%i in ('docker ps -a -q --no-trunc --filter name^=^^streamsheets-dev$') DO SET STREAMSHEETS_CONTAINER_EXISTS=%%i
FOR /f "tokens=*" %%i in ('docker ps -q --no-trunc --filter name^=^^streamsheets-dev$') DO SET STREAMSHEETS_RUNNING=%%i

If "%1"=="update" (
    "%~dp0update.dev.bat"
) ELSE (
	IF ["%STREAMSHEETS_CONTAINER_EXISTS%"] == [""] (
		echo "Creating and starting Streamsheets Docker container"
		md "%~dp0settings\mosquitto"
		docker run ^
			-p 8081:8081 ^
			-p 8083:8083 ^
			-p 1883:1883 ^
			-v "%~dp0settings\mosquitto":/etc/mosquitto-default-credentials ^
			-v streamsheets-data-dev:/var/lib/mongodb ^
			--name streamsheets-dev ^
			--network streamsheets ^
			cedalo/streamsheets-dev
	) ELSE (
		echo "Starting Streamsheets Docker container"
		docker start streamsheets-dev -a
	)
)
