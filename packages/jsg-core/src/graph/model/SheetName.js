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
const Expression = require('../expr/Expression');
const Strings = require('../../commons/Strings');

/**
 * Class to contain cell in formation for the worksheet.
 *
 * @class Cell
 * @constructor
 */
module.exports = class SheetName {
	constructor(name, expr) {
		this._expr = expr;
		this._name = name;
		this._value = 0;
	}

	newInstance() {
		return new SheetName();
	}

	copy() {
		const copy = this.newInstance();

		if (this._expr) {
			// original copy tries to retrieve value, which executes functions
			copy._expr = this._expr.newInstance();
			if (this._expr._term) {
				const formula = Strings.decode(this._expr._term.toString());
				copy._expr.set(undefined, formula);
			} else {
				copy._expr.set(this._expr.getValue());
			}
			copy._expr._constraint = this._expr._constraint !== undefined ? this._expr._constraint.copy() : undefined;
		}

		copy._name = this._name;
		copy._value = this._value;

		return copy;
	}

	setValue(value) {
		this._value = value;
	}

	getValue() {
		return this._value;
		// const term = this._expr.getTerm();
		// if (term !== undefined && term.operand && term.operand.type === Operand.REFERENCE) {
		// 	let range = term.operand.getValue();
		// 	if (!(range instanceof CellRange)) {
		// 		range = term.operand.getRange();
		// 		if ((range instanceof CellRange) && range.isSingleCell()) {
		// 			return this._expr.getValue();
		// 		}
		// 	}
		// 	return range;
		// }
		// return this._expr.getValue();
	}

	getFormula() {
		if (this._expr && this._expr.hasFormula()) {
			return this._expr.getFormula();
		}

		return this._expr.getValue();
	}

	getExpression() {
		return this._expr;
	}

	setExpression(expr) {
		this._expr = expr;
	}

	getName() {
		return this._name;
	}

	setName(name) {
		this._name = name;
	}

	evaluate(item) {
		if (this._expr) {
			this._expr.evaluate(item);
		}
	}

	invalidateTerm() {
		if (this._expr) {
			this._expr.invalidateTerm();
		}
	}

	/**
	 * Saves this Cell instance to the given Stream.
	 *
	 * @method save
	 * @param {Writer} writer Writer to use for streaming.
	 */
	save(writer) {
		writer.writeStartElement('sheetname');

		writer.writeAttributeString('name', this._name);

		if (this._expr) {
			this._expr.save('value', writer, 15);
		}

		writer.writeEndElement();
	}

	/**
	 * Read to initialize this SheetName.
	 *
	 * @method read
	 * @param {Reader} reader Reader to use for reading.
	 * @param {Object} object Object to read.
	 */
	read(reader, object) {
		this._name = reader.getAttribute(object, 'name');

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'value':
					if (!this._expr) {
						this._expr = new Expression(0);
					}
					this._expr.read(reader, child);
					break;
				default:
					break;
			}
		});
	}
};
