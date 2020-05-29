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
