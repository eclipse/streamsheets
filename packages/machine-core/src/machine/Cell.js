const { isType } = require('../utils');
const { Operand } = require('@cedalo/parser');
const { FunctionErrors } = require('@cedalo/error-codes');

const CELL_VALUE_REPLACEMENT = '{ JSON Object }';

const isValueType = (term) => {
	const type = term.operand.type;
	// we treat unit terms as value types!
	return term.isUnit || !!(type && type !== Operand.TYPE.UNDEF && type !== Operand.TYPE.REFERENCE);
};

const checkNaN = (value) => (typeof value === 'number' && Number.isNaN(value) ? 0 : value);

const checkTermValue = (term) => {
	const value = checkNaN(term.value);
	// eslint-disable-next-line no-nested-ternary
	return value != null ? value : term.hasOperandOfType('CellReference') ? 0 : value;
};
const evaluate = (cell, newValue) => {
	cell._isInited = true;
	if (newValue != null) {
		cell._value = checkNaN(newValue);
		cell._cellValue = undefined;
	} else {
		const term = cell._term;
		cell._value = term ? checkTermValue(term) : checkNaN(cell._value);
		cell._cellValue = term && term.cellValue != null ? checkNaN(term.cellValue) : undefined;
	}
};

const valueDescription = (value) => (isType.object(value) ? value.toString() : value); // == null ? 0 : value);

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

// to fix displayed value of sheet-functions which are used in cell directly instead
// as parameter of other functions. To prevent displayed values like [object Object]...
const adjustValueOf = (cell) => {
	let value = cell._value;
	const term = cell._term;
	const type = typeof value;
	// treatment for references => those have a proper toString()...
	if (type === 'object' && (!term || !term.hasOperandOfType(Operand.TYPE.REFERENCE))) value = CELL_VALUE_REPLACEMENT;
	else if (type === 'function') value = CELL_VALUE_REPLACEMENT;
	return value;
};


class Cell {
	static get VALUE_REPLACEMENT() {
		return CELL_VALUE_REPLACEMENT;
	}

	constructor(value, term) {
		setTerm(term, this);
		this._value = value;
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
		const value = valueDescription(this.cellValue);
		const descr = { formula: this.formula, value };
		descr.type = term ? term.operand.type : typeof value;
		if (term && term.isUnit && !descr.formula) {
			descr.type = 'unit';
			descr.value = term.toString();
		}
		// if info contains more than values
		descr.info = { values: this.info.values };
		// TODO: move level to cell properties
		descr.level = this.level;
		const references = this._references && refStrings(this._references);
		descr.references = Array.isArray(references) && references.length > 0 ? references : undefined;
		return descr;
	}

	// TODO review - do it explicitly like now or keep it private and do it implicitly?
	init(row, col) {
		if (!this._isInited) {
			const initialval = this._value;
			if (row != null) this.row = row;
			if (col != null) this.col = col;
			evaluate(this);
			if (initialval != null) {
				this._value = checkNaN(initialval);
			}
		}
		return this;
	}

	dispose() {
		this.row = -1;
		setTerm(undefined, this);
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

	get format() {
		return this._format;
	}

	get info() {
		return this._info;
	}

	set info(obj) {
		this._info = Object.assign({}, obj);
	}

	get term() {
		return this._term;
	}

	get references() {
		return this._references;
	}

	set term(term) {
		setTerm(term, this);
		this.evaluate();
	}

	get cellValue() {
		// return this._cellValue != null ? this._cellValue : this._value;
		return this._cellValue != null ? this._cellValue : adjustValueOf(this);
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

	copy() {
		const term = this._term ? this._term.copy() : undefined;
		return new Cell(this._value, term);
	}

	evaluate() {
		evaluate(this);
		return this;
	}

	// called instead of evaluate after load. should fix references without changing value!
	// with evaluate() e.g. A1+1 would become 2 instead of 1 !!!!
	update() {
		if (this._term) {
			const value = this._value;
			// fix value after load if it failed during load
			if (value == null || FunctionErrors.isError(value)) this._value = checkNaN(this._term.value);
		}
	}
}

module.exports = Cell;
