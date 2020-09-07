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

const Functions = {
	core: {},
	additional: {},
	additionalHelp: {}
};
const Actions = {
	core: {},
	additional: {
		'timescale.action.import': ({ table, data }) => (table && data ? Promise.resolve(true) : Promise.reject()),
		'timescale.action.listtables': ({ fail } = {}) => fail
			? Promise.reject(new Error('No tables found!'))
			: Promise.resolve([
				'table1', 'table2', 'table3', 'table4', 'table5', 'table6', 'table7', 'table8', 'table9',
				'table11', 'table12', 'table13', 'table14', 'table15', 'table16', 'table17', 'table18', 'table19',
				'table21', 'table22', 'table23', 'table24', 'table25', 'table26', 'table27', 'table28', 'table29',
				'table31', 'table32', 'table33', 'table34', 'table35', 'table36', 'table37', 'table38', 'table39',
		])
	}
};

const registerCore = ({ actions = {}, functions = {}, FunctionFactory } = {}) => {
	Actions.core = Object.assign(Actions.core, actions);
	Functions.core = Object.assign(Functions.core, functions);
	functionFactory = FunctionFactory;
};
const registerAdditional = ({ actions = {}, functions = {}, help = {} } = {}) => {
	Actions.additional = Object.assign(Actions.additional, actions);
	Functions.additional = Object.assign(Functions.additional, functions);
	Functions.additionalHelp = Object.assign(Functions.additionalHelp, help);
};
const logError = (err, mod) => logger.error(`Failed to load module: '${moduleName(mod)}'! Reason: ${err.message}`);


const toName = (name) => ({ name });

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
		return Object.keys(Functions.core).map(toName).concat(Object.keys(Functions.additional).map(toName));
	}

	getFunctionsHelp() {
		return Functions.additionalHelp;
	}

	hasFunction(id = '') {
		return !!this.getFunction(id);
	}

	registerCoreFunctionsModule(mod) {
		requireModule(mod).then(registerCore).catch((err) => logError(err, mod));
	}

	registerFunctionModule(mod) {
		requireModule(mod).then(registerAdditional).catch((err) => logError(err, mod));
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
			registerAdditional({ functions });
		}
	}
}
module.exports = FunctionRegistry.of();
