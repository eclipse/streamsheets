/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
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
