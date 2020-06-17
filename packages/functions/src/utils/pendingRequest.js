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
const logger = require('@cedalo/logger').create({ name: 'pendingRequest' });
const IdGenerator = require('@cedalo/id-generator');
// const { FunctionErrors } = require('@cedalo/error-codes');
// const ERROR = FunctionErrors.code;


// promise is never used => no need to store it...
const createRequestInfo = (/* promise */) => ({ status: 'pending' });
const updateRequestInfo = (request, status) => {
	if (request) request.status = status;
};
const update = async (sheet, reqId, callback, response, error) => {
	let rejected = !!error;
	const pendingRequests = sheet.getPendingRequests();
	try {
		// on error callback might want to try something different, so we await and check its response...
		const resperr = await callback(response, error);
		if (resperr) rejected = true;
	} catch (err) {
		rejected = true;
	}
	updateRequestInfo(pendingRequests.get(reqId), rejected ? 'rejected' : 'resolved');
};

// creates a new pending request and removes old one with given id
const create = (sheet, oldReqId, promise, callback, reqId) => {
	const pendingRequests = sheet.getPendingRequests();
	reqId = reqId || IdGenerator.generate();
	pendingRequests.delete(oldReqId);
	pendingRequests.set(reqId, createRequestInfo());
	promise
		.then((response) => {
			// ignore response if request was deleted...
			if (callback.force || pendingRequests.has(reqId)) update(sheet, reqId, callback, response);
		})
		.catch((err) => {
			logger.error(`Request failed ${reqId}`, err);
			// ignore error if request was deleted...
			if (callback.force || pendingRequests.has(reqId)) update(sheet, reqId, callback, undefined, err);
		});
	return reqId;
};
const getStatus = (sheet, reqId) => {
	const request = sheet.getPendingRequests().get(reqId);
	return request ? request.status : 'unknown';
};

const remove = (sheet, reqId) => {
	sheet.getPendingRequests().delete(reqId);
};


// const defaultCallback = (term) => async (response, error) => {
// 	if (term && !term.isDisposed) term.cellValue = error ? ERROR.RESPONSE : undefined;
// 	// note if response contains an error, we have to return it!
// 	return response && response.error;
// };


module.exports = {
	// defaultCallback,
	create,
	getStatus,
	remove
};
