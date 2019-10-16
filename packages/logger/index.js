'use strict';

const Logger = require('./src/Logger');
const LoggerFactory = require('./src/LoggerFactory');
// TODO: revise to be able to create different loggers
const logger = new Logger();

module.exports = {
	create: options => new Logger(options),
	logger,
	LoggerFactory
};
