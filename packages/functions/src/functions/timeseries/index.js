const help = require('./help');
const TIMEAGGREGATE = require('./timeaggregate');
const TIMEQUERY = require('./timequery');
const TIMESTORE = require('./timestore');

module.exports = {
	help,
	functions: {
		TIMEAGGREGATE,
		TIMEQUERY,
		TIMESTORE
	}
};
