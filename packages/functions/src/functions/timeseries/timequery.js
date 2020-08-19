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
const { convert, serialnumber: { ms2serial } } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Cell } = require('@cedalo/machine-core');
const { Term } = require('@cedalo/parser');
const {
	date: { localNow },
	runFunction,
	terms: { getCellRangeFromTerm, getTargetTerm, hasValue }
} = require('../../utils');
const aggregations = require('./aggregations');
const stateListener = require('./stateListener');
const transform = require('./transform');


const ERROR = FunctionErrors.code;
const DEF_LIMIT = 1000;
const DEF_LIMIT_MIN = 1;
const MIN_INTERVAL = 1 / 1000; // 1ms


const checkForWildCard = (query) => {
	let aggridx = 0;
	query.hasWildcard = query.select.some((str, index) => {
		aggridx = index;
		return str === '*';
	});
	// move wildcard aggregation to first place:
	if (query.hasWildcard) query.aggregate[0] = query.aggregate[aggridx];
};
const split = (str) => `${str}`.split(',').map((part) => part.trim());
const toLowerCase = (str) => str.toLowerCase();
const createQuery = (json) => {
	const { select, aggregate, where } = json;
	const query = {
		select: split(select),
		aggregate: aggregate != null ? split(aggregate).map(toLowerCase) : [],
		where
	};
	checkForWildCard(query);
	return query;
};

const boundedPush = (size) => (value, entries) => {
	entries.push(value);
	if (entries.length > size) entries.shift();
	return entries;
};

const areEqualQueries = (q1, q2) => q1.select === q2.select && q1.aggregate === q2.aggregate && q1.where === q2.where;


const entriesReduce = (all, { ts, values: vals }, index) => {
	all.time.push(ms2serial(ts));
	if (vals) {
		Object.keys(vals).forEach((key) => {
			all[key] = all[key] || [];
			// IMPORTANT!! add at index ensures equally array length for all values => undefined at index if no value exist
			all[key][index] = vals[key];
		});
	}
	return all;
};
const spreadValuesToRange = (values, range) => {
	const sheet = range.sheet;
	const time = values.time || [];
	const entries = Object.entries(values).filter(([key]) => key !== 'time');
	let row = -1;
	let col = 0;
	let value;
	range.iterate((_cell, index, nextrow) => {
		col = nextrow ? 0 : col + 1;
		row = nextrow ? row + 1 : row;
		value = undefined;
		if (col === 0) {
			value = row === 0 ? 'time' : time[row - 1];
		} else {
			const colEntries = entries[col - 1];
			if (colEntries) {
				value = row === 0 ? colEntries[0] : colEntries[1][row - 1];
			}
		}
		const newCell = value != null ? new Cell(value, Term.fromValue(value)) : undefined;
		sheet.setCellAt(index, newCell);
	});
};

class QueryStore {
	static of(queryjson, interval, limit) {
		const store = new QueryStore(interval, limit);
		store.setQuery(queryjson);
		return store.isValid() ? store : undefined;
	}
	constructor(interval, limit) {
		this.limit = limit;
		this.interval = interval;
		this.msInterval = interval * 1000;
		this.nextQuery = interval > 0 ? localNow() + this.msInterval : -1;
		this.entries = [];
		this.push = boundedPush(limit);
		this.reset = this.reset.bind(this);
	}

	reset() {
		this.entries = [];
		this.nextQuery = this.msInterval > 0 ? localNow() + this.msInterval : -1;
	}

	hasEqual(queryjson, interval, limit) {
		return this.interval === interval && this.limit === limit && areEqualQueries(this.queryjson, queryjson);
	}

	isValid() {
		if (this.query) {
			return aggregations.validate(this.query.aggregate);
		}
		return false;
	}

	setQuery(json) {
		this.query = createQuery(json);
		this.queryjson = { ...json };
	}

	performQuery(store, now = localNow()) {
		// create fresh transform, because aggregations/filters work with closures!
		const period = this.msInterval > 0 ? now - this.msInterval : -1;
		const xform = transform.createFrom(this.query, period);
		const result = store.entries.reduceRight(xform, { ts: now, values: {} });
		this.push(result, this.entries);
	}
	performQueryOnInterval(store, now = localNow()) {
		if (this.nextQuery < 0 || now >= this.nextQuery) {
			this.performQuery(store, now);
			if (this.nextQuery > 0) this.nextQuery = now + this.msInterval;
		}
	}

	write(cell, range, term) {
		const entries = this.entries;
		const values = entries.reduce(entriesReduce, { time: [] });
		if (range) spreadValuesToRange(values, range);
		// DL-4067: marker support
		cell.info.marker = term ? term._marker : undefined;
		cell.info.values = values;
		cell.info.xvalue = 'time';
	}
}

const getQueryStore = (term, query, interval, limit) => {
	if (!term._querystore || !term._querystore.hasEqual(query, interval, limit)) {
		term._querystore = QueryStore.of(query, interval, limit);
	}
	return term._querystore;
};

const isValidQuery = (json) => json != null && json.select != null && typeof json === 'object';

const getRange = (term, sheet) =>
	term && term.value != null ? getCellRangeFromTerm(term, sheet) || ERROR.VALUE : undefined;

const getLimit = (term) => {
	const limit = hasValue(term) ? convert.toNumberStrict(term.value, ERROR.VALUE) : DEF_LIMIT;
	return limit >= DEF_LIMIT_MIN ? limit : ERROR.VALUE;
};
const getInterval = (term) => {
	const interval = hasValue(term) ? convert.toNumberStrict(term.value, ERROR.VALUE) : -1;
	return interval >= MIN_INTERVAL || interval === -1 ? interval : ERROR.VALUE;
};
const getStoreTerm = (term) => {
	term = getTargetTerm(term);
	return term.name && term.name.toLowerCase() === 'timestore' ? term : undefined;
};
const setXValue = (term) => {
	const cell = term && term.cell;
	if (cell) cell.setCellInfo('xvalue', 'time');
};

const timeQuery = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(2)
		.withMaxArgs(5)
		.mapNextArg((term) => getStoreTerm(term) || ERROR.VALUE)
		.mapNextArg((query) => (isValidQuery(query.value) ? query.value : ERROR.VALUE))
		.mapNextArg((interval) => getInterval(interval))
		.mapNextArg((range) => getRange(range))
		.mapNextArg((limit) => getLimit(limit))
		.beforeRun(() => setXValue(timeQuery.term))
		.run((storeterm, queryjson, interval, range, limit) => {
			const term = timeQuery.term;
			const timestore = storeterm._timestore;
			const querystore = getQueryStore(term, queryjson, interval, limit);
			if (querystore) {
				stateListener.registerCallback(sheet, term, querystore.reset);
				querystore.performQueryOnInterval(timestore);
				querystore.write(term.cell, range, term);
				const size = querystore.entries.length;
				// eslint-disable-next-line no-nested-ternary
				return size === 0 ? ERROR.NA : size < querystore.limit ? true : ERROR.LIMIT;
			}
			// failed to create store...
			return ERROR.VALUE;
		});
timeQuery.displayName = true;

module.exports = timeQuery;