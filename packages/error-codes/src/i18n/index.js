const de = require('./de');
const en = require('./en');

module.exports = {
	de,
	en,
	createLocalization(locale = 'en') {
		const localize = this[locale] || {};
		return (str) => str != null ? localize[str] || str : undefined;
	}
};
