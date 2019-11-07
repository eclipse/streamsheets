const help = require('./help');
const split = require('./split');
const text = require('./text');
const { RANDID } = require('@cedalo/parser').Functions;

module.exports = {
	help,
	functions: {
		...text,
		RANDID,
		SPLIT: split
	}
};
