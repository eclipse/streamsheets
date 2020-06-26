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
const AttributeUtils = require('../attr/AttributeUtils');
const CellAttributes = require('../attr/CellAttributes');
const CellFormatAttributes = require('../attr/CellFormatAttributes');
const CellTextFormatAttributes = require('../attr/CellTextFormatAttributes');

/**
 * @class HeaderSection
 *
 * @extends HeaderSection
 * @constructor
 */
module.exports = class HeaderSection {
	constructor() {
		this._size = 0;
		this._level = 0;
		this._visible = true;
	}

	isDefault(defaultSize) {
		return (
			this._size === defaultSize &&
			this._level === 0 &&
			this._visible === true &&
			(this._closed === undefined || this._closed === false) &&
			this._format === undefined &&
			this._textFormat === undefined &&
			this._attributes === undefined
		);
	}

	copy() {
		const copy = new HeaderSection();

		copy._size = this._size;
		copy._level = this._level;
		copy._visible = this._visible;
		if (this._format) {
			copy._format = this._format.copy();
		}
		if (this._textFormat) {
			copy._textFormat = this._textFormat.copy();
		}
		if (this._attributes) {
			copy._attributes = this._attributes.copy();
		}

		return copy;
	}

	get level() {
		return this._level;
	}

	set level(value) {
		this._level = value;
	}

	get parent() {
		return this._parent;
	}

	set parent(value) {
		this._parent = value;
	}

	get closed() {
		return this._closed;
	}

	set closed(value) {
		this._closed = value;
	}

	getSize() {
		return this._size;
	}

	setSize(size) {
		this._size = size;
	}

	getVisible() {
		return this._visible;
	}

	setVisible(visible) {
		this._visible = visible;
	}

	getOrCreateFormat() {
		if (this._format === undefined) {
			this._format = new CellFormatAttributes();
		}

		return this._format;
	}

	getFormat() {
		return this._format;
	}

	setFormat(format) {
		this._format = format;
	}

	getOrCreateAttributes() {
		if (this._attributes === undefined) {
			this._attributes = new CellAttributes();
		}

		return this._attributes;
	}

	getAttributes() {
		return this._attributes;
	}

	setAttributes(attributes) {
		this._attributes = attributes;
	}

	getOrCreateTextFormat() {
		if (this._textFormat === undefined) {
			this._textFormat = new CellTextFormatAttributes();
		}

		return this._textFormat;
	}

	getTextFormat() {
		return this._textFormat;
	}

	setTextFormat(format) {
		this._textFormat = format;
	}

	clearFormat() {
		this._format = undefined;
		this._textFormat = undefined;
		this._attributes = undefined;
	}

	save(writer, index) {
		writer.writeStartElement('section');
		writer.writeAttributeNumber('index', index, 0);
		if (this._level) {
			writer.writeAttributeNumber('level', this._level, 0);
		}
		writer.writeAttributeNumber('size', this._size, 0);
		writer.writeAttributeNumber('visible', this._visible ? 1 : 0);
		if (this._closed) {
			writer.writeAttributeNumber('closed', 1);
		}

		if (this._format) {
			this._format.saveCondensed(writer, 'f');
		}

		if (this._textFormat) {
			this._textFormat.saveCondensed(writer, 't');
		}

		if (this._attributes) {
			this._attributes.saveCondensed(writer, 'a');
		}

		writer.writeEndElement();
	}

	read(reader, object) {
		const ssize = reader.getAttribute(object, 'size');
		if (ssize !== undefined) {
			this._size = Number(ssize);
		}
		const level = reader.getAttributeNumber(object, 'level', 0);
		if (level !== undefined) {
			this._level = level;
		}
		const closed = reader.getAttribute(object, 'closed');
		if (closed !== undefined) {
			this._closed = true;
		}

		const visible = reader.getAttribute(object, 'visible');
		if (visible !== undefined) {
			this._visible = Number(visible) === 1;
		}

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'cell':
				case 'format':
				case 'textformat': {
					const attrObj = reader.getObject(child, 'al');
					if (attrObj === undefined) {
						break;
					}
					const attr = AttributeUtils.readAttribute(reader, 'al', attrObj);
					if (attr === undefined) {
						break;
					}
					const attrName = attr.getName();
					switch (attrName) {
						case 'cell':
							this.setAttributes(attr);
							break;
						case 'format':
							this.setFormat(attr);
							break;
						case 'textformat':
							this.setTextFormat(attr);
							break;
					}
					break;
				}
				case 'a': {
					const format = this.getOrCreateAttributes();
					format.readCondensed(reader, child);
					break;
				}
				case 'f': {
					const format = this.getOrCreateFormat();
					format.readCondensed(reader, child);
					break;
				}
				case 't': {
					const format = this.getOrCreateTextFormat();
					format.readCondensed(reader, child);
					break;
				}
			}
		});
	}

	set properties(data) {
		this._properties = data;
	}

	get properties() {
		return this._properties;
	}

	get textproperties() {
		return this._properties && this._properties.formats ? this._properties.formats.text : undefined;
	}

	get styleproperties() {
		return this._properties && this._properties.formats ? this._properties.formats.styles : undefined;
	}
	get attributes() {
		return this._properties ? this._properties.attributes : undefined;
	}
};
