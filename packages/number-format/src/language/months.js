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
