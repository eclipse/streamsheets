const { create } = require('@cedalo/logger');

module.exports = {
	// level,
	create: ({ name = 'GraphService-Logger' } = {}) => create({ name })
};
