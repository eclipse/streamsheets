FROM node:12.4.0-alpine

RUN mkdir -p /app
RUN npm i -g pushstate-server@3.0.1
WORKDIR /app

COPY ./build .

EXPOSE 9000

CMD [ "pushstate-server", "./" ]