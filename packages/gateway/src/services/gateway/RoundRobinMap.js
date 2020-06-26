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
module.exports = class RoundRobinMap {
	constructor() {
		this._map = new Map();
		this._index = 0;
	}

	set(key, value) {
		return this._map.set(key, value);
	}

	has(key) {
		return this._map.has(key);
	}

	delete(key) {
		return this._map.delete(key);
	}

	keys() {
		return this._map.keys();
	}

	[Symbol.iterator]() {
		const that = this;
		return {
			next() {
				const keys = Array.from(that._map.keys());
				const result = keys[that._index];
				let index = (that._index + 1) % keys.length;
				if (isNaN(index)) {
					index = 0;
				}
				that._index = index;
				return {
					done: keys.length === 0,
					value: result
				};
			}
		};
	}

	iterator() {
		return this[Symbol.iterator]();
	}
};
