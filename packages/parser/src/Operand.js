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
const Locale = require('./Locale');

class Operand {
	static fromString(str) {
		let operand;
		if (str.length > 0) {
			if (isNaN(str)) {
				if (str === false || str === true) {
					operand = new Operand(Operand.TYPE.BOOL, Boolean(str));
				} else if (str.toUpperCase() === 'FALSE') {
					operand = new Operand(Operand.TYPE.BOOL, false);
				} else if (str.toUpperCase() === 'TRUE') {
					operand = new Operand(Operand.TYPE.BOOL, true);
				} else {
					// eslint-disable-next-line no-use-before-define
					operand = new StringOperand(str);
				}
			} else {
				operand = new Operand(Operand.TYPE.NUMBER, Number(str));
			}
		}
		return operand;
	}

	constructor(type, value) {
		this.type = type;
		this._value = value;
	}

	get value() {
		return this._value;
	}

	isResolved() {
		return true;
	}

	isTypeOf(type) {
		return this.type === type;
	}

	dispose() {}

	copy() {
		return new Operand(this.type, this.value);
	}

	isEqualTo(operand) {
		return operand && this.type === operand.type && this.value === operand.value;
	}

	toString() {
		let str = `${this.value}`;
		switch (this.type) {
		case Operand.TYPE.BOOL:
			str = str.toUpperCase();
			break;
		case Operand.TYPE.UNDEF:
			str = '';
			break;
		default:
			str = `${this.value}`;
		}
		return str;
	}
	toLocaleString(locale /* ...params */) {
		return this.type === Operand.TYPE.NUMBER ? Locale.localizeNumber(this.value, locale) : this.toString();
	}
}

Operand.TYPE = {
	BOOL: 'bool',
	NUMBER: 'number',
	STRING: 'string',
	REFERENCE: 'reference',
	UNDEF: 'undefined'
};


Operand.UNDEF = new Operand(Operand.TYPE.UNDEF, undefined);
Operand.UNDEF.copy = () => Operand.UNDEF;


// const ESC_REGEX = /\\["|\\|']/g;
// const replacement = (match) => match.charAt(match.length - 1);
const ESC_REGEX = /\\(.?)/g;
class StringOperand extends Operand {
	constructor(value) {
		super(Operand.TYPE.STRING);
		// ensure to have a string value:
		this._value = value != null ? `${value}` : value;
		this._unescapedValue = value != null ? this._value.replace(ESC_REGEX, '$1') : value;
		// this._unescapedValue = value != null ? this._value.replace(ESC_REGEX, replacement) : value;
	}

	get value() {
		return this._unescapedValue;
	}

	copy() {
		return new StringOperand(this._value);
	}

	toString() {
		return `"${this._value}"`;
	}
}

// DL-2012
const referenceIdentifierRegEx = /^[\w]+$/;
class Reference extends Operand {
// abstract definition of a reference -> should be subclassed...
	/**
	 * Checks if given string can be used as an identifier for a reference operand.
	 * 
	 * @param {String} str 
	 * @returns {Boolean} true if string represents a valid reference identifier or false otherwise.
	 */
	static isValidIdentifier(str) {
		return str && referenceIdentifierRegEx.test(str);
	}

	constructor() {
		super(Operand.TYPE.REFERENCE);
	}

	get target() {
		return undefined;
	}

	get value() {
		return undefined;
	}

	copy() {
		return new Reference();
	}

	isEqualTo(operand) {
		const equal = super.isEqualTo(operand);
		return equal && this.target === operand.target;
	}

	isResolved() {
		return !!this.target;
	}

	toString(/* ...params */) {
		// eslint-disable-next-line
		console.warn('Reference#toString() should be overwritten!');
		return 'undefined';
	}

	toLocaleString(locale, ...params) {
		return this.toString(...params);
	}
}


module.exports = {
	Operand,
	Reference,
	StringOperand
};
