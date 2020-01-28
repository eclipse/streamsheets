@echo off

SETLOCAL

FOR /f "tokens=*" %%i in ('docker ps -a -q --no-trunc --filter name^=^^streamsheets-dev$') DO SET STREAMSHEETS_CONTAINER_EXISTS=%%i
FOR /f "tokens=*" %%i in ('docker ps -q --no-trunc --filter name^=^^streamsheets-dev$') DO SET STREAMSHEETS_RUNNING=%%i

echo Checking for updates...
FOR /f "tokens=*" %%i in ('docker pull cedalo/streamsheets-dev ^| findstr /C:"Image is up to date"') DO SET NO_UPDATE=%%i

IF NOT ["%NO_UPDATE%"] == [""] (
	echo Already up-to-date
	exit /B 0
)

echo Updated Streamsheets to the latest version

IF NOT ["%STREAMSHEETS_CONTAINER_EXISTS%"] == [""] (
	IF NOT ["%STREAMSHEETS_RUNNING%"] == [""] (
		echo Stopping Streamsheets. Restart Streamsheets to finish the update
		docker stop streamsheets-dev
	)
	docker rm streamsheets-dev
)
