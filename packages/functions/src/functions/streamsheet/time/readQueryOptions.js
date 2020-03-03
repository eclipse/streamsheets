const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const {	terms: { getCellRangeFromTerm } } = require('../../../utils');


const ERROR = FunctionErrors.code;
const DEF_LIMIT = 100;
const MIN_INTERVAL = 1 / 1000; // 1ms

const addQueries = (queries, values = '', aggregates = '') => {
	const vals = values.split(',');
	const aggrs = aggregates.split(',');
	vals.forEach((value, index) => {
		let aggregate = aggrs[index];
		if (aggregate == null || aggregate === '') aggregate = 0;
		queries.push({ value, aggregate });
	});
};

const Read = {
	ERROR: (val, options) => {
		options.error = val || ERROR.VALUE;
		return Read.ERROR;
	},
	QUERY: (val, options) => {
		if (val != null && typeof val === 'object') {
			const { value, values, aggregate, aggregates } = val;
			if (value != null || values != null || aggregate != null || aggregates != null) {
				addQueries(options.queries, value || values, aggregate || aggregates);
				return Read.QUERY;
			}
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
	const options = { queries: [], interval: -1, limit: DEF_LIMIT };
	terms.reduce((read, term) => read(term.value, options, term, sheet), Read.QUERY);
	return options;
};
module.exports = readQueryOptions;
