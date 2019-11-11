const logger = require('./logger').create({ name: 'FunctionRegistry' });

// eslint-disable-next-line
const requireModule = async (path) => require(path);
// eslint-disable-next-line
const requireMachineCore = () => require('..');

let functionFactory;

const Functions = {
	core: {},
	additional: {},
	additionalHelp: {}
};

const registerCore = (functions = {}) => {
	Functions.core = Object.assign(Functions.core, functions);
};
const registerAdditional = (functions = {}, help = {}) => {
	Functions.additional = Object.assign(Functions.additional, functions);
	Functions.additionalHelp = Object.assign(Functions.additionalHelp, help);
};

const toName = (name) => ({ name });

class FunctionRegistry {
	static of() {
		return new FunctionRegistry();
	}

	getFunction(id = '') {
		id = id.toUpperCase();
		return Functions.core[id] || Functions.additional[id];
	}

	getFunctionDefinitions() {
		// currently we only need the names...
		return Object.keys(Functions.core).map(toName).concat(Object.keys(Functions.additional).map(toName));
	}

	getFunctionsHelp() {
		return Functions.additionalHelp;
	}

	hasFunction(id = '') {
		return !!this.getFunction(id);
	}

	registerCoreFunctionsModule(mod) {
		requireModule(mod)
			.then(({ functions, FunctionFactory, registerMachineCore }) => {
				registerMachineCore(requireMachineCore());
				registerCore(functions);
				functionFactory = FunctionFactory;
			})
			.catch((err) => logger.info(err.message));
	}

	registerFunctionModule(mod) {
		requireModule(mod)
			.then(({ functions, help, registerMachineCore }) => {
				if (registerMachineCore) registerMachineCore(requireMachineCore);
				registerAdditional(functions, help);
			})
			.catch((err) => logger.info(err.message));
	}

	registerFunctionDefinitions(definitions = []) {
		if (functionFactory) {
			const functions = definitions.reduce((fns, def) => {
				const fn = functionFactory.createFrom(def);
				if (fn) fns[def.name] = fn;
				return fns;
			}, {});
			registerAdditional(functions);
		}
	}
}
module.exports = FunctionRegistry.of();
