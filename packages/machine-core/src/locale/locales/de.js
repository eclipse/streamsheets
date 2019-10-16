const moment = require('moment');

const code = {
	short: 'de',
	iso: 'de-DE'
};
const formats = [
	'YYYY-M-D',
	'D.M.YYYY',
	'D MMM YYYY',
	'MMM YY',
	'D.MM.YY k:m',
	'D.MM.YY h:m a'
];
const monthsShort = ['Jan.', 'Feb.', 'Mrz.', 'Apr.', 'Mai', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];

const separators = { decimal: ',', thousand: '.', parameter: ';' };


const parse = (datestr) => {
	moment.locale(code.short);
	// moment.updateLocale(code.short, { monthsShort });
	return moment(datestr, formats).valueOf();
};

// load our local upfront to update it only once:
moment.locale(code.short);
moment.updateLocale(code.short, { monthsShort });


module.exports = {
	code,
	parse,
	separators
};
