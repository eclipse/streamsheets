const { runFunction } = require('../../utils');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

// maybe renamed to continue...
const goto = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(1)
		.mapNextArg(term => term.operand)
		.addMappedArg((operand) => {
			const index = operand.index;
			return index != null ? index : Error.code.INVALID_PARAM;
		})
		.run((oprand, index) => {
			sheet.processor.goto(index);
			return true;
		});


module.exports = goto;
