const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const {	terms: { getCellRangeFromTerm } } = require('../../../utils');


const ERROR = FunctionErrors.code;
const DEF_LIMIT = 100;
const MIN_INTERVAL = 1 / 1000; // 1ms


const State = {
	ERROR: (val, options) => {
		options.error = val || ERROR.VALUE;
		return State.ERROR;
	},
	QUERY: (val, options) => {
		// is val query:
		if (val != null && typeof val === 'object' && val.field != null) {
			options.queries.push(val);
			return State.QUERY;
		}
		return State.INTERVAL(val, options);
	},
	INTERVAL: (val, options) => {
		const interval = val != null ? convert.toNumberStrict(val, 0) : -1;
		if (interval < MIN_INTERVAL && interval !== -1) {
			return State.ERROR(ERROR.VALUE, options);
		}
		options.interval = interval;
		return State.RANGE;
	},
	RANGE: (val, options, term, sheet) => {
		if (val == null) return State.LIMIT;
		options.range = getCellRangeFromTerm(term, sheet);
		return options.range != null ? State.LIMIT : State.ERROR(ERROR.VALUE, options);
	},
	LIMIT: (val, options) => {
		const limit = val != null ? convert.toNumberStrict(val) : DEF_LIMIT;
		if (limit != null) {
			options.limit = Math.max(1, limit);
			return State.DONE;
		}
		return State.ERROR(ERROR.VALUE, options);
	},
	DONE: () => State.DONE
};

const mapQueryOptions = (sheet, terms) => {
	let state = State.QUERY;
	const options = { queries: [], interval: -1, limit: DEF_LIMIT };
	terms.forEach((term) => {
		const val = term.value;
		state = state(val, options, term, sheet);
	});
	return options;
};
module.exports = mapQueryOptions;
