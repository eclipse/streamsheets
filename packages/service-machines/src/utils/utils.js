const { isType, SheetIndex } = require('@cedalo/machine-core');


// either pass SheetIndex or col & row number...
const cellDescriptor = (cell, col, row) => {
	const descr = cell ? cell.description() : {};
	descr.reference = isType.number(col)
		? `${SheetIndex.columnAsStr(col)}${row}`
		: col.toString();
	return descr;
};

module.exports = {
	cellDescriptor,

	getSheetCells(sheet) {
		const cells = [];
		sheet.iterate((cell, rowidx, colidx) => {
			if (cell && cell.isDefined) {
				cells.push(cellDescriptor(cell, colidx, rowidx));
			}
		});
		return cells;
	},

	// temp. borrowed from JSG...
	decode(str) {
		if (typeof str === 'string') {
			str = str.replace(/~26/gi, '&');
			str = str.replace(/~22/gi, '"');
			str = str.replace(/~5C/gi, '\\');
			str = str.replace(/~3C/gi, '<');
			str = str.replace(/~3E/gi, '>');
			str = str.replace(/~0A/gi, '\n');
			str = str.replace(/~27/gi, "'");
			str = decodeURIComponent(str);
			str = str.replace(/~25/gi, '%');
		}
		return str;
	}
};
