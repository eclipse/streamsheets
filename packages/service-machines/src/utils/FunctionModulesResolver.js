const path = require('path');
const { resolve, resolveFile } = require('@cedalo/commons').moduleResolver;
const config = require('../../config/config');

const IGNORE_DIRS = config.functions.ignore_dirs;
const FN_MODULES_DIR = config.functions.module_dir;
const CORE_FUNCTIONS = '@cedalo/functions';

const RESOLVED_MODULES = [];

const traverse = async (dir) => {
	RESOLVED_MODULES.length = 0;
	const corefn = resolveFile(CORE_FUNCTIONS);
	if (corefn) RESOLVED_MODULES.push(corefn);
	const modules = await resolve(path.resolve(dir), { ignoreDirs: IGNORE_DIRS });
	RESOLVED_MODULES.push(...modules);
	return RESOLVED_MODULES;
};

module.exports = {
	resolve: async () => traverse(FN_MODULES_DIR),
	getModules: () => RESOLVED_MODULES
};
