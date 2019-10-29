const split = require('./split');
const text = require('./text');
const { RANDID } = require('@cedalo/parser').Functions;

module.exports = {
	...text,
	RANDID,
	SPLIT: split
};
