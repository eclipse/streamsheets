const { create } = require('@cedalo/logger');

// const level = process.env.STREAM_SERVICE_LOG_LEVEL || 'info';

module.exports = {
	// level,
	create: ({ name = 'File-Stream-Logger' } = {}) => create({ name })
};
