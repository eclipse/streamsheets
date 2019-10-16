const separators = {
	decimal: {
		en: '.',
		'us': '.',
		de: ',',
		'de-DE': ','
	},
	thousand: {
		en: ',',
		'us': ',',
		de: '.',
		'de-DE': '.'
	}
};

module.exports = class Separators {
	static getDecimalSeparator(lang) {
		return separators.decimal[lang];
	}

	static getThousandSeparator(lang) {
		return separators.thousand[lang];
	}
};
