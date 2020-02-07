const {
	calculate,
	runFunction,
	// sheet: sheetutils,
	// terms: { getCellRangeFromTerm }
} = require('../../../utils');
const { convert } = require('@cedalo/commons');
// const { Functions, Term } = require('@cedalo/parser');
const { FunctionErrors } = require('@cedalo/error-codes');
const { /* Cell, State, */ isType } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

const countNonZero = (acc, entry) => entry.value ? acc + 1 : acc;
const countNumber = (acc, entry) => isType.number(entry.value) ? acc + 1 : acc;
		
const aggregations = {
	// '0': (entries) => toValue(entries[en	tries.length - 1]),
	'0': (values) => values,
	'1': (values) => calculate.avg(values),
	// doesn't make sense because no number values are ignored anyway!
	'2': (values) => values.reduce(countNumber, 0),
	'3': (values) => values.reduce(countNonZero, 0),
	'4': (values) => calculate.max(values),
	'5': (values) => calculate.min(values),
	'6': (values) => calculate.product(values),
	'7': (values) => calculate.standardDerivation(values),
	'9': (values) => calculate.sum(values)
};
const getAggregateFunction = (key, method) => {
	const aggregation = aggregations[method];
	return (timestore) => aggregation(timestore.values(key));
};

class AggregateStore {
	constructor(settings) {
		this.entries = [];
		this.aggregate = getAggregateFunction(settings.key, settings.method);
	}
	hasSettings({ key, method, interval, limit }) {
		return (
			this.settings.key === key &&
			this.settings.method === method &&
			this.settings.interval === interval &&
			this.settings.limit === limit
		);
	}
}
const getAggregateStore = (term, settings) => {
	if (!term._aggstore || !term._aggstore.hasSettings(settings)) {
		term._aggstore = new AggregateStore(settings);
	}
	return term._aggstore;
};

const aggregate = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(5)
		.mapNextArg((timestore) => timestore._timestore || ERROR.VALUE)
		// .mapNextArg(period => period != null ? convert.toNumberStrict(period.value || DEF_PERIOD, ERROR.VALUE) : DEF_PERIOD)
		// .mapNextArg(timestamp => timestamp != null && convert.toNumberStrict(timestamp.value))
		// .mapNextArg(limit => limit != null ? convert.toNumberStrict(limit.value || DEF_LIMIT, ERROR.VALUE) : DEF_LIMIT)
		.run((timestore /* values, period, timestamp, limit */) => {
			return true;
			// const term = store.term;
			// const timestore = getTimeStore(term, period, limit);
			// return timestore.push(timestamp || Date.now(), values);
		});


module.exports = aggregate;
