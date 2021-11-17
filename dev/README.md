# Using the development version of Streamsheets

## Prerequisites

The following tools must be installed on your development computer:

* [Docker](https://www.docker.com/) and [Docker-Compose](https://docs.docker.com/compose/) (for running the backing services)
* [Yarn 1](https://classic.yarnpkg.com/lang/en/) (for running the Streamsheets services)
* [Node.js](https://nodejs.org/en/) (as JavaScript runtime)
* [Git](https://git-scm.com/) (for cloning the repository and collaborating)

## Installation

### Clone the Streamsheets repository

If you haven't already the first step is to clone the Streamsheets repository using the following command:

```
git clone https://github.com/eclipse/streamsheets.git
```

### Install the dependencies

Next you need to install the dependencies for Streamsheets. Since we use Yarn 1 use the following commands to first navigate to the clone `streamsheets` repository/folder and then install the dependencies:

```
cd streamsheets
yarn install
```

### Compile the gateway TypeScript code

Some parts of the gateway are implemented using TypeScript. Therefore we have a separate step to compile the TypeScript code into JavaScript code.

```
cd streamsheets/packages/gateway
yarn build
```

---
**NOTE**
This step is necessary everytime you change something in the gateway.

---

## Running

### Starting the backing services

Streamsheets uses the following backing services:
* [Mosquitto](https://mosquitto.org/): for internal communication between the services
* [MongoDB](https://www.mongodb.com/): for persistence
* [Redis](https://redis.io/): for caching

In order to start all those backing services properly we have prepared a [Docker Compose file](./docker-compose.dev.ext.yml). To run that file use the following command:

```
docker-compose -f docker-compose.dev.ext.yml up
```

Or if you want to run everything in detached mode:

```
docker-compose -f docker-compose.dev.ext.yml up -d
```

### Starting the gateway and all the other services

For starting the gateway and all the other Streamsheets services we have prepared a [`launch.json` configuration file](./launch.json) that can be used from Visual Studio Code. Please see the [official documentation](https://code.visualstudio.com/docs/editor/debugging) on how to run launch configurations in debug mode.

### Starting the frontend

To start the frontend use the following commands:

```
cd streamsheets/packages/webui
yarn start
```

This will open the browser at [http://localhost:3000](http://localhost:3000).

Happy coding! 😊