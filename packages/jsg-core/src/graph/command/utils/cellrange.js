const CellRange = require('../../model/CellRange');

const newCellRange = (sheet, range) => new CellRange(
	sheet,
	range.x1,
	range.y1,
	range.x2,
	range.y2,
	range.x1R,
	range.y1R,
	range.x2R,
	range.y2R
);

const toCellRange = (range, graph) => {
	const sheet = graph.getItemById(range.id);
	return sheet ? newCellRange(sheet, range) : undefined;
};
const toCellRanges = (ranges, graph) => {
	const sheet = graph.getItemById(ranges[0].id);
	return sheet ? ranges.map(range => newCellRange(sheet, range)) : undefined;
};

module.exports = {
	toCellRange,
	toCellRanges
};
