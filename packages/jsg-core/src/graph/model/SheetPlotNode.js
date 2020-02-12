
const JSG = require('../../JSG');
const GraphUtils = require('../GraphUtils');
const MathUtils = require('../../geometry/MathUtils');
const SheetReference = require('../expr/SheetReference');
const CellRange = require('./CellRange');
const Node = require('./Node');
const ItemAttributes = require('../attr/ItemAttributes');
const TextFormatAttributes = require('../attr/TextFormatAttributes');
const Expression = require('../expr/Expression');
const Numbers = require('../../commons/Numbers');
const JSONWriter = require('../../commons/JSONWriter');
const SetPlotDataCommand = require('../command/SetPlotDataCommand');
const CompoundCommand = require('../command/CompoundCommand');

const epsilon = 0.000000001;
const templates = {
	basic: {
		font: {
			name: 'Verdana',
			size: 8
		},
		title: {
			font: {
				size: 14
			},
		},
		legend: {
			linecolor: '#CCCCCC',
		},
		axis: {
			linecolor: '#AAAAAA',
		},
		series: {
			linewidth: 50,
			fill: [
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
		}
	}
};

class ChartFormat {
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

	save(name, writer) {
		writer.writeStartElement(name);
		if (this.line) {
			writer.writeStartElement('line');
			if (this.lineColor) {
				writer.writeAttributeString('color', this.lineColor);
			}
			if (this.lineWidth) {
				writer.writeAttributeNumber('width', this.lineWidth, 0);
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
				break;
			}
		});
	}
}

class ChartSeries {
	constructor(type, formula) {
		this.type = type || 'line';
		this.formula = formula;
		this.format = new ChartFormat();
	}

	save(writer) {
		writer.writeStartElement('series');
		this.formula.save('formula', writer);
		this.format.save('format', writer);
		writer.writeEndElement();
	}

