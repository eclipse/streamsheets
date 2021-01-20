FROM node:12.4.0-alpine
LABEL maintainer="philip.ackermann@cedalo.com"

ENV SWAGGER_SPEC_PATH=streamsheets/packages/gateway/src/public/swagger-spec/v1.0/gateway.yaml \
	MESSAGE_BROKER_URL=mqtt://localhost:1884 \
	MESSAGE_BROKER_KEEP_ALIVE=20 \
	MESSAGE_BROKER_USERNAME=cedalo \
	MESSAGE_BROKER_PASSWORD=r35aJkR!&dz \
	HTTP_PORT=8086 \
	HTTP_HOST=localhost \
	GATEWAY_HTTP_PORT=8080 \
	GATEWAY_HTTP_HOST=localhost \
	MONGO_DATABASE=streamsheets \
	MONGO_HOST=localhost \
	MONGO_PORT=27017 \
	REDIS_HOST=localhost \
	REDIS_PORT=6379 \
	GATEWAY_SERVICE_LOG_LEVEL=info \
	STREAMSHEETS_GATEWAY_CONFIGURATION_PATH=config/config-production.json \
	WEBPAGE_BASE=/var/tmp/ \
	GATEWAY_SOCKET_ENDPOINT=ws://localhost:8080/machineserver-proxy \
	MACHINE_SERVICE_LOG_LEVEL=info \
	GATEWAY_HOST=localhost \
	GRAPH_SERVICE_LOG_LEVEL=info \
	MONGO_USER_DB_URI=mongodb://localhost:27017/userDB \
	RESTSERVER_PORT=8083 \
	STREAMSHEETS_LOG_LEVEL=debug \
	STREAMSHEETS_STREAMS_SERVICE_LOG_LEVEL=info \
	NODE_ENV=production \
	STREAMS_SERVICE_START_DELAY=5000

RUN apk --no-cache add g++ make bash curl nginx git gnupg rsync unzip mongodb mosquitto openssl redis supervisor

# Streamsheets services
COPY deployment/single/services /services
COPY .yarnrc package.json yarn.lock /streamsheets/
COPY packages /streamsheets/packages
RUN cd /streamsheets && yarn install --production --frozen-lockfile
# TODO: Check if this is really necessary
COPY packages/gateway/config /config
COPY packages/webui/build /streamsheets/packages/gateway/public
COPY deployment/single/wait-for-database.sh wait-for-database.sh

# Create directories for logging
RUN mkdir -p \
	/var/log/mosquitto \
	/var/log/mosquitto-default \
	/var/log/gateway \
	/var/log/service-graphs \
	/var/log/service-machines \
	/var/log/service-streams

# # TODO: build WebUI in Docker image
# RUN npm install --global cross-env
# RUN cd /streamsheets/packages/webui && yarn install --production && npm run build

# MongoDB
COPY deployment/single/mongodb/mongod.conf /etc/mongod.conf
VOLUME /var/lib/mongodb

# Mosquitto
COPY deployment/single/mosquitto etc/mosquitto

# Default Mosquitto
COPY deployment/single/mosquitto-default etc/mosquitto-default
COPY deployment/single/mosquitto-default-credentials etc/mosquitto-default-credentials

# Redis
COPY deployment/single/redis/redis.conf /etc/redis.conf

# nginx
COPY deployment/single/nginx/nginx.conf /etc/nginx/nginx.conf

# Supervisor
RUN mkdir -p /var/log/supervisor
COPY deployment/single/supervisord.conf /etc/supervisord.conf

# Copy default setup
COPY deployment/single/init.json streamsheets/packages/gateway/config

# Copy start script
COPY deployment/single/streamsheets.sh streamsheets.sh

# Expose MongoDB port
EXPOSE 27017
# Expose Mosquitto port
EXPOSE 1883
# Expose Redis port
EXPOSE 6379
# Expose nginx port
EXPOSE 8081
# Expose Gateway port
EXPOSE 8080
# Expose Streams Service port
EXPOSE 8083

# General
CMD [ "sh", "streamsheets.sh" ]
