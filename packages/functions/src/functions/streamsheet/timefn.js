const {
	// calculate,
	runFunction,
	// sheet: sheetutils,
	// terms: { getCellRangeFromTerm }
} = require('../../utils');
const { convert } = require('@cedalo/commons');
// const { Functions, Term } = require('@cedalo/parser');
const { FunctionErrors } = require('@cedalo/error-codes');
// const { Cell, State, isType } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;
const DEF_LIMIT = 1000;
const DEF_PERIOD = 60;

const insert = (entry, entries) => {
	let left = 0;
	let right = entries.length;
	const timestamp = entry.timestamp;
	while (left < right) {
		// eslint-disable-next-line no-bitwise
		const idx = (left + right) >>> 1;
		if (entries[idx].timestamp <= timestamp) left = idx + 1;
		else right = idx;
	}
	entries.splice(right, 0, entry);
	return entries;
};
const sizeFilter = (size) => (entries) => {
	if (entries.length > size) entries.shift();
};
const periodFilter = (period) => (entries) => {
	const delta = entries[entries.length - 1].timestamp - entries[0].timestamp;
	if (delta > period) entries.shift();
};
class TimeStore {
	// period is in seconds
	constructor(period, limit) {
		this.entries = [];
		this.limit = limit;
		this.period = period;
		this.limitBySize = sizeFilter(limit);
		// period is in seconds
		this.limitByPeriod = periodFilter(period * 1000);
	}

	get size() {
		return this.entries.length;
	}

	values(key) {
		return this.entries.reduce((all, entry) => {
			if (entry.values.hasOwnProperty(key)) all.push(entry.values[key]);
			return all;
		}, []);
	}
	timestamps() {
		return this.entries.reduce((all, entry) => {
			all.push(entry.timestamp);
			return all;
		}, []);
	}

	push(timestamp, values) {
		insert({ timestamp, values }, this.entries);
		this.limitBySize(this.entries);
		this.limitByPeriod(this.entries);
	}
}
const getTimeStore = (term, period, limit) => {
	if (!term._timestore || term._timestore.period !== period || term._timestore.limit !== limit) {
		term._timestore = new TimeStore(period, limit);
	}
	return term._timestore;
};

const store = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(4)
		// we ignore any error values, since we do not want an error as return or in cell...
		.mapNextArg((values) => values.value || ERROR.ARGS)
		.mapNextArg(period => period != null ? convert.toNumberStrict(period.value || DEF_PERIOD, ERROR.VALUE) : DEF_PERIOD)
		.mapNextArg(timestamp => timestamp != null && convert.toNumberStrict(timestamp.value))
		.mapNextArg(limit => limit != null ? convert.toNumberStrict(limit.value || DEF_LIMIT, ERROR.VALUE) : DEF_LIMIT)
		.run((values, period, timestamp, limit) => {
			const term = store.term;
			const timestore = getTimeStore(term, period, limit);
			timestore.push(timestamp || Date.now(), values);
			return true;
		});

const interval = () => {};
const query = () => {};

module.exports = {
	'TIME.INTERVAL': interval,
	'TIME.QUERY': query,
	'TIME.STORE': store
};
