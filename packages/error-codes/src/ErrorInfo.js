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

const TYPES = {
	ERROR: 'ERROR',
	WARNING: 'WARNING'
};

class ErrorInfo {
	static TYPE() {
		return TYPES;
	}
	static create(code, message) {
		return new ErrorInfo(TYPES.ERROR, code, message);
	}
	static createWarning(code, message) {
		return new ErrorInfo(TYPES.WARNING, code, message);
	}

	static localize(error, locale) {
		const localize = i18n.createLocalization(locale);
		// const localizedError = Object.entries(error).reduce((all, [key, value]) => {
		// 	all[localize(key)] = value;
		// 	return all;
		// }, {});
		const localizedError = {};
		localizedError.type = localize(error.type);
		localizedError[localize('code')] = error.code;
		localizedError[localize('description')] = localize(error.code);
		if (error.paramIndex != null) localizedError[localize('paramIndex')] = error.paramIndex;
		localizedError[localize('message')] = error.message || '-';
		return localizedError;
	}
	constructor(type, code, message) {
		this.type = type || ErrorInfo.TYPE.ERROR;
		this.code = code;
		this.message = message;
		this.paramIndex = undefined;
		this.description = undefined;
	}

	setParamIndex(index) {
		this.paramIndex = index;
		return this;
	}
}

module.exports = ErrorInfo;
