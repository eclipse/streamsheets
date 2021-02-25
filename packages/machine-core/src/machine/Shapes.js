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
const SheetRange = require('./SheetRange');

const checkNaN = (value) => (typeof value === 'number' && Number.isNaN(value) ? 0 : value);
const checkTermValue = (term) => {
	const value = checkNaN(term.value);
	// eslint-disable-next-line no-nested-ternary
	return value != null ? value : term.hasOperandOfType('CellReference') ? 0 : value;
};

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
	const value = obj.term ? checkTermValue(obj.term) : checkNaN(obj.v);

	// eslint-disable-next-line no-nested-ternary
	obj.sv = value != null ? value : obj.term.hasOperandOfType('CellReference') ? 0 : value;
	if (obj.sv instanceof SheetRange) {
		obj.ref = undefined;
		obj.sv = obj.sv.toReferenceString();
	}
};

class Shapes {
	constructor(sheet) {
		this.sheet = sheet;
		this.json = {
			shapes:[],
			timestamp: 0,
			version: 0,
		};
	}

	toJSON() {
		const json = JSON.parse(JSON.stringify(this.json, (key, value) => {
				if (key === 'term') {
					return undefined;
				}
				return value;
			}
		));

		return json;
	}

	fromJSON(json) {
		this.json = json;

		return true;
	}

	evaluateObject(obj) {
		Object.entries(obj).forEach(([key, value]) => {
			if (value.v) {
				// if its a term and shall be calculated on server
				if (value.msc) {
					if  (!value.term) {
						value.term = SheetParser.parse(decode(value.f), this.sheet);
					}
					updateValue(value);
				}
			} else if (typeof value === 'object') {
				this.evaluateObject(value);
			}
		})
	}

	evaluate() {
		this.json.shapes.forEach(shape => {
			this.evaluateObject(shape);
		});
	}
}

module.exports = Shapes;
