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
const JSG = require('@cedalo/jsg-core');

const { GraphParserContext } = JSG;

const isFunctionParam = (node, parent) => parent && parent.type === 'function' && node.type === 'string';

const FN_CALC = () => '#CALC';
const ALL_FUNCTIONS = new Set();

module.exports = class SheetParserContext extends GraphParserContext {
	static updateFunctions(fnDefinitions = []) {
		// seems we only need function names for copy paste => remove when c&p is done by machine server...
		fnDefinitions.forEach((def) => ALL_FUNCTIONS.add(def.name));
	}

	createReferenceTerm(node, parent) {
		return isFunctionParam(node, parent) ? undefined : super.createReferenceTerm(node);
	}

	hasFunction(id) {
		return ALL_FUNCTIONS.has(id.toUpperCase());
	}

	getFunction(id) {
		return this.hasFunction(id) ? FN_CALC : undefined;
	}
};
