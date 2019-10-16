'use strict';

const RESTClient = require('./src/client/RESTClient');
const RESTServer = require('./src/server/RESTServer');
const EventEmittingRESTServer = require('./src/server/EventEmittingRESTServer');

module.exports = {
	RESTClient,
	RESTServer,
	EventEmittingRESTServer
};
