const database = require('./database');
const date = require('./date');
const drawing = require('./drawing');
const engineering = require('./engineering');
const info = require('./info');
const logical = require('./logical');
const lookup = require('./lookup');
const math = require('./math');
// const olap = require('./olap');
const stack = require('./stack');
const statistical = require('./statistical');
const streamsheet = require('./streamsheet');
const text = require('./text');

// THIS DOES NOT WORK :-(((
// const { help } = require('../src/functions');
// AND THIS NEITHER :-(
// const database = require('../src/functions/database/help');
// const ...

const help = {
	database,
	date,
	drawing,
	engineering,
	info,
	logical,
	lookup,
	math,
	// olap,
	stack,
	statistical,
	streamsheet,
	text
};

module.exports = help;
