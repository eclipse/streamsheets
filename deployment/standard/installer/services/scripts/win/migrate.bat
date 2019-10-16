@echo off

docker volume ls | findstr "streamsheets-data" >NUL
IF NOT ERRORLEVEL 1 (
	IF NOT "%1" == "--quiet" echo Already migrated
	exit /B 0
)

docker ps -af name=streamsheets-internal-database | findstr "streamsheets-internal-database" >NUL
IF ERRORLEVEL 1 (
	IF NOT "%1" == "--quiet" echo Nothing to migrate
	exit /B 0
)

docker start streamsheets-internal-database && ^
docker run --rm ^
	-e "MONGO_HOST=streamsheets-internal-mongodb" ^
	-e "MONGO_PORT=27017" ^
	-e "MONGO_DATABASE=streamsheets" ^
	--network="streamsheets" ^
	cedalo/streamsheets-migrate && ^
docker stop streamsheets-internal-database && ^
docker cp streamsheets-internal-database:/data/db/. ./.tmp && ^
docker container create --name streamsheets-temp -v streamsheets-data:/data busybox && ^
docker cp ./.tmp/. streamsheets-temp:/data && ^
docker rm -f streamsheets-temp streamsheets-internal-database && ^
RMDIR /S /Q .tmp
