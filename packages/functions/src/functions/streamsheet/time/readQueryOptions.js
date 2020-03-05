const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const {	terms: { getCellRangeFromTerm } } = require('../../../utils');


const ERROR = FunctionErrors.code;
const DEF_LIMIT = 100;
const MIN_INTERVAL = 1 / 1000; // 1ms

const split = (str) => `${str}`.split(',').map((part) => part.trim());
const createQuery = ({ select, aggregate, where }) => {
	aggregate = aggregate != null ? split(aggregate) : [];
	return { select: split(select), aggregate, where };
};

const Read = {
	ERROR: (val, options) => {
		options.error = options.error || val || ERROR.VALUE;
		return Read.ERROR;
	},
	QUERY: (val, options) => {
		if (val != null && typeof val === 'object' && val.select) {
			options.query = createQuery(val);
			return Read.INTERVAL;
		}
		return Read.ERROR(ERROR.VALUE, options);
	},
	INTERVAL: (val, options) => {
		const interval = val != null ? convert.toNumberStrict(val, -2) : -1;
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
	const options = { interval: -1, limit: DEF_LIMIT };
	terms.reduce((read, term) => read(term.value, options, term, sheet), Read.QUERY);
	return options;
};
module.exports = readQueryOptions;
