const GraphService = require('./src/services/graphs/GraphService');
const metadata = require('./meta.json');
const packageJSON = require('./package.json');
const { LoggerFactory } = require('@cedalo/logger');

const logger = LoggerFactory.createLogger(
	'Graph Service',
);

metadata.version = packageJSON.version;
process.on('unhandledRejection', (error) => {
	logger.error('unhandledRejection', error);
});
const service = new GraphService(metadata);
service
	.start()
	.then(() => {
		logger.info('Graph service started');
	});
