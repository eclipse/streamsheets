/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const logger = require('./logger').create({ name: 'FunctionRegistry' });
const DotReferenceOperator = require('./parser/DotReferenceOperator');

const moduleName = (path) => {
	const parts = path.split('/');
	return parts.length > 1 ? parts[parts.length - 2] : path;
};
const requireModule = async (path) => {
	// eslint-disable-next-line
	const mod = require(path);
	logger.info(`Loaded additional module: '${moduleName(path)}'`);
	return mod;
};


let functionFactory;

const DEF_CATEGORY = ['other', { en: 'Other', de: 'Sonstige' }];

const Functions = {
	core: {},
	additional: {},
	additionalHelp: {},
	dotFunctionNames: []
};
const Actions = {
	core: {},
	additional: {}
};

const toName = (name) => ({ name });
const isDotFunction = (name) => name.indexOf(DotReferenceOperator.SYMBOL) > 0;
const getFunctionNames = () => Object.keys(Functions.core).concat(Object.keys(Functions.additional));

const addFunction = (category, [key, value]) => {
	category.functions[key] = value;
	return category;
};
const addFunctions = (functions, category) => Object.entries(functions).reduce(addFunction, category);

const addCategory = (category, categories) => {
	const [name, locales] = Object.entries(category)[0] || DEF_CATEGORY;
	if (categories[name] == null) categories[name] = {};
	if (categories[name].functions == null) categories[name].functions = {};
	return Object.assign(categories[name], locales);
};
const addHelp = (help = {}, categories = {}) => {
	const { category = {}, functions = {} } = help;
	const newCategory = addCategory(category, categories);
	addFunctions(functions, newCategory);
	return categories;
};

const addCoreFunctions = ({ actions = {}, functions = {}, FunctionFactory } = {}) => {
	Actions.core = Object.assign(Actions.core, actions);
	Functions.core = Object.assign(Functions.core, functions);
	functionFactory = FunctionFactory;
	Functions.dotFunctionNames = getFunctionNames().filter(isDotFunction);
};
const addAdditionalFunctions = ({ actions = {}, functions = {}, help = {} } = {}) => {
	Actions.additional = Object.assign(Actions.additional, actions);
	Functions.additional = Object.assign(Functions.additional, functions);
	if (Array.isArray(help)) help.forEach((fnHelp) => addHelp(fnHelp, Functions.additionalHelp));
	else addHelp(help, Functions.additionalHelp);
	Functions.dotFunctionNames = getFunctionNames().filter(isDotFunction);
};
const logError = (err, mod) => logger.error(`Failed to load module: '${moduleName(mod)}'! Reason: ${err.message}`);

const register = (fn) => async (mod) => {
	try {
		const fnModule = await requireModule(mod);
		fn(fnModule);
	} catch (err) {
		logError(err, mod);
	}
};
const registerCore = register(addCoreFunctions);
const registerAdditional = register(addAdditionalFunctions);

class FunctionRegistry {
	static of() {
		return new FunctionRegistry();
	}

	getAction(id = '') {
		return Actions.core[id] || Actions.additional[id];
	}

	getFunction(id = '') {
		id = id.toUpperCase();
		return Functions.core[id] || Functions.additional[id];
	}

	getFunctionDefinitions() {
		// currently we only need the names...
		return getFunctionNames().map(toName);
		// return Object.keys(Functions.core).map(toName).concat(Object.keys(Functions.additional).map(toName));
	}

	getDotFunctions() {
		return Functions.dotFunctionNames;
	}

	getFunctionsHelp() {
		return Functions.additionalHelp;
	}

	hasFunction(id = '') {
		return !!this.getFunction(id);
	}

	async registerCoreFunctionsModule(mod) {
		return registerCore(mod);
	}

	async registerFunctionModule(mod) {
		return registerAdditional(mod);
	}

	registerFunctionDefinitions(definitions = []) {
		if (functionFactory) {
			const functions = definitions.reduce((fns, def) => {
				// stream functions do not overwrite already existing (additional) functions
				if (Functions.additional[def.name] == null) {
					const fn = functionFactory.createFrom(def);
					if (fn) fns[def.name] = fn;
				}
				return fns;
			}, {});
			addAdditionalFunctions({ functions });
		} else {
			logger.error('Failed to load stream functions! No functions factory available!!');
		}
	}
}
module.exports = FunctionRegistry.of();
