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

const Expression = require('../../expr/Expression');
const ChartFormat = require('./ChartFormat');
const ChartRect = require('./ChartRect');
const ChartTitle = require('./ChartTitle');

module.exports = class ChartAxis {
	constructor(name, type, align, size) {
		this.type = type;
		this.name = name;
		this.position = new ChartRect();
		this.size = size;
		this.align = align;
		this.formula = new Expression(0, 'AXIS()');
		this.format = new ChartFormat();
		this.format.linkNumberFormat = true;
		this.formatGrid = new ChartFormat();
		this.title = new ChartTitle(new Expression('Title', ''), false);
		this.gridVisible = true;
		this.visible = true;
		this.allowZoom = false;
		this.invert = false;
		this.updateZoom = false;
		this.zoomGroup = '';
		this.autoZero = true;
		this.betweenTicks = false;
		this.valueRanges = [];
	}

	isVertical() {
		return this.align === 'left' || this.align === 'right';
	}

	save(writer, name) {
		writer.writeStartElement(name);

		writer.writeAttributeString('align', this.align);
		writer.writeAttributeString('type', this.type);
		writer.writeAttributeString('name', this.name);
		writer.writeAttributeNumber('gridvisible', this.gridVisible ? 1 : 0);
		writer.writeAttributeNumber('visible', this.visible ? 1 : 0);
		writer.writeAttributeNumber('autozero', this.autoZero ? 1 : 0);
		writer.writeAttributeNumber('allowzoom', this.allowZoom ? 1 : 0);
		writer.writeAttributeNumber('updatezoom', this.updateZoom ? 1 : 0);
		writer.writeAttributeNumber('invert', this.invert ? 1 : 0);
		writer.writeAttributeNumber('betweenticks', this.betweenTicks ? 1 : 0);
		writer.writeAttributeString('zoomgroup', this.zoomGroup);
		writer.writeAttributeString('position', this.position.toString());
		this.formula.save('formula', writer);
		this.format.save('format', writer);
		this.formatGrid.save('formatGrid', writer);
		this.title.save('axistitle', writer);

		writer.writeStartArray('valueranges');

		this.valueRanges.forEach((range) => {
			writer.writeStartElement('valuerange');
			range.format.save('format', writer);
			range.formula.save('formula', writer);
			writer.writeEndElement();
		});
		writer.writeEndArray('valueranges');

		writer.writeEndElement();
	}

	read(reader, object) {
		this.align = reader.getAttributeString(object, 'align', 'left');
		this.type = reader.getAttributeString(object, 'type', 'linear');
		this.name = reader.getAttributeString(object, 'name', 'Axis1');
		this.zoomGroup = reader.getAttributeString(object, 'zoomgroup', '');
		this.position = ChartRect.fromString(reader.getAttribute(object, 'position'));
		this.gridVisible = reader.getAttributeBoolean(object, 'gridvisible', true);
		this.visible = reader.getAttributeBoolean(object, 'visible', true);
		this.autoZero = reader.getAttributeBoolean(object, 'autozero', true);
		this.allowZoom = reader.getAttributeBoolean(object, 'allowzoom', true);
		this.updateZoom = reader.getAttributeBoolean(object, 'updatezoom', false);
		this.betweenTicks = reader.getAttributeBoolean(object, 'betweenticks', false);
		this.invert = reader.getAttributeBoolean(object, 'invert', false);
		this.valueRanges = [];

		reader.iterateObjects(object, (subName, subChild) => {
			switch (subName) {
			case 'formula':
				this.formula = new Expression(0);
				this.formula.read(reader, subChild);
				break;
			case 'format':
				this.format = new ChartFormat();
				this.format.read(reader, subChild);
				break;
			case 'formatGrid':
				this.formatGrid = new ChartFormat();
				this.formatGrid.read(reader, subChild);
				break;
			case 'axistitle':
				this.title = new ChartTitle(new Expression('Title', ''), false);
				this.title.read(reader, subChild);
				break;
			case 'valueranges': {
				const range = {};
				range.label = reader.getAttributeString(subChild, 'label', undefined);
				if (range.label !== undefined) {
					range.from = reader.getAttributeNumber(subChild, 'from', 0);
					range.to = reader.getAttributeNumber(subChild, 'to', 10);
					range.width = reader.getAttributeNumber(subChild, 'width', 0);
					range.formula = new Expression(0, `VALUERANGE("${range.label}",${range.from},${range.to},${range.width})`);
				} else {
					const f = reader.getObject(subChild, 'formula');
					if (f) {
						range.formula = new Expression(0);
						range.formula.read(reader, f);
					}
				}
				const f = reader.getObject(subChild, 'format');
				if (f) {
					range.format = new ChartFormat();
					range.format.read(reader, f);
				}
				this.valueRanges.push(range);
				break;
			}
			}
		});
	}
};
