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
const jp = require('jsonpath');
const IdGenerator = require('@cedalo/id-generator');
const DefaultLogger = require('../DefaultLogger');

const logger = new DefaultLogger();

const isObject = (val) => val != null && typeof val === 'object';

const dataAt = (path, data) => {
	let res;
	try {
		res = jp.query(data, path, 1)[0];
	} catch (err) {
		logger.error(err);
	}
	return res;
};
const regex = /"/g;
const propertyFrom = (path) => {
	if (path.endsWith(']')) {
		// we reference an array index...
		const cutIndex = path.lastIndexOf('[');
		const index = path.substring(cutIndex + 1, path.length - 1);
		return index && index.length ? index.replace(regex, '') : undefined;
	}
	const index = path.lastIndexOf('.');
	return index >= 0 ? path.substr(index + 1) : path;
};
const deleteAt = (path, data) => {
	let delIt = true;
	try {
		const parent = jp.parent(data, path);
		const property = propertyFrom(path);
		delIt = parent && property != null;
		if (delIt) {
			delete parent[property];
		}
	} catch (err) {
		logger.error(err);
		delIt = false;
	}
	return delIt;
};
const clear = (obj) => Object.keys(obj).forEach((key) => delete obj[key]);
const now = () => Date.now();

/**
 * A class representing a message.
 *
 * @class Message
 * @public
 */
module.exports = class Message {
	constructor(data = {}, id) {
		// read only properties...
		Object.defineProperties(this, {
			data: { value: data, enumerable: true },
			metadata: { value: {}, enumerable: true }
		});
		this.metadata.id = id || IdGenerator.generate();
		this.metadata.arrivalTime = now();
	}

	toJSON() {
		const meta = Object.assign({}, this.metadata, {
			id: this.metadata.idAttribute || this.id
		});
		const json = {
			Metadata: meta,
			Data: this.data
		};
		delete json.Metadata.idAttribute;
		return json;
	}

	static fromJSON(json, id) {
		if (json && json.Data != null) {
			const message = new Message(json.Data);
			if (isObject(json.Metadata)) {
				Object.keys(json.Metadata).forEach((key) => {
					message.metadata[key] = json.Metadata[key];
				});
			}
			if (typeof id !== 'undefined') {
				message.metadata.id = id || IdGenerator.generate();
			}
			return message;
		}
		return null;
	}

	// NOTE: this is NOT a deep copy! => using JSON has probs with Date and possible cyclic references...
	// => currently no problem, since messages are only read... => make them immutable!!
	copy({ metadata, data }) {
		const msg = new Message(data || this.data, this.id);
		Object.assign(msg.metadata, metadata || this.metadata);
		return msg;
	}

	get id() {
		return this.metadata.id;
	}

	// path should be a json path...
	getDataAt(path) {
		return path == null || path === ''
			? this.data
			: dataAt(path, this.data);
	}

	deleteDataAt(path) {
		if (path == null || path === '') {
			clear(this.data);
			return true;
		}
		return deleteAt(path, this.data);
	}

	// path should be a json path...
	getMetaDataAt(path) {
		return path == null || path === ''
			? this.metadata
			: dataAt(path, this.metadata);
	}

	deleteMetaDataAt(path) {
		if (path == null || path === '') {
			const id = this.id;
			clear(this.metadata);
			this.metadata.id = id;
			return true;
		}
		return deleteAt(path, this.metadata);
	}
};
