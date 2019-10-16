const months = {
	long: {
		en: ['January', 'February', 'March', 'April', 'May',
			'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		'us': ['January', 'February', 'March', 'April', 'May',
			'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		de: ['Januar', 'Februar', 'März', 'April', 'Mai',
			'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
		'de-DE': ['Januar', 'Februar', 'März', 'April', 'Mai',
			'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
	},
	short: {
		en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		'us': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
		'de-DE': ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
	}
};

module.exports = class MonthsOfYear {
	static getMonthsOfYearLong(lang) {
		return months.long[lang];
	}

	static getMonthsOfYearShort(lang) {
		return months.short[lang];
	}
};
