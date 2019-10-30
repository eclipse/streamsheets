const { SheetParser } = require('@cedalo/machine-core');

const createTerm = (formula, sheet) => SheetParser.parse(formula, sheet);

module.exports = {
	createTerm
};
