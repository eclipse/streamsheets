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
const registerSheet = (term, sheet) => {
	const setSheet = (t) => { t.sheet = sheet; return true; };
	term.traverse(setSheet, null, false);
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
	obj.ref = undefined;
	if (obj.sv instanceof SheetRange) {
		obj.sv = obj.sv.toReferenceString();
	}
	if (obj.term && obj.term.hasOperandOfType('CellReference')) {
		obj.ref = obj.term.operand.toString();
	}
	if (obj.term && obj.term.info) {
		obj.info = obj.term.info;
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
		if (this.json === undefined) {
			return undefined;
		}

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
			if (value.v !== undefined) {
				// if its a term and shall be calculated on server
				if (value.msc) {
					if  (!value.term) {
						value.term = SheetParser.parse(decode(value.f), this.sheet);
						if (value.term) {
							registerSheet(value.term, this.sheet);
						}
					}
					updateValue(value);
				}
			} else if (typeof value === 'object') {
				this.evaluateObject(value);
			}
		})
	}

	evaluate() {
		if (this.json) {
			this.json.shapes.forEach(shape => {
				this.evaluateObject(shape);
			});
		}
	}

	getShapeValue(shape) {
		const get = (obj, defValue) => {
			if (!obj) {
				return defValue
			}
			let val =  obj.sv === undefined ? obj.v : obj.sv;
			if (obj.t === 'n') {
				val = Number(val);
			} else if (obj.t === 'b') {
				val = val === 'true' || val === true;
			// } else {
			// 	val = Strings.decode(String(input));
			}
			return val;
		};

		return {
			ID: shape.id,
			NAME: get(shape.name, ''),
			VISIBLE: get(shape.attributes.visible, true),
			VALUE: shape.modelattributes ? get(shape.modelattributes.value, 0) : undefined,
		}
	}

	getShapeByName(name) {
		if (this.json) {
			const shapes = this.json.shapes.filter(shape => {
				return shape.name && shape.name.v && shape.name.v.toUpperCase() === name;
			});
			return shapes.length === 1 ? shapes[0] : undefined;
		}
		return undefined;
	}
}

module.exports = Shapes;
