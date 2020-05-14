const json = require('./json');
const cellrange = require('./cellrange');
const copycells = require('./copycells');
const expression = require('./expression');
const map = require('./map');

const getSheetFromItem = (item) => {
	let sheet;
	if (item != null) sheet = item.isStreamSheet ? item : getSheetFromItem(item.getParent());
	return sheet;
};

module.exports = {
	...cellrange,
	...copycells,
	...expression,
	getSheetFromItem,
	...map,
	...json
};
