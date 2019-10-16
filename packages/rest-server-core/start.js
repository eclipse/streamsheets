const config = require('./config/start.json');
const EventEmittingRESTServer = require('./src/server/EventEmittingRESTServer');

config.basedir = __dirname;

const server = new EventEmittingRESTServer(config);
server.start();

