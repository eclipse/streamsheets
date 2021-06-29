const setCellInfo = (key, info, term) => {
	const cell = term && term.cell;
	if (cell) cell.setCellInfo(key, info);
};

module.exports = {
	setCellInfo
}
