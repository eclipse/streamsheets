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
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const {	messages: { getMessageInfo, getMessageValue, getMessageValueKey }, runFunction } = require('../../utils');

const ERROR = FunctionErrors.code;

const withKey = (key, data) => {
	// TODO if we want to support returning complete message under its ID:
	// key = key != null ? key : (data.id || '');
	let json = data;
	if (key) {
		json = {};
		json[key] = data;
	}
	return json;
};

const getMessageInfoOrError = (sheet, term) => {
	const msginfo = getMessageInfo(sheet, term);
	return msginfo.message ? msginfo : ERROR.NO_MSG;
};
const subtree = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((message) => getMessageInfoOrError(sheet, message))
		.mapNextArg((includeKey) => convert.toBoolean(includeKey && includeKey.value, false))
		.run((msginfo, includeKey) => {
			const value = getMessageValue(msginfo);
			// eslint-disable-next-line no-nested-ternary
			return value != null
				? (includeKey ? withKey(getMessageValueKey(msginfo), value) : value)
				: ERROR.NO_MSG_DATA;
		});


module.exports = subtree;
