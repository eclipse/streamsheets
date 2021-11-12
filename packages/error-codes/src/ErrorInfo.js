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
	static create(code, message, fnName) {
		return code.isErrorInfo
			? new ErrorInfo({ ...code })
			: new ErrorInfo({ type: TYPES.ERROR, code, message, fnName });
	}
	static createWarning(code, message, fnName) {
		// THINK: for warning type may allow cellValue property, so that this is returned by cell
		// => no need to set cell info outside cell itself!
		return code.isErrorInfo
			? new ErrorInfo({ ...code })
			: new ErrorInfo({ type: TYPES.WARNING, code, message, fnName });
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
		if (error.fnName != null) localizedError.Function = error.fnName;
		if (error.paramIndex != null) localizedError[localize('paramIndex')] = error.paramIndex;
		localizedError[localize('message')] = error.message || '-';
		return localizedError;
	}
	constructor({ type, code, fnName, message, paramIndex, description } = {}) {
		this.type = type || ErrorInfo.TYPE.ERROR;
		this.code = code;
		this.fnName = fnName;
		this.message = message;
		this.paramIndex = paramIndex;
		this.description = description;
		// no sub-classing so we can simply do this to be immutable:
		Object.freeze(this);
	}

	get isErrorInfo() {
		return true;
	}

	setFunctionName(name) {
		return new ErrorInfo({ ...this, fnName: name });
	}
	setMessage(message) {
		return new ErrorInfo({ ...this, message });
	}
	setParamIndex(index) {
		return new ErrorInfo({ ...this, paramIndex: index });
	}

	toString() {
		return this.code;
	}
}

module.exports = ErrorInfo;
