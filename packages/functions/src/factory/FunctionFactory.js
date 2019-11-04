const streamfunc = require('./streamfunc');

// currently only stream functions:
module.exports = {
	createFrom: (fnDefinition) => streamfunc(fnDefinition)
};
