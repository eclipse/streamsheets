const { validateStreamSheet } = require('./validation');
const { convert } = require('@cedalo/commons');
const { runFunction, terms: { getCellRangeFromTerm }} = require('@cedalo/functions').utils;
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;
const asString = (value) => convert.toString(value);

const pathsFromRange = (term, sheet) => {
	const range = term ? getCellRangeFromTerm(term, sheet) : undefined;
	const paths = range && range.reduce((all, cell) => {
		if (cell) {
			const path = asString(cell.value);
			if (path) all.push(asString(cell.value));
		}
		return all;
	}, []);
	return paths && paths.length ? paths : ERROR.VALUE;
};

const folder = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(path => asString(path.value, ERROR.VALUE))
		.addMappedArg(() => validateStreamSheet(sheet.streamsheet))
		.run((path, streamsheet) => {
			streamsheet.notify('event', {
				type: 'opcua',
				action: 'folder',
				data: { path }
			});
			return true;
		});

const folders = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(range => pathsFromRange(range, sheet))
		.addMappedArg(() => validateStreamSheet(sheet.streamsheet))
		.run((paths, streamsheet) => {
			streamsheet.notify('event', {
				type: 'opcua',
				action: 'folders',
				data: { paths }
			});
			return true;
		});

const deletefolder = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(path => asString(path.value, ERROR.VALUE))
		.addMappedArg(() => validateStreamSheet(sheet.streamsheet))
		.run((path, streamsheet) => {
			streamsheet.notify('event', {
				type: 'opcua',
				action: 'delete_folder',
				data: { path }
			});
			return true;
		});

module.exports = {
	folder,
	folders,
	deletefolder
};
