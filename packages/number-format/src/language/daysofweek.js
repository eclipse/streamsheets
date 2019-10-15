const daysofweek = {
	long: {
		en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		'us': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		de: ['Sonntag', 'Montag ', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
		'de-DE': ['Sonntag', 'Montag ', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
	},
	short: {
		en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		'us': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		de: ['So.', 'Mo. ', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'],
		'de-DE': ['So.', 'Mo. ', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.']
	}
};

module.exports = class DaysOfWeek {
	static getDaysOfWeekLong(lang) {
		return daysofweek.long[lang];
	}

	static getDaysOfWeekShort(lang) {
		return daysofweek.short[lang];
	}
};
