FROM node:12.4.0-alpine
LABEL maintainer="philip.ackermann@cedalo.com"

RUN apk --no-cache add g++ make curl nginx git gnupg rsync unzip mongodb mosquitto redis supervisor

# Streamsheets services
COPY services /services
COPY streamsheets /streamsheets
RUN cd /streamsheets && yarn install --production
RUN npm i -g pushstate-server@3.0.1
COPY streamsheets/packages/gateway/config /config

# # TODO: build WebUI in Docker image
# RUN npm install --global cross-env
# RUN cd /streamsheets/packages/webui && yarn install --production && npm run build

# MongoDB
COPY mongodb/mongod.conf /etc/mongod.conf
VOLUME /var/lib/mongodb

# # Mosquitto
COPY mosquitto etc/mosquitto

# Redis
COPY redis/redis.conf /etc/redis.conf

# nginx
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Supervisor
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisord.conf

# Expose MongoDB port
EXPOSE 27017
# Expose Mosquitto port
EXPOSE 1883
# Expose Redis port
EXPOSE 6379
# Expose nginx port
EXPOSE 8081
# Expose Web UI port
EXPOSE 9000
# Expose Gateway ports
EXPOSE 8080 8088
# Expose Streams Service port
EXPOSE 8083

# General
CMD [ "/usr/bin/supervisord", "-c", "/etc/supervisord.conf" ]
