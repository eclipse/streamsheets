const update = require('./update');
const properties = require('./properties');
const isEmpty = require('./isEmpty');
const isType = require('./isType');
// const functions = require('./functions'); circular dependency


module.exports = {
	...isEmpty,
	// ...functions,
	...properties,
	...update,
	isType
};
