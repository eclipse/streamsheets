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
const { convert, serialnumber: { serial2ms } } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const IdGenerator = require('@cedalo/id-generator');
const {	date: { localNow }, runFunction, terms: { hasValue } } = require('../../utils');
const toJSON = require('../streamsheet/json');
const stateListener = require('./stateListener');

const ERROR = FunctionErrors.code;
const DEF_LIMIT = 1000;
const DEF_LIMIT_MIN = 1;
const DEF_PERIOD = 60;


const insert = (entry, entries) => {
	let left = 0;
	let right = entries.length;
	const timestamp = entry.ts;
	while (left < right) {
		// eslint-disable-next-line no-bitwise
		const idx = (left + right) >>> 1;
		if (entries[idx].ts <= timestamp) left = idx + 1;
		else right = idx;
	}
	entries.splice(right, 0, entry);
	return entries;
};
const sizeFilter = (size) => (entries) => {
	if (entries.length > size) {
		entries.shift();
		return ERROR.LIMIT;
	}
	return true;
};
const periodFilter = (period) => (entries) => {
	const delta = entries[entries.length - 1].ts - entries[0].ts;
	if (delta > period) entries.shift();
};
class TimeStore {
	constructor(period, limit) {
		this.id = IdGenerator.generateShortId();
		this.entries = [];
		this.limit = limit;
		this.period = period;
		this.limitBySize = sizeFilter(limit);
		this.limitByPeriod = periodFilter(period * 1000);
		this.reset = this.reset.bind(this);
	}

	get size() {
		return this.entries.length;
	}

	reset() {
		this.entries = [];
	}

	values(key) {
		return this.entries.reduce((all, entry) => {
			if (entry.values.hasOwnProperty(key)) all.push(entry.values[key]);
			return all;
		}, []);
	}
	timestamps() {
		return this.entries.reduce((all, entry) => {
			all.push(entry.ts);
			return all;
		}, []);
	}

	push(ts, values) {
		insert({ ts, values }, this.entries);
		this.limitByPeriod(this.entries);
		return this.limitBySize(this.entries);
	}
}
const getTimeStore = (term, period, limit) => {
	if (!term._timestore || term._timestore.period !== period || term._timestore.limit !== limit) {
		term._timestore = new TimeStore(period, limit);
	}
	return term._timestore;
};

const getPeriod = (term) => hasValue(term) ? convert.toNumberStrict(term.value, ERROR.VALUE) : DEF_PERIOD;

const getTimeStamp = (term) => {
	// expect custom timestamp to be an excel serial number!
	if (hasValue(term) && term.value !== '') {
		let timestamp = convert.toNumberStrict(term.value);
		timestamp = timestamp != null && serial2ms(timestamp);
		return timestamp || ERROR.VALUE;
	}
	return undefined;
};
const getLimit = (term) => {
	const limit = hasValue(term) ? convert.toNumberStrict(term.value, ERROR.VALUE) : DEF_LIMIT;
	return limit >= DEF_LIMIT_MIN ? limit : ERROR.VALUE;
};

const isPlainObject = (value) => {
	const proto = Object.getPrototypeOf(value);
	return proto == null || Object.getPrototypeOf(proto) == null;
};
const getValues = (sheet, term) => {
	const value = term.value;
	if (value != null) return isPlainObject(value) ? value : toJSON(sheet, term);
	return undefined;
};

const store = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(4)
		.mapNextArg((values) => getValues(sheet, values) || ERROR.ARGS)
		.mapNextArg((period) => getPeriod(period))
		.mapNextArg((timestamp) => getTimeStamp(timestamp))
		.mapNextArg((limit) => getLimit(limit))
		.run((values, period, timestamp, limit) => {
			const term = store.term;
			const timestore = getTimeStore(term, period, limit);
			stateListener.registerCallback(sheet, term, timestore.reset);
			return timestore.push(timestamp || localNow(), values);
		});
store.displayName = true;

module.exports = store;
