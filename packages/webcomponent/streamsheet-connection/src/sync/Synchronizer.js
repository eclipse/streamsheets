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
class Synchronizer {

	constructor() {
		this.pending = 0;
		this.callbacks = [];
		this._executeCallbacks = this._executeCallbacks.bind(this);
	}

	sync(func, cb) {
		this.pending += 1;
		this.callbacks.push(cb);
		setImmediate(() => {
			func();
			this.pending -= 1;
			this._executeCallbacks();
		});
	}
	
	_executeCallbacks() {
		if (this.pending < 1) {
			this.pending = 0;
			this.callbacks.forEach((cb) => cb());
			this.callbacks.length = 0;
		}
	}
}

// singleton:
export default new Synchronizer();