	read(reader, object) {
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
			}
		});
	}
}

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
		return `${this.left} ${this.top} ${this.right} ${this.bottom} `;
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
			margins: new ChartRect(150, 250, 800, 150)
		};
		this.xAxes = [
			{
				type: 'linear',
				align: 'bottom',
				formula: new Expression(0, 'AXIS()'),
				position: new ChartRect(),
				format: new ChartFormat(),
				size: 500,
			}
		];
		this.yAxes = [
			{
				type: 'linear',
				align: 'left',
				formula: new Expression(0, 'AXIS()'),
				position: new ChartRect(),
				format: new ChartFormat(),
				size: 1000
			}
		];
		this.plot = {
			position: new ChartRect(),
			format: new ChartFormat(),
		};
		this.legend = {
			formula: new Expression('Legend', ''),
			position: new ChartRect(),
			format: new ChartFormat(),
			align: 'right'
		};
		this.title = {
			formula: new Expression('Chart', ''),
			position: new ChartRect(),
			format: new ChartFormat(),
			size: 700
		};
		this.series = [new ChartSeries('line', new Expression(0, 'DATAROW(B1,A2:A10,B2:B10)'))];
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

	setFont(graphics, name, size, style) {
		graphics.setFontName(name);
		graphics.setFontSize(size);
		graphics.setFontStyle(style);
		graphics.setFont();
	}

	resetFont(graphics) {
		graphics.setFontName('Verdana');
		graphics.setFontSize(8);
		graphics.setFontStyle(0);
		graphics.setFont();
	}

	layout() {
		const size = this.getSize().toPoint();
		const cs = JSG.graphics.getCoordinateSystem();

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
			if (JSG.graphics) {
				this.setFont(JSG.graphics, 'Verdana', 12, TextFormatAttributes.FontStyle.BOLD);
				const width = cs.deviceToLogX(JSG.graphics.measureText(title).width);
				this.title.position.left = size.x / 2 - width / 2;
				this.title.position.right = size.x / 2 + width / 2;
				this.resetFont(JSG.graphics);
				const metrics = GraphUtils.getFontMetricsEx('Verdana', 12);
				this.title.size = metrics.lineheight + metrics.descent;
				this.title.position.bottom = this.chart.margins.top + this.title.size;
				this.plot.position.top += 200;
			}
		} else {
			this.title.position.reset();
		}

		const legend = this.getLegend();
		if (legend.length) {
			const margin = 200;
			const metrics = GraphUtils.getFontMetricsEx('Verdana', 8);
			this.setFont(JSG.graphics, 'Verdana', 8, TextFormatAttributes.FontStyle.NORMAL);
			let width = 0;
			legend.forEach((entry) => {
				const measure = cs.deviceToLogX(JSG.graphics.measureText(String(entry.name)).width);
				width = Math.max(width, measure);
			});
			width += margin * 6;
			this.plot.position.right -= (width + margin);
			this.legend.position.left = this.plot.position.right + margin;
			this.legend.position.right = size.x - this.chart.margins.right;
			this.legend.position.top = this.plot.position.top;
			this.legend.position.bottom = this.plot.position.top + legend.length * (metrics.lineheight) + margin * 2;
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

	getParamValue(term, index, type = 'string') {
		const info = this.getParamInfo(term, index);
		if (info) {
			const cell = info.sheet.getDataProvider().getRC(info.range._x1, info.range._y1);
			return cell ? cell.getValue() : undefined;
		}
		if (term && term.params && term.params.length > index) {
			const value = term.params[index].value;
			if (value !== null && value !== undefined) {
				return type === 'string' ? term.params[index].value : Number(term.params[index].value);
			}
		}
		return undefined;
	}

	getParamFormat(term, index) {
		const info = this.getParamInfo(term, index);
		if (info) {
			const tf = info.sheet.getTextFormatAtRC(info.range._x1, info.range._y1);
			return {
				localCulture: tf
					.getLocalCulture()
					.getValue()
					.toString(),
				numberFormat: tf.getNumberFormat().getValue()
			};
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
			name: this.getParamValue(ds.getTerm(), 0, 'string'),
			x: this.getParamInfo(ds.getTerm(), 1),
			y: this.getParamInfo(ds.getTerm(), 2)
		};
		ret.xTime = ret.x ? this.isTimeAggregateRange(ret.x.sheet, ret.x.range) : false;
		ret.yTime = ret.y ? this.isTimeAggregateRange(ret.y.sheet, ret.y.range) : false;

		return ret;
	}

	getLegend() {
		const legend = [];
		this.series.forEach((series, index) => {
			const ref = this.getDataSourceInfo(series.formula);
			if (ref && ref.name !== undefined) {
				legend.push({
					name: ref.name,
					series
				});
			}
		});

		return legend;
	}

	getAxes(x, y) {
		const fill = (axis, size, direction) => {
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
				maxZoom: this.getParamValue(term, 4)
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
		};

		fill(this.xAxes[x], this.plot.position.width, 'x');
		fill(this.yAxes[y], this.plot.position.height, 'y');

		return {
			x: this.xAxes[x],
			y: this.yAxes[y]
		};
	}

	autoScale(axis, input, size, direction) {
		let stepCount;
		let m;
		let potMin;
		let potMax;
		let distLin;
		let minLabel;
		let maxLabel;
		let min = axis.minData;
		let max = axis.maxData;

		switch (axis.type) {
		case 'category':
			input.min = min;
			input.max = max;
			input.step = 1;
			break;
		case 'logarithmic' /* n„chstgr”áere und n„chstkleinere Dekade suchen */:
			if (min <= 0.0) {
				min = 0.1;
			}
			if (max <= 0.0) {
				max = 1;
			}
			if (min >= 1.0) {
				potMin = Numbers.digitsBefore(min) - 1;
				minLabel = 10.0 ** potMin;
			} else if (min <= DBL_MIN) {
				if (max > 0) {
					min = max / 1000;
				} else {
					min = 0.000001;
				}
				potMin = Math.floor(min);
				potMin = -Numbers.digitsBehind(min);
				if (potMin > Math.floor(Math.log10(Number.MAX_VALUE))) {
					minLabel = min;
				} else {
					minLabel = 10.0 ** potMin;
				}
			} else {
				potMin = -Numbers.digitsBehind(min);
				if (potMin > Math.floor(Math.log10(Number.MAX_VALUE))) {
					minLabel = min;
				} else {
					minLabel = 10.0 ** potMin;
				}
			}

			if (max >= 1.0) {
				potMax = Numbers.digitsBefore(max);
			} else {
				potMax = -Numbers.digitsBehind(max) + 1;
			}

			if (potMax > Math.floor(Math.log10(Number.MAX_VALUE))) {
				maxLabel = max;
			} else {
				maxLabel = 10 ** potMax;
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
				input.max += 1.0; // sicher ist sicher
			}
			break;
		case 'time':
			if (direction === 'x') {
				stepCount = Math.min(13, size / 1500);
			} else {
				// dTmp = (double)m_TickLabels.GetFont().GetSize() / 72 * 2540 * 2.0;
				stepCount = Math.min(13, size / 1300);
			}

			stepCount = Math.max(1, Math.floor(stepCount));

			if (input.min === undefined) {
				input.min = min;
			}
			if (input.max === undefined) {
				input.max = max;
			}

			if (input.min >= input.max) {
				if (input.min < 0.0) {
					input.max = input.min * 0.9 + 0.15;
				} else {
					input.max = input.max * 1.1 + 0.15;
				}
			}

			const diff = (input.max - input.min) / stepCount;

			if (input.step === undefined) {
				let timeStep;
				let step;
				let format = {
					localCulture: `time;en`,
					numberFormat: 'h:mm:ss',
				};
				if (diff > 90) {
					timeStep = 'year';
					step = Math.floor(Math.max(1, diff / 300));
					format = {
						localCulture: `date;en`,
						numberFormat: 'dd\\.MM\\.yy',
					};
				} else if (diff > 30) {				// from 300 to 450
					timeStep = 'quarter';
					step = 1;
					format = {
						localCulture: `date;en`,
						numberFormat: 'dd\\.MM\\.yy',
					};
				} else if (diff > 7) {				// from 70 to 300
					timeStep = 'month';
					step = 1;
					format = {
						localCulture: `date;en`,
						numberFormat: 'dd\\.MM\\.yy',
					};
				} else if (diff > 3) {				// from 10 to 70
					timeStep = 'week';
					step = 1;
					format = {
						localCulture: `date;en`,
						numberFormat: 'dd\\.MM\\.yy',
					};
				} else if (diff > 0.5) {					// from 1 to 10
					timeStep = 'day';
					if (diff < 1) {
						step = 1;
					} else if (diff < 2) {
						step = 2;
					} else {
						step = 5;
					}
					format = {
						localCulture: `date;en`,
						numberFormat: 'dd\\.MM\\.yy',
					};
				} else if (diff > 2700 / 86400) {
					timeStep = 'hour';
					if (diff < 3600 / 86400) {
						step = 1;
					} else if (diff < 7200 / 86400) {
						step = 2;
					} else if (diff < 21600 / 86400) {
						step = 6;
					} else {
						step = 12;
					}
				} else if (diff > 45 / 86400) {
					timeStep = 'minute';
					step = 1;
					if (diff < 60 / 86400) {
						step = 1;
					} else if (diff < 120 / 86400) {
						step = 2;
					} else if (diff < 300 / 86400) {
						step = 5;
					} else if (diff < 600 / 86400) {
						step = 10;
					} else {
						step = 30;
					}
				} else if (diff > 0.3 / 86000) {
					timeStep = 'second';
					if (diff < 1 / 86400) {
						step = 1;
					} else if (diff < 2 / 86400) {
						step = 2;
					} else if (diff < 5 / 86400) {
						step = 5;
					} else if (diff < 10 / 86400) {
						step = 10;
					} else {
						step = 30;
					}
				} else {
					timeStep = 'millisecond';
					if (diff < 0.05 / 86400) {
						step = 100;
					} else {
						step = 500;
					}
					format = {
						localCulture: `time;en`,
						numberFormat: 'h:mm:ss.000',
					};
				}
				input.step = step;
				input.timeStep = timeStep;
				input.format = format;
			}

			input.step = Math.max(input.step, epsilon * 10);

			// while (input.step * 1000 < input.max - input.min) {
			// 	input.step *= 10;
			// }
			break;
		case 'linear':
			/* Durch vergrößern dieser Zahl verfeinert     */
			/* sich das im Automatikmode generierte Raster */
			stepCount = 8; /* 11 => sehr fein      */

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
			if (input.min !== undefined) {
				min = input.min;
			}
			if (input.max !== undefined) {
				max = input.max;
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
				distLin /= 10 ** m;
				// 1, 2 oder 5 zuweisen
				if (distLin > 5) {
					distLin = 10; // von 5.0
				} else if (distLin > 2) {
					distLin = 5; // von 5.0
				} else if (distLin > 1) {
					distLin = 2;
				} else {
					distLin = 1;
				}
				// das ist jetzt der normierte Abstand
				distLin *= 10 ** m;
			} else {
				distLin = 1;
			}
			// MinWert der Beschriftung ermitteln
			if (input.min === undefined) {
				// if value range is small...
				minLabel = min / distLin;
				minLabel = Math.floor(minLabel);
				minLabel *= distLin;
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
				if (max > 0 && maxLabel <= max + 3) {
					maxLabel += distLin;
				}
			} else {
				maxLabel = input.max;
			}

			if (input.min === undefined) {
				input.min = minLabel;
			}
			if (input.max === undefined) {
				input.max = maxLabel;
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

			// if (nDist < 1) {
			// 	nDist = 1;
			// }
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
		value.x = undefined;
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
		} else if (ref.x) {
			const vertical = ref.x.range.getWidth() === 1;
			if (vertical) {
				if (index <= ref.x.range._y2 - ref.x.range._y1) {
					const cell = ref.x.sheet
						.getDataProvider()
						.getRC(ref.x.range._x1, ref.x.range._y1 + index);
					if (cell) {
						value.x = cell.getValue();
						if (!Numbers.isNumber(value.x)) {
							value.x = 0;
						}
					}
				}
			} else if (index <= ref.x.range._y2 - ref.x.range._y1) {
				const cell = ref.x.sheet
					.getDataProvider()
					.getRC(ref.x.range._x1 + index, ref.x.range._y1);
				if (cell) {
					value.x = cell.getValue();
					if (!Numbers.isNumber(value.x)) {
						value.x = 0;
					}
				}
			}
		} else {
			value.x = index;
		}

		if (ref.yTime) {
			const values = ref.yTime.getValues();
			if (values && values.length > index) {
				value.y = values[index].value;
				return true;
			}
		} else if (ref.y) {
			const vertical = ref.y.range.getWidth() === 1;
			if (vertical) {
				if (index <= ref.y.range._y2 - ref.y.range._y1) {
					const cell = ref.y.sheet
						.getDataProvider()
						.getRC(ref.y.range._x1, ref.y.range._y1 + index);
					if (cell) {
						value.y = cell.getValue();
						if (!Numbers.isNumber(value.y)) {
							value.y = 0;
						}
					}
					return true;
				}
			} else if (index <= ref.y.range._x2 - ref.y.range._x1) {
				const cell = ref.y.sheet
					.getDataProvider()
					.getRC(ref.y.range._x1 + index, ref.y.range._y1);
				if (cell) {
					value.y = cell.getValue();
					if (!Numbers.isNumber(value.y)) {
						value.y = 0;
					}
				}
				return true;
			}
		}

		return false;
	}

	scaleToAxis(info, value) {
		value = (value - info.min) / (info.max - info.min);

		return value;
	}

	scaleFromAxis(info, point) {
		point.x -= this.plot.position.left;

		return info.min + (point.x / (this.plot.position.right - this.plot.position.left)) * (info.max - info.min);
	}

	incrementScale(axis, value) {
		let result;

		switch (axis.type) {
		case 'time':
			switch (axis.scale.timeStep) {
			case 'year': {
				const date = MathUtils.excelDateToJSDate(value);
				date.setDate(1);
				date.setMonth(0);
				date.setFullYear(date.getFullYear() + axis.scale.step);
				result = Math.floor(MathUtils.JSDateToExcelDate(date));
				break;
			}
			case 'quarter': {
				const date = MathUtils.excelDateToJSDate(value);
				date.setDate(1);
				date.setMonth(date.getMonth() - (date.getMonth() % 3) + axis.scale.step * 3);
				result = Math.floor(MathUtils.JSDateToExcelDate(date));
				break;
			}
			case 'month': {
				const date = MathUtils.excelDateToJSDate(value);
				date.setDate(1);
				date.setMonth(date.getMonth() + axis.scale.step);
				result = Math.floor(MathUtils.JSDateToExcelDate(date));
				break;
			}
			case 'week': {
				const date = MathUtils.excelDateToJSDate(value);
				const day = date.getDay();
				if (day) {
					value += 7 - day;
				} else {
					value += 7 * axis.scale.step;
				}
				result = Math.floor(value);
				break;
			}
			case 'day':
				result = Math.floor(value) + axis.scale.step;
				break;
			case 'hour': {
				const date = MathUtils.excelDateToJSDate(value);
				date.setHours(date.getHours() + axis.scale.step);
				date.setMinutes(0);
				date.setSeconds(0);
				date.setMilliseconds(0);
				result = MathUtils.JSDateToExcelDate(date);
				break;
			}
			case 'minute': {
				const date = MathUtils.excelDateToJSDate(value);
				date.setMinutes(date.getMinutes() + axis.scale.step);
				date.setSeconds(0);
				date.setMilliseconds(0);
				result = MathUtils.JSDateToExcelDate(date);
				break;
			}
			case 'second': {
				const date = MathUtils.excelDateToJSDate(value);
				date.setSeconds(date.getSeconds() + axis.scale.step);
				date.setMilliseconds(0);
				result = MathUtils.JSDateToExcelDate(date);
				break;
			}
			case 'millisecond': {
				const date = MathUtils.excelDateToJSDate(value);
				const ms = date.getMilliseconds();
				if (ms % axis.scale.step) {
					date.setMilliseconds(ms + (axis.scale.step - (ms % axis.scale.step)));
				} else {
					date.setMilliseconds(date.getMilliseconds() + axis.scale.step);
				}
				result = MathUtils.JSDateToExcelDate(date);
				break;
			}
			default:
				result = value + 1;
				break;
			}
			break;
		default:
			result = MathUtils.roundTo(value + axis.scale.step, 12);
			break;
		}
		return result;
	}

	getDataFromSelection(selection) {
		switch (selection.element) {
		case 'datarow':
			return this.series[selection.index];
		case 'xAxis':
			return this.xAxes[selection.index];
		case 'yAxis':
			return this.yAxes[selection.index];
		case 'title':
			return this.title;
		case 'legend':
			return this.legend;
		case 'plot':
			return this.plot;
		default:
			break;
		}
		return undefined;
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

		if (this.legend.position.containsPoint(pt)) {
			return {
				element: 'legend',
				data: this.legend
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
						dataRect.set(
							plotRect.left + x * plotRect.width - 200,
							plotRect.bottom - y * plotRect.height - 200,
							plotRect.left + x * plotRect.width + 200,
							plotRect.bottom - y * plotRect.height + 200
						);
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
				index: 0,
				data: result[0]
			};
		}

		result = this.yAxes.filter((axis) => axis.position.containsPoint(pt));
		if (result.length) {
			return {
				element: 'yAxis',
				index: 0,
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
			// TODO different values for category axis
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
		let time = true;
		let formula;
		const cmp = new CompoundCommand();

		this.series = [];

		const cmdAxis = this.prepareCommand('axes');
		switch (type) {
		case 'column':
		case 'line':
			this.xAxes[0].type = 'category';
			break;
		case 'scatter':
			this.xAxes[0].type = 'linear';
			break;
		}
		// check for TIMEAGGREGATES
		if (width <= 2 || height <= 2) {
			const taRange = range.copy();
			if (width === 2) {
				taRange._x1 += 1;
			} else if (height === 2) {
				taRange._y1 += 1;
			}
			taRange.enumerateCells(true, (pos) => {
				const cell = data.get(pos);
				if (!this.isTimeAggregateCell(cell)) {
					time = false;
				}
			});
			if (time) {
				const cmd = this.prepareCommand('series');
				let index = 0;
				taRange.enumerateCells(true, (pos) => {
					const source = new CellRange(taRange.getSheet(), pos.x, pos.y);
					source.shiftToSheet();
					const ref = source.toString({ item: sheet, useName: true });
					if (width === 2) {
						const rangeName = source.copy();
						rangeName._x1 -= 1;
						rangeName._x2 -= 1;
						const refName = rangeName.toString({ item: sheet, useName: true });
						formula = new Expression(0, `DATAROW(${refName},${ref},${ref})`);
					} else if (height === 2) {
						const rangeName = source.copy();
						rangeName._y1 -= 1;
						rangeName._y2 -= 1;
						const refName = rangeName.toString({ item: sheet, useName: true });
						formula = new Expression(0, `DATAROW(${refName},${ref},${ref})`);
					} else {
						formula = new Expression(0, `DATAROW(,${ref},${ref})`);
					}
					this.series.push(new ChartSeries(type, formula));
					index += 1;
				});
				this.xAxes[0].type = 'time';
				this.finishCommand(cmd, 'series');
				cmp.add(cmd);
			}
		}

		if (!cmp.hasCommands()) {
			const vertical = range.getHeight() > range.getWidth();
			let startI = vertical ? range._x1 : range._y1;
			let endI = vertical ? range._x2 : range._y2;
			const startJ = vertical ? range._y1 : range._x1;
			const endJ = vertical ? range._y2 : range._x2;
			let step = 1;
			let column;
			let row;
			let seriesLabels = false;
			const tmpRange = new CellRange(range.getSheet(), 0, 0);
			const cmd = this.prepareCommand('series');

			let cell = range
				.getSheet()
				.getDataProvider()
				.getRC(range._x1, range._y1);
			let categoryLabels = cell === undefined || cell.getValue() === '' || cell.getValue() === undefined;

			if (categoryLabels) {
				startI += 1;
			}

			switch (type) {
			case 'bubble':
				step = 2;
				// startI += 1;
				break;
			case 'scatter':
			case 'scatterLine':
				if (!categoryLabels && ((vertical && width > 1) || (!vertical && height > 1))) {
					categoryLabels = true;
					startI += 1;
				}
				break;
			default:
				break;
			}
			endI = Math.max(startI, endI);

			let val;
			const start = vertical ? range._x1 + (categoryLabels ? 1 : 0) : range._y1 + (categoryLabels ? 1 : 0);
			const end = vertical ? range._x2 : range._y2;

			for (let i = start; i <= end; i += 1) {
				cell = vertical
					? range
						.getSheet()
						.getDataProvider()
						.getRC(i, range._y1, i)
					: range
						.getSheet()
						.getDataProvider()
						.getRC(range._x1, i);
				if (cell) {
					val = cell.getValue();
					if (typeof val === 'string' && val.length) {
						seriesLabels = true;
						break;
					}
				}
			}

			for (let i = startI; i <= endI; i += step) {
				formula = 'DATAROW(';
				column = vertical ? i : startJ;
				row = vertical ? startJ : i;

				if (seriesLabels) {
					tmpRange.set(column, row, column, row);
					tmpRange.shiftToSheet();
					const refName = tmpRange.toString({ item: sheet, useName: true });
					formula += `${refName},`;
				} else {
					formula += ',';
				}

				if (categoryLabels) {
					if (vertical) {
						tmpRange.set(range._x1, range._y1 + (seriesLabels ? 1 : 0), range._x1, range._y2);
					} else {
						tmpRange.set(range._x1 + (seriesLabels ? 1 : 0), range._y1, range._x2, range._y1);
					}
					tmpRange.shiftToSheet();
					const refName = tmpRange.toString({ item: sheet, useName: true });
					formula += `${refName},`;
				} else {
					formula += ',';
				}

				if (type === 'bubble') {
					// if (vertical) {
					// 	tmpRange.set(column + 1, row + (seriesLabels ? 1 : 0), column + 1, row + endJ - startJ);
					// } else {
					// 	tmpRange.set(column + (seriesLabels ? 1 : 0), row + 1, column + endJ - startJ, row + 1);
					// }
					// tmpRange.shiftToSheet();
					// currentSeries.dataRadius = `=${tmpRange.toString({ item: chartSheet, useName: true })}`;
				}

				if (vertical) {
					tmpRange.set(column, row + (seriesLabels ? 1 : 0), column, row + endJ - startJ);
				} else {
					tmpRange.set(column + (seriesLabels ? 1 : 0), row, column + endJ - startJ, row);
				}

				tmpRange.shiftToSheet();
				const refName = tmpRange.toString({ item: sheet, useName: true });
				formula += `${refName})`;

				this.series.push(new ChartSeries(type, new Expression(0, formula)));
			}
			this.finishCommand(cmd, 'series');
			cmp.add(cmd);
		}

		this.evaluate();

		if (cmp.hasCommands()) {
			this.finishCommand(cmdAxis, 'axes');
			cmp.add(cmdAxis);
			viewer.getInteractionHandler().execute(cmp);
		}
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
			const copySerie = new ChartSeries(serie.type, serie.formula.copy());
			copy.series.push(copySerie);
		});

		return copy;
	}

	saveTitle(writer) {
		writer.writeStartElement('title');
		this.title.formula.save('formula', writer);
		this.title.format.save('format', writer);
		writer.writeEndElement();
	}

	saveLegend(writer) {
		writer.writeStartElement('legend');
		this.legend.formula.save('formula', writer);
		this.legend.format.save('format', writer);
		writer.writeEndElement();
	}

	saveSeries(writer) {
		writer.writeStartArray('series');

		this.series.forEach((serie, index) => {
			serie.save(writer);
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
				axis.format.save('format', writer);

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
		this.saveLegend(writer);

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
						case 'format':
							this.title.format = new ChartFormat();
							this.title.format.read(reader, subChild);
							break;
						}
					});
					break;
				}
			}
		});
	}

	readLegend(reader, object) {
		reader.iterateObjects(object, (name, child) => {
			switch (name) {
			case 'legend': {
				reader.iterateObjects(child, (subName, subChild) => {
					switch (subName) {
					case 'formula':
						this.legend.formula = new Expression(0);
						this.legend.formula.read(reader, subChild);
						break;
					case 'format':
						this.legend.format = new ChartFormat();
						this.legend.format.read(reader, subChild);
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
					const serie = new ChartSeries();
					serie.read(reader, child);
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
					const axis = {
						format: new ChartFormat()
					};
					axis.size =
						reader.getAttribute(child, 'size') === undefined
							? 500
							: Number(reader.getAttribute(child, 'size'));
					axis.align =
						reader.getAttribute(child, 'align') === undefined
							? 'left'
							: reader.getAttribute(child, 'align');
					axis.type =
						reader.getAttribute(child, 'type') === undefined
							? 'linear'
							: reader.getAttribute(child, 'type');
					axis.position = ChartRect.fromString(reader.getAttribute(child, 'position'));

					reader.iterateObjects(child, (subName, subChild) => {
						switch (subName) {
						case 'formula':
							axis.formula = new Expression(0);
							axis.formula.read(reader, subChild);
							break;
						case 'format':
							axis.format = new ChartFormat();
							axis.format.read(reader, subChild);
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
			this.readLegend(reader, plot);
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
		case 'legend':
			this.saveLegend(writer);
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

	getTemplate(name) {
		return templates[name];
	}

	static get templates() {
		return templates;
	}
};
