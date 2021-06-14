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
const { runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');

const ERROR = FunctionErrors.code;

const pause = (sheet, context) => {
	if (!sheet.isPaused) {
		sheet.streamsheet.pauseProcessing();
		sheet.addRequestStateListener(context._checkRequestsCallback);
	}
};

const resume = (sheet, context) => {
	if (sheet.isPaused) {
		sheet.removeRequestStateListener(context._checkRequestsCallback);
		sheet.streamsheet.resumeProcessing();
	}
};
const cancel = (sheet, context) => () => {
	sheet.removeRequestStateListener(context._checkRequestsCallback);
	sheet.streamsheet.stopProcessing();
};

const isOnePending = (reqIDs, sheet) => reqIDs.some((id) => sheet.isPendingRequest(id));
const areAllPending = (reqIDs, sheet) => reqIDs.every((id) => sheet.isPendingRequest(id));
const checkRequests = (waitCondition, sheet, context) => () => {
	if (waitCondition(context._reqIDs, sheet)) pause(sheet, context);
	else resume(sheet, context);
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

const initContext = (sheet, context, waitCondition) => {
	if (!context._awaitInited) {
		context._awaitInited = true;
		context._reqIDs = [];
		context._checkRequestsCallback = checkRequests(waitCondition, sheet, context);
		context.addDisposeListener(cancel(sheet, context));
	}
};

const runAwait = (waitCondition, context, sheet, terms, waitfn) =>
	runFunction(sheet, terms, waitfn)
		.onSheetCalculation()
		.withMinArgs(1)
		.beforeRun(() => initContext(sheet, context, waitCondition))
		.run(() => {
			const reqIDs = getRequestIDs(sheet, terms);
			const error = FunctionErrors.isError(reqIDs);
			if (!error) {
				context._reqIDs = reqIDs;
				if (waitCondition(reqIDs, sheet)) pause(sheet, context);
				else resume(sheet, context);
			}
			return error || true;
		});

const wait = (sheet, ...terms) => runAwait(isOnePending, wait.context, sheet, terms, wait);
wait.displayName = true;

const waitone = (sheet, ...terms) => runAwait(areAllPending, waitone.context, sheet, terms, waitone);
waitone.displayName = true;

module.exports = {
	'AWAIT': wait,
	'AWAIT.ONE': waitone
};
