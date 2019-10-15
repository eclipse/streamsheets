const { daverage, dcount, dmax, dmin, dsum } = require('./database');
const date = require('./date');
const engineering = require('./engineering');
const { iferror, iseven, iserr, iserror, isna, isodd } = require('./info');
const logical = require('./logical');
const lookup = require('./lookup');
const execl = require('./maths');
const statistical = require('./statistical');
const text = require('./text');
// const { concat, find, left, len, mid, replace, rept, right, search, substitute, text, value } = require('./text');

module.exports = {
	...date,
	...engineering,
	...execl,
	...logical,
	...lookup,
	...statistical,
	...text,
	DAVERAGE: daverage,
	DCOUNT: dcount,
	DMAX: dmax,
	DMIN: dmin,
	DSUM: dsum,
	IFERROR: iferror,
	ISEVEN: iseven,
	ISERR: iserr,
	ISERROR: iserror,
	ISNA: isna,
	ISODD: isodd
};
