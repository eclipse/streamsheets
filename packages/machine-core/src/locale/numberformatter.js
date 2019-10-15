// a very simple formatter for JS numbers since NumberFormatter from number-format does not work as expected...

// separators are:  { decimal, thousand }
const format = (nr, separators = {}) => {
	const decimal = separators.decimal || '.';
	const thousand = separators.thousand;
	const parts = `${nr}`.split('.');
	// add thousands separator to first port if one is given...
	if (thousand) parts[0] = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${thousand}`);
	return parts.join(decimal);
};

module.exports = {
	format
};
