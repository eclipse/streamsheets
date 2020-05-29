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
const jsonpath = require('jsonpath');
const IdGenerator = require('@cedalo/id-generator');

const generateRandomString = (prefix = '') => prefix + IdGenerator.generate() + new Date().getMilliseconds();

const LIST_DELIMITED = ',';

const TYPES = {
	SHEET_REF: 'SHEET_REF',
	SHEET_RANGE: 'SHEET_RANGE',
	TEXT: 'TEXT',
	TEXTLIST: 'TEXTLIST',
	MULTILINETEXT: 'MULTILINETEXT',
	MULTITEXTFIELDPAIRS: 'MULTITEXTFIELDPAIRS',
	SELECT: 'SELECT',
	SELECT_NUM: 'SELECT_NUM',
	MULTISELECT: 'MULTISELECT',
	INT: 'INT',
	POSINT: 'POSINT',
	TREE: 'TREE',
	FILE: 'FILE',
	PASSWORD: 'PASSWORD',
	FILESECRET: 'FILESECRET',
	CHECKBOX: 'CHECKBOX',
	BUTTON: 'BUTTON',
	RANDOM_STRING: 'RANDOM_STRING'
};

const DEF_VALUES = {
	[TYPES.SHEET_REF]: '',
	[TYPES.SHEET_RANGE]: '',
	[TYPES.TEXT]: '',
	[TYPES.TEXTLIST]: [],
	[TYPES.MULTILINETEXT]: '',
	[TYPES.SELECT]: '0',
	[TYPES.SELECT_NUM]: 0,
	[TYPES.MULTISELECT]: [],
	[TYPES.MULTITEXTFIELDPAIRS]: [],
	[TYPES.INT]: 0,
	[TYPES.POSINT]: 0,
	[TYPES.TREE]: {},
	[TYPES.FILE]: {},
	[TYPES.PASSWORD]: '',
	[TYPES.FILESECRET]: '',
	[TYPES.CHECKBOX]: true,
	[TYPES.BUTTON]: true,
	[TYPES.RANDOM_STRING]: ''
};

const getDefaultFromDef = (def) => {
	const type = def.type || TYPES.TEXT;
	if (typeof def.defaultValue === 'undefined') {
		return DEF_VALUES[type];
	}
	return def.defaultValue;
};

class Field {
	constructor(definition) {
		this._value = null;
		this.id = definition.id;
		this.type = definition.type;
		this.label = definition.label;
		this.defaultValue = getDefaultFromDef(definition);
		this.options = definition.options;
		this.dependsOnPath = definition.dependsOnPath;
		this.dependsOnValue = definition.dependsOnValue;
		this.required = definition.required;
		this.hidden = definition.hidden;
		this.help = definition.help;
		this.onUpdate = definition.onUpdate;
		this.disabled = definition.disabled;
		this.secret = definition.secret;
		this.value = definition.value;
		this.advanced = definition.advanced === true;
	}

	toJSON() {
		return {
			id: this.id,
			type: this.type,
			label: this._label,
			defaultValue: this.defaultValue,
			options: this.options,
			dependsOnPath: this.dependsOnPath,
			dependsOnValue: this.dependsOnValue,
			required: this._required,
			onUpdate: this._onUpdate,
			value: this.value,
			advanced: this.advanced,
			disabled: !!this._disabled,
			help: this._help
		};
	}

	set value(value) {
		const type = this.type || TYPES.TEXT;
		if (typeof value === 'undefined' || value === null) {
			this._value = this.defaultValue;
		} else {
			switch (type) {
				case Field.TYPES.TEXTLIST: {
					if (Array.isArray(value)) {
						this._value = value;
					} else if (typeof value === 'string') {
						this._value = value.split(LIST_DELIMITED);
					}
					break;
				}
				case Field.TYPES.SELECT_NUM: {
					if (!isNaN(Number(value))) {
						this._value = +value;
					} else {
						// throw?
					}
					break;
				}
				default:
					this._value = value;
			}
			const isValid = this.isValueValid(this._value);
			if (!isValid) this._value = this._defaultValue;
		}
	}

	get value() {
		return this._value;
	}

