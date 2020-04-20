const { resolveFile } = require('@cedalo/commons').moduleResolver;
const { resolveAdditionalFunctions } = require('@cedalo/service-machines-extensions');

const CORE_FUNCTIONS = '@cedalo/functions';
const RESOLVED_MODULES = [];

const traverse = async () => {
	RESOLVED_MODULES.length = 0;
	const corefn = resolveFile(CORE_FUNCTIONS);
	if (corefn) RESOLVED_MODULES.push(corefn);
	const additionalFunctions = await resolveAdditionalFunctions();
	RESOLVED_MODULES.push(...additionalFunctions);
	return RESOLVED_MODULES;
};

module.exports = {
	resolve: traverse,
	getModules: () => RESOLVED_MODULES
};
