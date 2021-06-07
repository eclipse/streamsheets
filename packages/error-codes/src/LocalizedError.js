/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const i18n = require('./i18n');
// const FunctionErrors = require('./FunctionErrors');

class LocalizedError {
	static from(error, locale) {
		const localizations = i18n[locale];
		const localizedError = Object.entries(error).reduce((all, [key, value]) => {
			key = localizations[key] || key;
			all[key] = value;
			return all;
		}, {});
		localizedError.type = localizations[error.type] || error.type;
		localizedError.description = localizations[error.code];
		return localizedError;
		// return new Error(type, code);
	}
	// constructor(type = FunctionErrors.types.ERROR, code) {
	// 	this.type = type;
	// 	this.code = code;
	// 	this.description = '';
	// }

	// localize(locale) {
	// 	locale = locale ? locale.toLowerCase() : 'en';
	// 	const localizations = descriptions[locale];
	// 	if (error) {
	// 		const { type, ...props } = error;
	// 		const localizedError = Error.of(localizations[type] || type);
	// 		const localizedError.addDescription(error.code);
	// 		Object.entries(props).forEach((key, value) => {
	// 			if(key === 'code')
	// 			Object.assign(localizedError, props);
	// 			key = localizations[key] || key;
	// 		});
	// 		return Object.assign(localizedError, props);
	// 		// return localizedError;
	// 	}
	// 	// const typeDescription = (type, locale) => {
	// 	// 	const descr = ERROR_TYPE_DESCRIPTIONS[type];
	// 	// 	return descr ? descr[locale] : type;
	// 	// };
		
		
	// 	return error;
	// }
}

module.exports = LocalizedError;
