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
const logger = require('@cedalo/logger').create({ name: 'AsyncRequest' });
const { FunctionErrors, ErrorInfo } = require('@cedalo/error-codes');
const IdGenerator = require('@cedalo/id-generator');
const { RequestState } = require('@cedalo/machine-core');

const noop = () => {};

const setStatus = (sheet, reqId, state) => {
	if (!sheet.setRequestState(reqId, state)) sheet.registerRequest(reqId, state);
};

const setCellError = (context, error) => {
	const term = context.term;
	const cell = term && !term.isDisposed && term.cell;
	if (cell) {
		const resError = error ? ErrorInfo.create(FunctionErrors.code.RESPONSE, error.message) : undefined;
		cell.setCellInfo('error', resError);
		term.cellValue = resError ? resError.code : undefined;
	}
};
const resolve = async (request) => {
	const { context, error, result, sheet } = request;
	try {
		if (sheet.isPendingRequest(request.reqId())) {
			let cellerror = error;
			// callback can optionally return new request state or new error:
			const newresp = await request.onResponse(context, result, error);
			if (newresp === RequestState.RESOLVED) {
				cellerror = undefined;
				request.state = newresp;
			} else if (newresp === RequestState.REJECTED) {
				cellerror = error || ErrorInfo.create(FunctionErrors.code.RESPONSE);
				request.state = newresp;
			} else if (newresp != null) {
				cellerror = newresp;
				request.state = RequestState.REJECTED;
			}
			setCellError(context, cellerror);
		}
	} catch (err) {
		/* ignore */
	} finally {
		// remove callback dependencies:
		request.onResponse = noop;
		setStatus(sheet, request.reqId(), request.state);
	}
};
// queue to limit max parallel requests:
class Queue {
	constructor(maxParallel = -1) {
		this.queue = [];
		this.running = 0;
		this._maxParallel = maxParallel;
	}
	schedule(request) {
		if (this._maxParallel < 1 || this.running < this._maxParallel) this._run(request);
		else this.queue.push(request);
	}
	async _run(request) {
		this.running += 1;
		try {
			request.result = await request.requestFn();
			request.state = RequestState.RESOLVED;
		} catch (err) {
			logger.error(`Request failed ${request.reqId()}`, err);
			request.error = err;
			request.state = RequestState.REJECTED;
		} finally {
			await resolve(request);
			this.running -= 1;
			this._runNextRequest();
		}
	}

	_runNextRequest() {
		if (this.queue.length > 0) {
			const nxtRequest = this.queue.shift();
			const sheet = nxtRequest.sheet;
			const reqId = nxtRequest.reqId();
			// is request still waiting?
			if (sheet.isPendingRequest(reqId)) {
				this._run(nxtRequest);
			} else {
				sheet.removeRequest(reqId);
				this._runNextRequest();
			}
		}
	}
}
// class UnlimitedQueue extends Queue {
// 	schedule(request) {
// 		this._run(request);
// 	}
// }
// class LimitedQueue extends Queue {
// 	constructor(maxParallel = 10) {
// 		super();
// 		this._maxParallel = maxParallel;
// 	}
// 	schedule(request) {
// 		if (this.running < this._maxParallel) this._run(request);
// 		else this.queue.push(request);
// 	}
// }

class AsyncRequest {
	constructor(sheet, context) {
		this.sheet = sheet;
		this.context = context;
		this.error = undefined;
		this.result = undefined;
		this.state = RequestState.CREATED;
		this.requestFn = noop;
		this.onResponse = noop;
		this._queue = new Queue();
		this.onDispose = this.onDispose.bind(this);
		this._init(context);
	}
	_init(context) {
		if (context._reqId) this.sheet.removeRequest(context._reqId);
		if (context._pendreq) context.removeDisposeListener(context._pendreq.onDispose);
		context._reqId = IdGenerator.generate();
		context._pendreq = this;
		context.addDisposeListener(this.onDispose);
		setStatus(this.sheet, context._reqId, this.state);
	}

	reqId() {
		return this.context ? this.context._reqId : undefined;
	}

	request(fn) {
		this.requestFn = fn;
		this.state = RequestState.PENDING;
		setStatus(this.sheet, this.reqId(), this.state);
		this._queue.schedule(this);
		return this;
	}

	response(fn) {
		if (this.state === RequestState.RESOLVED || this.state === RequestState.REJECTED)
			fn(this.context, this.result, this.error);
		else this.onResponse = fn;
		// this.onResponse = fn;
		// if (this.state === RequestState.RESOLVED || this.state === RequestState.REJECTED) resolve(this);
		return this;
	}

	queue(_queue) {
		this._queue = _queue;
		return this;
	}

	onDispose() {
		const { context, sheet } = this;
		sheet.removeRequest(context._reqId);
		context.removeDisposeListener(this.onDispose);
		context._reqId = undefined;
		context._pendreq = undefined;
		this.sheet = undefined;
		this.context = undefined;
	}
}

class NoopAsyncRequest extends AsyncRequest {
	_init() {}
	queue(/* queue */) {
		return this;
	}
	reqId() {
		return this._reqId;
	}
	request(/* fn */) {
		return this;
	}
	response(/* fn */) {
		return this;
	}
	setReqId(reqId) {
		this._reqId = reqId;
		return this;
	}
}
const dummy = new NoopAsyncRequest();

const create = (sheet, context) => {
	const reqId = context._reqId;
	if (!reqId || !sheet.isPendingRequest(reqId)) {
		sheet.removeRequest(reqId);
		return new AsyncRequest(sheet, context);
	}
	return dummy.setReqId(reqId);
};

module.exports = {
	create,
	Queue
};
