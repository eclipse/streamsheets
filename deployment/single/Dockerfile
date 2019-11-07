FROM node:12.4.0-alpine
LABEL maintainer="philip.ackermann@cedalo.com"

RUN apk --no-cache add curl gnupg rsync unzip mongodb mosquitto redis supervisor

# MongoDB
COPY mongod.conf /etc/mongod.conf
VOLUME /var/lib/mongodb

# General
CMD [ "/usr/bin/supervisord", "-c", "/etc/supervisord.conf" ]


