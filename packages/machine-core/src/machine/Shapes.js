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
const { SheetParser } = require('../parser/SheetParser');

const checkNaN = (value) => (typeof value === 'number' && Number.isNaN(value) ? 0 : value);
// temp. borrowed from JSG...
const decode = (str) => {
	if (typeof str === 'string') {
		str = str.replace(/~26/gi, '&');
		str = str.replace(/~22/gi, '"');
		str = str.replace(/~5C/gi, '\\');
		str = str.replace(/~3C/gi, '<');
		str = str.replace(/~3E/gi, '>');
		str = str.replace(/~0A/gi, '\n');
		str = str.replace(/~27/gi, "'");
		str = decodeURIComponent(str);
		str = str.replace(/~25/gi, '%');
	}
	return str;
};

const updateValue = (obj) => {
	if (!obj.term) {
		return;
	}
	const value = checkNaN(obj.term.value);
	// eslint-disable-next-line no-nested-ternary
	obj.v = value != null ? value : obj.term.hasOperandOfType('CellReference') ? 0 : value;
};

class Shapes {
	constructor(sheet) {
		this.sheet = sheet;
		this.shapesWithTerms = [];
		this.shapes = [];
	}

	toJSON() {
		return this.shapes;
	}

	fromJSON(json) {
		if (json === undefined) {
			return false;
		}
		this.shapes = json;
		this.shapesWithTerms = JSON.parse(JSON.stringify(json));

		this.shapesWithTerms.forEach(shape => {
			Object.values(shape).forEach(value => {
				if (value.f) {
					value.term = SheetParser.parse(decode(value.f), this.sheet);
				}
			})
		});

		return true;
	}

	evaluate() {
		this.shapesWithTerms.forEach((shape, index) => {
			Object.entries(shape).forEach(([key, value]) => {
				if (value.term) {
					updateValue(value);
					this.shapes[index][key].sv = value.v;
				}
			})
		});
	}
}

module.exports = Shapes;
