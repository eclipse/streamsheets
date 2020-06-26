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

const get = (key, map) => {
	let value = map.get(key);
	if (!value) {
		value = new Set();
		map.set(key, value);
	}
	return value;
};

const set = (key, object, map) => {
	const values = get(key, map);
	const oldsize = values.size;
	return values.add(object).size > oldsize;
};
const remove = (key, object, map) => {
	const values = get(key, map);
	return values.delete(object);
}

class DummyClient {
	constructor() {
		this.listeners = new Map();
		this.subscriptions = new Map();
	}

	end() { /* do nothing */ }
	
	on(event, callback) {
		set(event, callback, this.listeners);
	}
	off(event, callback) {
		remove(event, callback, this.listeners);
	}

	publish(/* topic, message */) { /* do nothing */ }

	subscribe(topic, handler) {
		return set(topic, handler, this.subscriptions);
	}

	unsubscribe(topic, handler) {
		return remove(topic, handler, this.subscriptions);
	}
};

module.exports = DummyClient;
