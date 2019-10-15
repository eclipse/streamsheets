/**
 *
 *  DO NOT USE!! CURRENTLY UNDER REVIEW!!
 *
 */

const DE = Object.freeze({ code: 'de-DE', separators: { decimal: ',', parameter: ';' } });
const EN = Object.freeze({ code: 'en-GB', separators: { decimal: '.', parameter: ',' } });

const locales = {};
locales[DE.code] = DE;
locales[EN.code] = EN;

const byCode = (code) => {
	if (code.includes('-')) {
		return locales[code];
	}
	let locale;
	Object.keys(locales).some((key) => {
		locale = (key.startsWith(code) || key.endsWith(code)) ? locales[key] : null;
		return locale != null;
	});
	return locale;
};

const get = (locale, def) => {
	const loc = (typeof locale === 'string') ? byCode(locale) : locale;
	return loc || def;
};

const set = (locale) => {
	if (locale && locale.code) {
		locales[locale.code] = locale;
	}
};

const localizeNumber = (nr, locale) => {
	const str = `${nr}`;
	const separators = get(locale, EN).separators;
	return separators.decimal !== '.' ? str.replace('.', separators.decimal) : str;
};

module.exports = {
	get,
	set,
	localizeNumber,
	DE,
	EN,
	DEFAULT: EN
};
