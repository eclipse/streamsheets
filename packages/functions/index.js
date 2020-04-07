const utils = require('./src/utils');
const help = require('./help');
const functions = require('./src/functions');
const FunctionFactory = require('./src/factory/FunctionFactory');
const testutils = require('./test/utilities');

module.exports = {
	help,
	utils,
	test: {
		utils: testutils
	},
	functions,
	FunctionFactory
};
