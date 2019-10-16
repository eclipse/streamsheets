const { convert, runFunction } = require('./_utils');

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
