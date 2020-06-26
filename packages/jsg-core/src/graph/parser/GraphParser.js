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
const { Parser } = require('@cedalo/parser');
const GraphParserContext = require('./GraphParserContext');

const isFunction = ({ type } = {}) => type === 'function' || type === 'condition';
const getFunctionName = ({ type, value }) => (type === 'condition' ? 'IF' : type === 'function' ? value : undefined);
const tokenAt = (infos, pos) => infos.reduce((token, info) => {
	// ignore info with no length or use it if it is next parameter
	if (pos >= info.start && pos <= info.end && (info.end > info.start || token.paramIndex == null)) {
		return info;
	}
	return token;
}, {});
const infoForToken = (token, pos, info = {}) => {
	if (token) {
		const { end, isInvalid, paramIndex, parent, start } = token;
		info.paramIndex =
			info.paramIndex != null ? info.paramIndex : !isFunction(token) || pos === start || pos >= end ? paramIndex : undefined;
		info.function = pos > start && pos < end || isInvalid ? getFunctionName(token) : undefined;
		if (info.function == null) infoForToken(parent, pos, info);
	}
	return info;
};
const infoAtPosition = (infos, pos) => {
	const token = tokenAt(infos, pos);
	const info = infoForToken(token, pos);
	if (token.type === 'identifier') {
		info.start = token.start;
		info.identifier = token.value;
	}
	return info;
};

/**
 * Used by framework.
 * Note: Should not be instantiated! An instance is accessible via <code>JSG.FormulaParser</code>.
 */
class GraphParser {
	constructor() {
		this._context = new GraphParserContext();
	}

	get context() {
		return this._context;
	}

	set context(ctxt) {
		this._context = ctxt;
	}

	runIgnoringErrors(fn, doIt = true) {
		const { ignoreErrors } = this._context;
		this._context.ignoreErrors = doIt;
		const result = fn();
		this._context.ignoreErrors = ignoreErrors;
		return result;
	}

	parse(formula, graph, item) {
		this._context.setScope(graph, item);
		const term = Parser.parse(formula, this._context);
		// clear context to prevent memory leak since graph or item are stored globally...
		this._context.setScope(undefined);
		return term;
	}

	parseValue(str, graph, item) {
		this._context.setScope(graph, item);
		const term = Parser.parseValue(str, this._context);
		// clear context to prevent memory leak since graph or item are stored globally...
		this._context.setScope(undefined);
		return term;
	}

	parseFormulaInfo(str, offset, graph, item) {
		this._context.setScope(graph, item);
		const info = Parser.getFormulaInfos(str, this._context);
		if (offset == null || offset < 0 || offset > str.length) offset = 0;
		// clear context to prevent memory leak since graph or item are stored globally...
		this._context.setScope(undefined);
		return infoAtPosition(info, offset);
	}
}

module.exports = GraphParser;
