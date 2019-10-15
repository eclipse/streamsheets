const ERROR = require('./errors');
const { calculate, convert, runFunction, sheet: sheetutils } = require('./_utils');
const Cell = require('../machine/Cell');
const { Functions, Term } = require('@cedalo/parser');
const { isType } = require('../utils');

const IGNORE = 'ignore';
const MIN_INTERVAL = 1 / 1000; // 1ms
const DEF_METHOD = 9;

const countNonZero = (acc, entry) => entry.value ? acc + 1 : acc;
const countNumber = (acc, entry) => isType.number(entry.value) ? acc + 1 : acc;
const toValue = (entry) => entry.value;

const aggregations = {
	'1': (entries) => calculate.avg(entries.map(toValue)),
	// doesn't make sense because no number values are ignored anyway!
	'2': (entries) => entries.reduce(countNumber, 0),
	'3': (entries) => entries.reduce(countNonZero, 0),
	'4': (entries) => calculate.max(entries.map(toValue)),
	'5': (entries) => calculate.min(entries.map(toValue)),
	'6': (entries) => calculate.product(entries.map(toValue)),
	'7': (entries) => calculate.standardDerivation(entries.map(toValue)),
	'9': (entries) => calculate.sum(entries.map(toValue)),
};
const aggregate = (method) => aggregations[method];

const timeFilter = period => (entries, now) => {
	const limit = now - period;
	return entries.filter((entry) => entry.timestamp > limit);
};
const sizeFilter = size => (entries) => {
	if (entries.length > size) entries.splice(0, 1);
	return entries;
};

const compareByKey = (entry1, entry2) => entry1.key - entry2.key;
const areEqualNr = (n1, n2) => Math.abs(n2 - n1) < 0.00001;

class Store {
	static of(filter, sorted) {
		return new Store(filter, sorted);
	}
	constructor(filter, sorted) {
		this.filter = filter;
		this.entries = [];
		this.sortIt = sorted;
	}
	push(now, value, key = now) {
		this.entries.push({ key, value, timestamp: now });
		if (this.sortIt) this.entries.sort(compareByKey);
		this.entries = this.filter(this.entries, now);
	}
}

class Aggregator {
	static of(settings) {
		const { period, interval, sorted } = settings;
		const store = Store.of(timeFilter(period), sorted);
		const size = interval > 0 ? Math.round(period / interval) : 1;
		const aggStore = Store.of(sizeFilter(size), sorted);
		return new Aggregator(store, aggStore, settings);
	}
	constructor(valStore, aggStore, settings) {
		this.valStore = valStore;
		this.aggStore = aggStore;
		this.settings = settings;
		this.aggregate = aggregate(settings.method);
		this.intervalFilter = timeFilter(settings.interval);
		this.nextAggregation = Date.now() + settings.interval;
		this._aggregatedValues = ERROR.NA;
	}

	getAggregatedValues() {
		return this._aggregatedValues;
	}

	hasEqual({ period, method, interval, sorted }) {
		return (
			this.settings.method === method &&
			this.settings.sorted === sorted &&
			areEqualNr(this.settings.period, period) &&
			areEqualNr(this.settings.interval, interval)
		);
	}

	// timestamp is an optional custom value, used as key for store's key/value pairs
	push(value, timestamp) {
		const now = Date.now();
		const interval = this.settings.interval;
		this.valStore.push(now, value, timestamp);
		this._aggregatedValues = this.aggregate(this.valStore.entries);
		if (interval > 0 && now >= this.nextAggregation) {
			const aggregated = this.aggregate(this.intervalFilter(this.valStore.entries, now));
			this.aggStore.push(now, aggregated, timestamp);
			this.nextAggregation = now + interval;
		}
	}
	write(cell, range) {
		const entries = this.settings.interval > 0 ? this.aggStore.entries : this.valStore.entries;
		if (range) {
			const sheet = range.sheet;
			const startrow = range.start.row;
			range.iterate((_cell, index, nextrow) => {
				const entry = entries[index.row - startrow];
				// eslint-disable-next-line no-nested-ternary
				const value = entry ? (nextrow ? entry.key : entry.value) : undefined;
				const newCell = value != null ? new Cell(value, Term.fromValue(value)) : undefined;
				sheet.setCellAt(index, newCell);
			});
		}
		// DL-2306 always return entries with cell
		cell.info = { values: entries.map(({ key, value }) => ({ key, value })) };
	}
}

const getMethodNumber = (value, defNr) => {
	const nr = value != null ? convert.toNumberStrict(value) : defNr;
	return aggregations[nr] ? nr : ERROR.VALUE;
};
const getAggregator = (term, settings) => {
	if (!term._timeaggregator || !term._timeaggregator.hasEqual(settings)) {
		term._timeaggregator = Aggregator.of(settings);
	}
	return term._timeaggregator;
};


const timeaggregate = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(7)
		// we ignore any error values, since we do not want an error as return or in cell...
		.mapNextArg(val => (val != null ? convert.toNumberStrict(val.value, IGNORE) : IGNORE))
		.mapNextArg(period => convert.toNumberStrict(period != null ? period.value || 60 : 60, ERROR.VALUE))
		.mapNextArg(method => getMethodNumber(method && method.value, DEF_METHOD))
		.mapNextArg(timestamp => convert.toNumberStrict(timestamp != null ? timestamp.value : null, Functions.NOW()))
		.mapNextArg(interval => convert.toNumberStrict(interval != null ? interval.value : null))
		.mapNextArg(targetrange => sheetutils.getCellRangeFromTerm(targetrange, sheet))
		.mapNextArg(doSort => doSort != null ? convert.toBoolean(doSort.value) : false)
		.validate((val, period, method, timestamp, interval) =>
			((interval != null && interval < MIN_INTERVAL) ? ERROR.VALUE : undefined)
		)
		.run((val, period, method, timestamp, interval, targetrange, sorted) => {
			period *= 1000; // in ms
			interval = interval != null ? interval * 1000 : -1;
			const settings = { period, method, interval, sorted };
			const aggregator = getAggregator(timeaggregate.term, settings);
			if (val !== IGNORE) {
				aggregator.push(val, timestamp);
				aggregator.write(sheetutils.cellFromFunc(timeaggregate), targetrange);
			}
			return aggregator.getAggregatedValues();
		});

module.exports = timeaggregate;