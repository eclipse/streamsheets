const path = require('path');
const compose = require('docker-compose');

const COMPOSE_OPTIONS = { cwd: path.join(__dirname), log: true };
const startService = async (service) => {
	const { out, err } = await compose.upOne(service, COMPOSE_OPTIONS);
	if(err) {
		console.error(err);
	}
	console.log(out);
};

const stopServices = () => compose.stop(COMPOSE_OPTIONS);

module.exports = {
	startService,
	stopServices
};
