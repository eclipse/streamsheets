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
const Writer = require('./Writer');
const Arrays = require('./Arrays');
const Strings = require('./Strings');

module.exports = class JSONWriter extends Writer {
	writeStartDocument() {
		super.writeStartDocument();

		this.writeStartElement('root', true);
	}

	writeEndDocument() {
		super.writeEndDocument();

		this.writeEndElement('root');
	}

	writeStartArray(name) {
		this._array = true;

		if (this.active) {
			this.active._activeArray = [];
			this.active[`a-${name}`] = this.active._activeArray;
		}
	}

	writeEndArray(name) {
		if (this.active) {
			// if nothing in array omit []
			if (this.active._activeArray.length === 0) {
				this.active[`a-${name}`] = undefined;
			}
			this.active._activeArray = undefined;
		}
	}

	writeStartElement(name, writeEmpty) {
		// to separate object from attribute
		name = `o-${name}`;

		const node = {
			_writeEmpty: writeEmpty,
			_name: name,
			_writeAttributes: false
		};

		if (this.active) {
			if (this.active._activeArray) {
				this.active._activeArray.push(node);
			} else {
				this.active[name] = node;
			}
			this.tree.push(this.active);
			this.parent = this.active;
		} else {
			this.root = node;
		}

		this.active = node;
	}

	writeEndElement(cancel) {
		let cancelled;

		const parent = this.tree ? this.tree.pop() || this.root : this.root;
		cancelled = cancel === true;
		cancelled =
			cancelled ||
			(this.active._writeEmpty
				? false
				: this.active._writeAttributes === 0 &&
				  (this.active._activeArray === undefined ||
						this.active._activeArray.length === 0));

		if (cancelled) {
			if (parent._activeArray) {
				Arrays.remove(parent._activeArray, this.active);
			} else {
				parent[this.active._name] = undefined;
			}
		}

		// temporary variables do no need to be saved
		delete this.active._name;
		delete this.active._writeEmpty;
		delete this.active._writeAttributes;
		if (!this.active._activeArray || this.active._activeArray.length < 1) {
			delete this.active._activeArray;
		}

		this.active = parent;
		return !cancelled;
	}

	writeString(text) {
		this.writeAttributeString('text', text);
	}

	/**
	 * Add attribute to the current node.
	 *
	 * @method writeAttributeString
	 * @param {String} name Name of the attribute.
	 * @param {String} value Value of the attribute.
	 */
	writeAttributeString(name, value) {
		if (this.active) {
			this.active[name] = Strings.encodeXML(value.toString());
			this.active._writeAttributes = true;
		}
	}

	/**
	 * Add attribute to the current node using a number a optionally rounding it to n decimals.
	 *
	 * @method writeAttributeString
	 * @param {String} name Name of the attribute.
	 * @param {Number} value Value of the attribute.
	 * @param {Number} [decimals] Round value to. If not supplied, no rounding will take place.
	 */
	writeAttributeNumber(name, value, decimals) {
		let val = Number(value);
		let factor;

		if (decimals !== undefined) {
			factor = 10 ** decimals;
			val = Math.round(val * factor) / factor;
		}
		if (this.active) {
			this.active[name] = String(val);
			this.active._writeAttributes = true;
		}
	}

	/**
	 * Creates either a string or object JSON representation.
	 *
	 * @method flush
	 * @param {boolean} plain Specify <code>true</code> to return a JSON object.
	 * @return {String|Object} Graph as JSON string or object.
	 */
	flush(plain) {
		if (this.tree && this.tree[0]) {
			// ensure it's closed
			this.writeEndDocument();
		}

		return plain ? this.root : JSON.stringify(this.root);
	}

	clean() {}
};
