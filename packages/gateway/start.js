const { LoggerFactory } = require('@cedalo/logger');
const GatewayService = require('./src/services/gateway/GatewayService');
const initializer = require('./src/initializer');
const metadata = require('./meta.json');
const packageJSON = require('./package.json');

const logger = LoggerFactory.createLogger('Gateway Service', process.env.GATEWAY_SERVICE_LOG_LEVEL);

metadata.version = packageJSON.version;
const service = new GatewayService(metadata);
service.start().then(() => {
	logger.info('Gateway service started');
	initializer.setup(service);
});
