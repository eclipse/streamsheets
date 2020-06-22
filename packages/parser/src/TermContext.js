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
class TermContext {
	constructor(term) {
		this._term = term;
		this._disposeListeners = new Set();
	}

	get term() {
		return this._term;
	}

	copy(term) {
		// should we deep copy?
		return new TermContext(term);
	}

	// TODO: rename??
	addDisposeListener(fn) {
		this._disposeListeners.add(fn);
	}

	// TODO: rename??
	getDisposeListeners() {
		return Array.from(this._disposeListeners.values());
	}

	// TODO: rename??
	hasDisposeListener(fn) {
		return this._disposeListeners.has(fn);
	}

	// TODO: rename??
	removeDisposeListener(fn) {
		this._disposeListeners.delete(fn);
	}

	dispose() {
		this._disposeListeners.forEach((handler) => handler(this));
		this._disposeListeners.clear();
	}
}

module.exports = TermContext;
