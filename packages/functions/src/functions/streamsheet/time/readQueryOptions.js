const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const {	terms: { getCellRangeFromTerm } } = require('../../../utils');


const ERROR = FunctionErrors.code;
const DEF_LIMIT = 100;
const MIN_INTERVAL = 1 / 1000; // 1ms


const Read = {
	ERROR: (val, options) => {
		options.error = val || ERROR.VALUE;
		return Read.ERROR;
	},
	QUERY: (val, options) => {
		// is val query:
		if (val != null && typeof val === 'object' && (val.value != null || val.values != null)) {
			options.queries.push(val);
			return Read.QUERY;
		}
		return Read.INTERVAL(val, options);
	},
	INTERVAL: (val, options) => {
		const interval = val != null ? convert.toNumberStrict(val, 0) : -1;
		if (interval < MIN_INTERVAL && interval !== -1) {
			return Read.ERROR(ERROR.VALUE, options);
		}
		options.interval = interval;
		return Read.RANGE;
	},
	RANGE: (val, options, term, sheet) => {
		if (val == null) return Read.LIMIT;
		options.range = getCellRangeFromTerm(term, sheet);
		return options.range != null ? Read.LIMIT : Read.ERROR(ERROR.VALUE, options);
	},
	LIMIT: (val, options) => {
		const limit = val != null ? convert.toNumberStrict(val) : DEF_LIMIT;
		if (limit != null) {
			options.limit = Math.max(1, limit);
			return Read.DONE;
		}
		return Read.ERROR(ERROR.VALUE, options);
	},
	DONE: () => Read.DONE
};

const readQueryOptions = (sheet, terms) => {
	let read = Read.QUERY;
	const options = { queries: [], interval: -1, limit: DEF_LIMIT };
	terms.forEach((term) => {
		const val = term.value;
		read = read(val, options, term, sheet);
	});
	return options;
};
module.exports = readQueryOptions;
