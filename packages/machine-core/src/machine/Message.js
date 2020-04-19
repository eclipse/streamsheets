const { isType } = require('../utils');
const { jsonpath } = require('@cedalo/commons');
const { Functions } = require('@cedalo/parser');
const IdGenerator = require('@cedalo/id-generator');

const clear = (obj) => Object.keys(obj).forEach((key) => delete obj[key]);
const now = () => (Functions.NOW ? Functions.NOW() : Date.now());

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
		const json = {
			Metadata: { ...this.metadata, id: this.metadata.idAttribute || this.id },
			Data: this.data
		};
		delete json.Metadata.idAttribute;
		return json;
	}

	static fromJSON(json, id) {
		if (json && json.Data != null && isType.object(json.Metadata)) {
			const message = new Message(json.Data);
			Object.keys(json.Metadata).forEach((key) => {
				message.metadata[key] = json.Metadata[key];
			});
			if (typeof id !== 'undefined') {
				message.metadata.id = id || IdGenerator.generate();
			}
			return message;
		}
		return null;
	}

	// NOTE: this is NOT a deep copy! => using JSON has probs with Date and possible cyclic references...
	// => currently no problem, since messages are only read... => make them immutable!!
	copy() {
		const msg = new Message(this.data, this.id);
		Object.assign(msg.metadata, this.metadata);
		return msg;
	}

	get id() {
		return this.metadata.id;
	}

	// path is an array
	getDataAt(path) {
		return path == null || !path.length ? this.data : jsonpath.query(path, this.data);
	}

	deleteDataAt(path) {
		if (path == null || !path.length) {
			clear(this.data);
			return true;
		}
		return jsonpath.deleteAt(path, this.data) != null;
	}

	// path is an array
	getMetaDataAt(path) {
		return path == null || !path.length ? this.metadata : jsonpath.query(path, this.metadata);
	}

	deleteMetaDataAt(path) {
		if (path == null || !path.length) {
			const id = this.id;
			clear(this.metadata);
			this.metadata.id = id;
			return true;
		}
		return jsonpath.deleteAt(path, this.metadata) != null;
	}
};
