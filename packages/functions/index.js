const utils = require('./src/utils');
const machinecore = require('./src/machinecore');
const help = require('./help');
const functions = require('./src/functions');
const FunctionFactory = require('./src/factory/FunctionFactory');

const registerMachineCore = (mcore) => machinecore.set(mcore);

module.exports = {
	help,
	utils,
	functions,
	FunctionFactory,
	registerMachineCore
};
