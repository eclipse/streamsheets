const timequery = require('./timequery');
const timestore = require('./timestore');

module.exports = {
	functions: {
		TIMEQUERY: timequery,
		TIMESTORE: timestore
	}
};
