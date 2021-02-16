@echo off

docker network ls | findstr streamsheets || docker network create streamsheets

docker volume ls | findstr streamsheets-data || docker volume create streamsheets-data

SETLOCAL

FOR /f "tokens=*" %%i in ('docker ps -a -q --no-trunc --filter name^=^^streamsheets$') DO SET STREAMSHEETS_CONTAINER_EXISTS=%%i
FOR /f "tokens=*" %%i in ('docker ps -q --no-trunc --filter name^=^^streamsheets$') DO SET STREAMSHEETS_RUNNING=%%i

If "%1"=="update" (
	"%~dp0update.bat"
) ELSE (
	IF ["%STREAMSHEETS_CONTAINER_EXISTS%"] == [""] (
		echo "Creating and starting Streamsheets Docker container"
		md "%~dp0settings\mosquitto"
		docker run ^
			-p 8081:8081 ^
			-p 8083:8083 ^
			-p 1883:1883 ^
			-v "%~dp0settings\mosquitto":/etc/mosquitto-default-credentials ^
			-v streamsheets-data:/var/lib/mongodb ^
			--name streamsheets ^
			--network streamsheets ^
			cedalo/streamsheets:2.0-milestone
	) ELSE (
		echo "Starting Streamsheets Docker container"
		docker start streamsheets -a
	)
)
