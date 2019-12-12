FROM node:12.4.0-alpine
LABEL maintainer="philip.ackermann@cedalo.com"
ARG os

RUN mkdir -p /installer

RUN apk --no-cache add curl gnupg rsync unzip

# Copy the os specific start scripts
COPY ./${os} /installer

# Copy the script executed during the installation
COPY install.sh /install
RUN chmod +x /install

ENTRYPOINT ["/install"]
