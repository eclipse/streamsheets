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
const IdGenerator = require('@cedalo/id-generator');
const events = require('events');
const DefaultLogger = require('./DefaultLogger');
const { EVENTS } = require('./Constants');

class EventEmitter extends events.EventEmitter {
	constructor(...args) {
		super(...args);
		this._lastEventType = null;
		this._noReemitted = [EVENTS.CONNECTOR.DISPOSED];
	}

	emit(type, ...args) {
		if (type === this._lastEventType && this._noReemitted.includes(type)) {
			if(args[0] && args[0].force){
				// Reset if we had an dispose triggerd by user action
				// Otherwise the result of the action will not reach the user
				this._lastEventType = null;
			}
			return;
		}
		this._lastEventType = type;
		super.emit(type, ...args);
	}
}

class Stream {
	constructor({ id = IdGenerator.generate(), owner = 'anon' } = {}) {
		this.logger = new DefaultLogger();
		this._emitter = new EventEmitter();
		this._emitter.setMaxListeners(0);
		// read only properties...
		Object.defineProperties(this, {
			id: { value: id, enumerable: true },
			type: { value: 'Consumer', enumerable: true },
			callbacks: { value: new Map() }
		});
		this._owner = owner;
		this.uid = IdGenerator.generate();
	}

	toJSON() {
		return {
			uid: this.uid,
			id: this.id,
			type: this.type,
			owner: this._owner
		};
	}

	get owner() {
		return this._owner;
	}

	set owner(owner) {
		this._owner = owner;
	}

	on(event, fn) {
		this._emitter.on(event, fn);
	}

	off(event, fn) {
		this._emitter.off(event, fn);
	}

	removeAllListeners() {
		this._emitter.removeAllListeners();
	}

	get isUsed() {
		return this.callbacks.size > 0;
	}

	get targets() {
		return Array.from(this.callbacks.keys());
	}

	// target & callback must be given...
	subscribe(target, callback) {
		let addIt = !!target && !!callback && typeof callback === 'function';
		// maybe we should allow and simply replace registered callback...
		addIt = addIt && !this.callbacks.has(target);
		if (addIt) {
			this.callbacks.set(target, callback);
		}
		return addIt;
	}

	unsubscribe(target) {
		return this.callbacks.delete(target);
	}

	// target is optional, if not provided we send data to all subscribed targets...
	emit(data, target) {
		// return target ? this._notify(target, data) : this.targets.forEach(trgt => this._notify(trgt, data));
		return target
			? this._notify(target, data)
			: this.callbacks.forEach((v, k) => this._notify(k, data));
	}

	_notify(target, data) {
		const callback = this.callbacks.get(target);
		return callback && callback.call(target, data);
	}

	dispose() {
		this.callbacks.clear();
	}
}

Stream.TYPE = {
	CONNECTOR: 'connector',
	PRODUCER: 'producer',
	CONSUMER: 'consumer'
};

module.exports = Stream;
