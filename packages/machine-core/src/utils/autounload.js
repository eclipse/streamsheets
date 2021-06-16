const logger = require('../logger').create({ name: 'AutoUnload' });
const { State } = require('../State');

const AUTO_UNLOAD_TIMEOUT = process.env.AUTO_UNLOAD_TIMEOUT || 60 * 1000;

let timeoutId;
const cancel = () => {
	if (timeoutId) {
		logger.debug('clear unload timer...');
		clearTimeout(timeoutId);
		timeoutId = undefined;
	}
};
const update = (machine) => {
	cancel();
	if (machine.state === State.STOPPED && machine.getClientCount() === 0) {
		logger.debug('start unload timer...');
		// timeoutId = setTimeout(() => process.exit(1), AUTO_UNLOAD_TIMEOUT);
		timeoutId = setTimeout(() => {
			logger.debug('exit machine...');
			process.exit(1);
		}, AUTO_UNLOAD_TIMEOUT);
	}
};

module.exports = {
	update
};
