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
import en from './en.json';
import de from './de.json';

const defLocale = () => {
	let lang = window.navigator.userLanguage || window.navigator.language;
	if (lang.indexOf('-') !== -1) {
		// eslint-disable-next-line prefer-destructuring
		lang = lang.split('-')[0];
	}
	if (lang.indexOf('_') !== -1) {
		// eslint-disable-next-line prefer-destructuring
		lang = lang.split('_')[0];
	}
	return lang;
};

export const DEFAULT_LOCALE = defLocale() || 'en';

export const messages = {
	de,
	en,
};
