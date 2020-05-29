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

const Strings = require('../../../commons/Strings');

module.exports = class ChartFormat {
	constructor(lineColor, lineStyle, lineWidth, fillStyle, fillColor, fontSize, fontStyle, fontColor, transparency) {
		this.lineColor = lineColor;
		this.lineStyle = lineStyle;
		this.lineWidth = lineWidth;
		this.fillColor = fillColor;
		this.fillStyle = fillStyle;
		this.fontSize = fontSize;
		this.fontStyle = fontStyle;
		this.fontColor = fontColor;
		this.fontRotation = 0;
		this.transparency = transparency;
	}

	copy() {
		const copy = new ChartFormat();
		copy.lineColor = this.lineColor;
		copy.lineStyle = this.lineStyle;
		copy.lineWidth = this.lineWidth;
		copy.fillColor = this.fillColor;
		copy.fillStyle = this.fillStyle;
		copy.fontSize = this.fontSize;
		copy.fontStyle = this.fontStyle;
		copy.fontColor = this.fontColor;
		copy.fontRotation = this.fontRotation;
		copy.transparency = this.transparency;

		return copy;
	}

	get lineColor() {
		return this.line && this.line.color ? this.line.color : undefined;
	}

	set lineColor(value) {
		if (value === undefined) {
			return;
		}
		if (this.line === undefined) {
			this.line = {};
		}
		this.line.color = value;
	}

	get lineWidth() {
		return this.line && this.line.width !== undefined ? this.line.width : undefined;
	}

	set lineWidth(value) {
		if (value === undefined) {
			return;
		}
		if (this.line === undefined) {
			this.line = {};
		}
		this.line.width = Number(value);
	}

	get lineStyle() {
		return this.line && this.line.style !== undefined ? this.line.style : undefined;
	}

	set lineStyle(value) {
		if (value === undefined) {
			return;
		}
		if (this.line === undefined) {
			this.line = {};
		}
		this.line.style = Number(value);
	}

	get fillStyle() {
		return this.fill && this.fill.style !== undefined ? this.fill.style : undefined;
	}

	set fillStyle(value) {
		if (value === undefined) {
			return;
		}
		if (this.fill === undefined) {
			this.fill = {};
		}
		this.fill.style = Number(value);
	}

	get transparency() {
		return this.fill && this.fill.transparency !== undefined ? this.fill.transparency : undefined;
	}

	set transparency(value) {
		if (value === undefined) {
			return;
		}
		if (this.fill === undefined) {
			this.fill = {};
		}
		this.fill.transparency = Number(value);
	}

	get fillColor() {
		return this.fill && this.fill.color ? this.fill.color : undefined;
	}

	set fillColor(value) {
		if (value === undefined) {
			return;
		}
		if (this.fill === undefined) {
			this.fill = {};
		}
		this.fill.color = value;
	}

	get fontColor() {
		return this.font && this.font.color ? this.font.color : undefined;
	}

	set fontColor(value) {
		if (value === undefined) {
			return;
		}
		if (this.font === undefined) {
			this.font = {};
		}

		this.font.color = value;
	}

	get fontStyle() {
		return this.font && this.font.style !== undefined ? this.font.style : undefined;
	}

	set fontStyle(value) {
		if (value === undefined) {
			return;
		}
		if (this.font === undefined) {
			this.font = {};
		}
		this.font.style = Number(value);
	}

	get fontName() {
		return this.font && this.font.name ? this.font.name : undefined;
	}

	set fontName(value) {
		if (value === undefined) {
			return;
		}
		if (this.font === undefined) {
			this.font = {};
		}
		this.font.name = value;
	}

	get fontSize() {
		return this.font && this.font.size ? this.font.size : undefined;
	}

	set fontSize(value) {
		if (value === undefined) {
			return;
		}
		if (this.font === undefined) {
			this.font = {};
		}
		this.font.size = Number(value);
	}

	get fontRotation() {
		return this.font && this.font.rotation ? this.font.rotation : undefined;
	}

	set fontRotation(value) {
		if (value === undefined) {
			return;
		}
		if (this.font === undefined) {
			this.font = {};
		}
		this.font.rotation = Number(value);
	}

	get numberFormat() {
		return this.font && this.font.number ? this.font.number : undefined;
	}

	set numberFormat(value) {
		if (this.font === undefined) {
			this.font = {};
		}
		this.font.number = value;
	}

	get localCulture() {
		return this.font && this.font.local ? this.font.local : undefined;
	}

	set localCulture(value) {
		if (this.font === undefined) {
			this.font = {};
		}
		this.font.local = value;
	}

	get linkNumberFormat() {
		return this.font && this.font.linknumber ? this.font.linknumber : undefined;
	}

	set linkNumberFormat(value) {
		if (this.font === undefined) {
			this.font = {};
		}
		this.font.linknumber = value;
	}

	save(name, writer) {
		writer.writeStartElement(name);
		if (this.line) {
			writer.writeStartElement('line');
			if (this.lineColor) {
				writer.writeAttributeString('color', this.lineColor);
			}
			if (this.lineWidth !== undefined) {
				writer.writeAttributeNumber('width', this.lineWidth, 0);
			}
			if (this.lineStyle !== undefined) {
				writer.writeAttributeNumber('style', this.lineStyle, 0);
			}
			writer.writeEndElement();
		}
		if (this.fill) {
			writer.writeStartElement('fill');
			if (this.fillColor) {
				writer.writeAttributeString('color', this.fillColor);
			}
			if (this.fillStyle !== undefined) {
				writer.writeAttributeNumber('style', this.fillStyle, 0);
			}
			if (this.transparency !== undefined) {
				writer.writeAttributeNumber('transparency', this.transparency, 0);
			}
			writer.writeEndElement();
		}
		if (this.font) {
			writer.writeStartElement('font');
			if (this.fontColor) {
				writer.writeAttributeString('color', this.fontColor);
			}
			if (this.fontName) {
				writer.writeAttributeString('name', this.fontName);
			}
			if (this.fontSize) {
				writer.writeAttributeNumber('size', this.fontSize, 0);
			}
			if (this.fontStyle !== undefined) {
				writer.writeAttributeNumber('style', this.fontStyle, 0);
			}
			if (this.numberFormat) {
				writer.writeAttributeString('number', this.numberFormat);
			}
			if (this.localCulture) {
				writer.writeAttributeString('local', this.localCulture);
			}
			if (this.linkNumberFormat) {
				writer.writeAttributeNumber('linknumberformat', this.linkNumberFormat ? 1 : 0);
			}
			if (this.fontRotation !== undefined) {
				writer.writeAttributeNumber('rotation', this.fontRotation, 0);
			}
			writer.writeEndElement();
		}
		writer.writeEndElement();
	}

	read(reader, object) {
		reader.iterateObjects(object, (name, child) => {
			switch (name) {
			case 'line':
				this.line = {};
				this.lineWidth = reader.getAttribute(child, 'width');
				this.lineColor = reader.getAttribute(child, 'color');
				this.lineStyle = reader.getAttribute(child, 'style');
				break;
			case 'fill':
				this.fill = {};
				this.fillColor = reader.getAttribute(child, 'color');
				this.fillStyle = reader.getAttribute(child, 'style');
				this.transparency = reader.getAttribute(child, 'transparency');
				break;
			case 'font':
				this.font = {};
				this.fontColor = reader.getAttribute(child, 'color');
				this.fontName = reader.getAttribute(child, 'name');
				this.fontSize = reader.getAttribute(child, 'size');
				this.fontStyle = reader.getAttribute(child, 'style');
				this.fontRotation = reader.getAttribute(child, 'rotation');
				this.linkNumberFormat = reader.getAttribute(child, 'linknumberformat');
				if (reader.getAttribute(child, 'number') !== undefined) {
					this.numberFormat = reader.getAttribute(child, 'number');
				}
				if (reader.getAttribute(child, 'local') !== undefined) {
					this.localCulture = reader.getAttribute(child, 'local');
				}
				break;
			}
		});
	}

	get fillColorRGBA() {
		let color = this.fillColor;
		if (color === undefined || color[0] !== '#') {
			return {r: 255, g: 255, b: 255, a: 1};
		}

		color = Strings.cut(color, '#');
		// cut off a leading #
		color = parseInt(color, 16);
		const r = color >> 16;
		const g = (color >> 8) & 0xff;
		const b = color & 0xff;
		const a = this.transparency === undefined ? 1 : this.transparency / 100;

		return { r, g, b, a };
	}

};
