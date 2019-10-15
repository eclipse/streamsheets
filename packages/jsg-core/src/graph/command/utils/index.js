const json = require('./json');
const cellrange = require('./cellrange');
const copycells = require('./copycells');
const expression = require('./expression');
const map = require('./map');

module.exports = {
	...cellrange,
	...copycells,
	...expression,
	...map,
	...json
};
