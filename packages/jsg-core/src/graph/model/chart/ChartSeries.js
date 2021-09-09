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
const ChartMap = require('./ChartMap');
const JSG = require('../../../JSG');

module.exports = class ChartSeries {
	constructor(type, formula) {
		this.type = type;
		this.timeSeries = false;
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
		this.pointerType = 'narrowingline';
		this.pointerLength = 'center';
		this.tooltip = 'value';
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

	formulaToString(sheet) {
		// if (this.formulaYValues && this.formulaValues.length) {
		//
		// }

		return this.formula.toLocaleString(JSG.getParserLocaleSettings(), { item: sheet, useName: true });
	}

	save(writer) {
		writer.writeStartElement('series');
		writer.writeAttributeString('type', this.type);
		if (this.timeSeries) {
			writer.writeAttributeNumber('timeseries', this.timeSeries ? 1 : 0);
		}
		if (this.xAxis !== 'XAxis1') {
			writer.writeAttributeString('xaxis', this.xAxis);
		}
		if (this.yAxis !== 'YAxis1') {
			writer.writeAttributeString('yaxis', this.yAxis);
		}
		if (this.smooth) {
			writer.writeAttributeNumber('smooth', this.smooth ? 1 : 0);
		}
		if (this.visible === false) {
			writer.writeAttributeNumber('visible', this.visible ? 1 : 0);
		}
		if (this.innerPoints === false) {
			writer.writeAttributeNumber('innerpoints', this.innerPoints ? 1 : 0);
		}
		if (this.outerPoints === false) {
			writer.writeAttributeNumber('outerpoints', this.outerPoints ? 1 : 0);
		}
		if (this.average === false) {
			writer.writeAttributeNumber('average', this.average ? 1 : 0);
		}
		if (this.autoSum === true) {
			writer.writeAttributeNumber('autosum', this.autoSum ? 1 : 0);
		}
		writer.writeAttributeNumber('bargap', this.barGap, 2);
		if (this.pointerType !== 'narrowingline') {
			writer.writeAttributeString('pointertype', this.pointerType);
		}
		if (this.pointerLength !== 'center') {
			writer.writeAttributeString('pointerlength', this.pointerLength);
		}
		if (this.tooltip !== 'value') {
			writer.writeAttributeString('tooltip', this.tooltip);
		}

		if (this.formulaXValues) {
			writer.writeStartArray('fxvalues');
			this.formulaXValues.forEach((formula, index) => {
				const node = formula.save('formula', writer);
				node.index = index;
			});
			writer.writeEndArray('fxvalues');
		}
		if (this.formulaYValues) {
			writer.writeStartArray('fyvalues');
			this.formulaYValues.forEach(formula => {
				formula.save('formula', writer);
			});
			writer.writeEndArray('fyvalues');
		}
		if (this.formulaCValues) {
			writer.writeStartArray('fcvalues');
			this.formulaCValues.forEach(formula => {
				formula.save('formula', writer);
			});
			writer.writeEndArray('fcvalues');
		}
		if (this.formulaXLabel) {
			this.formulaXLabel.save('fxlabel', writer);
		}
		if (this.formulaYLabel) {
			this.formulaYLabel.save('fylabel', writer);
		}
		if (this.formulaTime) {
			this.formulaTime.save('ftime', writer);
		}
		if (this.formulaTimeXKey) {
			this.formulaTimeXKey.save('ftimexkey', writer);
		}
		if (this.formulaTimeYKey) {
			this.formulaTimeYKey.save('ftimeykey', writer);
		}
		if (this.formulaTimeCKey) {
			this.formulaTimeCKey.save('ftimeckey', writer);
		}

		this.formula.save('formula', writer);
		this.format.save('format', writer);
		this.marker.save('marker', writer);
		this.dataLabel.save('datalabel', writer);
		if (this.map) {
			this.map.save('map', writer);
		}

		writer.writeStartArray('points');
		this.points.forEach((point, index) => {
			point.save(writer, index);
		});
		writer.writeEndArray('points');

		writer.writeEndElement();
	}

	read(reader, object) {
		this.type = reader.getAttribute(object, 'type');
		this.timeSeries = reader.getAttributeBoolean(object, 'timeseries', false);
		this.xAxis = reader.getAttributeString(object, 'xaxis', 'XAxis1');
		this.yAxis = reader.getAttributeString(object, 'yaxis', 'YAxis1');
		this.smooth = reader.getAttributeBoolean(object, 'smooth', false);
		this.visible = reader.getAttributeBoolean(object, 'visible', true);
		this.innerPoints = reader.getAttributeBoolean(object, 'innerpoints', true);
		this.outerPoints = reader.getAttributeBoolean(object, 'outerpoints', true);
		this.average = reader.getAttributeBoolean(object, 'average', true);
		this.autoSum = reader.getAttributeBoolean(object, 'autosum', false);
		this.barGap = reader.getAttributeNumber(object, 'bargap', this.type === 'state' ? 0 : 0.3);
		this.pointerType = reader.getAttributeString(object, 'pointertype', 'narrowingline');
		this.pointerLength = reader.getAttributeString(object, 'pointerlength', 'center');
		this.tooltip = reader.getAttributeString(object, 'tooltip', 'value');

		let formula;
		this.formulaXLabel = undefined;
		this.formulaYLabel = undefined;
		this.formulaXValues = undefined;
		this.formulaYValues = undefined;
		this.formulaCValues = undefined;
		this.formulaTime = undefined;
		this.formulaTimeXKey = undefined;
		this.formulaTimeYKey = undefined;
		this.formulaTimeCKey = undefined;

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'formula':
					// TODO convert to new formula settings
					this.formula = new Expression(0);
					this.formula.read(reader, child);
					break;
				case 'fxlabel':
					this.formulaXLabel = new Expression(0);
					this.formulaXLabel.read(reader, child);
					break;
				case 'fylabel':
				case 'formulalabely':
					this.formulaYLabel = new Expression(0);
					this.formulaYLabel.read(reader, child);
					break;
				case 'formulacategories':
				case 'fxvalues':
					if (this.formulaXValues === undefined || !(this.formulaXValues instanceof Array)) {
						this.formulaXValues = [];
					}
					formula = new Expression(0);
					formula.read(reader, child);
					if (child.index !== undefined) {
						this.formulaXValues[child.index] = formula;
					} else {
						this.formulaXValues.push(formula);
					}
					break;
				case 'formulavalues':
				case 'fyvalues':
					if (this.formulaYValues === undefined || !(this.formulaYValues instanceof Array)) {
						this.formulaYValues = [];
					}
					formula = new Expression(0);
					formula.read(reader, child);
					this.formulaYValues.push(formula);
					break;
				case 'fcvalues':
					if (this.formulaCValues === undefined || !(this.formulaCValues instanceof Array)) {
						this.formulaCValues = [];
					}
					formula = new Expression(0);
					formula.read(reader, child);
					this.formulaCValues.push(formula);
					break;
				case 'ftime':
					this.formulaTime = new Expression(0);
					this.formulaTime.read(reader, child);
					break;
				case 'ftimexkey':
					this.formulaTimeXKey = new Expression(0);
					this.formulaTimeXKey.read(reader, child);
					break;
				case 'ftimeykey':
					this.formulaTimeYKey = new Expression(0);
					this.formulaTimeYKey.read(reader, child);
					break;
				case 'ftimeckey':
					this.formulaTimeCKey = new Expression(0);
					this.formulaTimeCKey.read(reader, child);
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
				case 'map':
					if (!this.map) {
						this.map = new ChartMap();
					}
					this.map.read(reader, child);
					break;
				case 'points': {
					const point = new ChartPoint();
					const index = point.read(reader, child);
					this.points[index] = point;
					break;
				}
			}
		});

		if (this.type === 'map' && !this.map) {
			this.map = new ChartMap();
		}
	}

	evaluate(item) {
		this.formula.evaluate(item);
		if (this.formulaXLabel) {
			this.formulaXLabel.evaluate(item);
		}
		if (this.formulaYLabel) {
			this.formulaYLabel.evaluate(item);
		}
		if (this.formulaXValues) {
			this.formulaXValues.forEach((formula) => {
				formula.evaluate(item);
			});
		}
		if (this.formulaYValues) {
			this.formulaYValues.forEach((formula) => {
				formula.evaluate(item);
			});
		}
		if (this.formulaCValues) {
			this.formulaCValues.forEach((formula) => {
				formula.evaluate(item);
			});
		}
		if (this.formulaTime) {
			this.formulaTime.evaluate(item);
		}
		if (this.formulaTimeXKey) {
			this.formulaTimeXKey.evaluate(item);
		}
		if (this.formulaTimeYKey) {
			this.formulaTimeYKey.evaluate(item);
		}
		if (this.formulaTimeCKey) {
			this.formulaTimeCKey.evaluate(item);
		}
	}

};
