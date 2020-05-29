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
module.exports = class Writer {
	/**
	 * Create a new Document.
	 *
	 * @method writeStartDocument
	 */
	writeStartDocument() {
		this.close();
		this.tree = [];
	}

	/**
	 * Finish the XML Document.
	 *
	 * @method writeEndDocument
	 */
	writeEndDocument() {
		this.active = this.root;
		this.tree = [];
	}

	writeStartArray(/* name */) {}

	writeEndArray() {}

	/**
	 * Start a new node.
	 *
	 * @method writeStartElement
	 * @param {String} name Name of the node.
	 * @param {Boolean} [writeEmpty] Optional flag which indicates if an empty element should be written at all.
	 * An element is empty if it has no attributes and no children. Specify <code>false</code> to prevent writing
	 * empty element.
	 * @since 1.6.43
	 */
	writeStartElement(/* name, writeEmpty */) {}

	/**
	 * Finish node.</br>
	 * Use the optional <code>cancel</code> parameter to prevent Writer to save started element.
	 *
	 * @method writeEndElement
	 * @param {Boolean} [cancel] Cancels started element so that it is not written to XML.
	 * @return {Boolean} <code>true</code> if element was written, <code>false</code> if it was cancelled.
	 */
	writeEndElement(/* cancel */) {
		return false;
	}

	/**
	 * Add attribute to the current node.
	 *
	 * @method writeAttributeString
	 * @param {String} name Name of the attribute.
	 * @param {String} value Value of the attribute.
	 */
	writeAttributeString(/* name, value */) {}

	/**
	 * Add attribute to the current node using a number a optionally rounding it to n decimals.
	 *
	 * @method writeAttributeString
	 * @param {String} name Name of the attribute.
	 * @param {Number} value Value of the attribute.
	 * @param {Number} [decimals] Round value to. If not supplied, no rounding will take place.
	 */
	writeAttributeNumber(/* name, value, decimals */) {}

	/**
	 * Add text to node.
	 *
	 * @method writeString
	 * @param {String} text Text to write.
	 */
	writeString(/* text */) {}

	/**
	 * Create String with the file Information.
	 *
	 * @method flush
	 * @param {boolean} plain False to format returned String and add the header to it, true to leave it unformatted.
	 * @return {String} String.
	 */
	flush(/* plain */) {
		if (this.tree && this.tree[0]) {
			// ensure it's closed
			this.writeEndDocument();
		}

		return '';
	}

	/**
	 * Close Document. Calling this will destroy all Information in the Writer
	 *
	 * @method close
	 */
	close() {
		if (this.root) {
			this.clean(this.root);
		}

		this.active = undefined;
		this.root = undefined;
		this.tree = undefined;
	}

	clean(node) {
		let l = node.c.length;
		while (l) {
			l -= 1;
			if (typeof node.c[l] === 'object') {
				this.clean(node.c[l]);
			}
		}
		node.n = undefined;
		node.a = undefined;
		node.c = undefined;
	}

	setMode(description) {
		this._mode = description;
	}

	getMode() {
		return this._mode;
	}

	enumerate(node, callback) {
		node.c.forEach((item) => {
			if (typeof item === 'object') {
				callback(item);
				this.enumerate(item, callback);
			}
		});
	}
};
