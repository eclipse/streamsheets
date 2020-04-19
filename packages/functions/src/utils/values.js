const asNumber = (val, defval) => {
	const nr = (typeof val === 'number') ? val : parseInt(val, 10);
	return !isNaN(nr) && isFinite(nr) ? nr : defval;
};
const isNumber = val => asNumber(val) != null;

const isEven = nr => nr % 2 === 0;

const asString = (val, defval) => (val == null ? defval : `${val}`);

// taken from MDN Math.round() doc
const _shift = (nr, precision, reverse) => {
	const numArray = asString(nr).split('e');
	precision = reverse ? -precision : precision;
	// return +(numArray[0] + 'e' + (numArray[1] ? +numArray[1] + precision : precision));
	return +(`${numArray[0]}e${(numArray[1] ? +numArray[1] + precision : precision)}`);
};
const roundNumber = (nr, precision) => _shift(Math.round(_shift(nr, precision, false)), precision, true);

module.exports = {
	isNumber,
	isEven,
	roundNumber
};
