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
const RequestState = require('./RequestState');

const notifyListeners = (listeners) => {
	listeners.forEach((listener) => listener());
};

// class MapDecorator extends Map {
// 	constructor() {
// 		super();
// 		this._listeners = new Set();
// 	}

// 	clear() {
// 		super.clear();
// 		this.removeAllListeners();
// 	}

// 	delete(key) {
// 		const doIt = super.delete(key);
// 		if (doIt) notifyListeners(this._listeners);
// 		return doIt;
// 	}

// 	addListener(fn) {
// 		this._listeners.add(fn);
// 	}
// 	removeListener(fn) {
// 		this._listeners.delete(fn);
// 	}
// 	removeAllListeners() {
// 		this._listeners.clear();
// 	}
// }

// TODO: as soon as legacy request and requestinfo are removed this class can be possibly deleted and request-state can
// be handled in cell context via AsyncRequest and and notify on resolve/reject. manage state-listeners via Machine to 
// be independent of Sheets (i.e. to support await requests from different sheets)
const SheetRequests = (BaseSheet) =>
	class extends BaseSheet {
		constructor(streamsheet, config) {
			super(streamsheet, config);
			this._requests = new Map();
			this._stateListeners = new Set();
			// this._pendingRequests = new MapDecorator();
		}

		clear() {
			super.clear();
			this.removeAllRequests();
			this._stateListeners.clear();
		}

		// returns a list of ids for request which have pending state
		getPendingRequests() {
			const pending = [];
			this._requests.forEach((req, id) => {
				if (req.state === RequestState.PENDING) pending.push(id);
			});
			return pending;
		}
		getRequestState(reqId) {
			const req = this._requests.get(reqId);
			return req ? req.state : RequestState.UNKNOWN;
		}

		hasRequest(reqId) {
			return this._requests.has(reqId);
		}

		isPendingRequest(reqId) {
			const req = this._requests.get(reqId);
			return req && req.state === RequestState.PENDING;
		}

		// state is optional
		registerRequest(reqId, state = RequestState.CREATED) {
			const req = { state };
			this._requests.set(reqId, req);
			return reqId;
		}

		removeRequest(reqId) {
			// if removed request is still pending update its state to notify any state listeners
			if (this.isPendingRequest(reqId)) this.setRequestState(reqId, RequestState.ABORTED);
			this._requests.delete(reqId);
		}
		removeAllRequests() {
			this._requests.clear();
		}


		setRequestState(reqId, state) {
			const req = this._requests.get(reqId);
			if (req && req.state !== state) {
				req.state = state;
				notifyListeners(this._stateListeners);
			}
			return !!req;
		}

		addRequestStateListener(fn) {
			this._stateListeners.add(fn);
		}
		removeRequestStateListener(fn) {
			this._stateListeners.delete(fn);
		}
	};
module.exports = SheetRequests;
