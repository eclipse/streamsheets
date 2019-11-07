const update = require('./update');
const properties = require('./properties');
const isEmpty = require('./isEmpty');
const isType = require('./isType');


module.exports = {
	...isEmpty,
	...properties,
	...update,
	isType
};