	isShow(model) {
		if (!this.dependsOnPath) return true;
		if (
			typeof this.dependsOnValue === 'undefined' ||
			this.dependsOnValue === null
		) {
			return !!model[this.dependsOnPath];
		}
		let values = [];
		if (typeof this.dependsOnValue === 'string') {
			values.push(this.dependsOnValue);
		} else if (Array.isArray(this.dependsOnValue)) {
			values = values.concat(this.dependsOnValue);
		}
		const depOnPaths = jsonpath.query(model, this.dependsOnPath);
		const depOnPath = depOnPaths.length > 0 ? depOnPaths[0] : undefined;
		const res = values.map((v) => depOnPath === v);
		if (res.includes(true)) return true;
		return false;
	}

	validateValue(value) {
		const errors = [];
		if (this._required && typeof value === 'undefined') {
			errors.push(Field.ERRORS.IS_REQUIRED);
		}
		if (!this._isTypeValid(value)) {
			errors.push(Field.ERRORS.WRONG_TYPE);
		}
		if (!this._isRangeValid(value)) {
			errors.push(Field.ERRORS.OUT_OF_RANGE);
		}
		return errors;
	}

	_isTypeValid(value) {
		if (typeof value !== 'undefined') {
			switch (this.type || Field.TYPES.TEXT) {
				case Field.TYPES.TEXT: {
					return typeof value === 'string';
				}
				case Field.TYPES.MULTILINETEXT: {
					return typeof value === 'string';
				}
				case Field.TYPES.SELECT: {
					return (
						typeof value === 'string' || typeof value === 'number'
					);
				}
				case Field.TYPES.SELECT_NUM: {
					return typeof value === 'number';
				}
				case Field.TYPES.POSINT: {
					return value && Number.isInteger(value) && value > 0;
				}
				case Field.TYPES.INT: {
					return value && Number.isInteger(value);
				}
				case Field.TYPES.TEXTLIST: {
					return Array.isArray(value);
				}
				default:
					return true;
			}
		}
		return true;
	}

	_isRangeValid(value) {
		switch (this.type || Field.TYPES.TEXT) {
			case Field.TYPES.POSINT: {
				return value > 0;
			}
			case Field.TYPES.CHECKBOX: {
				return typeof value === 'boolean';
			}
			default:
				return true;
		}
	}

	isValueValid(v) {
		return this.validateValue(v).length < 1;
	}

	getHelp(locale = 'en') {
		if (this._help) {
			if (typeof this._help === 'string') {
				return this._help;
			}
			return this._help[locale];
		}
		return null;
	}

	getLabel(locale = 'en') {
		if (this._label) {
			if (typeof this._label === 'string') {
				return this._label;
			}
			return this._label[locale];
		}
		return null;
	}

	static generateRandom(prefix = '') {
		return generateRandomString(prefix);
	}

	get definition() {
		return this._definition;
	}

	set definition(value) {
		this._definition = value;
	}

	get id() {
		return this._id;
	}

	set id(value) {
		this._id = value;
	}

	get type() {
		return this._type;
	}

	set type(value) {
		this._type = value;
	}

	set label(value) {
		this._label = value;
	}

	get onUpdate() {
		return this._onUpdate;
	}

	set onUpdate(value) {
		this._onUpdate = value;
	}

	get dependsOnPath() {
		return this._dependsOnPath;
	}

	set dependsOnPath(value) {
		this._dependsOnPath = value;
	}

	get dependsOnValue() {
		return this._dependsOnValue;
	}

	set dependsOnValue(value) {
		this._dependsOnValue = value;
	}

	get options() {
		return this._options;
	}

	set options(value) {
		this._options = value;
	}

	get defaultValue() {
		return this._defaultValue;
	}

	set defaultValue(value) {
		this._defaultValue = value;
	}

	get required() {
		return this._required;
	}

	set required(value) {
		this._required = value;
	}

	get hidden() {
		return this._hidden;
	}

	set hidden(value) {
		this._hidden = value;
	}

	get help() {
		return this._help;
	}

	set help(value) {
		this._help = value;
	}

	get secret() {
		return this._secret;
	}

	set secret(value) {
		this._secret = value;
	}

	get disabled() {
		return this._disabled;
	}

	set disabled(value) {
		this._disabled = value;
	}
}

Field.ERRORS = {
	IS_REQUIRED: 'IS_REQUIRED',
	WRONG_TYPE: 'WRONG_TYPE',
	OUT_OF_RANGE: 'OUT_OF_RANGE'
};

Field.TYPES = TYPES;

module.exports = Field;
