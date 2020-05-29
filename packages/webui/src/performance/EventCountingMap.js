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
class EventCountingMap {
	constructor() {
		this._map = new Map();
	}

	add(event) {
		const id = performance.now();
		this._map.set(id, event);
		setTimeout(() => {
			this._map.delete(id);
		}, 1000);
	}

	get size() {
		return this._map.size;
	}
}

export default EventCountingMap;
