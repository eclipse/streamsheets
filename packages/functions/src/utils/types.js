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
const array = require('../functions/streamsheet/array');
const jsonFunc = require('../functions/streamsheet/json');
const { isFuncTerm } = require('./terms');
const { Term } = require('@cedalo/parser');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const TYPE = {
	STRING: 'string',
	INTEGER: 'integer',
	NUMBER: 'number',
	ENUM: 'enum',
	BOOLEAN: 'boolean',
	JSON: 'json',
	// STREAM: 'stream',
	LIST: 'list',
	UNION: 'union',
	MQTT_TOPIC: 'mqtt_topic'
};

const toArray = (sheet, term, byRow, forceFlatOr2d) => {
	if (term && term.value) {
		if (isFuncTerm('array')) {
			return term.value;
		}
		return array(sheet, term, byRow, forceFlatOr2d);
	}
	return undefined;
};

const safeArray = (sheet, term, byRow, forceFlatOr2d) => toArray(sheet, term, byRow, forceFlatOr2d) || [];

// const futureAsString = {
// 	[TYPE.STRING]: (config, value) => {
// 		if (value === null || value === undefined) {
// 			return undefined;
// 		}
// 		switch (typeof value) {
// 			case 'string': return value;
// 			case 'object': return JSON.stringify(value, null, 2);
// 			default: return value.toString();
// 		}
// 	}
// };
const nrOrStrToNumber = convert.from().number.or.string.toNumber;
const asNumber2 = (value) => value !== '' ? nrOrStrToNumber(value) : undefined;
const asString2 = (value) => convert.toString(value);

const asInteger = (value) => {
	const number = asNumber2(value);
	return number && Math.trunc(number);
};

const asEnum = (value, config) => {
	const string = convert.toString(value);
	const enumValues = config.values;
	const lowerEnumValues = enumValues.map((enumValue) => enumValue.toLowerCase());
	const lowerString = string.toLowerCase();
	const index = lowerEnumValues.indexOf(lowerString);
	const result = enumValues[index];
	// if (value && result === undefined) {
	// 	return ERROR.INVALID_PARAM;
	// }
	return result;
};

const asJSONWithFields = (value, config) => {
	// TODO validate types of fields
	const isArray = Array.isArray(value);
	// eslint-disable-next-line
	const getField = (index, name) => {
		return isArray ? value[index] : value[name];
	};

	if (isArray || typeof value === 'object') {
		const record = {};
		// eslint-disable-next-line
		for (let [index, fieldConfig] of config.fields.entries()) {
			// eslint-disable-next-line
			const fieldValue = asType(getField(index, fieldConfig.id), fieldConfig.type);
			if (fieldValue !== undefined) {
				record[fieldConfig.id] = fieldValue;
			} else if (fieldConfig.defaultValue) {
				record[fieldConfig.id] = fieldConfig.defaultValue;
			} else if (!fieldConfig.optional) {
				return undefined;
			}
		}
		return record;
	}
	if (typeof value === 'string') {
		try {
			const parsedValue = JSON.parse(value);
			if (Array.isArray(parsedValue) || typeof parsedValue === 'object') {
				return asJSONWithFields(parsedValue, config);
			}
		} catch (e) {
			// do nothing
		}
	}
	return undefined;
};

const asJSONWithFieldType = (json, config) => {
	const subtypeConfig = config.fieldType;
	const keys = Object.keys(json);
	const result = {};
	// eslint-disable-next-line
	for (let key of keys) {
		// eslint-disable-next-line
		const convertedValue = asType(json[key], subtypeConfig);
		if (convertedValue === undefined) return undefined;
		result[key] = convertedValue;
	}
	return result;
};

const asJSON = (value, config) => {
	if (Array.isArray(config.fields)) {
		return asJSONWithFields(value, config);
	}
	try {
		const string =
			typeof value === 'string' ? value : JSON.stringify(value, (k, v) => (v === undefined ? null : v));
		const json = JSON.parse(string);
		if (json !== null && typeof json === 'object') {
			if (config.fieldType) {
				return asJSONWithFieldType(json, config);
			}
			return json;
		}
	} catch (e) {
		return undefined;
	}
	return undefined;
};

function asList(listValue, config) {
	if (listValue === undefined) {
		return undefined;
	}
	const list = Array.isArray(listValue) ? listValue : [listValue];
	const subtypeConfig = config.type;
	const resultList = [];
	// eslint-disable-next-line
	for (let value of list) {
		// eslint-disable-next-line
		const convertedValue = asType(value, subtypeConfig);
		if (convertedValue === undefined) return undefined;
		resultList.push(convertedValue);
	}
	return resultList;
}

const asBoolean = (value) => {
	const lower = `${value}`.toLowerCase();
	if (lower === 'true' || lower === '1') return true;
	if (lower === 'false' || lower === '0') return false;
	return undefined;
};

const asUnion = (value, config) => {
	const types = config.types;
	// eslint-disable-next-line
	for (let type of types) {
		// eslint-disable-next-line
		const typedValue = asType(value, type);
		if (typedValue !== undefined) {
			return typedValue;
		}
	}
	return undefined;
};

