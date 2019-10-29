const MAX = require('./max');
const MIN = require('./min');
const statistical = require('./statistical');

module.exports = {
	...statistical,
	MAX,
	MIN
};
