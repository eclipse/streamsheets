FROM node:12.4.0-alpine
LABEL maintainer="philip.ackermann@cedalo.com"
ARG os

RUN mkdir -p /app

RUN apk --no-cache add curl gnupg rsync unzip

WORKDIR /app

# Copy the os specific start scripts
COPY ./services/scripts/${os} ./services/scripts/${os}

# Copy the configuration file containing the environment variables
COPY ./services/.env ./services/scripts/${os}/.env

# Copy the docker-compose files
COPY ./services/docker-compose ./services/docker-compose

# Copy the script executed during the installation
COPY install.sh /install
RUN chmod +x /install

RUN mkdir -p /software

ENTRYPOINT ["/install"]
