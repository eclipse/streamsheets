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
const { isType } = require('../utils');
const { Operand } = require('@cedalo/parser');
const { FunctionErrors } = require('@cedalo/error-codes');

const CELL_VALUE_REPLACEMENT = '{ JSON }';

const isValueType = (term) => {
	const type = term.operand.type;
	// we treat unit terms as value types!
	return (
		term.isUnit ||
		term.isError ||
		term.isNullTerm ||
		!!(type && type !== Operand.TYPE.UNDEF && type !== Operand.TYPE.REFERENCE)
	);
};

const checkNaN = (value) => (typeof value === 'number' && Number.isNaN(value) ? 0 : value);

const checkTermValue = (term) => {
	const value = checkNaN(term.value);
	// eslint-disable-next-line no-nested-ternary
	return value != null ? value : term.hasOperandOfType('CellReference') ? 0 : value;
};
const evaluate = (cell, newValue) => {
	// remove any previous error
	const oldError = cell._info.error;
	cell._info.error = undefined;
	cell._isInited = true;
	if (newValue != null) {
		cell._value = checkNaN(newValue);
		cell._cellValue = undefined;
	} else {
		const term = cell._term;
		cell._value = term ? checkTermValue(term) : checkNaN(cell._value);
		cell._cellValue = term && term.cellValue != null ? checkNaN(term.cellValue) : undefined;
		// error handling
		if (cell._value != null && cell._value.isErrorInfo) {
			cell._info.error = cell._value;
			cell._cellValue = cell._cellValue || cell._value.code;
		} else if(cell._cellValue && FunctionErrors.isError(cell._cellValue)) {
			cell._info.error = oldError;
		}
	}
	// DL-4088: treat error as false for if columns => should we generally return only true/false for IF
	if (cell.col === -1 && FunctionErrors.isError(cell._value)) cell._value = false;
};

const isCellReference = (value) => value && (value.isCellReference || value.isCellRangeReference);
const limitString = (str, sheet) => {
	const limit = sheet.settings.maxchars;
	return limit > 0 && str.length > limit ? str.substr(0, limit) : str;
};

// DL-4113 prevent displaying values like [object Object]...
const valueDescription = (value, sheet) => {
	if (value == null) return value;
	if (isCellReference(value)) return value.value;
	if (value.isSheetRange) return value.sheet !== sheet ? value.toReferenceString() : value.toString();
	if (Array.isArray(value)) return CELL_VALUE_REPLACEMENT;
	if (isType.object(value)) {
		const descr = value.toString();
		return descr.startsWith('[object Object]') ? CELL_VALUE_REPLACEMENT : descr;
	}
	return value;
};

const refStrings = (references) => references.map((r) => r.toString());
const registerCell = (term, cell) => {
	const setCell = (t) => { t.cell = cell; return true; };
	term.traverse(setCell, null, false);
};
const setTerm = (newTerm, cell) => {
	if (cell._term) {
		cell._term.dispose();
		registerCell(cell._term, undefined);
		if (cell._references) this._references = undefined;
	}
	cell._term = newTerm;
	if (newTerm) {
		registerCell(cell._term, cell);
		cell._references = refStrings(newTerm.findReferences());
	}
};

const getRawType = (cell, valueDescr) => {
	const value = cell.value;
	if (FunctionErrors.isError(value)) return 'string';
	return isCellReference(value) ? typeof valueDescr : typeof value;
};

const displayName = (term) => term && term.func && term.func.displayName;

class Cell {
	static get VALUE_REPLACEMENT() {
		return CELL_VALUE_REPLACEMENT;
	}

	constructor(value, term) {
		setTerm(term, this);
		this._value = value;
		this._sheet = undefined;
		this._cellValue = undefined;
		this._isInited = false;
		this.row = -1;
		this.col = 0;
		// discuss: we might need to support cell formats...
		this.level = 0;
		// used to send info to clients which are not necessarily stored to definition
		this._info = {};
	}

	description() {
		const term = this._term;
		const value = valueDescription(this.cellValue, this.sheet);
		const descr = { formula: this.formula, value };
		const rawtype = getRawType(this, value);
		// DL-4908: limit string values
		if (this._sheet && rawtype === 'string') descr.value = limitString(value, this._sheet);
		descr.type = term ? term.operand.type : typeof value;
		if (term && term.isUnit && !descr.formula) {
			descr.type = 'unit';
			descr.value = term.toString();
		}
		descr.info = { ...this.info, displayName: displayName(term), rawtype };
		// TODO: move level to cell properties
		descr.level = this.level;
		const references = this._references && refStrings(this._references);
		descr.references = Array.isArray(references) && references.length > 0 ? references : undefined;
		return descr;
	}

	// TODO review - do it explicitly like now or keep it private and do it implicitly?
	init(row, col, sheet) {
		if (sheet) this._sheet = sheet;
		if (row != null) this.row = row;
		if (col != null) this.col = col;
		if (!this._isInited) {
			const initialval = this._value;
			evaluate(this);
			if (initialval != null) {
				this._value = checkNaN(initialval);
			}
		}
		return this;
	}

	dispose() {
		this.row = -1;
		this._sheet = undefined;
		setTerm(undefined, this);
	}

	get context() {
		return this._term && this._term.context;
	}

	get isDefined() {
		return this._term != null || this._value != null;
	}

	get hasFormula() {
		return !!this._term && (!!this._term.formula || !isValueType(this._term));
	}
	// if cell value is based on a cell reference or formula, otherwise undefined
	get formula() {
		return this.hasFormula ? this._term.toString() : undefined;
	}

	get info() {
		return this._info;
	}

	set info(obj) {
		this._info = Object.assign({}, obj);
	}

	get references() {
		return this._references;
	}

	get sheet() {
		return this._sheet;
	}

	get term() {
		return this._term;
	}


	set term(term) {
		setTerm(term, this);
		this.evaluate();
	}

	get cellValue() {
		return this._cellValue != null ? this._cellValue : this._value;
	}

	get value() {
		// nice but to dangerous!!
		// return this.term ? this.term.value : this._value;
		return this._value;
	}

	set value(newValue) {
		//  valid until next evaluation
		evaluate(this, newValue);
	}

	setInternalValue(newValue) {
		this._info = {};
		this._value = newValue;
	}

	copy() {
		const term = this._term ? this._term.copy() : undefined;
		return new Cell(this._value, term);
	}

	evaluate() {
		evaluate(this);
		return this;
	}

	setCellInfo(key, value) {
		this._info[key] = value;
	}

	// called instead of evaluate after load. should fix references without changing value!
	// with evaluate() e.g. A1+1 would become 2 instead of 1 !!!!
	update() {
		if (this._term) {
			const value = this._value;
			// fix value after load if it failed during load
			if (value == null || FunctionErrors.isError(value)) {
				this._value = checkNaN(this._term.value);
				this._cellValue = this._term.cellValue != null ? checkNaN(this._term.cellValue) : undefined;
				this._info.error = this._value != null && this._value.isErrorInfo ? this._value : undefined;
			}
		}
	}
}

module.exports = Cell;
