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

const JSONWriter = require('../../../commons/JSONWriter');
const JSONReader = require('../../../commons/JSONReader');
const Expression = require('../../expr/Expression');
const ChartFormat = require('./ChartFormat');
const ChartMarker = require('./ChartMarker');
const ChartDataLabel = require('./ChartDataLabel');
const ChartPoint = require('./ChartPoint');

module.exports = class ChartSeries {
	constructor(type, formula) {
		this.type = type;
		this.smooth = false;
		this.visible = true;
		this.innerPoints = true;
		this.outerPoints = true;
		this.average = true;
		this.formula = formula;
		this.format = new ChartFormat();
		this.marker = new ChartMarker();
		this.dataLabel = new ChartDataLabel();
		this.points = [];
		this.xAxis = 'XAxis1';
		this.yAxis = 'YAxis1';
		this.barGap = 0.3;
		this.autoSum = false;
	}

	copy() {
		const copy = new ChartSeries();

		const writer = new JSONWriter();
		writer.writeStartDocument();
		this.save(writer);
		writer.writeEndDocument();
		const json = writer.flush();

		const reader = new JSONReader(json);
		const root = reader.getObject(reader.getRoot(), 'series');
		copy.read(reader, root);

		return copy;
	}

	set type(type) {
		this._type = type || 'line';
	}

	get type() {
		return this._type;
	}

	save(writer) {
		writer.writeStartElement('series');
		writer.writeAttributeString('type', this.type);
		writer.writeAttributeString('xaxis', this.xAxis);
		writer.writeAttributeString('yaxis', this.yAxis);
		writer.writeAttributeNumber('smooth', this.smooth ? 1 : 0);
		writer.writeAttributeNumber('visible', this.visible ? 1 : 0);
		writer.writeAttributeNumber('innerpoints', this.innerPoints ? 1 : 0);
		writer.writeAttributeNumber('outerpoints', this.outerPoints ? 1 : 0);
		writer.writeAttributeNumber('average', this.average ? 1 : 0);
		writer.writeAttributeNumber('autosum', this.autoSum ? 1 : 0);
		writer.writeAttributeNumber('bargap', this.barGap, 2);
		this.formula.save('formula', writer);
		this.format.save('format', writer);
		this.marker.save('marker', writer);
		this.dataLabel.save('datalabel', writer);

		writer.writeStartArray('points');
		this.points.forEach((point, index) => {
			point.save(writer, index);
		});
		writer.writeEndArray('points');

		writer.writeEndElement();
	}

	read(reader, object) {
		this.type = reader.getAttribute(object, 'type');
		this.xAxis = reader.getAttributeString(object, 'xaxis', 'XAxis1');
		this.yAxis = reader.getAttributeString(object, 'yaxis', 'YAxis1');
		this.smooth = reader.getAttributeBoolean(object, 'smooth', false);
		this.visible = reader.getAttributeBoolean(object, 'visible', true);
		this.innerPoints = reader.getAttributeBoolean(object, 'innerpoints', true);
		this.outerPoints = reader.getAttributeBoolean(object, 'outerpoints', true);
		this.average = reader.getAttributeBoolean(object, 'average', true);
		this.autoSum = reader.getAttributeBoolean(object, 'autosum', false);
		this.barGap = reader.getAttributeNumber(object, 'bargap', this.type === 'state' ? 0 : 0.3);

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
			case 'formula':
				this.formula = new Expression(0);
				this.formula.read(reader, child);
				break;
			case 'format':
				this.format = new ChartFormat();
				this.format.read(reader, child);
				break;
			case 'marker':
				this.marker = new ChartMarker();
				this.marker.read(reader, child);
				break;
			case 'datalabel':
				this.dataLabel = new ChartDataLabel();
				this.dataLabel.read(reader, child);
				break;
			case 'points': {
				const point = new ChartPoint();
				const index = point.read(reader, child);
				this.points[index] = point;
				break;
			}
			}
		});
	}
};
