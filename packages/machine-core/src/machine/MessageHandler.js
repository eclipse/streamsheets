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
const { jsonpath } = require('@cedalo/commons');
const { isType } = require('../utils');

const DEF = {
	path: '',
	enabled: false,
	recursively: false
};

const traverse = (el, path, recursively, cb) => {
	cb(el, path);
	if (Array.isArray(el)) {
		el.forEach((e, index) =>
			recursively ? traverse(e, `${path}[${index}]`, recursively, cb) : cb(e, `${path}[${index}]`)
		);
	} else if (isType.object(el)) {
		Object.keys(el).forEach((k) =>
			recursively ? traverse(el[k], `${path}[${k}]`, recursively, cb) : cb(el[k], `${path}[${k}]`)
		);
	}
};

const getLoopElement = (message, datapath) => {
	let loop;
	if (message) {
		const path = datapath && jsonpath.parse(datapath);
		const rootpath = path && path.length ? path.shift().toLowerCase() : undefined;
		if (rootpath) loop = rootpath === 'data' ? message.getDataAt(path) : message.getMetaDataAt(path);
	}
	return loop;
};

const createStack = (loop, recursively = false) => {
	const stack = [];
	// DL-1159: loop should support objects!
	if (loop) traverse(loop, '', recursively, (e, p) => p && stack.push({ key: p, value: e }));
	return stack;
};


class MessageHandler {
	constructor(cfg = {}) {
		this.config = Object.assign({}, DEF, cfg);
		this._index = 0;
		this._hasLoop = false;
		this._message = undefined;
		this._stack = [];
		this._stacklength = 1;
	}

	toJSON() {
		return Object.assign({}, this.config);
	}

	update(cfg = {}) {
		Object.assign(this.config, cfg);
		this.reset();
	}

	get path() {
		return this.config.path;
	}
	set path(path) {
		this.config.path = path;
		this.reset();
	}

	get index() {
		// DL-712: we keep last loop element...
		return Math.max(0, Math.min(this._index, this._stacklength - 1));
	}

	get indexKey() {
		const index = Math.min(this._index, this._stack.length - 1);
		return index < 0 ? '[0]' : this._stack[index].key;
		// return this._index < this._stacklength ? this._stack[this._index].key : (this._stack.length ? '[0]';
	}

	get message() {
		return this._message;
	}
	set message(message) {
		this._message = message;
		this.reset();
	}

	get isEnabled() {
		return this.config.enabled;
	}

	set isEnabled(doIt) {
		this.config.enabled = !!doIt;
	}

	get isProcessed() {
		return !this._message || this._index >= this._stacklength || (!this.isEnabled && this._index > 0);
	}

	setProcessed() {
		this._index = this._stacklength;
	}

	get isRecursive() {
		return this.config.recursively;
	}
	set isRecursive(doIt) {
		this.config.recursively = !!doIt;
	}

	hasLoop() {
		return this._hasLoop;
	}

	getLoopCount() {
		return this._hasLoop ? this._stack.length : -1;
	}

	reset() {
		this._index = 0;
		const loop = getLoopElement(this._message, this.config.path);
		this._stack = createStack(loop, this.config.recursively);
		// stacklength should be at least 1 to handle messages without loop!
		this._stacklength = this._stack.length || 1;
		this._hasLoop = !!loop;
	}

	pathForIndex(index) {
		let key;
		if (this._stacklength) {
			const max = this._stacklength - 1;
			// eslint-disable-next-line no-nested-ternary
			key = index < 0 ? this._stack[0].key : index > max ? this._stack[max].key : this._stack[index].key;
		} else {
			key = '0';
		}
		return `${this.path}${key}`;
	}

	next() {
		const value =
			!this.isEnabled || this._index >= this._stack.length ? undefined : this._stack[this._index].value;
		// have to move index to ensure we process loop elements, even if they have no data...
		this._index = Math.min(this._index + 1, this._stacklength);
		return value;
	}
}

module.exports = MessageHandler;
