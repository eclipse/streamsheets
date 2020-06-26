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
const JSG = require('../../JSG');
const Expression = require('../expr/Expression');
const AttributeUtils = require('../attr/AttributeUtils');
const CellAttributes = require('../attr/CellAttributes');
const CellFormatAttributes = require('../attr/CellFormatAttributes');
const CellTextFormatAttributes = require('../attr/CellTextFormatAttributes');
const Strings = require('../../commons/Strings');

/**
 * Class to contain cell information for the worksheet.
 *
 * @class Cell
 * @constructor
 */
module.exports = class Cell {
	constructor(expr) {
		this._expr = expr;
		this._value = undefined;
		this._format = undefined;
		this._textFormat = undefined;
		this._attributes = undefined;
	}

	newInstance() {
		return new Cell();
	}

	copy() {
		const copy = this.newInstance();

		if (this._format) {
			copy._format = this._format.copy();
		}
		if (this._textFormat) {
			copy._textFormat = this._textFormat.copy();
		}
		if (this._attributes) {
			copy._attributes = this._attributes.copy();
		}
		if (this._expr) {
			const value = this._expr._value;
			copy._expr = this._expr.copy();
			copy._expr._value = value;
		}
		copy._value = this._value;
		copy._values = this._values;

		return copy;
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

	getValue() {
		return this._value;
	}

	getActualValue() {
		if (this._expr) {
			this._value = this._expr.getValue();
		}

		return this._value;
	}

	setTargetValue(value) {
		this._targetValue = value;
	}

	getTargetValue() {
		return this._targetValue;
	}

	toLocaleString(forItem, encode) {
		const expr = this.getExpression();

		if (expr === undefined) {
			return '';
		}

		// DL-1592: if expression has a formula but not term => there was an error while parsing, so simply use formula
		let value =
			expr.hasFormula() && !expr.hasTerm()
				? `=${expr.getFormula()}`
				: expr.toLocaleString(JSG.getParserLocaleSettings(), { item: forItem, useName: true });

		if (encode) {
			value = Strings.encodeXML(String(value));
		}

		return value;
	}

	setValue(value) {
		if (value !== '#CALC') {
			this._value = value;
		}
	}

	setInfo(info) {
		this._info = info;
	}

	get displayFunctionName() {
		return this._info && this._info.displayName;
	}
	get values() {
		return this._info ? this._info.values : undefined;
	}

	get valuesMarker() {
		return this._info ? this._info.marker : undefined;
	}

	get xvalue() {
		return this._info ? this._info.xvalue : 'time';
	}

	clearContent() {
		this._value = undefined;
		this._expr = undefined;
	}

	clearFormat() {
		this._format = undefined;
		this._textFormat = undefined;
		this._attributes = undefined;
	}

	clearFormula() {
		if (this._expr) {
			this._expr.setFormula(undefined);
			this._expr.setTerm(undefined);
		}
	}

	hasFormat() {
		return this._format !== undefined || this._textFormat !== undefined || this._attributes !== undefined;
	}

	hasContent() {
		return this._expr !== undefined;
	}

	clearAll() {
		this.clearFormat();
		this.clearContent();
	}

	getExpression() {
		return this._expr;
	}

	setExpression(expr) {
		this._expr = expr;
		if (this._expr && this._expr.hasFormula() === false) {
			this._value = this._expr.getValue();
		} else {
			this._value = undefined;
		}
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

	setIf(flag) {
		this._if = flag;
	}

	evaluate(item) {
		if (this._expr) {
			// we evaluate ignoring any errors...
			JSG.FormulaParser.runIgnoringErrors(() => this._expr.evaluate(item));
		}
	}

	invalidateTerm() {
		if (this._expr) {
			this._expr.invalidateTerm();
		}
	}

	calc(item) {
		if (this._expr) {
			if (item !== undefined) {
				this._expr.evaluate(item);
			}
			this._value = this._expr.getValue();
		} else {
			this._value = undefined;
		}
	}

	saveNeeded(writer) {
		const serverMode = writer.getMode() === 'machineserver';

		// no need to save
		if (!this.hasFormat() && (serverMode || !this.hasContent())) {
			return false;
		}

		return true;
	}

	/**
	 * Saves this Cell instance to the given Stream.
	 *
	 * @method save
	 * @param {Writer} writer Writer to use for streaming.
	 */
	save(writer) {
		const serverMode = writer.getMode() === 'machineserver';

		writer.writeStartElement('cell');

		if (this._expr && serverMode === false) {
			this._expr.save('value', writer, 15);
		}
		/*
		if (this._attributes) {
			writer.writeStartElement('cell');
			this._attributes.save(writer);
			writer.writeEndElement();
		}

		if (this._format) {
			writer.writeStartElement('format');
			this._format.save(writer);
			writer.writeEndElement();
		}
		if (this._textFormat) {
			writer.writeStartElement('textformat');
			this._textFormat.save(writer);
			writer.writeEndElement();
		}
		*/
		this.saveCellAttributes(writer);

		writer.writeEndElement();
	}

	saveCellAttributes(writer) {
		if (this._format) {
			this._format.saveCondensed(writer, 'f');
		}

		if (this._textFormat) {
			this._textFormat.saveCondensed(writer, 't');
		}

		if (this._attributes) {
			this._attributes.saveCondensed(writer, 'a');
		}
	}
	/**
	 * Read to initialize this Cell.
	 *
	 * @method read
	 * @param {Reader} reader Reader to use for reading.
	 * @param {Object} object Object to read.
	 */
	read(reader, object) {
		let type = reader.getAttribute(object, 'type');
		// "number";
		const value = reader.getAttribute(object, 'value');

		if (type === undefined) {
			type = 'number';
		}

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'value':
					if (!this._expr) {
						this._expr = new Expression(0);
					}
					this._expr.read(reader, child);
					this._value = this._expr.getValue();
					break;
				// todo remove old persistence
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
							this._attributes = attr;
							break;
						case 'format':
							this._format = attr;
							break;
						case 'textformat':
							this._textFormat = attr;
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
				default:
					break;
			}
		});
	}
};
