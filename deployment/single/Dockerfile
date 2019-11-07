FROM node:12.4.0-alpine
LABEL maintainer="philip.ackermann@cedalo.com"

RUN apk --no-cache add curl gnupg rsync unzip mongodb mosquitto redis supervisor

# MongoDB
COPY mongodb/mongod.conf /etc/mongod.conf
VOLUME /var/lib/mongodb

# # Mosquitto
COPY mosquitto etc/mosquitto

# Redis
COPY redis/redis.conf /etc/redis.conf

# Streamsheets services
COPY services /services

# Supervisor
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisord.conf

# Expose MongoDB port
EXPOSE 27017
# Expose Mosquitto port
EXPOSE 1883
# Expose Redis port
EXPOSE 6379
# Expose Web UI port
EXPOSE 9000
# Expose Gateway ports
EXPOSE 8082 8088
# Expose Streams Service port
EXPOSE 8083

# General
CMD [ "/usr/bin/supervisord", "-c", "/etc/supervisord.conf" ]