const TYPE_FUNCS = {
	[TYPE.NUMBER]: asNumber2,
	[TYPE.BOOLEAN]: asBoolean,
	[TYPE.INTEGER]: asInteger,
	[TYPE.STRING]: asString2,
	[TYPE.ENUM]: asEnum,
	[TYPE.LIST]: asList,
	[TYPE.JSON]: asJSON,
	// [TYPE.STREAM]: () => {},
	[TYPE.UNION]: asUnion
};

function asType(value, config) {
	const type = config.name;
	return TYPE_FUNCS[type] && TYPE_FUNCS[type](value, config);
}

const fromTerm = (f) => (term, ...args) => {
	if (term && term.value !== undefined && term.value !== null) {
		const result = f(term.value, ...args);
		if (result === undefined) {
			return ERROR.INVALID_PARAM;
		}
		return result;
	}
	return undefined;
};

const termAsNumber = fromTerm(asNumber2);
const termAsBoolean = fromTerm(asBoolean);
const termAsInteger = fromTerm(asInteger);
const termAsString = fromTerm(convert.toString);
// const termAsJSON = fromTerm(asJSON);
const termAsEnum = fromTerm(asEnum);

const termAsJSON = (term, config, sheet) => {
	if (term && term.value) {
		let value = term.value;
		if (isFuncTerm(term, 'dictionary') || isFuncTerm(term, 'json') || isFuncTerm(term, 'array')) {
			value = term.value;
		} else if (Array.isArray(config.fields)) {
			const recordArrays = safeArray(sheet, term, null, Term.fromString('2d'));
			if (recordArrays.length > 1) return ERROR.INVALID_PARAM;
			value = recordArrays[0];
		} else {
			const dict = jsonFunc(sheet, term);
			if (!FunctionErrors.isError(dict)) {
				value = dict;
			}
		}
		const result = asJSON(value, config);
		if (result === undefined) {
			return ERROR.INVALID_PARAM;
		}
		return result;
	}
	return undefined;
};

const termAsList = (term, config, sheet) => {
	const sybtypeConfig = config.type;
	const mode = sybtypeConfig.name === TYPE.RECORD || sybtypeConfig.name === TYPE.LIST ? '2d' : 'flat';
	let value = toArray(sheet, term, null, Term.fromString(mode));
	if (FunctionErrors.isError(value)) {
		// eslint-disable-next-line
		const singleValue = termAsType(term, sybtypeConfig, sheet);
		if (FunctionErrors.isError(singleValue)) return value;
		value = singleValue;
	}
	return asList(value, config);
};

const termAsUnion = (term, config, sheet) => {
	const types = config.types;
	// eslint-disable-next-line
	for (let type of types) {
		// eslint-disable-next-line
		const value = termAsType(term, type, sheet);
		if (!FunctionErrors.isError(value) && value !== undefined) {
			return value;
		}
	}
	return undefined;
};

// args: term, config, sheet
const TERM_TYPE_FUNCS = {
	[TYPE.NUMBER]: termAsNumber,
	[TYPE.BOOLEAN]: termAsBoolean,
	[TYPE.INTEGER]: termAsInteger,
	[TYPE.STRING]: termAsString,
	[TYPE.MQTT_TOPIC]: termAsString,
	[TYPE.ENUM]: termAsEnum,
	[TYPE.LIST]: termAsList,
	[TYPE.JSON]: termAsJSON,
	// [TYPE.STREAM]: termAsStream,
	[TYPE.UNION]: termAsUnion
};

function termAsType(term, config, sheet) {
	const type = config.name;
	const func = TERM_TYPE_FUNCS[type];
	return func && func(term, config, sheet);
}

const numberContraints = (value, config) => {
	if (config.min) {
		return config.min > value ? ERROR.INVALID_PARAM : value;
	}
	if (config.max) {
		return config.max < value ? ERROR.INVALID_PARAM : value;
	}
	return value;
};

const listConstraints = (value, config) => {
	if (config.min) {
		return config.min > value.length ? ERROR.INVALID_PARAM : value;
	}
	if (config.max) {
		return config.max < value.length ? ERROR.INVALID_PARAM : value;
	}
	return value;
};

const mqttTopicConstraints = (value, config) => {
	if (typeof value !== 'string') {
		return ERROR.INVALID_PARAM;
	}
	if (value.indexOf('//') > -1
			|| value.startsWith('#')
			|| value.length < 1
	) {
		return ERROR.INVALID_PARAM;
	}
	const topicParts = String(value).split('/');
	if (config.context === 'publish') {
		return !topicParts.find((t) => t.includes('+') || t.includes('#')) ? value : ERROR.INVALID_PARAM;
	}
	return value;
};

// value is alwyas defined
const TYPE_CONSTRAINTS = {
	[TYPE.NUMBER]: numberContraints,
	[TYPE.LIST]: listConstraints,
	[TYPE.BOOLEAN]: (value) => value,
	[TYPE.INTEGER]: numberContraints,
	[TYPE.STRING]: (value) => value,
	[TYPE.ENUM]: (value) => value,
	// [TYPE.STREAM]: value => value,
	[TYPE.JSON]: (value) => value,
	[TYPE.MQTT_TOPIC]: mqttTopicConstraints,
	// Not supported for now
	[TYPE.UNION]: (value) => value
};

const checkConstraints = (value, config) => {
	const type = config.name;
	const func = TYPE_CONSTRAINTS[type];
	return func && func(value, config);
};

module.exports = {
	TYPE,
	asType,
	termAsType,
	checkConstraints
};
