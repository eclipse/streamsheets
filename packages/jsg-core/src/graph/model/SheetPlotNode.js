
const JSG = require('../../JSG');
const SheetReference = require ('../expr/SheetReference');
const CellRange = require ('./CellRange');
const Node = require('./Node');
const ItemAttributes = require('../attr/ItemAttributes');
const TextFormatAttributes = require('../attr/TextFormatAttributes');
const Expression = require('../expr/Expression');
const Numbers = require('../../commons/Numbers');
const JSONWriter = require('../../commons/JSONWriter');
const SetPlotDataCommand = require('../command/SetPlotDataCommand');

const epsilon = 0.000000001;
const defaultChartColors = {
	background: [
		'rgb(54, 162, 235)',
		'rgb(255, 99, 132)',
		'rgb(255, 206, 86)',
		'rgb(75, 192, 192)',
		'rgb(153, 102, 255)',
		'rgb(255, 159, 64)',
		'rgb(98,51,58)',
		'rgb(0,177,91)',
		'rgb(88,207,255)',
		'rgb(255,139,116)',
		'rgb(131,240,255)',
		'rgb(224,108,255)'
	],
	line: [
		'rgb(54, 162, 235)',
		'rgb(255,99,132)',
		'rgb(255, 206, 86)',
		'rgb(75, 192, 192)',
		'rgb(153, 102, 255)',
		'rgb(255, 159, 64)',
		'rgb(98,51,58)',
		'rgb(0,177,91)',
		'rgb(88,207,255)',
		'rgb(255,139,116)',
		'rgb(131,240,255)',
		'rgb(224,108,255)'
	]
};

class ChartRect {
	constructor(left, top, right, bottom) {
		this.set(left, top, right, bottom);
	}

	reset() {
		this.left = 0;
		this.right = 0;
		this.top = 0;
		this.bottom = 0;
	}

	containsPoint(pt) {
		return pt.x >= this.left && pt.x <= this.right && pt.y >= this.top && pt.y <= this.bottom;
	}

	set(left, top, right, bottom) {
		this.left = left || 0;
		this.top = top || 0;
		this.right = right || 0;
		this.bottom = bottom || 0;
	}

	get width() {
		return this.right - this.left;
	}

	get height() {
		return this.bottom - this.top;
	}

	toString() {
		return `${this.left} ${this.top} ${this.right} ${this.bottom} `
	}

	static fromString(str) {
		const rect = new ChartRect(0, 0, 0, 0);
		if (str !== undefined) {
			const parts = str.split(' ');
			if (parts.length === 4) {
				rect.left = Number(parts[0]);
				rect.top = Number(parts[1]);
				rect.right = Number(parts[2]);
				rect.bottom = Number(parts[3]);
			}
		}

		return rect;
	}
}

