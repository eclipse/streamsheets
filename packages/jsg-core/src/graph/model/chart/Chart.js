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

const ChartRect = require('./ChartRect');
const ChartElement = require('./ChartElement');
const Expression = require('../../expr/Expression');

module.exports = class Chart {
	constructor() {
		this._period = false;
		this._stacked = false;
		this._step = false;
		this._relative = false;
		this._dataMode = 'datazero';
		this.rotation = Math.PI_2;
		this.startAngle = 0;
		this.endAngle = Math.PI * 2;
		this.hole = 0.5;
		this.barMargin = 150;
		this.template = 'basic';
		this.tooltips = false;
		this.margins = new ChartRect(300, 200, 300, 200);
		this.coharentData = true;
		this.firstCategoryLabels = true;
		this.firstSeriesLabels = true;
		this.dataInRows = true;
		this.varyByCategories = false;
		this.varyByThreshold = 'none';
		this.hiLoLines = new ChartElement();
		this.seriesLines = new ChartElement();
		this.upBars = new ChartElement();
		this.downBars = new ChartElement();
		this.gaugePointer = false;
		this.mapZoom = false;
		this.mapZoomFactor = 1;
		this.formula = new Expression('');
	}

	get dataMode() {
		return this._dataMode;
	}

	set dataMode(value) {
		this._dataMode = value === undefined ? 'datazero' : value;
	}

	get stacked() {
		return this._stacked;
	}

	set stacked(value) {
		this._stacked = value === undefined ? false : !!Number(value);
	}

	get step() {
		return this._step;
	}

	set step(value) {
		this._step = value === undefined ? false : !!Number(value);
	}

	get period() {
		return this._period;
	}

	set period(value) {
		this._period = value === undefined ? false : !!Number(value);
	}

	get relative() {
		return this._relative;
	}

	set relative(value) {
		this._relative = value === undefined ? false : !!Number(value);
	}

	save(writer) {
		writer.writeStartElement('chart');
		if (this.type) {
			writer.writeAttributeString('type', this.type);
		}
		if (this.dataMode !== 'datazero') {
			writer.writeAttributeString('datamode', this.dataMode);
		}
		writer.writeAttributeString('template', this.template);
		if (this.coharentData === false) {
			writer.writeAttributeNumber('coharent', this.coharentData ? 1 : 0);
		}
		if (this.firstCategoryLabels === false) {
			writer.writeAttributeNumber('firstcategories', this.firstCategoryLabels ? 1 : 0);
		}
		if (this.firstSeriesLabels === false) {
			writer.writeAttributeNumber('firstseries', this.firstSeriesLabels ? 1 : 0);
		}
		if (this.dataInRows === false) {
			writer.writeAttributeNumber('datainrows', this.dataInRows ? 1 : 0);
		}
		if (this.varyByCategories === true) {
			writer.writeAttributeNumber('varybycategories', this.varyByCategories ? 1 : 0);
		}
		if (this.varyByThreshold !== 'none') {
			writer.writeAttributeString('varybythreshold', this.varyByThreshold);
		}
		if (this.gaugePointer !== false) {
			writer.writeAttributeString('gaugepointer', this.gaugePointer ? 1 : 0);
		}
		if (this.stacked !== false) {
			writer.writeAttributeNumber('stacked', this.stacked ? 1 : 0);
		}
		if (this.relative !== false) {
			writer.writeAttributeNumber('relative', this.relative ? 1 : 0);
		}
		if (this.step !== false) {
			writer.writeAttributeNumber('step', this.step ? 1 : 0);
		}
		if (this.period !== false) {
			writer.writeAttributeNumber('period', this.period ? 1 : 0);
		}
		if (this.tooltips !== false) {
			writer.writeAttributeNumber('tooltips', this.tooltips ? 1 : 0);
		}
		if (this.rotation !== Math.PI_2) {
			writer.writeAttributeNumber('rotation', this.rotation);
		}
		if (this.startAngle !== 0) {
			writer.writeAttributeNumber('startangle', this.startAngle);
		}
		if (this.endAngle !== Math.PI * 2) {
			writer.writeAttributeNumber('endangle', this.endAngle);
		}
		if (this.hole !== 0.5) {
			writer.writeAttributeNumber('hole', this.hole);
		}
		if (this.mapZoom === true) {
			writer.writeAttributeNumber('mapzoom', this.mapZoom ? 1 : 0);
		}

		this.formula.save('formula', writer);
		this.hiLoLines.save('hilolines', writer);
		this.seriesLines.save('serieslines', writer);
		this.upBars.save('upbars', writer);
		this.downBars.save('downbars', writer);
		writer.writeEndElement();
	}

	read(reader, object) {
		this.type = reader.getAttribute(object, 'type') ? reader.getAttribute(object, 'type') : undefined;
		this.dataMode = reader.getAttributeString(object, 'datamode', 'datazero');
		this.stacked = reader.getAttributeBoolean(object, 'stacked', false);
		this.relative = reader.getAttributeBoolean(object, 'relative', false);
		this.step = reader.getAttributeBoolean(object, 'step', false);
		this.period = reader.getAttributeBoolean(object, 'period', false);
		this.coharentData = reader.getAttributeBoolean(object, 'coharent', true);
		this.firstCategoryLabels = reader.getAttributeBoolean(object, 'firstcategories', true);
		this.firstSeriesLabels = reader.getAttributeBoolean(object, 'firstseries', true);
		this.dataInRows = reader.getAttributeBoolean(object, 'datainrows', true);
		this.tooltips = reader.getAttributeBoolean(object, 'tooltips', false);
		this.varyByCategories = reader.getAttributeBoolean(object, 'varybycategories', false);
		this.varyByThreshold = reader.getAttributeString(object, 'varybythreshold', 'none');
		this.gaugePointer = reader.getAttributeBoolean(object, 'gaugepointer', false);
		this.rotation = reader.getAttributeNumber(object, 'rotation', Math.PI_2);
		this.startAngle = reader.getAttributeNumber(object, 'startangle', 0);
		this.endAngle = reader.getAttributeNumber(object, 'endangle', Math.PI * 2);
		this.hole = reader.getAttributeNumber(object, 'hole', 0.5);
		this.mapZoom = reader.getAttributeBoolean(object, 'mapzoom', false);
		this.template = reader.getAttributeString(object, 'template', 'basic');

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'formula':
					this.formula = new Expression(0);
					this.formula.read(reader, child);
					break;
				case 'hilolines':
					this.hiLoLines = new ChartElement();
					this.hiLoLines.read(reader, child);
					break;
				case 'serieslines':
					this.seriesLines = new ChartElement();
					this.seriesLines.read(reader, child);
					break;
				case 'upbars':
					this.upBars = new ChartElement();
					this.upBars.read(reader, child);
					break;
				case 'downbars':
					this.downBars = new ChartElement();
					this.downBars.read(reader, child);
					break;
			}
		});
	}
};
