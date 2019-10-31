const { FunctionErrors: Error } = require('@cedalo/error-codes');

const checkParam = (terms, index) => terms.length > index && terms[index].value !== null;

// simply copied from original olap.js => seems not to be OLAP dependent...
const select = (sheet, ...terms) => {
	if (!sheet || !terms || terms.length < 1) {
		return Error.code.ARGS;
	}

	const target = checkParam(terms, 1) ? terms[1].value : '';

	return target;
};

module.exports = select;