module.exports = class SheetPlotNode extends Node {
	constructor() {
		super();

		this.getFormat().setLineColor('#AAAAAA');
		this.getFormat().setFillColor('#FFFFFF');
		this.getTextFormat().setFontSize(9);

		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setContainer(false);

		this.series = [];
		this.chart = {
			margins: new ChartRect(150, 250, 800, 150),
		};
		this.xAxes = [{
			type: 'time',
			align: 'bottom',
			formula: new Expression(0, 'AXIS()'),
			position: new ChartRect(),
			size: 500,
		}];
		this.yAxes = [{
			type: 'linear',
			align: 'left',
			formula: new Expression(0, 'AXIS()'),
			position: new ChartRect(),
			size: 1000,
		}];
		this.plot = {
			position: new ChartRect()
		};
		this.title = {
			formula: new Expression('Test', ''),
			position: new ChartRect(),
			size: 1000
		};
		this.series = [{
			type: 'line',
			line: {
				color: defaultChartColors.line[0],
			},
			formula: new Expression(0, 'DATAROW(B1,A2:A10,B2:B10)'),
		}, {
			type: 'line',
			line: {
				color: defaultChartColors.line[1],
			},
			formula: new Expression(0, 'DATAROW(C1,A2:A10,C2:C10)'),
		}, {
			type: 'line',
			line: {
				color: defaultChartColors.line[2],
			},
			formula: new Expression(0, 'DATAROW(,A12,A12)')
		}, {
			type: 'line',
			line: {
				color: defaultChartColors.line[3],
			},
			formula: new Expression(0, 'DATAROW(,A12,A12)')
		}];
	}

	getExpressionValue(expr) {
		if (expr === undefined) {
			return '';
		}

		const term = expr.getTerm();
		if (term) {
			const { operand } = term;

			if (operand instanceof SheetReference) {
				const range = operand._range.copy();
				range.shiftFromSheet();
				const cell = range._worksheet.getDataProvider().getRC(range._x1, range._y1);
				return cell ? cell.getValue() : '';
			}
		}

		return expr.getValue();
	}

	layout() {
		const size = this.getSize().toPoint();

		this.plot.position.left = this.chart.margins.left;
		this.plot.position.top = this.chart.margins.top;
		this.plot.position.bottom = size.y - this.chart.margins.bottom;
		this.plot.position.right = size.x - this.chart.margins.right;

		const title = String(this.getExpressionValue(this.title.formula));
		if (title.length) {
			this.plot.position.top += this.title.size;
			this.title.position.top = this.chart.margins.top;
			this.title.position.left = this.chart.margins.left;
			this.title.position.right = size.x - this.chart.margins.right;
			this.title.position.bottom = this.chart.margins.top + this.title.size;
			if (JSG.graphics) {
				const cs = JSG.graphics.getCoordinateSystem();
				JSG.graphics.setFontSize(12);
				JSG.graphics.setFontStyle(TextFormatAttributes.FontStyle.BOLD);
				JSG.graphics.setFont();
				const width = cs.deviceToLogX(JSG.graphics.measureText(title).width);
				this.title.position.left = size.x / 2 - width / 2;
				this.title.position.right = size.x / 2 + width / 2;
				JSG.graphics.setFontSize(8);
				JSG.graphics.setFontStyle(TextFormatAttributes.FontStyle.BOLD);
				JSG.graphics.setFont();
			}
		} else {
			this.title.position.reset();
		}

		this.xAxes.forEach((axis) => {
			switch (axis.align) {
			case 'top':
				this.plot.position.top -= axis.size;
				break;
			case 'bottom':
				this.plot.position.bottom -= axis.size;
				break;
			}
		});

		this.yAxes.forEach((axis) => {
			switch (axis.align) {
			case 'left':
				this.plot.position.left += axis.size;
				break;
			case 'right':
				this.plot.position.right -= axis.size;
				break;
			}
		});

		this.xAxes.forEach((axis) => {
			if (axis.position) {
				Object.assign(axis.position, this.plot.position);
				switch (axis.align) {
				case 'bottom':
					axis.position.top = this.plot.position.bottom;
					axis.position.bottom = axis.position.top + axis.size;
					break;
				}
			}
		});

		this.yAxes.forEach((axis) => {
			if (axis.position) {
				Object.assign(axis.position, this.plot.position);
				switch (axis.align) {
				case 'left':
					axis.position.right = this.plot.position.left;
					axis.position.left = this.plot.position.left - axis.size;
					break;
				}
			}
		});

		super.layout();
	}

	getParamInfo(term, index) {
		if (term && term.params && term.params.length > index) {
			const { operand } = term.params[index];
			if (operand instanceof SheetReference) {
				const range = operand._range.copy();
				range.shiftFromSheet();
				return { sheet: operand._item, range };
			}
		}
		return undefined;
	}

	getParamValue(term, index) {
		const info = this.getParamInfo(term, index);
		if (info) {
			const cell = info.sheet.getDataProvider().getRC(info.range._x1, info.range._y1);
			return cell ? cell.getValue() : undefined;
		}
		if (term && term.params && term.params.length > index) {
			const value = term.params[index].value;
			if (value !== null && value !== undefined) {
				return Number(term.params[index].value);
			}
		}
		return undefined;
	}

	getParamFormat(term, index) {
		const info = this.getParamInfo(term, index);
		if (info) {
			const tf = info.sheet.getTextFormatAtRC(info.range._x1, info.range._y1);
			return {
				localCulture: tf.getLocalCulture().getValue().toString(),
				numberFormat: tf.getNumberFormat().getValue()
			}
		}
		return undefined;
	}

	isTimeAggregateCell(cell) {
		const expr = cell ? cell.getExpression() : undefined;
		if (expr === undefined) {
			return undefined;
		}
		const formula = expr.getFormula();

		if (formula && formula.indexOf('TIMEAGGREGATE') !== -1) {
			return cell;
		}

		return undefined;
	}

	isTimeAggregateRange(sheet, range) {
		if (range.getWidth() !== 1 || range.getHeight() !== 1) {
			return undefined;
		}
		const cell = sheet.getDataProvider().getRC(range._x1, range._y1);
		return this.isTimeAggregateCell(cell);
	}

	getDataSourceInfo(ds) {
		const ret = {
			x: this.getParamInfo(ds.getTerm(), 1),
			y: this.getParamInfo(ds.getTerm(), 2)
		};
		ret.xTime = ret.x ? this.isTimeAggregateRange(ret.x.sheet, ret.x.range) : false;
		ret.yTime = ret.y ? this.isTimeAggregateRange(ret.y.sheet, ret.y.range) : false;

		return ret;
	}

	getAxes(x, y) {
		const fill = ((axis, size, direction) => {
			if (!axis) {
				return;
			}
			const { formula } = axis;
			const term = formula.getTerm();
			const result = {
				min: this.getParamValue(term, 0),
				max: this.getParamValue(term, 1),
				step: this.getParamValue(term, 2),
				minZoom: this.getParamValue(term, 3),
				maxZoom: this.getParamValue(term, 4),
			};

			result.format = this.getParamFormat(term, 0);

			if (result.minZoom !== undefined) {
				result.min = result.minZoom;
			}
			if (result.maxZoom !== undefined) {
				result.max = result.maxZoom;
			}

			this.autoScale(axis, result, size, direction);

			axis.scale = result;
		});

		fill(this.xAxes[x], this.plot.position.width, 'x');
		fill(this.yAxes[y], this.plot.position.height, 'y');

		return {
			x: this.xAxes[x],
			y: this.yAxes[y]
		};
	}

	autoScale(axis, input, size, direction) {
		let stepCount;
		let nDist = 5;
		let m;
		let potMin;
		let potMax;
		let distLin;
		let minLabel;
		let maxLabel;
		let min = axis.minData;
		let max = axis.maxData;

		switch (axis.type) {
		case 'logarithmic':	    			 /* n„chstgr”áere und n„chstkleinere Dekade suchen */
			if (min <= 0.0) {
				min = 0.1;
			}
			if (max <= 0.0) {
				max = 1;
			}
			if ( min >= 1.0 ) {
				potMin = Numbers.digitsBefore( min ) - 1;
				minLabel = 10.0 ** potMin;
			} else if (min <= DBL_MIN ) {
				if ( max > 0 ) {
					min = max / 1000;
				} else {
					min = 0.000001;
				}
				potMin = Math.floor(min);
				potMin = -Numbers.digitsBehind( min );
				if ( potMin > Math.floor(Math.log10(Number.MAX_VALUE))) {
					minLabel = min;
				} else {
					minLabel = 10.0 ** potMin;
				}
			} else {
				potMin = -Numbers.digitsBehind( min );
				if ( potMin > Math.floor(Math.log10(Number.MAX_VALUE))) {
					minLabel = min;
				} else {
					minLabel = 10.0 ** potMin;
				}
			}

			if ( max >= 1.0 ) {
				potMax = Numbers.digitsBefore(max);
			} else {
				potMax = -Numbers.digitsBehind(max) + 1;
			}

			if ( potMax > Math.floor(Math.log10(Number.MAX_VALUE))) {
				maxLabel = max;
			} else{
				maxLabel = pow(10, potMax);
			}

			if (input.min === undefined) {
				input.min = minLabel;
			}
			if (input.min !== undefined && input.min < epsilon) {
				input.min = 1.0;
			}
			if (input.max === undefined) {
				input.max = maxLabel;
			}
			if (input.max - input.min < epsilon) {
				input.max += 1.0;	// sicher ist sicher
			}
			break;
		case 'linear':
		case 'time':
			/* Durch vergrößern dieser Zahl verfeinert     */
			/* sich das im Automatikmode generierte Raster */
			stepCount = 8;    /* 11 => sehr fein      */

			if (direction === 'x') {
				stepCount = Math.min(13, size / 1500);
			} else {
				// dTmp = (double)m_TickLabels.GetFont().GetSize() / 72 * 2540 * 2.0;
				stepCount = Math.min(13, size / 1300);
			}

			stepCount = Math.max(1, stepCount);
			//        if(m_fMinimumScaleIsAuto && min > 0.0) min = 0.0;
			if (input.max === undefined && input.maxData < 0.0) {
				max = 0;
			}
			if (max - min > max * 0.15 && axis.type !== 'time' && min > 0) {
				min = 0;
			}
			if (input.max !== undefined) {
				max = input.max;
			}
			if (input.min !== undefined) {
				min = input.min;
			}

			if (max > min) {
				const diff = max - min;

				distLin = diff / stepCount;
				// den Abstand auf eine Zahl zwischen 1 und 10 bringen
				if (distLin >= 1) {
					m = Numbers.digitsBefore(distLin) - 1;
				} else {
					m = -Numbers.digitsBehind(distLin);
				}
				// eslint-disable-next-line no-restricted-properties
				distLin = distLin / Math.pow(10, m);
				// 1, 2 oder 5 zuweisen
				if ( distLin > 5) {
					distLin = 10;         // von 5.0
				} else if ( distLin > 2) {
					distLin = 5;         // von 5.0
				} else if ( distLin > 1) {
					distLin = 2;
				} else {
					distLin = 1;
				}
				// das ist jetzt der normierte Abstand
				// eslint-disable-next-line no-restricted-properties
				distLin = distLin * Math.pow(10, m);
			} else {
				distLin = 1;
			}
			// MinWert der Beschriftung ermitteln
			if (input.min === undefined) {
				// if value range is small...
				minLabel = min / distLin;
				minLabel = Math.floor(minLabel);
				minLabel = minLabel * distLin;
				if (min < 0.0 && minLabel >= min - 3) {
					minLabel -= distLin;
				}
			} else {
				minLabel = input.min;
			}
			// MaxWert der Beschriftung ermitteln
			if (input.max === undefined) {
				maxLabel = max / distLin;
				if (Math.abs(maxLabel % 1) > epsilon) {
					maxLabel = Math.ceil(maxLabel);
				}
				maxLabel = maxLabel * distLin;
				if (max > 0  && maxLabel <= max + 3) {
					maxLabel += distLin;
				}
			} else {
				maxLabel = input.max;
			}

			if (axis.type === 'time') {
				if (input.min === undefined) {
					input.min = min;
				}
				if (input.max === undefined) {
					input.max = max;
				}
			} else {
				if (input.min === undefined) {
					input.min = minLabel;
				}
				if (input.max === undefined) {
					input.max = maxLabel;
				}
			}

			if (input.min >= input.max) {
				if (input.min < 0.0) {
					input.max = input.min * 0.9 + 0.15;
				} else {
					input.max = input.max * 1.1 + 0.15;
				}
			}

			if (input.step === undefined) {
				input.step = distLin;
			}

			input.step = Math.max(input.step, epsilon * 10);

			while (input.step * 1000 < input.max - input.min) {
				input.step *= 10;
			}

			if (nDist < 1) {
				nDist = 1;
			}
			// if (m_fMinorUnitIsAuto) {
			// 	m_minorUnit = m_dMajorUnit / nDist;
			// }
			//
			// m_minorUnit = max(m_minorUnit, ctEpsilon * 10);
			// while (m_minorUnit * 1000 < m_maximumScale - m_minimumScale) {
			// 	m_minorUnit *= 10;
			// }
			break;
		}
	}

	getValue(ref, index, value) {
		value.x = 0;
		value.y = 0;

		if (!this.xAxes.length || !this.yAxes.length) {
			return false;
		}

		if (this.xAxes[0].type === 'category') {
			value.x = index;
		} else if (ref.xTime) {
			const values = ref.xTime.getValues();
			if (values && values.length > index) {
				value.x = values[index].key;
			}
		} else if (ref.x && index <= ref.x.range._y2 - ref.x.range._y1) {
			const cell = ref.x.sheet.getDataProvider().getRC(ref.x.range._x1, ref.x.range._y1 + index);
			if (cell) {
				value.x = cell.getValue();
				if (!Numbers.isNumber(value.x)) {
					value.x = 0;
				}
			}
		}

		if (ref.yTime) {
			const values = ref.yTime.getValues();
			if (values && values.length > index) {
				value.y = values[index].value;
				return true;
			}
		} else if (ref.y && index <= ref.y.range._y2 - ref.y.range._y1) {
			const cell = ref.y.sheet.getDataProvider().getRC(ref.y.range._x1, ref.y.range._y1 + index);
			if (cell) {
				value.y = cell.getValue();
				if (!Numbers.isNumber(value.y)) {
					value.y = 0;
				}
			}
			return true;
		}

		return false;
	}

	scaleToAxis(info, value) {

		value = (value - info.min) / (info.max - info.min);

		return value;
	}

	scaleFromAxis(info, point) {
		point.x -= this.plot.position.left;

		return info.min + point.x / (this.plot.position.right - this.plot.position.left) * (info.max - info.min);
	}

	isElementHit(pt) {
		let result;
		const dataPoints = [];
		let dataIndex = 0;

		if (this.title.position.containsPoint(pt)) {
			return {
				element: 'title',
				data: this.title
			};
		}

		if (this.plot.position.containsPoint(pt)) {
			result = this.series.filter((series, index) => {
				const ref = this.getDataSourceInfo(series.formula);
				const dataRect = new ChartRect();
				const plotRect = this.plot.position;
				if (ref) {
					const axes = this.getAxes(0, 0);
					let pointIndex = 0;
					let x;
					let y;
					const value = {};

					while (this.getValue(ref, pointIndex, value)) {
						x = this.scaleToAxis(axes.x.scale, value.x);
						y = this.scaleToAxis(axes.y.scale, value.y);
						dataRect.set(plotRect.left + x * plotRect.width - 200,
							plotRect.bottom - y * plotRect.height - 200,
							plotRect.left + x * plotRect.width + 200,
							plotRect.bottom - y * plotRect.height + 200);
						if (dataRect.containsPoint(pt)) {
							dataPoints.push(value);
							dataIndex = index;
							return true;
						}
						pointIndex += 1;
					}
				}
				return false;
			});
			if (result.length) {
				return {
					element: 'datarow',
					index: dataIndex,
					data: result[0],
					dataPoints
				};
			}
		}

		result = this.xAxes.filter((axis) => axis.position.containsPoint(pt));
		if (result.length) {
			return {
				element: 'xAxis',
				data: result[0]
			};
		}

		result = this.yAxes.filter((axis) => axis.position.containsPoint(pt));
		if (result.length) {
			return {
				element: 'yAxis',
				data: result[0]
			};
		}

		if (this.plot.position.containsPoint(pt)) {
			return {
				element: 'plot',
				data: this.plot
			};
		}

		return undefined;
	}

	setMinMax() {
		let xMin = Number.MAX_VALUE;
		let xMax = -Number.MAX_VALUE;
		let yMin = Number.MAX_VALUE;
		let yMax = -Number.MAX_VALUE;
		let valid = false;

		this.series.forEach((series, index) => {
			const ref = this.getDataSourceInfo(series.formula);
			if (ref) {
				let pointIndex = 0;
				const value = {};

				while (this.getValue(ref, pointIndex, value)) {
					xMin = Math.min(value.x, xMin);
					xMax = Math.max(value.x, xMax);
					yMin = Math.min(value.y, yMin);
					yMax = Math.max(value.y, yMax);
					pointIndex += 1;
					valid = true;
				}
			}
		});

		if (!valid) {
			xMin = 0;
			xMax = 100;
			yMin = 0;
			yMax = 100;
		}
		if (xMin >= xMax) {
			xMax = xMin + 1;
		}
		if (yMin >= yMax) {
			yMax = yMin + 1;
		}

		if (this.xAxes.length && this.yAxes.length) {
			this.xAxes[0].minData = xMin;
			this.xAxes[0].maxData = xMax;
			this.yAxes[0].minData = yMin;
			this.yAxes[0].maxData = yMax;
		}
	}

	createSeriesFromSelection(viewer, sheet, selection, type) {
		if (!selection.hasSelection()) {
			return;
		}

		const range = selection.getAt(0);
		const width = range.getWidth();
		const height = range.getHeight();
		const data = range.getSheet().getDataProvider();
		let time  = true;

		this.series = [];

		// check for TIMEAGGREGATES
		if (width === 1 || height === 1) {
			range.enumerateCells(true, (pos) => {
				const cell = data.get(pos);
				if (!this.isTimeAggregateCell(cell)) {
					time = false;
				}
			});
			if (time) {
				const cmd = this.prepareCommand('series');
				let index = 0;
				range.enumerateCells(true, (pos) => {
					const source = new CellRange(range.getSheet(), pos.x, pos.y);
					source.shiftToSheet();
					const ref = source.toString({item: sheet, useName: true});
					const formula =  new Expression(0, `DATAROW(,${ref},${ref})`);
					this.series.push({
						type,
						formula,
					});
					index += 1;
				});
				this.evaluate();

				this.finishCommand(cmd, 'series');
				viewer.getInteractionHandler().execute(cmd);
				return;
			}
		}

		// if (range.getWidth() === 2) {
		// 	for (let i = range.getY1(); i <= range.getY2(); i += 1) {
		// 		if (allValues !== undefined) {
		// 			const cell = range
		// 				.getSheet()
		// 				.getDataProvider()
		// 				.getRC(range.getX1() + 1, i);
		// 			if (this.isTimeAggregateCell(cell)) {
		// 				allValues.push(cell);
		// 			} else {
		// 				allValues = undefined;
		// 			}
		// 		}
		// 	}
		// 	if (allValues) {
		// 		item.data.hasSeriesLabels = 'first';
		// 		item.data.hasCategoryLabels = 'auto';
		// 		item.data.direction = 'rows';
		// 		return allValues;
		// 	}
		// }
		//
		// allValues = [];
		//
		// if (range.getHeight() === 2) {
		// 	for (let i = range.getX1(); i <= range.getX2(); i += 1) {
		// 		if (allValues !== undefined) {
		// 			const cell = range
		// 				.getSheet()
		// 				.getDataProvider()
		// 				.getRC(i, range.getY1() + 1);
		// 			if (this.isTimeAggregateCell(cell)) {
		// 				allValues.push(cell);
		// 			} else {
		// 				allValues = undefined;
		// 			}
		// 		}
		// 	}
		// 	if (allValues) {
		// 		item.data.hasSeriesLabels = 'first';
		// 		item.data.hasCategoryLabels = 'auto';
		// 		item.data.direction = 'columns';
		// 		return allValues;
		// 	}
		// }

		this.evaluate();
	}

	newInstance() {
		return new SheetPlotNode();
	}

	evaluate() {
		super.evaluate();
		this.series.forEach((serie) => {
			serie.formula.evaluate(this);
		});
		this.xAxes.forEach((axis) => {
			axis.formula.evaluate(this);
		});
		this.yAxes.forEach((axis) => {
			axis.formula.evaluate(this);
		});
		this.title.formula.evaluate(this);
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		copy.series = [];

		this.series.forEach((serie, index) => {
		 	copy.series.push({
				type: serie.type,
				line: serie.line ? JSON.parse(JSON.stringify(serie.line)) : undefined,
				formula: serie.formula.copy()
			});
		});

		return copy;
	}

	saveTitle(writer) {
		writer.writeStartElement('title');
		this.title.formula.save('formula', writer);
		writer.writeEndElement();
	}

	saveSeries(writer) {
		writer.writeStartArray('series');

		this.series.forEach((serie, index) => {
			writer.writeStartElement('series');
			serie.formula.save('formula', writer);
			writer.writeEndElement();
		});
		writer.writeEndArray('series');
	}

	saveAxes(writer) {
		const save = (data, name) => {
			writer.writeStartArray(name);

			data.forEach((axis, index) => {
				writer.writeStartElement(name);

				writer.writeAttributeNumber('size', axis.size, 0);
				writer.writeAttributeString('align', axis.align);
				writer.writeAttributeString('type', axis.type);
				writer.writeAttributeString('position', axis.position.toString());
				axis.formula.save('formula', writer);

				writer.writeEndElement();
			});

			writer.writeEndArray('name');
		};

		save(this.xAxes, 'xaxis');
		save(this.yAxes, 'yaxis');
	}

	saveContent(writer, absolute) {
		super.saveContent(writer, absolute);

		writer.writeAttributeString('type', 'sheetplotnode');

		writer.writeStartElement('plot');

		this.saveTitle(writer);
		this.saveSeries(writer);
		this.saveAxes(writer);

		writer.writeEndElement();
	}

	readTitle(reader, object) {
		reader.iterateObjects(object, (name, child) => {
			switch (name) {
			case 'title': {
				reader.iterateObjects(child, (subName, subChild) => {
					switch (subName) {
					case 'formula':
						this.title.formula = new Expression(0);
						this.title.formula.read(reader, subChild);
						break;
					}
				});
				break;
			}
			}
		});
	}

	readSeries(reader, object) {
		this.series = [];

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
			case 'series': {
				const serie = {};
				reader.iterateObjects(child, (subName, subChild) => {
					switch (subName) {
					case 'formula':
						serie.formula = new Expression(0);
						serie.formula.read(reader, subChild);
						break;
					}
				});
				this.series.push(serie);
				break;
			}
			}
		});
	}

	readAxes(reader, object) {
		this.xAxes = [];
		this.yAxes = [];

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
			case 'xaxis':
			case 'yaxis': {
				const axis = {};
				axis.size = reader.getAttribute(child, 'size') === undefined ? 500 : Number(reader.getAttribute(child, 'size'));
				axis.align = reader.getAttribute(child, 'align') === undefined ? 'left' : reader.getAttribute(child, 'align');
				axis.type = reader.getAttribute(child, 'type') === undefined ? 'linear' : reader.getAttribute(child, 'type');
				axis.position = ChartRect.fromString(reader.getAttribute(child, 'position'));

				reader.iterateObjects(child, (subName, subChild) => {
					switch (subName) {
					case 'formula':
						axis.formula = new Expression(0);
						axis.formula.read(reader, subChild);
						break;
					}
				});
				if (name === 'xaxis') {
					this.xAxes.push(axis);
				} else {
					this.yAxes.push(axis);
				}
				break;
			}
			}
		});
	}

	read(reader, object) {
		super.read(reader, object);

		const plot = reader.getObject(object, 'plot');
		if (plot) {
			this.readTitle(reader, plot);
			this.readSeries(reader, plot);
			this.readAxes(reader, plot);
		}
	}

	saveByKey(key) {
		const writer = new JSONWriter();
		writer.writeStartDocument();
		switch (key) {
		case 'title':
			this.saveTitle(writer);
			break;
		case 'series':
			this.saveSeries(writer);
			break;
		case 'axes':
			this.saveAxes(writer);
			break;
		}
		writer.writeEndDocument();

		return writer.flush();
	}

	prepareCommand(key) {
		// save current state
		const current = this.saveByKey(key);
		const cmd = new SetPlotDataCommand(this, key, undefined, current);

		return cmd;
	}

	finishCommand(cmd, key) {
		cmd._data = this.saveByKey(key);
	}

	_assignName(id) {
		const name = this.getGraph().getUniqueName('Plot');
		this.setName(name);
	}

	getSheet() {
		let sheet = this;

		while (sheet && !sheet.getCellDescriptors) {
			sheet = sheet.getParent();
		}

		return sheet;
	}

	isAddLabelAllowed() {
		return false;
	}

	static get defaultColors() {
		return defaultChartColors;
	}
};
