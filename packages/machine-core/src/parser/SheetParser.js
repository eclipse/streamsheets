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
const Cell = require('../machine/Cell');
const { ErrorTerm } = require('./Error');
const SheetParserContext = require('./SheetParserContext');
const { AndOperator, ConcatOperator, Operations } = require('./Operations');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Drawings, ErrorCodes, Operation, Parser, Term, Operand } = require('@cedalo/parser');

class ObjectTerm extends Term {
	constructor(value) {
		super();
		this.operand = new Operand('object', value);
	}

	get value() {
		return this.operand.value; // <-- return undefined can cause NaN e.g. 1 * undefined!
	}

	newInstance() {
		return new ObjectTerm();
	}

	toString(/* ...params */) {
		return this.value.toString();
	}

	toLocaleString(/* locale, ...params */) {
		return this.toString();
	}
}

const termFromCellDescriptor = (descr, scope) => {
	// eslint-disable-next-line no-use-before-define
	let term = descr.formula ? SheetParser.parse(descr.formula, scope) : undefined;
	if (!term) {
		const { value } = descr;
		const type = descr.type || typeof value;
		switch (type) {
			case 'bool':
			case 'boolean':
				term = Term.fromBoolean(`${descr.value}`.toLowerCase() === 'true');
				break;
			case 'number':
				term = Term.fromNumber(Number(value != null ? value : 0));
				break;
			case 'object':
				term = new ObjectTerm(descr.value);
				break;
			case 'unit':
				// eslint-disable-next-line no-use-before-define
				term = SheetParser.parseValue(descr.value, scope);
				break;
			default:
				term = value != null ? Term.fromString(`${value}`) : undefined;
		}
	}
	return term;
};

const valueFromCellDescriptor = (descr) => {
	const value = descr.value;
	// we still get #CALC values from client :-( so have to handle it here...
	return descr.formula && value !== '#CALC' ? value : undefined;
};

const convertParserError = (error) => {
	let err = FunctionErrors.isError(error.code) || FunctionErrors.isError(error.operand);
	if (!err) {
		switch (error.code) {
			case ErrorCodes.MISSING_OPERAND:
			case ErrorCodes.UNKNOWN_FUNCTION:
			case ErrorCodes.UNKNOWN_IDENTIFIER:
				err = FunctionErrors.code.NAME;
				break;
			default:
				err = FunctionErrors.code.ERR;
		}
	}
	return err;
};

Operation.register(new AndOperator(), 2);
Operation.register(new ConcatOperator(), 7);

// replace basic parser operations with own, more excel like, once
Operations.forEach((op) => Operation.set(op));

const parse = (value, scope, fn) => {
	let term;
	// eslint-disable-next-line no-use-before-define
	const { context } = SheetParser;
	context.scope = scope || context.scope;
	try {
		term = fn(value, context);
	} catch (err) {
		// DL -714: ignore unknown parser error and create an error term
		const sheeterror = convertParserError(err);
		term = ErrorTerm.fromError(sheeterror, value);
	}
	context.scope = undefined;
	return term;
};

class SheetParser {
	static parse(formula, scope) {
		const term = parse(formula, scope, Parser.parse);
		// preserve formula: this is always important to distinguish creation of base values (strings, numbers, units)
		// via formula. cells with formula might be handled differently DL-4077/4076 OR for units, e.g. 5% & =5%
		if (term) term.formula = formula;
		return term;
	}

	static parseValue(value, scope) {
		return value != null ? parse(value, scope, Parser.parseValue) : undefined;
	}

	static createCell(value, scope) {
		if (value == null) {
			return new Cell();
		}
		// we always use a cell descriptor:
		const type = typeof value;
		const descr = type === 'object' ? value : { value, type };
		// value is either a cell descriptor or term...
		const term = descr instanceof Term ? descr : termFromCellDescriptor(descr, scope);
		const cellValue = valueFromCellDescriptor(descr);
		const cell = new Cell(cellValue, term);
		cell.level = descr.level != null ? descr.level : 0;
		return cell;
	}
}

SheetParser.context = new SheetParserContext();

class SheetDrawings extends Drawings {
	_deleteProperties(fromObj) {
		if (fromObj) Object.keys(fromObj).forEach((key) => delete fromObj[key]);
	}
	_deleteProperty(name, fromObj = {}) {
		if (fromObj[name]) delete fromObj[name];
	}

	removeDrawing(name) {
		this._deleteProperty(name, this._drawings);
	}

	removeGraphItem(name) {
		this._deleteProperty(name, this._graphItems);
	}

	removeAll() {
		this._deleteProperties(this._drawings);
		this._deleteProperties(this._graphItems);
	}
}

module.exports = {
	ObjectTerm,
	SheetDrawings,
	SheetParser
};
