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
const fnshelp = require('@cedalo/functions/help');
const JSG = require('@cedalo/jsg-core');
const DotOperatorParserContext = require('./DotOperatorParserContext');

const { GraphParserContext } = JSG;

const isFunctionParam = (node, parent) => parent && parent.type === 'function' && node.type === 'string';

const FN_CALC = () => '#CALC';
const CORE_FUNCTIONS = Object.values(fnshelp).reduce((all, { functions = {} } = {}) => {
	Object.keys(functions).forEach((name) => all.push(name));
	return all;
}, []);
const ALL_FUNCTIONS = new Set(CORE_FUNCTIONS);
let FN_NAMES = Array.from(ALL_FUNCTIONS);


class SheetParserContext extends GraphParserContext {
	static updateFunctions(fnDefinitions = []) {
		// seems we only need function names for copy paste => remove when c&p is done by machine server...
		fnDefinitions.forEach((def) => ALL_FUNCTIONS.add(def.name));
		FN_NAMES = Array.from(ALL_FUNCTIONS);
	}

	get functionNames() {
		return FN_NAMES;
	}

	createReferenceTerm(node, parent) {
		return isFunctionParam(node, parent) ? undefined : super.createReferenceTerm(node);
	}

	hasFunction(id) {
		return ALL_FUNCTIONS.has(id.toUpperCase()) || super.hasFunction(id);
	}

	getFunction(id) {
		return this.hasFunction(id) ? FN_CALC : undefined;
	}
}

// add dot operator support...
module.exports = DotOperatorParserContext(SheetParserContext);