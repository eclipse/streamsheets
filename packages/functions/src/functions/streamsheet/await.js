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
const {	AsyncRequest, runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');

const ERROR = FunctionErrors.code;

const pause = (sheet) => {
	if (!sheet.isPaused) sheet.pauseProcessing();
};
const resume = (sheet) => {
	if (sheet.isPaused) sheet.resumeProcessing();
};

const addRequestId = (value, allIDs) => {
	const reqId = convert.toString(value);
	if (reqId) {
		allIDs.push(reqId);
		return undefined;
	}
	return ERROR.VALUE;
};
const addRequestIdsFromRange = (range, allIDs) => {
	let error;
	range.iterate((cell) => {
		if (cell) error = error || addRequestId(cell.value, allIDs);
	});
	return error;
};
const getRequestIDs = (sheet, terms) => {
	let error;
	return terms.reduce((allIDs, term) => {
		if (!error) {
			const range = getCellRangeFromTerm(term, sheet, true);
			error = range ? addRequestIdsFromRange(range, allIDs) : addRequestId(term.value, allIDs);
		}
		return error || allIDs;
	}, []);
};

const initContext = (sheet, context) => {
	if (!context._awaitInited) {
		context._awaitInited = true;
		context.addDisposeListener(() => resume(sheet));
	}
};

const wait = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.beforeRun(() => initContext(sheet, wait.context))
		.run(() => {
			const reqIDs = getRequestIDs(sheet, terms);
			const error = FunctionErrors.isError(reqIDs);
			if (!error) {
				const onePending = reqIDs.some((id) => AsyncRequest.isPending(sheet, id));
				if (onePending) pause(sheet);
				else resume(sheet);
			}
			return error || true;
		});
wait.displayName = true;

const waitone = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.beforeRun(() => initContext(sheet, waitone.context))
		.run(() => {
			const reqIDs = getRequestIDs(sheet, terms);
			const error = FunctionErrors.isError(reqIDs);
			if (!error) {
				const oneIsResolved = reqIDs.some((id) => AsyncRequest.isResolved(sheet, id));
				if (oneIsResolved) resume(sheet);
				else pause(sheet);
			}
			return error || true;
		});
waitone.displayName = true;

module.exports = {
	'AWAIT': wait,
	'AWAIT.ONE': waitone
};
