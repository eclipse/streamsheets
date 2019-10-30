const { runFunction } = require('../../utils');
const { convert } = require('@cedalo/commons');

const bar = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.run(() => {
			let result = '';
			terms.forEach((term) => {
				result += `${convert.toString(term.value)};`;
			});
			return result;
		});

module.exports = bar;
