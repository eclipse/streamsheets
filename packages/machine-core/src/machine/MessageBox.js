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
const logger = require('../logger').create({ name: 'MessageBox' });
const EventEmitter = require('events');
const IdGenerator = require('@cedalo/id-generator');
const { Functions } = require('@cedalo/parser');
const { firstElements, lastElements } = require('../utils/array');

const now = () => (Functions.NOW ? Functions.NOW() : Date.now());

const messageById = (id, messages) => {
	let message;
	messages.some((msg) => {
		message = msg.id === id ? msg : undefined;
		return !!message;
	});
	return message;
};

const popMessageById = (id, messages) => {
	const message = messageById(id, messages);
	if (message) {
		messages.splice(messages.indexOf(message), 1);
	}
	return message;
};

const match = (data, selector) => {
	let doMatch = !!data;
	const selkeys = typeof selector === 'object' ? Object.keys(selector) : [];
	selkeys.forEach((key) => {
		doMatch = doMatch && match(data[key], selector[key]);
	});
	return selkeys.length === 0 ? selector === data : doMatch;
};

const DEF_CONF = {
	max: 100, // -1, to signal no bounds...
	reverse: false,
	type: 'MessageBox'
};

class MessageBox {
	constructor(config) {
		const mergedConfig = Object.assign({ id: IdGenerator.generate() }, DEF_CONF, config);
		this._applyConfig(mergedConfig);
		// read only properties...
		Object.defineProperties(this, {
			messages: { value: [], enumerable: true },
			_emitter: { value: new EventEmitter() }
		});
	}

	_applyConfig(config) {
		this._id = config.id;
		this._type = config.type;
		this._max = config.max;
		this._reverse = config.reverse;
	}

	toJSON() {
		return {
			max: this.max,
			type: this.type,
			id: this.id
		};
	}

	load(config) {
		const mergedConfig = Object.assign({ id: this.id }, DEF_CONF, config);
		this._applyConfig(mergedConfig);
	}

	get id() {
		return this._id;
	}

	get type() {
		return this._type;
	}

	get max() {
		return this._max;
	}

	get size() {
		return this.messages.length;
	}

	getFirstMessages(n = 1) {
		return firstElements(n, this.messages);
	}

	getLastMessages(n = 1) {
		return lastElements(n, this.messages);
	}

	on(event, callback) {
		this._emitter.on(event, callback);
	}

	off(event, callback) {
		this._emitter.removeListener(event, callback);
	}

	isEmpty() {
		return this.messages.length < 1;
	}

	clear() {
		const removed = this.messages.slice(0);
		this.messages.length = 0;
		if (removed.length > 0) {
			this._emitter.emit('clear', removed);
		}
	}

	_addTimestamp(message) {
		// DL-674: change message arrivalTime when put into inbox/outbox.
		// FIXME
		if (message.metadata) {
			message.metadata.arrivalTime = now();
		}
		if (message.Metadata) {
			message.Metadata.arrivalTime = now();
		}
		// message.metadata.arrivalTime = now();
	}

	put(message, force = false) {
		const doIt = force || this.max < 0 || this.messages.length < this.max;
		this._addTimestamp(message);
		if (doIt) {
			if (this._reverse) this.messages.unshift(message);
			else this.messages.push(message);
		}
		logger.debug(`${this.type}: ${doIt ? 'PUT' : 'SKIP'} message ${message.id}`);
		// review: don't care if message was added -> we want event even for empty or full boxes!
		this._emitter.emit('message_put', message, doIt);
		return doIt;
	}

	// id is optional. if specified message with this id is popped from box, otherwise first message
	pop(id) {
		const poppedMsg = id ? popMessageById(id, this.messages) : this.messages.shift();
		if (poppedMsg) {
			logger.debug(`${this.type}: POP message ${poppedMsg.id}`);
			this._emitter.emit('message_pop', poppedMsg);
		}
		return poppedMsg;
	}

	peek(id) {
		// eslint-disable-next-line
		return this.isEmpty() ? undefined : id ? messageById(id, this.messages) : this.messages[0]; // .copy();
	}

	// selector is a json object!
	find(selector) {
		let message;
		if (selector) {
			const candidates = this.messages.filter((msg) => match(msg.data, selector));
			message = candidates[0];
		}
		return message;
	}

	replaceMessage(newMessage) {
		const msgId = newMessage.id;
		const replaced = this.messages.some((msg, index) => {
			const foundIt = msg.id === msgId;
			if (foundIt) {
				this._addTimestamp(newMessage);
				this.messages[index] = newMessage;
			}
			return foundIt;
		});
		if (replaced) this._emitter.emit('message_changed', newMessage);
		return replaced;
	}
}

module.exports = MessageBox;
