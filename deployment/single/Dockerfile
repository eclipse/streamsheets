FROM node:12.4.0-alpine
LABEL maintainer="philip.ackermann@cedalo.com"

RUN apk --no-cache add curl gnupg rsync unzip mongodb mosquitto redis supervisor

# MongoDB
COPY mongodb/mongod.conf /etc/mongod.conf
VOLUME /var/lib/mongodb

# # Mosquitto
COPY mosquitto etc/mosquitto

# Redis
COPY redis.conf /etc/redis.conf

# Supervisor
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisord.conf

# Expose MongoDB port
EXPOSE 27017
# Expose Mosquitto port
EXPOSE 1883
# Expose Redis port
EXPOSE 6379

# General
CMD [ "/usr/bin/supervisord", "-c", "/etc/supervisord.conf" ]


