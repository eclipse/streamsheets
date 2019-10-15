const { create } = require('@cedalo/logger');

module.exports = {
	// level,
	create: ({ name = 'Gateway-Logger' } = {}) => create({ name })
};
