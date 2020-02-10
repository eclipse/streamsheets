const {	runFunction, terms: { hasValue } } = require('../../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const IdGenerator = require('@cedalo/id-generator');

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
	if (entries.length > size) {
		entries.shift();
		return ERROR.LIMIT;
	}
	return true;
};
const periodFilter = (period) => (entries) => {
	const delta = entries[entries.length - 1].timestamp - entries[0].timestamp;
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

const store = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(4)
		.mapNextArg((values) => values.value || ERROR.ARGS)
		.mapNextArg(period => hasValue(period) ? convert.toNumberStrict(period.value, ERROR.VALUE) : DEF_PERIOD)
		.mapNextArg(timestamp => timestamp != null && convert.toNumberStrict(timestamp.value))
		.mapNextArg(limit => hasValue(limit) ? convert.toNumberStrict(limit.value, ERROR.VALUE) : DEF_LIMIT)
		.run((values, period, timestamp, limit) => {
			// TODO: should we validate values, e.g. if key or value is undefined?
			// => prevent wrong usage, accidental wrong json
			const term = store.term;
			const timestore = getTimeStore(term, period, limit);
			// should we filter certain values, e.g. ERRORs?
			return timestore.push(timestamp || Date.now(), values);
		});


module.exports = store;
