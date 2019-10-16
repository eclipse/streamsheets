const moment = require('moment');

const code = {
	short: 'en',
	iso: 'en-GB'
};

const formats = [
	'DD.MM.YYYY',
	'YYYY-MM-DD',
	'DD MMM YYYY',
	// support some US typical formats too => late we can decide to extract into own module...
	'MM.DD.YYYY',
	'MM/DD/YYYY',
	'DD-MMM-YYYY',
	'MMM-YY',
	'MMM DD, YYYY',
	'MM.DD.YY k:m',
	'MM.DD.YY h:m a'
];

const separators = { decimal: '.', thousand: ',', parameter: ',' };

const parse = datestr => moment(datestr, formats, code.short).valueOf();


module.exports = {
	code,
	parse,
	separators
};
