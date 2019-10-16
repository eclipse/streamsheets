const MachineService = require('./src/machines/MachineService');
const metadata = require('./meta.json');
const packageJSON = require('./package.json');
const logger = require('./src/utils/logger').create({ name: 'Machine Service' });


metadata.version = packageJSON.version;

process.on('unhandledRejection', (error) => {
	logger.error('unhandledRejection', error);
	logger.error(error);
});

const service = new MachineService(metadata);
service
	.start()
	.then(() => {
		logger.info('Machine service started');
	});
