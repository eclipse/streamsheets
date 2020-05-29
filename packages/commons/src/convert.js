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
const TYPES = {
	boolean: 1,
	number: 2,
	string: 4,
	object: 8,
	ALL: 15
};

const valueOrDefault = (val, defval) => (val == null && defval != null ? defval : val);
// note: !isNaN(null) && isFinite(null) evaluates to true!!!
const isNr = (val) => val != null && !isNaN(val) && isFinite(val);

const toBool = {
	boolean: (val) => val,
	number: (val) => Boolean(val),
	string: (val) => {
		const str = `${val}`.toLowerCase();
		// eslint-disable-next-line no-nested-ternary
		return str === 'false' ? false : str === 'true' ? true : undefined;
	},
	object: () => undefined
	// object: (val) => val != null
};
const toNr = {
	boolean: (val) => (val ? 1 : 0),
	number: (val) => (isNr(val) ? val : undefined),
	string: (val) => {
		const nr = Number(val);
		return isNr(nr) ? nr : undefined;
	},
	object: () => undefined
};
const toStr = {
	boolean: (val) => `${val}`,
	number: (val) => `${val}`,
	string: (val) => val,
	object: (val) => val != null ? val.toString() : undefined
};

const convert = (types, to) => (val, defval) => {
	const type = typeof val;
	if (types.has(TYPES[type])) {
		const conv = to[type];
		val = conv ? conv(val) : undefined;
	} else {
		val = undefined;
	}
	return valueOrDefault(val, defval);
};

const types = () => ({
	value: 0,
	has(type) {
		// eslint-disable-next-line no-bitwise
		return this.value === 0 || (this.value & type) === type;
	},
	set(type) {
		// eslint-disable-next-line no-bitwise
		this.value |= type;
	},
	unset(type) {
		// eslint-disable-next-line no-bitwise
		this.value &= ~type;
	}
});

const update = (type, converter) => {
	const toTypes = converter.types;
	if (converter.doSet) toTypes.set(type);
	else {
		toTypes.value =  toTypes.value === 0 ? TYPES.ALL : toTypes.value;
		toTypes.unset(type);
	} 
	converter.doSet = true;
	return converter;
};

class Convert {
	constructor() {
		this.types = types();
		this.doSet = true;
		this.toBoolean = convert(this.types, toBool);
		this.toNumber = convert(this.types, toNr);
		this.toString = convert(this.types, toStr);
	}

	get boolean() {
		return update(TYPES.boolean, this);
	}
	get number() {
		return update(TYPES.number, this);
	}
	get object() {
		return update(TYPES.object, this);
	}
	get string() {
		return update(TYPES.string, this);
	}
	get or() {
		return this;
	}
	get no() {
		this.doSet = false;
		return this;
	}
}

module.exports = {
	// predefine some often used conversions:
	toBoolean: new Convert().toBoolean,
	toNumber: new Convert().toNumber,
	toNumberStrict: new Convert().number.toNumber,
	toString: new Convert().toString,
	// for other conversion scenarios
	from: () => new Convert()
};
