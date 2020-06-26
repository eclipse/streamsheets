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
const { calculate, runFunction, sheet: sheetutils, terms: { getCellRangeFromTerm } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { Functions, Term } = require('@cedalo/parser');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Cell, State, isType } = require('@cedalo/machine-core');


const IGNORE = 'ignore';
const MIN_INTERVAL = 1 / 1000; // 1ms
const DEF_LIMIT = 1000;
const DEF_METHOD = 9;
const ERROR = FunctionErrors.code;

const countNonZero = (acc, entry) => entry.value ? acc + 1 : acc;
const countNumber = (acc, entry) => isType.number(entry.value) ? acc + 1 : acc;
const toValue = (entry) => entry.value;

const aggregations = {
	// '0': (entries) => toValue(entries[entries.length - 1]),
	'0': (entries) => entries.length ? toValue(entries[entries.length - 1]) : undefined,
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

const registerStateListener = (term, sheet) => {
	if (!term._stateListener) {
		term._stateListener = (type, state) => {
			// DL-3309: reset values on start of a stopped machine
			if (type === 'state' && state.new === State.RUNNING && state.old === State.STOPPED) {
				term._timeaggregator.reset();
			}
		};
		sheet.machine.on('update', term._stateListener);
	}
};
const setDisposeHandler = (term, sheet) => {
	term.dispose = () => {
		if (term._stateListener) sheet.machine.off('update', term._stateListener);
		const proto = Object.getPrototypeOf(term);
		if (proto) proto.dispose.call(term);
	};
};

const entriesReduce = (all, { key, value }) => {
	all.time.push(key);
	all.value.push(value);
	return all;
};

class Store {
	static of(filter, sorted, limitFilter) {
		return new Store(filter, sorted, limitFilter);
	}
	constructor(filter, sorted, limitFilter) {
		this.filter = filter;
		this.entries = [];
		this.sortIt = sorted;
		this.limitFilter = limitFilter;
	}

	reset() {
		this.entries = [];
	}

	push(now, value, key = now) {
		this.entries.push({ key, value, timestamp: now });
		if (this.sortIt) this.entries.sort(compareByKey);
		this.entries = this.filter(this.entries, now);
		this.entries = this.limitFilter(this.entries);
	}
}

class Aggregator {
	static of(settings) {
		const { period, interval, sorted, limit } = settings;
		const limitFilter = sizeFilter(limit);
		const store = Store.of(timeFilter(period), sorted, limitFilter);
		const size = interval > 0 ? Math.round(period / interval) : 1;
		const aggStore = Store.of(sizeFilter(size), sorted, limitFilter);
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

	reset() {
		this.valStore.reset();
		this.aggStore.reset();
		this.nextAggregation = Date.now() + this.settings.interval;
		this._aggregatedValues = ERROR.NA;
	}

	getAggregatedValues() {
		return this.valStore.entries.length < this.settings.limit ? this._aggregatedValues : ERROR.LIMIT;
	}

	hasEqual({ period, method, interval, sorted, limit }) {
		return (
			this.settings.method === method &&
			this.settings.sorted === sorted &&
			areEqualNr(this.settings.limit, limit) &&
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
			if (aggregated != null) this.aggStore.push(now, aggregated, timestamp);
			this.nextAggregation = now + interval;
		}
	}
	write(cell, range, term) {
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
		const marker = term ? term._marker : undefined;
		cell.info = { marker, xvalue: 'time', values: entries.reduce(entriesReduce, { time: [], value: [] }) };
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
const setXValue = (term) => {
	const cell = term && term.cell;
	if (cell) cell.setCellInfo('xvalue', 'time');
};


const timeaggregate = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(8)
		// we ignore any error values, since we do not want an error as return or in cell...
		.mapNextArg(val => (val != null ? convert.toNumberStrict(val.value, IGNORE) : IGNORE))
		.mapNextArg(period => convert.toNumberStrict(period != null ? period.value || 60 : 60, ERROR.VALUE))
		.mapNextArg(method => getMethodNumber(method && method.value, DEF_METHOD))
		.mapNextArg(timestamp => convert.toNumberStrict(timestamp != null ? timestamp.value : null, Functions.NOW()))
		.mapNextArg(interval => convert.toNumberStrict(interval != null ? interval.value : null))
		.mapNextArg(targetrange => getCellRangeFromTerm(targetrange, sheet))
		.mapNextArg(doSort => doSort != null ? convert.toBoolean(doSort.value) : false)
		.mapNextArg(limit => convert.toNumberStrict(limit != null ? limit.value || DEF_LIMIT: DEF_LIMIT, ERROR.VALUE))
		.validate((v, p, m, t, interval) =>	((interval != null && interval < MIN_INTERVAL) ? ERROR.VALUE : undefined))
		.beforeRun(() => setXValue(timeaggregate.term))
		.run((val, period, method, timestamp, interval, targetrange, sorted, limit) => {
			period *= 1000; // in ms
			interval = interval != null ? interval * 1000 : -1;
			const term = timeaggregate.term;
			const settings = { period, method, interval, sorted, limit };
			const aggregator = getAggregator(term, settings);
			setDisposeHandler(term, sheet);
			registerStateListener(term, sheet);
			if (val !== IGNORE) {
				aggregator.push(val, timestamp);
				aggregator.write(sheetutils.cellFromFunc(timeaggregate), targetrange, term);
			}
			return aggregator.getAggregatedValues();
		});

module.exports = timeaggregate;