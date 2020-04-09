const logger = require('../utils/logger').create({ name: 'FunctionModuleResolver' });
const path = require('path');
const { resolve, resolveFile } = require('@cedalo/commons').moduleResolver;
const config = require('../../config/config');

const IGNORE_DIRS = config.functions.ignore_dirs;
const ADDITIONAL_FUNCTIONS = [config.functions.module_dir, config.functions.module_dir_user];
const CORE_FUNCTIONS = '@cedalo/functions';

const RESOLVED_MODULES = [];

const traverse = async () => {
	RESOLVED_MODULES.length = 0;
	const corefn = resolveFile(CORE_FUNCTIONS);
	if (corefn) RESOLVED_MODULES.push(corefn);
	await Promise.all(
		ADDITIONAL_FUNCTIONS.map((dir) =>
			resolve(path.resolve(dir), { ignoreDirs: IGNORE_DIRS })
				.then((modules) => RESOLVED_MODULES.push(...modules))
				.catch((err) => logger.error(`Failed to resolve function module ${dir}`, err))
		)
	);
	return RESOLVED_MODULES;
};

module.exports = {
	resolve: traverse,
	getModules: () => RESOLVED_MODULES
};
