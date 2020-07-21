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
const { runFunction, wildcards } = require('../../utils');

const ERROR = FunctionErrors.code;

const filter = (messages, regex) =>
	messages.reduce((matching, message) => {
		if (regex.test(message.id)) matching.push(message.id);
		return matching;
	}, []);

const getIdRegEx = (context, idFilter) => {
	let _filter = context.idFilter;
	const filterStr = idFilter ? convert.toString(idFilter.value) : '*';
	if (filterStr != null && (!_filter || _filter.filterStr !== filterStr)) {
		_filter = {
			filterStr,
			regex: wildcards.toBoundedRegExp(filterStr)
		};
		context.idFilter = _filter;
	}
	return filterStr != null ? _filter.regex : ERROR.VALUE;
};

const outboxgetids = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(1)
		.mapNextArg((idFilter) => getIdRegEx(outboxgetids.context, idFilter))
		.run((idRegEx) => {
			const outbox = sheet.machine.outbox;
			const ids = filter(outbox.messages, idRegEx);
			return ids;
		});

module.exports = outboxgetids;
