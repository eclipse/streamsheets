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
const IdGenerator = require('@cedalo/id-generator');

const STATE = {
	CREATED: 'created',
	PENDING: 'pending',
	RESOLVED: 'resolved',
	REJECTED: 'rejected'
};

const noop = () => {};

const getStatus = (sheet, reqId) => {
	const request = sheet.getPendingRequests().get(reqId);
	return request ? request.status : 'unknown';
};
const setStatus = (sheet, reqId, state) => {
	const allRequests = sheet.getPendingRequests();
	const request = allRequests.get(reqId);
	if (request) request.status = state;
	else allRequests.set(reqId, { status: state });
};

const remove = (sheet, reqId) => sheet.getPendingRequests().delete(reqId);

const isPending = (sheet, reqId) => {
	const status = getStatus(sheet, reqId);
	return status === STATE.PENDING;
};
const isResolved = (sheet, reqId) => !isPending(sheet, reqId);

const resolve = async (request) => {
	const { context, error, result, sheet, state } = request;
	const pendingRequests = sheet.getPendingRequests();
	const pendingReq = pendingRequests.get(request.reqId());
	try {
		if (pendingReq != null) {
			// callback can optionally adjust request state:
			const newstate = await request.onResponse(context, result, error);
			if (newstate && newstate !== state) request.state = newstate;
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
	_run(request) {
		this.running += 1;
		request
			.requestFn()
			.then((res) => {
				request.state = STATE.RESOLVED;
				request.result = res;
			})
			.catch((err) => {
				logger.error(`Request failed ${request.reqId()}`, err);
				request.state = STATE.REJECTED;
				request.error = err;
			})
			.finally(async () => {
				await resolve(request);
				this.running -= 1;
				this._runNextRequest();
			});
	}

	_runNextRequest() {
		if (this.queue.length > 0) {
			const nxtRequest = this.queue.shift();
			const sheet = nxtRequest.sheet;
			const reqId = nxtRequest.reqId();
			// is request still waiting?
			if (isPending(sheet, reqId)) {
				this._run(nxtRequest);
			} else {
				remove(sheet, reqId);
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
		this.state = STATE.CREATED;
		this.requestFn = noop;
		this.onResponse = noop;
		this._queue = new Queue();
		this.onDispose = this.onDispose.bind(this);
		this._init(context);
	}
	_init(context) {
		if (context._reqId) this.sheet.getPendingRequests().delete(context._reqId);
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
		this.state = STATE.PENDING;
		setStatus(this.sheet, this.reqId(), this.state);
		this._queue.schedule(this);
		return this;
	}

	response(fn) {
		if (this.state === STATE.RESOLVED || this.state === STATE.REJECTED) fn(this.context, this.result, this.error);
		else this.onResponse = fn;
		return this;
	}

	queue(_queue) {
		this._queue = _queue;
		return this;
	}

	onDispose() {
		const { context, sheet } = this;
		sheet.getPendingRequests().delete(context._reqId);
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
	if (!reqId || isResolved(sheet, reqId)) {
		remove(sheet, reqId);
		return new AsyncRequest(sheet, context);
	}
	return dummy.setReqId(reqId);
};

module.exports = {
	create,
	getStatus,
	isPending,
	isResolved,
	remove,
	STATE,
	Queue
};
