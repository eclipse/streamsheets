FROM node:12.4.0-alpine
LABEL maintainer="philip.ackermann@cedalo.com"

RUN apk --no-cache add curl gnupg rsync unzip

RUN mkdir -p /installer

ARG version

# Copy the docker-compose files and set version
COPY ./docker-compose /installer/docker-compose
RUN sed -i "s/<VERSION>/$version/g" /installer/docker-compose/docker-compose.prod.yml

# Copy the os specific start scripts
COPY ./scripts /installer

# Copy the script executed during the installation
COPY install.sh /install
RUN chmod +x /install

ENTRYPOINT ["/install"]
