const StreamsService = require('./src/StreamsService');
const metadata = require('./meta.json');
const packageJSON = require('./package.json');
const { LoggerFactory } = require('@cedalo/logger');

const logger = LoggerFactory.createLogger(
	'Stream Service',
	process.env.STREAMSHEETS_STREAMS_SERVICE_LOG_LEVEL
);
metadata.version = packageJSON.version;

process.on('unhandledRejection', (error) => {
	// Won't execute
	logger.error('unhandledRejection');
	logger.error(error);
});

process.on('uncaughtException', (err) => {
	logger.error('uncaughtException');
	logger.error(err);
});

const start = async () => {
	const service = new StreamsService(metadata);
	await service.start();
	logger.info('Streams service started');
};

start();
