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

/* eslint-disable no-empty */
const JSG = require('@cedalo/jsg-core');
const { Term, NullTerm } = require('@cedalo/parser');
const { NumberFormatter } = require('@cedalo/number-format');

const {
	Node,
	Strings,
	GraphUtils,
	MathUtils,
	SheetReference,
	CellRange,
	ItemAttributes,
	Expression,
	TextFormatAttributes,
	Numbers,
	JSONWriter,
	JSONReader,
	ZoomChartCommand,
	MarkCellValuesCommand,
	SetPlotDataCommand,
	CompoundCommand,
	Chart,
	ChartFormat,
	ChartAxis,
	ChartRect,
	ChartSeries,
	ChartMap,
	ChartPoint,
	ChartTitle,
	Selection
} = require('@cedalo/jsg-core');

//   console.log(require('@cedalo/jsg-core'));

const epsilon = 0.000000001;
const isValuesCell = (cell) => cell && cell._info && cell.values != null;
const getTimeCell = (item, formula) => {
	const cell = item.getDataSourceInfo(formula);
	return cell && cell.time;
};
const getCellReference = (item, formula) => {
	// which index is it? 1 or 2 or should we search?
	const { range, sheet } = item.getParamInfo(formula.getTerm(), 2);
	if (range) range.shiftToSheet();
	return range && sheet ? `${sheet.getName()}!${range.toString()}` : undefined;
};

const templates = {
	basic: {
		font: {
			name: 'Verdana',
			size: 7,
			style: 0,
			color: '#000000'
		},
		chart: {
			format: new ChartFormat('#000000', 0, -1, 1, '#FFFFFF')
		},
		title: {
			format: new ChartFormat('#000000', 0, -1, 0, '#FFFFFF', 12)
		},
		serieslabel: {
			format: new ChartFormat('#000000', 0, -1, 0, '#FFFFFF', 6)
		},
		plot: {
			format: new ChartFormat('#CCCCCC', 0, -1, 0, '#FFFFFF')
		},
		legend: {
			format: new ChartFormat('#CCCCCC', 1, -1, 1, '#FFFFFF')
		},
		axis: {
			format: new ChartFormat('#CCCCCC', 1, -1)
		},
		axisgrid: {
			format: new ChartFormat('#CCCCCC', 1, -1)
		},
		axisTitle: {
			format: new ChartFormat('#000000', 0, -1, 0, '#FFFFFF', 9)
		},
		hilolines: {
			format: new ChartFormat('#000000', 1, -1)
		},
		upbars: {
			format: new ChartFormat('#000000', 1, -1, 1, '#FFFFFF')
		},
		downbars: {
			format: new ChartFormat('#000000', 1, -1, 1, '#000000')
		},
		series: {
			format: new ChartFormat(),
			linewidth: 50,
			linestyle: 1,
			fillstyle: 1,
			getFillForIndex(index) {
				return this.fill[index % 11];
			},
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
			getLineForIndex(index) {
				return this.line[index % 11];
			},
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
	},
	dark: {
		font: {
			name: 'Verdana',
			size: 7,
			style: 0,
			color: '#FFFFFF'
		},
		chart: {
			format: new ChartFormat('#FFFFFF', 0, -1, 0, '#000000')
		},
		title: {
			format: new ChartFormat('#FFFFFF', 0, -1, 0, '#000000', 12)
		},
		serieslabel: {
			format: new ChartFormat('#FFFFFF', 0, -1, 0, '#000000', 6)
		},
		plot: {
			format: new ChartFormat('#FFFFFF', 0, -1, 0, '#000000')
		},
		legend: {
			format: new ChartFormat('#FFFFFF', 1, -1, 0, '#000000')
		},
		axis: {
			format: new ChartFormat('#FFFFFF', 1, -1)
		},
		axisgrid: {
			format: new ChartFormat('#FFFFFF', 1, -1)
		},
		axisTitle: {
			format: new ChartFormat('#FFFFFF', 0, 0, 1, '#000000', 9)
		},
		hilolines: {
			format: new ChartFormat('#FFFFFF', 1, -1)
		},
		upbars: {
			format: new ChartFormat('#FFFFFF', 1, -1, 1, '#FFFFFF')
		},
		downbars: {
			format: new ChartFormat('#FFFFFF', 1, -1, 1, '#000000')
		},
		series: {
			format: new ChartFormat(),
			linewidth: 50,
			linestyle: 1,
			fillstyle: 1,
			getFillForIndex(index) {
				return this.fill[index % 11];
			},
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
			getLineForIndex(index) {
				return this.line[index % 11];
			},
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

module.exports.SheetPlotNode = class SheetPlotNode extends Node {
	constructor() {
		super();

		this.getFormat().setLineColor('#AAAAAA');
		this.getTextFormat().setFontSize(8);
		this.getItemAttributes().setContainer(false);
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);

		this.series = [];
		this.actions = [];
		this.chart = new Chart();
		this.chartZoom = false;
		this.xAxes = [new ChartAxis('XAxis1', 'linear', 'bottom', 500)];
		this.yAxes = [new ChartAxis('YAxis1', 'linear', 'left', 1000)];
		this.plot = {
			position: new ChartRect(),
			format: new ChartFormat()
		};
		this.legend = {
			formula: new Expression('Legend', ''),
			visible: true,
			position: new ChartRect(),
			format: new ChartFormat(),
			align: 'middleright'
		};
		this.title = new ChartTitle(new Expression('Title', ''));
		this.series = [new ChartSeries('line', new Expression(0, 'SERIES(B1,A2:A10,B2:B10)'))];
		this.cellValuesMarker = -1;
	}

	getExpressionValue(expr) {
		if (expr === undefined) {
			return '';
		}

		if (expr._termValue !== undefined) {
			return expr.getValue();
		}
		const term = expr.getTerm();
		if (term) {
			const { operand } = term;
			if (operand instanceof SheetReference && operand._range) {
				const range = operand._range.copy();
				range.shiftFromSheet();
				const cell = range._worksheet.getDataProvider().getRC(range._x1, range._y1);
				return cell ? cell.getValue() : '';
			}
		}

		return expr.getValue();
	}

	setFont(graphics, format, id, vertical, horizontal) {
		const tmp = this.getTemplate();
		const tmpId = tmp[id];
		const fontColor = format.fontColor || tmpId.format.fontColor || this.getTemplate().font.color;
		const fontName = format.fontName || tmpId.format.fontName || this.getTemplate().font.name;
		const fontSize = format.fontSize || tmpId.format.fontSize || tmp.font.size;
		const fontStyle = format.fontStyle === undefined ? tmpId.format.fontStyle : format.fontStyle;

		graphics.setTextBaseline(vertical);
		graphics.setFillColor(fontColor);
		graphics.setTextAlignment(horizontal);
		graphics.setFontName(fontName);
		graphics.setFontSize(fontSize);
		graphics.setFontStyle(fontStyle === undefined ? 0 : fontStyle);
		graphics.setFont();
	}

	formatNumber(value, format) {
		// somehow the scale value sometimes does not show correct values
		value = MathUtils.roundTo(value, 12);
		if (format && format.numberFormat && format.numberFormat !== 'General' && format.localCulture) {
			let formattingResult = {
				value,
				formattedValue: value,
				color: undefined,
				type: 'general'
			};
			const type = format.localCulture.split(';');
			try {
				formattingResult = NumberFormatter.formatNumber(format.numberFormat, formattingResult.value, type[0]);
			} catch (e) {
				formattingResult.formattedValue = '#####';
			}

			return formattingResult.formattedValue;
		}
		return String(value);
	}

	measureText(graphics, cs, format, id, text, unrotated = false) {
		const name = format.fontName || this.getTemplate()[id].format.fontName || this.getTemplate().font.name;
		const size = format.fontSize || this.getTemplate()[id].format.fontSize || this.getTemplate().font.size;

		const result = {
			width: cs.deviceToLogX(graphics.measureText(text).width, true),
			height: GraphUtils.getFontMetricsEx(name, size).lineheight
		};

		if (!unrotated) {
			const labelAngle = format.fontRotation === undefined ? 0 : MathUtils.toRadians(-format.fontRotation);
			if (labelAngle) {
				const width = result.width;
				result.width =
					Math.abs(Math.sin(labelAngle) * result.height) + Math.abs(Math.cos(labelAngle) * result.width);
				result.height = Math.abs(Math.sin(labelAngle) * width) + Math.abs(Math.cos(labelAngle) * result.height);
			}
		}

		return result;
	}

	measureTitle(graphics, title, id, text) {
		const cs = graphics.getCoordinateSystem();
		this.setFont(graphics, title.format, id, 'middle', TextFormatAttributes.TextAlignment.CENTER);
		const textSize = this.measureText(graphics, cs, title.format, id, text);
		textSize.width += 300;
		textSize.height += 300;

		return textSize;
	}

	measureAxis(graphics, axis) {
		const result = {
			width: 200,
			height: 200
		};

		if (!axis.position || !axis.scale || !axis.visible) {
			return result;
		}

		// const lastInfo = JSON.stringify({
		// 	format: axis.format.getSizeChangeInfo(),
		// 	scale: axis.scale,
		// });

		this.setFont(graphics, axis.format, 'axis', 'middle', TextFormatAttributes.TextAlignment.CENTER);

		const cs = graphics.getCoordinateSystem();
		let pos;
		let text;
		const refLabel = this.getDataSourceInfoAxis(axis);
		let current = this.getAxisStart(refLabel, axis);
		const final = this.getAxisEnd(axis);

		while (current.value <= final) {
			if (axis.type === 'category' && axis.betweenTicks && current.value >= axis.scale.max) {
				break;
			}

			pos = this.scaleToAxis(axis, current.value, undefined, false);
			if (axis.type === 'category' && refLabel) {
				const index = Math.floor(current.value);
				if (axis.uniqueLabels && axis.uniqueLabels.length > index) {
					text = axis.uniqueLabels[index];
				} else {
					text = this.getLabel(refLabel, axis, index);
				}
				text = this.getLabel(refLabel, axis, Math.floor(current.value));
			} else if (axis.format && axis.format.numberFormat) {
				text = this.formatNumber(
					current.value,
					axis.format && axis.format.numberFormat ? axis.format : axis.scale.format
				);
			} else {
				text = this.formatNumber(
					current.value,
					axis.scale.format
						? axis.scale.format
						: { numberFormat: axis.format.linkedNumberFormat, localCulture: axis.format.linkedLocalCulture }
				);
			}

			const size = this.measureText(graphics, cs, axis.format, 'axis', text);
			result.width = Math.max(result.width, size.width);
			result.height = Math.max(result.height, size.height);

			if (axis.invert) {
				result.firstPos = pos;
				result.firstWidth = size.width + 200;
				result.firstHeight = size.height + 200;
				if (result.lastWidth === undefined && current.value >= axis.scale.min) {
					result.lastPos = pos;
					result.lastWidth = result.width + 200;
					result.lastHeight = result.height + 200;
				}
			} else {
				result.lastPos = pos;
				result.lastWidth = size.width + 200;
				result.lastHeight = size.height + 200;
				if (result.firstWidth === undefined && current.value >= axis.scale.min) {
					result.firstPos = pos;
					result.firstWidth = result.width + 200;
					result.firstHeight = result.height + 200;
				}
			}

			if (axis.type === 'category') {
				current.value += 1;
			} else {
				current = this.incrementScale(refLabel, axis, current);
			}
		}

		result.width = Math.max(result.width + axis.labelDistance, 300);
		result.height = Math.max(result.height + axis.labelDistance, 300);

		if (result.firstPos === undefined) {
			result.firstWidth = 0;
			result.firstHeight = 0;
			result.firstPos = 0;
		}

		if (result.lastPos === undefined) {
			result.lastWidth = 0;
			result.lastHeight = 0;
			result.lastPos = 0;
		}

		return result;
	}

	measurePieLabels(graphics, serie, legendData) {
		const textSize = { width: 0, height: 0 };

		if (serie.dataLabel.visible && serie.dataLabel.position === 'outer') {
			let index = 0;
			const value = {
				formatY: {},
			};
			const ref = this.getDataSourceInfo(serie.formula);
			const axes = this.getAxes(serie);

			if (!ref || !axes) {
				return undefined;
			}

			this.setFont(
				graphics,
				serie.dataLabel.format,
				'serieslabel',
				'middle',
				TextFormatAttributes.TextAlignment.CENTER
			);
			const params = {
				graphics,
				serie
			};

			while (this.getValue(ref, index, value)) {
				if (value.x !== undefined && value.y !== undefined) {
					if (this.hasDataPointLabel(serie, index)) {
						const text = this.getDataLabel(value, axes.x, ref, serie, legendData);
						if (text) {
							const size = this.measureLabel(text, params);
							textSize.width = Math.max(size.width, textSize.width);
							textSize.height = Math.max(size.height, textSize.height);
						}
					}
				}
				index += 1;
			}
		}

		return textSize;
	}

	layout() {
		const size = this.getSize().toPoint();

		if (!JSG.graphics) {
			super.layout();
			return;
		}

		const cs = JSG.graphics.getCoordinateSystem();

		this.setMinMax();
		this.setScales();

		this.plot.position.left = this.chart.margins.left;
		this.plot.position.top = this.chart.margins.top;
		this.plot.position.bottom = size.y - this.chart.margins.bottom;
		this.plot.position.right = size.x - this.chart.margins.right;

		let title = String(this.getExpressionValue(this.title.formula));
		if (this.title.visible) {
			this.plot.position.top += this.title.size;
			this.title.position.top = this.chart.margins.top;
			const textSize = this.measureTitle(JSG.graphics, this.title, 'title', title);
			switch (this.title.align) {
			case 'left':
				this.title.position.left = this.chart.margins.left;
				this.title.position.right = this.chart.margins.left + textSize.width;
				break;
			case 'right':
				this.title.position.left = size.x - this.chart.margins.right - textSize.width;
				this.title.position.right = size.x - this.chart.margins.right;
				break;
			case 'center':
			default:
				this.title.position.left = size.x / 2 - textSize.width / 2;
				this.title.position.right = size.x / 2 + textSize.width / 2;
				break;
			}
			this.title.size = textSize.height;
			this.title.position.bottom = this.chart.margins.top + this.title.size;
			this.plot.position.top = this.title.position.bottom + 200;
		} else {
			this.plot.position.top += 200;
			this.title.position.reset();
		}

		this.actions = [];

		this.xAxes.forEach((axis) => {
			if (axis.scale.maxZoom !== undefined) {
				this.plot.position.top = Math.max(this.plot.position.top, 800);
				this.actions.push({
					position: new ChartRect(size.x - 3200, 0, size.x - 500, 800),
					action: this.resetZoom,
					title: JSG.getLocalizedString('Reset Zoom')
				});
			}
		});

		this.actions.push({
			position: new ChartRect(size.x - 500, 0, size.x, 800),
			action: this.showActionMenu,
			title: 'sysicon'
		});

		if (this.chart.mapZoom) {
			this.actions.push({
				position: new ChartRect(300, 300, 800, 800),
				action: this.mapZoomPlus,
				title: 'mapzoomplus'
			});
			this.actions.push({
				position: new ChartRect(300, 1000, 800, 1500),
				action: this.mapZoomMinus,
				title: 'mapzoomminus'
			});
		}

		const legend = this.getLegend();
		if (legend.length && this.legend.visible) {
			const margin = 200;
			this.setFont(
				JSG.graphics,
				this.legend.format,
				'legend',
				'middle',
				TextFormatAttributes.TextAlignment.CENTER
			);
			let legendWidth = 0;
			let textSize = {};
			let legendHeight = 0;
			let maxTextWidth = 0;
			let extra = margin * 6;
			const map = this.isMap();

			legend.forEach((entry) => {
				textSize = this.measureText(JSG.graphics, cs, this.legend.format, 'legend', String(entry.name));
				maxTextWidth = Math.max(textSize.width, maxTextWidth);
				if (this.legend.align === 'top' || this.legend.align === 'bottom') {
					legendWidth += textSize.width + extra;
				}
				if (entry.series) {
					if (entry.series.type === 'bubble') {
						extra = margin * 4;
					}
					if (entry.series.type === 'map') {
						extra = margin * 4.5;
					}
				}
			});

			maxTextWidth += extra;
			this.legend.columns = undefined;
			if (this.legend.align === 'top' || this.legend.align === 'bottom') {
				if (map) {
					legendWidth = this.plot.position.width / 3;
					legendHeight =  textSize.height + 300 + margin * 2;
				} else if (legendWidth > this.plot.position.width) {
					const columns = Math.floor(this.plot.position.width / maxTextWidth);
					const rows = Math.ceil(legend.length / columns);
					legendWidth = columns * (maxTextWidth);
					legendHeight = (rows - 1) * textSize.height * 1.3 + textSize.height + margin * 2;
					this.legend.columns = columns;
					this.legend.maxTextWidth = maxTextWidth;
				} else {
					legendHeight =  textSize.height + margin * 2;
				}
			} else if (map) {
				legendHeight = Math.max(1500, this.plot.position.height / 3);
				legendWidth = maxTextWidth - margin * 2;
			} else {
				legendHeight = (legend.length - 1) * textSize.height * 1.3 + textSize.height + margin * 2;
				legendWidth = maxTextWidth;
			}

			switch (this.legend.align) {
			case 'left':
			case 'middleleft':
				this.legend.position.left = this.plot.position.left;
				this.legend.position.right = this.plot.position.left + legendWidth;
				this.legend.position.top = this.plot.position.top;
				this.legend.position.bottom = this.plot.position.top + legendHeight;
				this.plot.position.left += legendWidth + margin;
				break;
			case 'right':
			case 'middleright':
				this.plot.position.right -= legendWidth + margin;
				this.legend.position.left = this.plot.position.right + margin;
				this.legend.position.right = size.x - this.chart.margins.right;
				this.legend.position.top = this.plot.position.top;
				this.legend.position.bottom = this.plot.position.top + legendHeight;
				break;
			case 'top':
				this.legend.position.left = (size.x - legendWidth) / 2;
				this.legend.position.right = (size.x + legendWidth) / 2;
				this.legend.position.top = this.plot.position.top;
				this.legend.position.bottom = this.plot.position.top + legendHeight;
				this.plot.position.top = this.legend.position.bottom + margin;
				break;
			case 'bottom':
				this.legend.position.left = (size.x - legendWidth) / 2;
				this.legend.position.right = (size.x + legendWidth) / 2;
				this.legend.position.top = this.plot.position.bottom - legendHeight;
				this.legend.position.bottom = this.plot.position.bottom;
				this.plot.position.bottom = this.legend.position.top - margin;
				break;
			default:
				break;
			}
		} else {
			this.legend.position.reset();
		}

		// reduce plot by axis title size
		this.xAxes.forEach((axis) => {
			if (axis.title.visible) {
				title = String(this.getExpressionValue(axis.title.formula));
				axis.title.size = this.measureTitle(JSG.graphics, axis.title, 'axisTitle', title);
				switch (axis.align) {
				case 'top':
					this.plot.position.top += axis.title.size.height;
					break;
				case 'bottom':
					this.plot.position.bottom -= axis.title.size.height;
					break;
				case 'left':
					this.plot.position.left += axis.title.size.height;
					break;
				case 'right':
					this.plot.position.right -= axis.title.size.height;
					break;
				default:
					break;
				}
			}
		});

		// reduce plot by axis size
		this.xAxes.forEach((axis, index) => {
			switch (axis.align) {
			case 'radialoutside':
				break;
			case 'left':
				axis.size = this.measureAxis(JSG.graphics, axis);
				this.plot.position.left += axis.size.width;
				if (index) {
					this.plot.position.left += 200;
				}
				break;
			case 'right':
				axis.size = this.measureAxis(JSG.graphics, axis);
				this.plot.position.right -= axis.size.width;
				if (index) {
					this.plot.position.right -= 200;
				}
				break;
			case 'top':
				axis.size = this.measureAxis(JSG.graphics, axis);
				this.plot.position.top += axis.size.height;
				if (index) {
					this.plot.position.top += 200;
				}
				break;
			case 'bottom':
				axis.size = this.measureAxis(JSG.graphics, axis);
				this.plot.position.bottom -= axis.size.height;
				if (index) {
					this.plot.position.bottom -= 200;
				}
				break;
			default:
				break;
			}
		});

		this.yAxes.forEach((axis) => {
			if (axis.title.visible) {
				title = String(this.getExpressionValue(axis.title.formula));
				axis.title.size = this.measureTitle(JSG.graphics, axis.title, 'axisTitle', title);
				switch (axis.align) {
				case 'left':
					this.plot.position.left += axis.title.size.height;
					break;
				case 'right':
					this.plot.position.right -= axis.title.size.height;
					break;
				case 'top':
					this.plot.position.top += axis.title.size.height;
					break;
				case 'bottom':
					this.plot.position.bottom -= axis.title.size.height;
					break;
				default:
					break;
				}
			}
		});

		this.yAxes.forEach((axis, index) => {
			switch (axis.align) {
			case 'radialoutside':
				axis.size = this.measureAxis(JSG.graphics, axis);
				const thresholds = this.hasLegendRange() ? legend : undefined;
				if (
					thresholds &&
					thresholds.length &&
					axis.valueRangesVisible &&
					this.chart.gaugePointer === false
				) {
					axis.size.height += 400;
					axis.size.width += 400;
				}
				this.plot.position.top += axis.size.height;
				this.plot.position.bottom -= axis.size.height;
				this.plot.position.left += axis.size.width;
				this.plot.position.right -= axis.size.width;
				break;
			case 'left':
				axis.size = this.measureAxis(JSG.graphics, axis);
				this.plot.position.left += axis.size.width;
				if (index) {
					this.plot.position.left += 200;
				}
				break;
			case 'right':
				axis.size = this.measureAxis(JSG.graphics, axis);
				this.plot.position.right -= axis.size.width;
				if (index) {
					this.plot.position.right -= 200;
				}
				break;
			case 'top':
				axis.size = this.measureAxis(JSG.graphics, axis);
				this.plot.position.top += axis.size.height;
				if (index) {
					this.plot.position.top += 200;
				}
				break;
			case 'bottom':
				axis.size = this.measureAxis(JSG.graphics, axis);
				this.plot.position.bottom -= axis.size.height;
				if (index) {
					this.plot.position.bottom -= 200;
				}
				break;
			default:
				break;
			}
		});

		// ensure for axis first and last label space
		this.xAxes.forEach((axis) => {
			if (axis.visible) {
				const labelAngle =
					axis.format.fontRotation === undefined ? 0 : JSG.MathUtils.toRadians(-axis.format.fontRotation);
				switch (axis.align) {
				case 'left': {
					let plot = this.plot.position.bottom - axis.size.lastPos * this.plot.position.height;
					if (Math.abs(labelAngle) === Math.PI_2) {
						this.plot.position.top = Math.max(
							this.plot.position.top,
							axis.size.lastHeight / 2 - (plot - this.plot.position.top) + 150
						);
					} else if (labelAngle < 0) {
						this.plot.position.top = Math.max(
							this.plot.position.top,
							axis.size.lastHeight - (plot - this.plot.position.top) + 150
						);
					}
					plot = this.plot.position.bottom - axis.size.firstPos * this.plot.position.height;
					if (Math.abs(labelAngle) === Math.PI_2) {
						this.plot.position.bottom = Math.min(
							this.plot.position.bottom,
							size.y - (plot + axis.size.lastHeight / 2 - this.plot.position.bottom)
						);
					} else if (labelAngle > 0) {
						this.plot.position.bottom = Math.min(
							this.plot.position.bottom,
							size.y - (plot + axis.size.lastHeight - this.plot.position.bottom)
						);
					}
					break;
				}
				case 'right': {
					let plot = this.plot.position.bottom - axis.size.lastPos * this.plot.position.height;
					if (Math.abs(labelAngle) === Math.PI_2) {
						this.plot.position.top = Math.max(
							this.plot.position.top,
							axis.size.lastHeight / 2 - (plot - this.plot.position.top) + 150
						);
					} else if (labelAngle > 0) {
						this.plot.position.top = Math.max(
							this.plot.position.top,
							axis.size.lastHeight - (plot - this.plot.position.top) + 150
						);
					}
					plot = this.plot.position.bottom - axis.size.firstPos * this.plot.position.height;
					if (Math.abs(labelAngle) === Math.PI_2) {
						this.plot.position.bottom = Math.min(
							this.plot.position.bottom,
							size.y - (plot + axis.size.lastHeight / 2 - this.plot.position.bottom)
						);
					} else if (labelAngle < 0) {
						this.plot.position.bottom = Math.min(
							this.plot.position.bottom,
							size.y - (plot + axis.size.lastHeight - this.plot.position.bottom)
						);
					}
					break;
				}
				case 'top': {
					let plot = axis.size.firstPos * this.plot.position.width;
					if (labelAngle === 0) {
						this.plot.position.left = Math.max(
							this.plot.position.left,
							axis.size.firstWidth / 2 - plot
						);
					} else if (labelAngle < 0) {
						this.plot.position.left = Math.max(
							this.plot.position.left,
							axis.size.firstWidth - plot + 150
						);
					}
					plot = this.plot.position.left + axis.size.lastPos * this.plot.position.width;
					if (labelAngle === 0) {
						this.plot.position.right = Math.min(
							this.plot.position.right,
							size.x - (plot + axis.size.lastWidth / 2 - this.plot.position.right)
						);
					} else if (labelAngle > 0) {
						this.plot.position.right = Math.min(
							this.plot.position.right,
							size.x - (plot + axis.size.lastWidth - this.plot.position.right) - 150
						);
					}
					break;
				}
				case 'bottom': {
					let plot = axis.size.firstPos * this.plot.position.width;
					if (labelAngle === 0) {
						this.plot.position.left = Math.max(
							this.plot.position.left,
							axis.size.firstWidth / 2 - plot
						);
					} else if (labelAngle > 0) {
						this.plot.position.left = Math.max(
							this.plot.position.left,
							axis.size.firstWidth - plot + 150
						);
					}
					plot = this.plot.position.left + axis.size.lastPos * this.plot.position.width;
					if (labelAngle === 0) {
						this.plot.position.right = Math.min(
							this.plot.position.right,
							size.x - (plot + axis.size.lastWidth / 2 - this.plot.position.right)
						);
					} else if (labelAngle < 0) {
						this.plot.position.right = Math.min(
							this.plot.position.right,
							size.x - (plot + axis.size.lastWidth - this.plot.position.right) - 150
						);
					}
					break;
				}
				default:
					break;
				}
			}
		});

		this.yAxes.forEach((axis) => {
			const labelAngle =
				axis.format.fontRotation === undefined ? 0 : JSG.MathUtils.toRadians(-axis.format.fontRotation);
			if (axis.visible) {
				switch (axis.align) {
				case 'top': {
					let plot = axis.size.firstPos * this.plot.position.width;
					if (labelAngle === 0) {
						this.plot.position.left = Math.max(
							this.plot.position.left,
							axis.size.firstWidth / 2 - plot
						);
					} else if (labelAngle < 0) {
						this.plot.position.left = Math.max(
							this.plot.position.left,
							axis.size.firstWidth - plot + 150
						);
					}
					plot = this.plot.position.left + axis.size.lastPos * this.plot.position.width;
					if (labelAngle === 0) {
						this.plot.position.right = Math.min(
							this.plot.position.right,
							size.x - (plot + axis.size.lastWidth / 2 - this.plot.position.right)
						);
					} else if (labelAngle > 0) {
						this.plot.position.right = Math.min(
							this.plot.position.right,
							size.x - (plot + axis.size.lastWidth - this.plot.position.right) - 150
						);
					}
					break;
				}
				case 'bottom': {
					let plot = axis.size.firstPos * this.plot.position.width;
					if (labelAngle === 0) {
						this.plot.position.left = Math.max(
							this.plot.position.left,
							axis.size.firstWidth / 2 - plot
						);
					} else if (labelAngle > 0) {
						this.plot.position.left = Math.max(
							this.plot.position.left,
							axis.size.firstWidth - plot + 150
						);
					}
					plot = this.plot.position.left + axis.size.lastPos * this.plot.position.width;
					if (labelAngle === 0) {
						this.plot.position.right = Math.min(
							this.plot.position.right,
							size.x - (plot + axis.size.lastWidth / 2 - this.plot.position.right)
						);
					} else if (labelAngle < 0) {
						this.plot.position.right = Math.min(
							this.plot.position.right,
							size.x - (plot + axis.size.lastWidth - this.plot.position.right) - 150
						);
					}
					break;
				}
				case 'left':
				case 'right':
					break;
				default:
					break;
				}
			}
		});

		let { left, top, right, bottom } = this.plot.position;

		this.xAxes.forEach((axis) => {
			if (axis.position) {
				Object.assign(axis.position, this.plot.position);
				switch (axis.align) {
				case 'left':
					axis.position.left = left - axis.size.width;
					axis.position.right = left;
					left -= axis.size.width;
					if (axis.title.visible) {
						axis.title.position.left = axis.position.left - axis.title.size.height;
						axis.title.position.right = axis.position.left;
						axis.title.position.top =
							axis.position.top + axis.position.height / 2 - axis.title.size.width / 2;
						axis.title.position.bottom =
							axis.position.top + axis.position.height / 2 + axis.title.size.width / 2;
						left -= axis.title.size.height;
					} else {
						axis.title.position.reset();
					}
					left -= 200;
					break;
				case 'right':
					axis.position.left = right;
					axis.position.right = right + axis.size.width;
					right += axis.size.width;
					if (axis.title.visible) {
						axis.title.position.left = axis.position.right;
						axis.title.position.right = axis.position.right + axis.title.size.height;
						axis.title.position.top =
							axis.position.top + axis.position.height / 2 - axis.title.size.width / 2;
						axis.title.position.bottom =
							axis.position.top + axis.position.height / 2 + axis.title.size.width / 2;
						right += axis.title.size.height;
					} else {
						axis.title.position.reset();
					}
					right += 200;
					break;
				case 'top':
					axis.position.top = top - axis.size.height;
					axis.position.bottom = top;
					top -= axis.size.height;
					if (axis.title.visible) {
						axis.title.position.top = axis.position.top - axis.title.size.height;
						axis.title.position.bottom = axis.position.top;
						axis.title.position.left =
							axis.position.left + axis.position.width / 2 - axis.title.size.width / 2;
						axis.title.position.right =
							axis.position.left + axis.position.width / 2 + axis.title.size.width / 2;
						top -= axis.title.size.height;
					} else {
						axis.title.position.reset();
					}
					top -= 200;
					break;
				case 'bottom':
					axis.position.top = bottom;
					axis.position.bottom = bottom + axis.size.height;
					bottom += axis.size.height;
					if (axis.title.visible) {
						axis.title.position.top = axis.position.bottom;
						axis.title.position.bottom = axis.position.bottom + axis.title.size.height;
						axis.title.position.left =
							axis.position.left + axis.position.width / 2 - axis.title.size.width / 2;
						axis.title.position.right =
							axis.position.left + axis.position.width / 2 + axis.title.size.width / 2;
						bottom += axis.title.size.height;
					} else {
						axis.title.position.reset();
					}
					bottom += 200;
					break;
				default:
					break;
				}
			}
		});

		this.yAxes.forEach((axis) => {
			if (axis.position) {
				Object.assign(axis.position, this.plot.position);
				switch (axis.align) {
				case 'left':
					axis.position.left = left - axis.size.width;
					axis.position.right = left;
					left -= axis.size.width;
					if (axis.title.visible) {
						axis.title.position.left = axis.position.left - axis.title.size.height;
						axis.title.position.right = axis.position.left;
						axis.title.position.top =
							axis.position.top + axis.position.height / 2 - axis.title.size.width / 2;
						axis.title.position.bottom =
							axis.position.top + axis.position.height / 2 + axis.title.size.width / 2;
						left -= axis.title.size.height;
					} else {
						axis.title.position.reset();
					}
					left -= 200;
					break;
				case 'right':
					axis.position.left = right;
					axis.position.right = right + axis.size.width;
					right += axis.size.width;
					if (axis.title.visible) {
						axis.title.position.left = axis.position.right;
						axis.title.position.right = axis.position.right + axis.title.size.height;
						axis.title.position.top =
							axis.position.top + axis.position.height / 2 - axis.title.size.width / 2;
						axis.title.position.bottom =
							axis.position.top + axis.position.height / 2 + axis.title.size.width / 2;
						right += axis.title.size.height;
					} else {
						axis.title.position.reset();
					}
					right += 200;
					break;
				case 'top':
					axis.position.top = top - axis.size.height;
					axis.position.bottom = top;
					top -= axis.size.height;
					if (axis.title.visible) {
						axis.title.position.top = axis.position.top - axis.title.size.height;
						axis.title.position.bottom = axis.position.top;
						axis.title.position.left =
							axis.position.left + axis.position.width / 2 - axis.title.size.width / 2;
						axis.title.position.right =
							axis.position.left + axis.position.width / 2 + axis.title.size.width / 2;
						top -= axis.title.size.height;
					} else {
						axis.title.position.reset();
					}
					top -= 200;
					break;
				case 'bottom':
					axis.position.top = bottom;
					axis.position.bottom = bottom + axis.size.height;
					bottom += axis.size.height;
					if (axis.title.visible) {
						axis.title.position.top = axis.position.bottom;
						axis.title.position.bottom = axis.position.bottom + axis.title.size.height;
						axis.title.position.left =
							axis.position.left + axis.position.width / 2 - axis.title.size.width / 2;
						axis.title.position.right =
							axis.position.left + axis.position.width / 2 + axis.title.size.width / 2;
						bottom += axis.title.size.height;
					} else {
						axis.title.position.reset();
					}
					bottom += 200;
					break;
				default:
					break;
				}
			}
		});

		if (this.isPie()) {
			const textSize = this.measurePieLabels(JSG.graphics, this.series[0], legend);
			this.plot.position.top += textSize.height;
			this.plot.position.bottom -= textSize.height;
			this.plot.position.left += textSize.width;
			this.plot.position.right -= textSize.width;
		}

		if (legend.length && this.legend.visible) {
			const height = this.legend.position.height;
			switch (this.legend.align) {
			case 'left':
			case 'right':
				this.legend.position.top = this.plot.position.top;
				this.legend.position.bottom = this.plot.position.top + height;
				break;
			case 'middleright':
			case 'middleleft':
				this.legend.position.top = this.plot.position.top + this.plot.position.height / 2 - height / 2;
				this.legend.position.bottom = this.plot.position.top + this.plot.position.height / 2 + height / 2;
				break;
			default:
				break;
			}
		}

		super.layout();
	}

	getDataLabel(value, axis, ref, serie, legendData) {
		let text;
		if (serie.dataLabel.separator === '&lf') {
			text = [];
		} else {
			text = '';
		}
		const add = (newText) => {
			if (serie.dataLabel.separator === '&lf') {
				if (String(newText).length) {
					text.push(String(newText));
				}
			} else {
				if (text.length) {
					text += serie.dataLabel.separator;
				}
				text += newText;
			}
		};

		if (serie.dataLabel.content.series) {
			if (ref && ref.yName !== undefined) {
				add(ref.yName);
			}
		}
		if (serie.dataLabel.content.x && value.x !== undefined) {
			if (axis.type === 'category' && ref) {
				add(this.getLabel(ref, axis, Math.floor(value.xLabel === undefined ? value.x : value.xLabel)));
			} else if (Numbers.isNumber(value.x)) {
				if (serie.dataLabel.format.linkNumberFormat && value.formatX) {
					add(
						this.formatNumber(value.x, {
							numberFormat: value.formatX.numberFormat,
							localCulture: value.formatX.localCulture
						})
					);
				} else if (serie.dataLabel.format && serie.dataLabel.format.numberFormat) {
					add(this.formatNumber(value.x, serie.dataLabel.format));
				} else {
					add(value.x);
				}
			} else {
				add(value.x);
			}
		}
		if (serie.dataLabel.content.y && value.y !== undefined) {
			if (Numbers.isNumber(value.y)) {
				if (serie.dataLabel.format.linkNumberFormat && value.formatY) {
					add(
						this.formatNumber(value.y, {
							numberFormat: value.formatY.numberFormat,
							localCulture: value.formatY.localCulture
						})
					);
				} else if (serie.dataLabel.format && serie.dataLabel.format.numberFormat) {
					add(this.formatNumber(value.y, serie.dataLabel.format));
				} else {
					add(value.y);
				}
			} else {
				add(value.y);
			}
		}

		if (serie.dataLabel.content.radius && value.c !== undefined) {
			add(value.c);
		}

		if (serie.dataLabel.content.state && value.c !== undefined) {
			value.c = this.translateFromLegend(value.c, legendData);
			const parts = String(value.c).split(';');
			if (parts.length > 2) {
				add(parts[2]);
			}
		}

		if (serie.dataLabel.content.id && value.c !== undefined) {
			add(value.c);
		}

		return text;
	}

	getParamInfo(term, index) {
		if (term && term.params && term.params.length > index) {
			const { operand } = term.params[index];
			if (operand instanceof SheetReference && operand._range) {
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

	setParamValues(viewer, expression, values, sourceItem) {
		let term = expression.getTerm();
		if (term === undefined) {
			return;
		}

		let selection;
		const cellData = [];
		let sheet;

		values.forEach((value) => {
			const info = this.getParamInfo(term, value.index);
			if (info) {
				if (this === sourceItem) {
					sheet = info.sheet;
					const range = info.range.copy();
					if (value.value === undefined) {
						if (!selection) {
							selection = new JSG.Selection(info.sheet);
						}
						selection.add(range);
					} else {
						range.shiftToSheet();
						const cell = {};
						cell.reference = range.toString();
						cell.value = value.value;
						cellData.push(cell);
					}
				}
			} else if (term && term.params) {
				for (let i = term.params.length; i < value.index; i += 1) {
					term.params[i] = new NullTerm();
				}

				if (value.value === undefined) {
					term.params[value.index] = new NullTerm();
				} else {
					term.params[value.index] = Term.fromNumber(value.value);
				}
				expression.correctFormula();
				// term can change
				term = expression.getTerm();
			}
		});

		let zoomcmd;
		if (sheet) {
			if (selection) {
				zoomcmd = JSG.SheetCommandFactory.create(
					'command.DeleteCellContentCommand',
					sheet,
					selection.toStringMulti(),
					'all'
				);
			} else if (cellData.length) {
				zoomcmd = JSG.SheetCommandFactory.create('command.SetCellsCommand', sheet, cellData, false);
			}
		}
		// eslint-disable-next-line consistent-return
		return zoomcmd ? [zoomcmd] : [];
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

	isTimeBasedCell(cell) {
		// if and only if cell has time values...
		return cell && cell._info && cell._info.xvalue ? cell : undefined;
	}

	isTimeBasedRange(sheet, range) {
		if (range.getWidth() !== 1 || range.getHeight() !== 1) {
			return undefined;
		}
		const cell = sheet.getDataProvider().getRC(range._x1, range._y1);
		return this.isTimeBasedCell(cell);
	}

	isTimeBasedChart() {
		return this.series.length && !!this.getDataSourceInfo(this.series[0].formula).time;
	}

	getDataSourceInfoAxis(axis) {
		let ref;

		if (axis.type === 'category') {
			this.series.some((series) => {
				if (series.xAxis === axis.name) {
					ref = this.getDataSourceInfo(series.formula);
					return true;
				}
				return false;
			});
		}
		return ref;
	}

	getDataSourceInfo(ds) {
		const timeParam = this.getParamInfo(ds.getTerm(), 2);
		const time = timeParam ? this.isTimeBasedRange(timeParam.sheet, timeParam.range) : false;

		if (time) {
			return {
				xName: this.getParamValue(ds.getTerm(), 0, 'string'),
				yName: this.getParamValue(ds.getTerm(), 1, 'string'),
				time,
				xKey: this.getParamValue(ds.getTerm(), 3, 'string'),
				yKey: this.getParamValue(ds.getTerm(), 4, 'string'),
				cKey: this.getParamValue(ds.getTerm(), 5, 'string')
			};
		}

		return {
			yName: this.getParamValue(ds.getTerm(), 0, 'string'),
			x: this.getParamInfo(ds.getTerm(), 1),
			y: this.getParamInfo(ds.getTerm(), 2),
			c: this.getParamInfo(ds.getTerm(), 3)
		};
	}

	hasLegendRange() {
		const expr = this.legend.formula;
		if (expr !== undefined) {
			const term = expr.getTerm();
			if (term) {
				const { operand } = term;
				if (operand instanceof SheetReference && operand._range) {
					return true;
				}
			}
		}

		return false;
	}

	getThresholds() {
		const expr = this.legend.formula;
		if (expr !== undefined) {
			const term = expr.getTerm();
			if (term) {
				const { operand } = term;
				if (operand instanceof SheetReference && operand._range) {
					const legend = [];
					const range = operand._range.copy();
					range.shiftFromSheet();
					for (let i = 0; i < range.getHeight(); i += 1) {
						const entry = {};
						let cell = range._worksheet.getDataProvider().getRC(range._x1, range._y1 + i);
						entry.name = cell ? cell.getValue() : '';
						cell = range._worksheet.getDataProvider().getRC(range._x1 + 1, range._y1 + i);
						const color = cell ? cell.getValue() : '';
						const parts = String(color).split(';');
						if (parts.length > 1) {
							entry.lineColor = parts[1];
						} else {
							entry.lineColor = parts[0];
						}
						entry.color = parts[0];
						legend.push(entry);
					}
					return legend;
				}
			}
		}

		return [];
	}

	getSheetMap(ref) {
		const map = {
			features: []
		};

		if (ref.x && ref.c && ref.x.range && ref.c.range) {
			for (let i = 0; i < ref.x.range.getHeight(); i += 1) {
				const feature = {
					type: 'feature',
					properties: {},
					geometry: {
						coordinates: []
					}
				};
				let cell = ref.c.range._worksheet.getDataProvider().getRC(ref.x.range._x1, ref.x.range._y1 + i);
				feature.properties.name = cell ? cell.getValue() : '';
				if (ref.c.range.getWidth() === 4) {
					feature.geometry.type = 'LineString';
					const pt1 = [];
					cell = ref.c.range._worksheet.getDataProvider().getRC(ref.c.range._x1, ref.c.range._y1 + i);
					pt1.push(cell ? cell.getValue() : undefined);
					cell = ref.c.range._worksheet.getDataProvider().getRC(ref.c.range._x1 + 1, ref.c.range._y1 + i);
					pt1.push(cell ? cell.getValue() : undefined);
					if (pt1.every(coor => coor !== undefined && Numbers.isNumber(coor))) {
						feature.geometry.coordinates.push(pt1);
					}
					const pt2 = [];
					cell = ref.c.range._worksheet.getDataProvider().getRC(ref.c.range._x1 + 2, ref.c.range._y1 + i);
					pt2.push(cell ? cell.getValue() : undefined);
					cell = ref.c.range._worksheet.getDataProvider().getRC(ref.c.range._x1 + 3, ref.c.range._y1 + i);
					pt2.push(cell ? cell.getValue() : undefined);
					if (pt2.every(coor => coor !== undefined && Numbers.isNumber(coor))) {
						feature.geometry.coordinates.push(pt2);
					}
					if (feature.geometry.coordinates.length) {
						map.features.push(feature);
					}
				} else {
					feature.geometry.type = 'Point';
					cell = ref.c.range._worksheet.getDataProvider().getRC(ref.c.range._x1, ref.c.range._y1 + i);
					feature.geometry.coordinates.push(cell ? cell.getValue() : undefined);
					cell = ref.c.range._worksheet.getDataProvider().getRC(ref.c.range._x1 + 1, ref.c.range._y1 + i);
					feature.geometry.coordinates.push(cell ? cell.getValue() : undefined);
					if (feature.geometry.coordinates.every(coor => coor !== undefined && Numbers.isNumber(coor))) {
						map.features.push(feature);
					}
				}
			}
		}

		return map;
	}

	getLegend() {
		// eslint-disable-next-line
		let legend = [];


		if (this.series.length && this.chart.varyByCategories) {
			const ref = this.getDataSourceInfo(this.series[0].formula);
			let index = 0;
			const value = {};
			while (this.getValue(ref, index, value)) {
				const entry = {};
				entry.name = this.getLabel(ref, undefined, index);
				entry.series = this.series[0];
				legend.push(entry);
				index += 1;
			}
			return legend;
		}

		if (this.chart.varyByThreshold !== 'none') {
			return this.getThresholds();
		}

		this.series.forEach((series) => {
			if (series.visible) {
				const ref = this.getDataSourceInfo(series.formula);
				legend.push({
					name: ref && ref.yName !== undefined ? ref.yName : '',
					series
				});
			}
		});

		return legend;
	}

	getVisibleSeries(type) {
		let cnt = 0;

		if (type === undefined && this.series.length) {
			type = this.series[0].type;
		}

		this.series.forEach((serie) => {
			if (serie.visible && type === serie.type) {
				cnt += 1;
			}
		});

		return cnt;
	}

	getFirstVisibleSeries() {
		for (let i = 0; i < this.series.length; i += 1) {
			if (this.series[i].visible) {
				return i;
			}
		}

		return 0;
	}

	getLastVisibleSeries() {
		for (let i = this.series.length - 1; i >= 0; i -= 1) {
			if (this.series[i].visible) {
				return i;
			}
		}

		return this.series.length - 1;
	}

	getVisibleSeriesIndex(type, index) {
		let cnt = 0;

		if (type === undefined && this.series.length) {
			type = this.series[0].type;
		}

		for (let i = 0; i < index; i += 1) {
			const serie = this.series[i];
			if (serie.visible && type === serie.type) {
				cnt += 1;
			}
		}

		return cnt;
	}

	translateFromLegend(color, legendData) {
		if (!legendData.length || !legendData[0].color) {
			return color;
		}

		for (let i = 0; i < legendData.length; i += 1) {
			const entry = legendData[i];
			if (color === entry.name) {
				return entry.color;
			}
		}
		return color;
	}

	setScales() {
		const fill = (axis) => {
			if (!axis) {
				return;
			}
			const { formula } = axis;
			const term = formula.getTerm();
			const result = {
				min: this.getParamValue(term, 0),
				max: this.getParamValue(term, 1),
				step: this.getParamValue(term, 2),
				timeStep: this.getParamValue(term, 3),
				minZoom: this.getParamValue(term, 4),
				maxZoom: this.getParamValue(term, 5)
			};

			result.format = this.getParamFormat(term, 0);
			result.minZoom = result.minZoom === '' ? undefined : result.minZoom;
			result.maxZoom = result.maxZoom === '' ? undefined : result.maxZoom;

			if (result.minZoom !== undefined && this.getAllowZoom(axis)) {
				result.min = result.minZoom;
				if (this.chartZoomTimestamp && axis.updateZoom) {
					result.min +=
						MathUtils.JSDateToExcelDate(new Date(Date.now())) -
						MathUtils.JSDateToExcelDate(this.chartZoomTimestamp);
				}
			}
			if (result.maxZoom !== undefined && this.getAllowZoom(axis)) {
				result.max = result.maxZoom;
				if (this.chartZoomTimestamp && axis.updateZoom) {
					result.max +=
						MathUtils.JSDateToExcelDate(new Date(Date.now())) -
						MathUtils.JSDateToExcelDate(this.chartZoomTimestamp);
				}
			}
			// const cmd = vitem.setParamValues(viewer, vitem.xAxes[0].formula, [
			// 	{ index: 4, value: valueStart.x },
			// 	{ index: 5, value: valueEnd.x }
			// ], item);

			this.autoScale(axis, result);

			axis.scale = result;
		};

		this.xAxes.forEach((axis) => {
			fill(axis);
		});
		this.yAxes.forEach((axis) => {
			fill(axis);
		});
	}

	getAxes(series) {
		let xAxis;
		let yAxis;

		if (series === undefined) {
			xAxis = this.xAxes[0];
			yAxis = this.yAxes[0];
		} else {
			let result = this.xAxes.filter((axis) => axis.name === series.xAxis);
			xAxis = result.length ? result[0] : this.xAxes[0];
			result = this.yAxes.filter((axis) => axis.name === series.yAxis);
			yAxis = result.length ? result[0] : this.yAxes[0];
		}

		return {
			x: xAxis,
			y: yAxis
		};
	}

	setMinMax() {
		if (!this.xAxes.length || !this.yAxes.length) {
			return;
		}

		this.xAxes.forEach((axis) => {
			axis.uniqueLabels = undefined;
		});
		this.yAxes.forEach((axis) => {
			if (!axis.categories) {
				axis.categories = [];
			}
		});

		const value = {};
		let maxPointIndex = 0;
		let catValue;

		// evaluate min/max for series
		this.series.forEach((serie, index) => {
			serie.xMax = undefined;
			serie.xMin = undefined;
			serie.yMax = undefined;
			serie.yMin = undefined;
			serie.cMax = undefined;
			serie.cMin = undefined;
			if (serie.visible) {
				const ref = this.getDataSourceInfo(serie.formula);
				const axes = this.getAxes(serie);
				axes.x.betweenTicks =
					(serie.type === 'bar' ||
						serie.type === 'column' ||
						serie.type === 'funnelbar' ||
						serie.type === 'funnelcolumn' ||
						serie.type === 'waterfall' ||
						serie.type === 'boxplot' ||
						serie.type === 'state') &&
					axes.x.type === 'category';
				if ((this.chart.upBars.visible || this.chart.hiLoLines.visible) && serie.type === 'line') {
					axes.x.betweenTicks = true;
				}
				if (ref) {
					let pointIndex = 0;
					const uniqueLabels = {};
					let xMin = Number.MAX_VALUE;
					let xMax = -Number.MAX_VALUE;
					let yMin = Number.MAX_VALUE;
					let yMax = -Number.MAX_VALUE;
					let cMin = Number.MAX_VALUE;
					let cMax = -Number.MAX_VALUE;
					let yValueSum = 0;
					let valid = false;
					serie.xHasString = false;
					axes.x.xHasString = false;

					if (!ref.time) {
						while (this.getValue(ref, pointIndex, value)) {
							if (typeof value.x === 'string' && value.x.length) {
								serie.xHasString = true;
								break;
							}
							pointIndex += 1;
						}
					}

					axes.x.xHasString = serie.xHasString;
					pointIndex = 0;
					value.formatX = {};
					value.formatY = {};

					while (this.getValue(ref, pointIndex, value, 'none')) {
						if (Numbers.isNumber(value.x)) {
							xMin = Math.min(value.x, xMin);
							xMax = Math.max(value.x, xMax);
						}
						if (Numbers.isNumber(value.y)) {
							if (serie.type === 'waterfall') {
								if (serie.autoSum && pointIndex) {
									const lastVal = { x: 0, y: 0 };
									this.getValue(ref, pointIndex - 1, lastVal);
									value.y -= lastVal.y === undefined ? 0 : lastVal.y;
								}
								if (serie.points[pointIndex] && serie.points[pointIndex].pointSum) {
									yValueSum = value.y;
								} else {
									yValueSum += value.y;
								}
								value.y = yValueSum;
							}
							yMin = Math.min(value.y, yMin);
							yMax = Math.max(value.y, yMax);
						}
						if (Numbers.isNumber(value.c)) {
							cMin = Math.min(value.c, cMin);
							cMax = Math.max(value.c, cMax);
						}
						if (!axes.y.categories[pointIndex]) {
							axes.y.categories[pointIndex] = {
								values: [],
								pos: 0,
								neg: 0
							};
						}
						if (axes.x.format.linkNumberFormat && index === 0 && pointIndex === 0) {
							axes.x.format.linkedNumberFormat = value.formatX ? value.formatX.numberFormat : undefined;
							axes.x.format.linkedLocalCulture = value.formatX ? value.formatX.localCulture : undefined;
							value.formatX = undefined;
						}
						if (axes.y.format.linkNumberFormat && index === 0 && pointIndex === 0) {
							axes.y.format.linkedNumberFormat = value.formatY ? value.formatY.numberFormat : undefined;
							axes.y.format.linkedLocalCulture = value.formatY ? value.formatY.localCulture : undefined;
							value.formatY = undefined;
						}
						if (!axes.y.categories[pointIndex].values[index]) {
							axes.y.categories[pointIndex].values[index] = {};
						}
						catValue = axes.y.categories[pointIndex].values[index];
						catValue.x = value.x;
						catValue.y = value.y;
						catValue.pureY = value.pureY;
						catValue.c = value.cY;
						catValue.axes = axes;
						catValue.serie = serie;
						catValue.seriesIndex = index;

						if (index === 0) {
							axes.y.categories[pointIndex].values.length = this.series.length;
						}

						if (serie.type === 'boxplot') {
							const label = this.getLabel(ref, axes.x, pointIndex, false);
							uniqueLabels[label === '' ? ' ' : label] = label;
						}

						maxPointIndex = Math.max(pointIndex, maxPointIndex);
						pointIndex += 1;
						if (value.x !== undefined && value.y !== undefined) {
							valid = true;
						}
					}

					axes.y.categories.length = maxPointIndex + 1;

					if (this.chart.stacked) {
						axes.y.categories.forEach((category) => {
							if (category.values) {
								let pos = 0;
								let neg = 0;
								category.values.forEach((values) => {
									if (Numbers.isNumber(values.y)) {
										if (values.y > 0) {
											pos += values.y;
										} else {
											neg += values.y;
										}
									}
								});
								category.pos = pos;
								category.neg = neg;
								yMax = Math.max(yMax, pos);
								yMin = Math.min(yMin, neg);
							}
						});
						if (this.chart.relative) {
							yMax = 1;
							yMin = yMin < 0 ? -1 : 0;
						}
					}
					if (valid) {
						serie.xMin = Numbers.isNumber(xMin) ? xMin : 0;
						if (serie.type === 'boxplot') {
							axes.x.uniqueLabels = Object.keys(uniqueLabels);
							serie.xMax = Math.max(0, axes.x.uniqueLabels.length - 1);
						} else {
							serie.xMax = Numbers.isNumber(xMax) ? xMax : 100;
						}
						if (serie.seriesMapsMin !== undefined) {
							serie.yMin = Numbers.isNumber(serie.seriesMapsMin) ? serie.seriesMapsMin : 0;
						} else {
							serie.yMin = Numbers.isNumber(yMin) ? yMin : 0;
						}
						if (serie.seriesMapsMax !== undefined) {
							serie.yMax = Numbers.isNumber(serie.seriesMapsMax) ? serie.seriesMapsMax : 0;
						} else {
							serie.yMax = Numbers.isNumber(yMax) ? yMax : 100;
						}
						serie.cMin = Numbers.isNumber(cMin) ? cMin : 0;
						serie.cMax = Numbers.isNumber(cMax) ? cMax : 100;
					}
				}
			}
		});

		this.xAxes.forEach((axis) => {
			axis.minData = undefined;
			axis.maxData = undefined;
			axis.xHasString = false;
			this.series.forEach((series) => {
				if (
					series.visible &&
					series.xAxis === axis.name &&
					series.xMin !== undefined &&
					series.xMax !== undefined
				) {
					axis.minData = axis.minData === undefined ? series.xMin : Math.min(series.xMin, axis.minData);
					axis.maxData = axis.maxData === undefined ? series.xMax : Math.max(series.xMax, axis.maxData);
					axis.xHasString = series.xHasString || axis.xHasString;
					if (series.type === 'bubble' && axis.maxData !== undefined && axis.minData !== undefined) {
						axis.minData -= (axis.maxData - axis.minData) * 0.08;
						axis.maxData += (axis.maxData - axis.minData) * 0.08;
					}
				}
			});
			axis.valueCategories = [];
			if (axis.type === 'category' && this.chart._dataMode === 'hideempty') {
				for (let i = 0; i <= axis.maxData; i += 1) {
					axis.valueCategories[i] = this.hasCategoryValue(axis, i);
				}
			}
			if (axis.minData === undefined) {
				axis.minData = 0;
			}
			if (axis.maxData === undefined) {
				axis.maxData = axis.type === 'category' ? 5 : 100;
			}
			axis.scale = undefined;
		});

		this.yAxes.forEach((axis) => {
			axis.minData = undefined;
			axis.maxData = undefined;
			axis.cMinData = undefined;
			axis.cMaxData = undefined;
			this.series.forEach((series) => {
				if (
					series.visible &&
					series.yAxis === axis.name &&
					series.yMin !== undefined &&
					series.yMax !== undefined
				) {
					axis.minData = axis.minData === undefined ? series.yMin : Math.min(series.yMin, axis.minData);
					axis.maxData = axis.maxData === undefined ? series.yMax : Math.max(series.yMax, axis.maxData);
					if (series.type === 'bubble' && axis.maxData !== undefined && axis.minData !== undefined) {
						axis.minData -= (axis.maxData - axis.minData) * 0.08;
						axis.maxData += (axis.maxData - axis.minData) * 0.08;
					}
					if (
						(series.type === 'bubble' || series.type === 'heatmap') &&
						series.cMin !== undefined &&
						series.cMax !== undefined
					) {
						axis.cMinData =
							axis.cMinData === undefined ? series.cMin : Math.min(series.cMin, axis.cMinData);
						axis.cMaxData =
							axis.cMaxData === undefined ? series.cMax : Math.max(series.cMax, axis.cMaxData);
					}
				}
			});
			if (axis.minData === undefined) {
				axis.minData = 0;
			}
			if (axis.maxData === undefined) {
				axis.maxData = 100;
			}
			if (axis.cMinData === undefined) {
				axis.cMinData = 0;
			}
			if (axis.cMaxData === undefined) {
				axis.cMaxData = 100;
			}
			axis.scale = undefined;
		});
	}

	autoScale(axis, input) {
		let stepCount;
		let m;
		let diff;
		let potMin;
		let potMax;
		let distLin;
		let minLabel;
		let maxLabel;
		let min = axis.minData;
		let max = axis.maxData;
		const stepDist = axis.type === 'category' && axis.size ? axis.size.width : 1500;
		const stepDistVert = axis.type === 'category' ? 600 : 1500;
		let size = axis.isVertical() ? axis.position.height : axis.position.width;
		const labelAngle =
			axis.format.fontRotation === undefined ? 0 : JSG.MathUtils.toRadians(-axis.format.fontRotation);

		if (Number.isNaN(size)) {
			size = 1000;
		}

		if (this.series.length && this.series[0].type.indexOf('funnel') !== -1 && axis.type !== 'category') {
			input.min = 0;
			input.max = max;
		}

		switch (axis.type) {
		case 'logarithmic':
			if (min <= 0) {
				min = 0.01;
			}
			if (max <= 0) {
				max = 1;
			}
			if (min >= 1.0) {
				potMin = Numbers.digitsBefore(min) - 1;
				minLabel = 10.0 ** potMin;
			} else if (min <= -Number.MAX_VALUE) {
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
			if (axis.isVertical()) {
				stepCount = Math.min(13, size / 600);
			} else {
				stepCount = Math.min(13, size / 1500);
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

			diff = (input.max - input.min) / stepCount;

			let timeStep;
			let step;
			let format = {
				localCulture: `time;en`,
				numberFormat: 'h:mm:ss'
			};
			if (diff > 90) {
				timeStep = 'year';
				step = Math.floor(Math.max(1, diff / 300));
			} else if (diff > 30) {
				// from 300 to 450
				timeStep = 'quarter';
				step = 1;
			} else if (diff > 13) {
				// from 70 to 300
				timeStep = 'month';
				step = 1;
			} else if (diff > 5) {
				// from 10 to 70
				timeStep = 'week';
				step = 1;
				if (diff < 2) {
					step = 1;
				} else {
					step = 2;
				}
			} else if (diff > 0.5) {
				// from 1 to 10
				timeStep = 'day';
				if (diff < 1) {
					step = 1;
				} else if (diff < 2) {
					step = 2;
				} else {
					step = 5;
				}
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
			} else if (diff > 30 / 86400) {
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
				if (diff < 0.003 / 86400) {
					step = 1;
				} else if (diff < 0.007 / 86400) {
					step = 5;
				} else if (diff < 0.01 / 86400) {
					step = 10;
				} else if (diff < 0.02 / 86400) {
					step = 20;
				} else if (diff < 0.03 / 86400) {
					step = 50;
				} else if (diff < 0.1 / 86400) {
					step = 100;
				} else {
					step = 500;
				}
			}
			if (input.step === undefined) {
				input.step = step;
			}
			if (input.timeStep === undefined) {
				input.timeStep = timeStep;
			}
			switch (input.timeStep) {
			case 'year':
				format = {
					localCulture: `date;en`,
					numberFormat: 'dd\\.MM\\.yy'
				};
				break;
			case 'quarter':
				format = {
					localCulture: `date;en`,
					numberFormat: 'dd\\.MM\\.yy'
				};
				break;
			case 'month':
				format = {
					localCulture: `date;en`,
					numberFormat: 'dd\\.MM\\.yy'
				};
				break;
			case 'week':
				format = {
					localCulture: `date;en`,
					numberFormat: 'dd\\.MM\\.yy'
				};
				break;
			case 'day':
				format = {
					localCulture: `date;en`,
					numberFormat: 'dd\\.MM\\.yy'
				};
				break;
			case 'hour':
				format = {
					localCulture: `time;en`,
					numberFormat: 'h:mm'
				};
				break;
			case 'minute':
				format = {
					localCulture: `time;en`,
					numberFormat: 'h:mm'
				};
				break;
			case 'millisecond':
				format = {
					localCulture: `time;en`,
					numberFormat: 'h:mm:ss.000'
				};
				break;
			default:
				break;
			}

			input.format = format;
			input.step = Math.max(input.step, epsilon * 10);

			break;
		case 'linear':
		case 'category':
			stepCount = 8; /* 11 => sehr fein      */

			if (axis.isVertical()) {
				stepCount = Math.min(30, size / Math.max(600, stepDistVert * Math.abs(Math.sin(labelAngle))));
			} else {
				stepCount = Math.min(30, size / Math.max(600, stepDist * Math.abs(Math.cos(labelAngle))));
			}

			stepCount = Math.max(1, stepCount);
			if (input.max === undefined && max < 0.0 && axis.autoZero) {
				max = 0;
			}
			if (
				(max - min > max * 0.15 || max - min < epsilon) &&
				axis.type !== 'time' &&
				min > 0 &&
				axis.autoZero
			) {
				min = 0;
			}
			if (input.min !== undefined) {
				min = input.min;
			}
			if (input.max !== undefined) {
				max = input.max;
			}

			if (max > min) {
				diff = max - min;

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
				if (this.chart.relative) {
					minLabel = min;
				} else {
					// if value range is small...
					minLabel = min / distLin;
					minLabel = Math.floor(minLabel);
					minLabel *= distLin;
					if (min !== 0.0 && minLabel >= min - 3) {
						minLabel -= distLin;
					}
				}
			} else {
				minLabel = input.min;
			}
			// MaxWert der Beschriftung ermitteln
			if (input.max === undefined) {
				if (this.chart.relative) {
					maxLabel = max;
				} else {
					maxLabel = max / distLin;
					if (Math.abs(maxLabel % 1) > epsilon) {
						maxLabel = Math.ceil(maxLabel);
					}
					maxLabel *= distLin;
					if (max !== 0.0 && maxLabel <= max + 3 && !this.isMap()) {
						maxLabel += distLin;
					}
				}
			} else {
				maxLabel = input.max;
			}

			if (input.min === undefined) {
				input.min = minLabel;
			}
			if (input.max === undefined) {
				if (axis.type === 'category') {
					input.max = axis.betweenTicks ? max + 1 : max;
				} else {
					input.max = maxLabel;
				}
			}

			if (axis.type !== 'category') {
				if (input.min >= input.max) {
					if (input.min < 0.0) {
						input.max = input.min * 0.9 + 0.15;
					} else {
						input.max = input.max * 1.1 + 0.15;
					}
				}
			}

			if (input.step === undefined) {
				input.step = distLin;
			}

			input.step = Math.max(input.step, epsilon * 10);

			while (input.step * 1000 < input.max - input.min) {
				input.step *= 10;
			}

			if (this.chart.relative && axis.type === 'linear') {
				input.format = {
					localCulture: `percent;en`,
					numberFormat: '0%'
				};
			}

			if (axis.type === 'category') {
				input.min = Math.floor(input.min);
				input.max = Math.ceil(input.max);
				input.step = Math.max(1, input.step);
			}
			break;
		default:
			break;
		}
	}

	getPieInfo(ref, serie, plotRect, index) {
		let rect;
		let pointIndex = 0;
		const value = {};
		const seriesCnt = serie ? this.getVisibleSeries(serie.type) : 1;
		const visibleIndex = serie ? this.getVisibleSeriesIndex(serie.type, index) : 1;
		let sum = 0;

		while (this.getValue(ref, pointIndex, value)) {
			pointIndex += 1;
			if (value.y !== undefined) {
				sum += Math.abs(value.y);
			}
		}

		if (serie.type === 'pie') {
			// calc region, if mulitple pies
			let columns = Math.max(1, Math.ceil(plotRect.width / (plotRect.height ? plotRect.height : 1000)));
			columns = Math.min(columns, seriesCnt);
			const rows = Math.ceil(seriesCnt / columns);
			const column = visibleIndex % columns;
			const row = Math.floor(visibleIndex / columns);
			const hMargin = columns > 1 ? 500 : 0;
			const vMargin = rows > 1 ? 500 : 0;
			rect = new ChartRect(
				plotRect.left + (column * plotRect.width) / columns + hMargin,
				plotRect.top + (row * plotRect.height) / rows + vMargin,
				plotRect.left + ((column + 1) * plotRect.width) / columns - hMargin,
				plotRect.top + ((row + 1) * plotRect.height) / rows - vMargin
			);
		} else {
			rect = plotRect.copy();
		}

		// deduct title
		if (serie && serie.type === 'pie' && seriesCnt > 1 && ref.yName) {
			rect.top += 500;
		}

		// deduct height of pie side
		// const height = 700 * Math.cos(this.chart.rotation);
		const height = (700 * (Math.PI_2 - this.chart.rotation)) / Math.PI_2;
		rect.bottom -= height;

		const startAngle = this.chart.startAngle - Math.PI_2;
		let endAngle = this.chart.endAngle - Math.PI_2;
		if (endAngle <= startAngle) {
			endAngle = startAngle + 0.1;
		}
		let angle = startAngle;
		let yTop = 0;
		let yBottom = 0;

		// calc radius based on rect and start and end angle
		while (angle < endAngle) {
			if (Math.sin(angle) <= 0) {
				yTop = Math.max(yTop, Math.abs(Math.sin(angle)));
			} else {
				yBottom = Math.max(yBottom, Math.abs(Math.sin(angle)));
			}
			const share = angle % Math.PI_2;
			if (share > 0.0001) {
				angle += Math.PI_2 - share;
			} else {
				angle += Math.PI_2;
			}
		}

		if (Math.sin(endAngle) <= 0) {
			yTop = Math.max(yTop, Math.abs(Math.sin(endAngle)));
		} else {
			yBottom = Math.max(yBottom, Math.abs(Math.sin(endAngle)));
		}

		let yRadius = yTop + yBottom;
		yRadius = rect.height / yRadius;
		let xRadius = Math.abs(Math.sin(this.chart.rotation))
			? yRadius / Math.abs(Math.sin(this.chart.rotation))
			: yRadius;
		const xc = rect.left + rect.width / 2;
		if (xRadius * 2 > rect.width) {
			const fact = rect.width / (xRadius * 2);
			xRadius *= fact;
			yRadius *= fact;
		}
		const yc = rect.top + rect.height / 2 + (yTop * yRadius) / 2 - (yBottom * yRadius) / 2;

		return {
			startAngle,
			endAngle,
			angle: endAngle - startAngle,
			xRadius,
			yRadius,
			xOuterRadius: xRadius * (this.chart.hole + (1 - this.chart.hole) * ((visibleIndex + 1) / seriesCnt)),
			yOuterRadius: yRadius * (this.chart.hole + (1 - this.chart.hole) * ((visibleIndex + 1) / seriesCnt)),
			xInnerRadius: xRadius * (this.chart.hole + (1 - this.chart.hole) * (visibleIndex / seriesCnt)),
			yInnerRadius: yRadius * (this.chart.hole + (1 - this.chart.hole) * (visibleIndex / seriesCnt)),
			xc,
			yc,
			height,
			rect,
			sum
		};
	}

	getGaugeInfo(plotRect) {
	}

	getGaugeRadius(axes, gaugeInfo, serie, seriesIndex, index) {
	}

	getGaugeSection(axes, gaugeInfo, value, info) {
	}

	getBarInfo(axes, serie, seriesIndex, index, value, barWidth) {
		let height;
		const margin = this.chart.stacked || serie.type === 'state' ? 0 : this.chart.barMargin;
		const seriesCnt = this.getVisibleSeries(serie.type);
		const visibleSeriesIndex = this.getVisibleSeriesIndex(serie.type, seriesIndex);

		if (this.chart.relative) {
			const neg = axes.y.categories[index].neg;
			const pos = axes.y.categories[index].pos;
			const sum = pos - neg;
			if (sum !== 0 && Numbers.isNumber(sum)) {
				height = -this.scaleSizeToAxis(axes.y, value / sum, false);
			}
		} else {
			height = -this.scaleSizeToAxis(axes.y, value);
		}
		return {
			margin,
			height: axes.y.invert ? -height : height,
			offset: this.chart.stacked
				? -barWidth / 2
				: (-seriesCnt / 2) * barWidth + visibleSeriesIndex * barWidth + margin / 2
		};
	}

	getBarWidth(axes, serie, plotRect) {
		const seriesCnt = this.getVisibleSeries(serie.type);
		if (axes.x.type === 'category') {
			let barWidth;
			const empty = this.chart._dataMode === 'hideempty' ? this.getEmptyCategoryCount(axes.x) : 0;
			const value0 = -axes.x.scale.min / (axes.x.scale.max - axes.x.scale.min - empty);
			const value1 = (1 - axes.x.scale.min) / (axes.x.scale.max - axes.x.scale.min - empty);
			if (this.isHorizontalChart()) {
				barWidth = (value1 - value0) * plotRect.height;
			} else {
				barWidth = (value1 - value0) * plotRect.width;
			}
			const fact = 1 - serie.barGap;
			barWidth = (barWidth * fact) / (this.chart.stacked ? 1 : seriesCnt);
			return Math.min(Math.abs(barWidth), 50);
		}

		return 100;
	}

	getUpDownBarWidth(axes, plotRect) {
		if (axes.x.type === 'category') {
			const value0 = -axes.x.scale.min / (axes.x.scale.max - axes.x.scale.min);
			const value1 = (1 - axes.x.scale.min) / (axes.x.scale.max - axes.x.scale.min);
			// if (serie.type === 'bar') {
			// 	barWidth = (value1 - value0) * plotRect.height;
			// } else {
			let barWidth = (value1 - value0) * plotRect.width;
			barWidth *= 0.7;
			return Math.abs(barWidth - 120);
		}

		return 400;
	}

	getLabel(ref, axis, index, createNumber = true) {
		let label = createNumber ? index + 1 : undefined;

		if (ref.time) {
			const values = ref.time.values;
			if (values) {
				if (values.time) {
					if (values.time.length > index && values[ref.xKey]) {
						label = values[ref.xKey][index];
					}
				} else if (values.length > index) {
					label = values[index].key;
				}
			}
		} else if (ref.x) {
			const vertical = ref.x.range.getWidth() === 1;
			if (vertical) {
				if (index <= ref.x.range._y2 - ref.x.range._y1) {
					const cell = ref.x.sheet.getDataProvider().getRC(ref.x.range._x1, ref.x.range._y1 + index);
					if (cell) {
						label = cell.getValue();
					}
				}
				if (axis && axis.format.linkNumberFormat) {
					const tf = ref.x.sheet.getTextFormatAtRC(ref.x.range._x1, ref.x.range._y1 + index);
					if (tf) {
						axis.format.linkedLocalCulture = tf
							.getLocalCulture()
							.getValue()
							.toString();
						axis.format.linkedNumberFormat = tf.getNumberFormat().getValue();
					}
				}
			} else if (index <= ref.x.range._x2 - ref.x.range._x1) {
				const cell = ref.x.sheet.getDataProvider().getRC(ref.x.range._x1 + index, ref.x.range._y1);
				if (cell) {
					label = cell.getValue();
				}
				if (axis && axis.format.linkNumberFormat) {
					const tf = ref.x.sheet.getTextFormatAtRC(ref.x.range._x1 + index, ref.x.range._y1);
					if (tf) {
						axis.format.linkedLocalCulture = tf
							.getLocalCulture()
							.getValue()
							.toString();
						axis.format.linkedNumberFormat = tf.getNumberFormat().getValue();
					}
				}
			}
		}

		if (axis && Numbers.isNumber(label)) {
			if (axis.format && axis.format.numberFormat) {
				label = this.formatNumber(label, axis.format);
			} else if (axis.scale) {
				label = this.formatNumber(
					label,
					axis.scale.format
						? axis.scale.format
						: { numberFormat: axis.format.linkedNumberFormat, localCulture: axis.format.linkedLocalCulture }
				);
			}
		}

		return label || '';
	}

	validate(val, dataMode, allowString) {
		if (allowString || Numbers.isNumber(val)) {
			return val;
		}

		return dataMode === 'datazero' ? 0 : undefined;
	}

	getValueFromRange(range, sheet, index, dataMode, format, allowString = false) {
		let value;
		const vertical = this.series[0].type === 'map' || range.getWidth() === 1;
		if (vertical) {
			if (index <= range._y2 - range._y1) {
				const cell = sheet.getDataProvider().getRC(range._x1, range._y1 + index);
				if (cell) {
					value = cell.getValue();
				}
				if (format) {
					const tf = sheet.getTextFormatAtRC(range._x1, range._y1 + index);
					if (tf) {
						format.localCulture = tf
							.getLocalCulture()
							.getValue()
							.toString();
						format.numberFormat = tf.getNumberFormat().getValue();
					}
				}
				return this.validate(value, dataMode, allowString);
			}
		} else if (index <= range._x2 - range._x1) {
			const cell = sheet.getDataProvider().getRC(range._x1 + index, range._y1);
			if (cell) {
				value = cell.getValue();
			}
			if (format) {
				const tf = sheet.getTextFormatAtRC(range._x1 + index, range._y1);
				if (tf) {
					format.localCulture = tf
						.getLocalCulture()
						.getValue()
						.toString();
					format.numberFormat = tf.getNumberFormat().getValue();
				}
			}
			return this.validate(value, dataMode, allowString);
		}

		return '#er';
	}

	getCategoryCount(ref) {
		if (ref.time && ref.time.values) {
			return ref.time.values.time.length;
		}

		if (ref.y) {
			const range = ref.y.range;
			return range._y2 - range._y1 + 1;
		}

		return 1;
	}

	getValue(ref, index, value, dataMode) {
		value.x = undefined;
		value.y = undefined;

		if (!this.xAxes.length || !this.yAxes.length) {
			return false;
		}

		if (dataMode === undefined) {
			dataMode = this.chart.dataMode;
		}

		if (ref.time) {
			const values = ref.time.values;
			if (values) {
				if (this.xAxes[0].type === 'category') {
					value.x = index;
				} else if (values.time && values.time.length > index && index >= 0) {
					if (values[ref.xKey]) {
						value.x = values[ref.xKey][index];
					}
					value.x = this.validate(value.x, dataMode, true);
				}
				if (values.time && values.time.length > index && index >= 0) {
					if (values[ref.cKey]) {
						value.c = values[ref.cKey][index];
					}
					value.c = this.validate(value.c, dataMode, true);
					if (values[ref.yKey]) {
						value.y = this.validate(values[ref.yKey][index], dataMode);
						value.pureY = values[ref.yKey][index];
						if (value.formatY) {
							const tf = ref.time.getTextFormat();
							if (tf && tf.getNumberFormat() && tf.getLocalCulture()) {
								value.formatY.localCulture = tf.getLocalCulture().getValue().toString();
								value.formatY.numberFormat = tf.getNumberFormat().getValue();
							} else {
								value.formatY = undefined;
							}
						}
						return true;
					}
				}
			}

			return false;
		}

		if (this.xAxes[0].type === 'category') {
			value.x = index;
		} else if (ref.x) {
			value.x = this.getValueFromRange(ref.x.range, ref.x.sheet, index, dataMode, value.formatX, true);
			// if there is a text in the x values range
			if (this.xAxes[0].xHasString) {
				value.x = index + 1;
			}
		} else {
			value.x = index;
		}

		if (ref.c) {
			value.c = this.getValueFromRange(ref.c.range, ref.c.sheet, index, dataMode, value.formatC, true);
		}

		if (ref.y) {
			value.y = this.getValueFromRange(ref.y.range, ref.y.sheet, index, dataMode, value.formatY);
			value.pureY = this.getValueFromRange(ref.y.range, ref.y.sheet, index, dataMode, value.formatY, true);
			if (value.y !== '#er') {
				return true;
			}
		}

		return false;
	}

	scaleToAxis(axis, value, info, grid) {
		if (info) {
			let tmp;
			let y = 0;
			if (this.chart.stacked && info.index !== undefined) {
				if (this.chart.relative) {
					if (info.categories.length) {
						const neg = info.categories[info.index].neg;
						const pos = info.categories[info.index].pos;
						const sum = pos - neg;
						if (sum !== 0 && Numbers.isNumber(sum)) {
							for (let i = 0; i <= info.seriesIndex; i += 1) {
								if (info.categories[info.index].values[i]) {
									tmp = info.categories[info.index].values[i].y;
									if (Numbers.isNumber(tmp)) {
										if (value < 0) {
											if (tmp < 0) {
												y += tmp / sum;
											}
										} else if (tmp > 0) {
											y += tmp / sum;
										}
									}
								}
							}
						}
					}
				} else {
					for (let i = 0; i <= info.seriesIndex; i += 1) {
						if (info.categories.length && info.categories[info.index].values[i]) {
							tmp = info.categories[info.index].values[i].y;
							if (Numbers.isNumber(tmp)) {
								if (
									value < 0 &&
									(info.serie.type === 'column' ||
										info.serie.type === 'bar' ||
										info.serie.type === 'gauge')
								) {
									if (tmp < 0) {
										y += tmp;
									}
								} else if (
									tmp > 0 ||
									(info.serie.type !== 'column' &&
										info.serie.type !== 'bar' &&
										info.serie.type !== 'gauge')
								) {
									y += tmp;
								}
							}
						}
					}
				}
				value = y;
			}
		}

		switch (axis.type) {
		case 'category':
			if (!grid && axis.betweenTicks) {
				value += 0.5;
			}
			if (axis.scale.max - axis.scale.min === 0) {
				value = 0;
			} else if (this.chart._dataMode === 'hideempty') {
				const empty = this.getEmptyCategoryCount(axis);
				value -= this.getEmptyCategoryCountIndex(axis, value);
				value = (value - axis.scale.min) / (axis.scale.max - axis.scale.min - empty);
			} else {
				value = (value - axis.scale.min) / (axis.scale.max - axis.scale.min);
			}
			break;
		case 'linear':
			value = (value - axis.scale.min) / (axis.scale.max - axis.scale.min);
			break;
		case 'logarithmic':
			value =
				(Math.log10(value) - Math.log10(axis.scale.min)) /
				(Math.log10(axis.scale.max) - Math.log10(axis.scale.min));
			break;
		default:
			value = (value - axis.scale.min) / (axis.scale.max - axis.scale.min);
			break;
		}

		if (axis.invert) {
			value = 1 - value;
		}

		return value;
	}

	scaleSizeToAxis(axis, value) {
		switch (axis.type) {
		default:
		case 'linear':
			return value / (axis.scale.max - axis.scale.min);
		case 'logarithmic':
			return Math.log10(value) / (Math.log10(axis.scale.max) - Math.log10(axis.scale.min));
		}
	}

	scaleFromAxis(axes, point) {
		let x = point.x - this.plot.position.left;
		let y = this.plot.position.bottom - point.y;

		switch (axes.x.align) {
		case 'left':
		case 'right':
			if (axes.x.invert) {
				y = this.plot.position.height - y;
			}
			break;
		case 'top':
		case 'bottom':
			if (axes.x.invert) {
				x = this.plot.position.width - x;
			}
			break;
		default:
			break;
		}

		const empty = this.chart._dataMode === 'hideempty' ? this.getEmptyCategoryCount(axes.x) : 0;
		let ret;

		if (axes.x.align === 'bottom' || axes.x.align === 'top') {
			ret = {
				x:
					axes.x.scale.min +
					(x / (this.plot.position.right - this.plot.position.left)) *
					(axes.x.scale.max - axes.x.scale.min - empty),
				y:
					axes.y.scale.min +
					(y / (this.plot.position.bottom - this.plot.position.top)) * (axes.y.scale.max - axes.y.scale.min)
			};
		} else {
			ret = {
				x:
					axes.x.scale.min +
					(y / (this.plot.position.bottom - this.plot.position.top)) *
					(axes.x.scale.max - axes.x.scale.min - empty),
				y:
					axes.y.scale.min +
					(x / (this.plot.position.right - this.plot.position.left)) * (axes.y.scale.max - axes.y.scale.min)
			};
		}

		ret.x += this.chart._dataMode === 'hideempty' ? this.getEmptyCategoryCountIndex(axes.x, ret.x) : 0;
		ret.x -= axes.x.betweenTicks ? 0.5 : 0;

		return ret;
	}

	getAxisStart(ref, axis) {
		let start = {
			value: axis.scale.min
		};

		switch (axis.type) {
		case 'time':
			start.value = Math.max(0, start.value - 0.0000001);
			start = this.incrementScale(ref, axis, start);
			break;
		case 'logarithmic': {
			let a = start.value;
			let value = start.value;
			let startDecade = 0.1;
			if (a > 1) {
				while (a > 1) {
					a /= 10;
					startDecade *= 10;
				}
			} else {
				while (a < 1) {
					a *= 10;
					startDecade /= 10;
				}
			}
			let result = startDecade;
			let i = 1;

			while (result < value) {
				i += 1;
				result = startDecade * i;
			}

			value = startDecade * i;
			return {
				value,
				startDecade: startDecade * 10,
				i,
				end: false
			};
		}
		case 'category':
			while (start.value <= axis.scale.max) {
				if (!this.chart._dataMode === 'hideempty' || axis.valueCategories[start.value] !== false) {
					break;
				}
				start.value = MathUtils.roundTo(start.value + axis.scale.step, 0);
			}
			break;
		default:
			break;
		}

		return start;
	}

	getAxisEnd(axis) {
		return axis.scale.max;
	}

	incrementScale(ref, axis, valueInfo) {
		let result;

		switch (axis.type) {
		case 'logarithmic':
			result = valueInfo.value;
			// durchlaufen jeder Dekade
			while (valueInfo.i <= 10) {
				valueInfo.value = valueInfo.startDecade * valueInfo.i;
				// if (valueInfo.i === 1) {
				// 	valueInfo.i += 1;
				// 	return valueInfo;
				// }
				valueInfo.i += 1;
			}
			valueInfo.i = 1;
			if (Math.log10(Number.MAX_VALUE) - (Math.log10(valueInfo.startDecade) + 1) > 1) {
				valueInfo.startDecade *= 10;
			} else if (!valueInfo.end) {
				valueInfo.startDecade *= 10;
				valueInfo.end = true;
			}
			break;
		case 'time':
			switch (axis.scale.timeStep) {
			case 'year': {
				const date = MathUtils.excelDateToJSDate(valueInfo.value);
				date.setUTCDate(1);
				date.setUTCMonth(0);
				date.setUTCFullYear(date.getUTCFullYear() + axis.scale.step);
				result = Math.floor(MathUtils.dateToSerial(date));
				// result = Math.floor(MathUtils.JSDateToExcelDate(date));
				break;
			}
			case 'quarter': {
				const date = MathUtils.excelDateToJSDate(valueInfo.value);
				date.setUTCDate(1);
				date.setUTCMonth(date.getUTCMonth() - (date.getUTCMonth() % 3) + axis.scale.step * 3);
				result = Math.floor(MathUtils.dateToSerial(date));
				// result = Math.floor(MathUtils.JSDateToExcelDate(date));
				break;
			}
			case 'month': {
				const date = MathUtils.excelDateToJSDate(valueInfo.value);
				date.setUTCDate(1);
				date.setUTCMonth(date.getUTCMonth() + axis.scale.step);
				result = Math.floor(MathUtils.dateToSerial(date));
				// result = Math.floor(MathUtils.JSDateToExcelDate(date));
				break;
			}
			case 'week': {
				const date = MathUtils.excelDateToJSDate(valueInfo.value);
				const day = date.getUTCDay();
				if (day) {
					valueInfo.value += 7 - day;
				} else {
					valueInfo.value += 7 * axis.scale.step;
				}
				result = Math.floor(valueInfo.value);
				break;
			}
			case 'day':
				result = Math.floor(valueInfo.value) + axis.scale.step;
				break;
			case 'hour': {
				const date = MathUtils.excelDateToJSDate(valueInfo.value);
				const h = date.getUTCHours();
				if (h % axis.scale.step) {
					date.setUTCHours(h + (axis.scale.step - (h % axis.scale.step)));
				} else {
					date.setUTCHours(h + axis.scale.step);
				}
				date.setUTCMinutes(0);
				date.setUTCSeconds(0);
				date.setUTCMilliseconds(0);
				result = MathUtils.dateToSerial(date);
				// result = MathUtils.JSDateToExcelDate(date);
				break;
			}
			case 'minute': {
				const date = MathUtils.excelDateToJSDate(valueInfo.value);
				const m = date.getUTCMinutes();
				if (m % axis.scale.step) {
					date.setUTCMinutes(m + (axis.scale.step - (m % axis.scale.step)));
				} else {
					date.setUTCMinutes(m + axis.scale.step);
				}
				date.setUTCSeconds(0);
				date.setUTCMilliseconds(0);
				result = MathUtils.dateToSerial(date);
				// result = MathUtils.JSDateToExcelDate(date);
				break;
			}
			case 'second': {
				const date = MathUtils.excelDateToJSDate(valueInfo.value);
				const s = date.getUTCSeconds();
				if (s % axis.scale.step) {
					date.setUTCSeconds(s + (axis.scale.step - (s % axis.scale.step)));
				} else {
					date.setUTCSeconds(s + axis.scale.step);
				}
				date.setUTCMilliseconds(0);
				result = MathUtils.dateToSerial(date);
				// result = MathUtils.JSDateToExcelDate(date);
				break;
			}
			case 'millisecond': {
				const date = MathUtils.excelDateToJSDate(valueInfo.value);
				const ms = date.getUTCMilliseconds();
				if (ms % axis.scale.step) {
					date.setUTCMilliseconds(ms + (axis.scale.step - (ms % axis.scale.step)));
				} else {
					date.setUTCMilliseconds(ms + axis.scale.step);
				}
				result = MathUtils.dateToSerial(date);
				// result = MathUtils.JSDateToExcelDate(date);
				break;
			}
			default:
				result = valueInfo.value + 1;
				break;
			}
			valueInfo.value = result;
			break;
		case 'category':
			while (valueInfo.value <= axis.scale.max) {
				valueInfo.value = MathUtils.roundTo(valueInfo.value + axis.scale.step, 0);
				if (!this.chart._dataMode === 'hideempty' || axis.valueCategories[valueInfo.value] !== false) {
					break;
				}
			}
			break;
		default:
			valueInfo.value = MathUtils.roundTo(valueInfo.value + axis.scale.step, 12);
			break;
		}
		return valueInfo;
	}

	getEmptyCategoryCount(axis) {
		let cnt = 0;

		axis.valueCategories.forEach((value) => {
			if (value === false) {
				cnt += 1;
			}
		});
		return cnt;
	}

	getEmptyCategoryCountIndex(axis, index) {
		let cnt = 0;

		for (let i = 0; i < index; i += 1) {
			if (axis.valueCategories[i] === false) {
				cnt += 1;
			}
		}
		return cnt;
	}

	hasCategoryValue(axis, index) {
		return this.series.some((series) => {
			if (series.xAxis === axis.name) {
				const ref = this.getDataSourceInfo(series.formula);
				if (ref.time) {
					return true;
				}

				if (ref.x) {
					const value = this.getValueFromRange(
						ref.x.range,
						ref.x.sheet,
						index,
						this.chart.dataMode,
						undefined,
						true
					);
					if (value !== undefined && (Numbers.isNumber(value) || String(value) !== '')) {
						return true;
					}
				}

				if (ref.y) {
					const value = this.getValueFromRange(ref.y.range, ref.y.sheet, index, this.chart.dataMode);
					if (value !== undefined && (Numbers.isNumber(value) || String(value) !== '')) {
						return true;
					}
				}
			}
			return false;
		});
	}

	getDataFromSelection(selection) {
		if (!selection) {
			return this.chart;
		}

		switch (selection.element) {
		case 'serieslabel':
		case 'series':
		case 'point':
			return this.series[selection.index];
		case 'xAxis':
		case 'xAxisGrid':
			return this.xAxes[selection.index];
		case 'xAxisTitle':
			return this.xAxes[selection.index].title;
		case 'yAxis':
		case 'yAxisGrid':
			return this.yAxes[selection.index];
		case 'yAxisTitle':
			return this.yAxes[selection.index].title;
		case 'title':
			return this.title;
		case 'legend':
			return this.legend;
		case 'plot':
			return this.plot;
		case 'hilolines':
			return this.chart.hiLoLines;
		case 'upbars':
			return this.chart.upBars;
		case 'downbars':
			return this.chart.downBars;
		default:
			return this.chart;
		}
	}

	checkAxis(axis, pt, plotRect) {

		return axis.position.containsPoint(pt);
	}

	checkAxisGrid(axis, pt, plotRect) {
		if (!axis.position || !axis.scale || !axis.gridVisible || !axis.visible) {
			return false;
		}

		let pos;
		const rect = new ChartRect();
		const ref = this.getDataSourceInfoAxis(axis);
		let current = this.getAxisStart(ref, axis);
		const final = this.getAxisEnd(axis);
		const gaugeInfo =
			axis.align === 'radialoutside' || axis.align === 'radialinside' ? this.getGaugeInfo(plotRect) : null;

		while (current.value <= final) {
			if (axis.type === 'category' && current.value >= axis.scale.max) {
				break;
			}
			pos = this.scaleToAxis(axis, current.value, undefined, true);

			switch (axis.align) {
			case 'left':
			case 'right':
				pos = plotRect.bottom - pos * plotRect.height;
				rect.set(plotRect.left, pos - 100, plotRect.right, pos + 100);
				if (rect.containsPoint(pt)) {
					return true;
				}
				break;
			case 'top':
			case 'bottom':
				pos = plotRect.left + pos * plotRect.width;
				rect.set(pos - 100, plotRect.top, pos + 100, plotRect.bottom);
				if (rect.containsPoint(pt)) {
					return true;
				}
				break;
			default:
				break;
			}

			current = this.incrementScale(ref, axis, current);
		}
		return false;
	}

	isPlotHit(pt) {
		return this.plot.position.containsPoint(pt);
	}

	toPlot(serie, plotRect, point) {
		if (this.isHorizontalChart()) {
			const x = point.x;
			if (point.x !== undefined) {
				point.x = plotRect.left + point.y * plotRect.width;
			}
			if (point.y !== undefined) {
				point.y = plotRect.bottom - x * plotRect.height;
			}
		} else {
			if (point.x !== undefined) {
				point.x = plotRect.left + point.x * plotRect.width;
			}
			if (point.y !== undefined) {
				point.y = plotRect.bottom - point.y * plotRect.height;
			}
		}
		return point;
	}

	getEllipseSegmentPoints(
		xc,
		yc,
		xInnerRadius,
		yInnerRadius,
		xOuterRadius,
		yOuterRadius,
		rotation,
		startAngle,
		endAngle,
		count
	) {
		const step = (endAngle - startAngle) / count;
		const points = [];

		if (endAngle <= startAngle) {
			return points;
		}

		for (let i = startAngle; i <= endAngle + 0.0000001; i += step) {
			points.push({
				x: xc + xOuterRadius * Math.cos(i),
				y: yc + yOuterRadius * Math.sin(i)
			});
		}

		for (let i = endAngle; i >= startAngle; i -= step) {
			points.push({
				x: xc + xInnerRadius * Math.cos(i),
				y: yc + yInnerRadius * Math.sin(i)
			});
		}

		return points;
	}

	isSeriesHitCircular(serie, ref, seriesIndex, plotRect, pt, dataPoints) {
		if (!ref) {
			return false;
		}

		const value = {};
		const pieInfo = this.getPieInfo(ref, serie, plotRect, seriesIndex);
		const axes = this.getAxes(serie);
		let currentAngle = pieInfo.startAngle;
		let points;
		let index = 0;

		while (this.getValue(ref, index, value)) {
			if (value.x !== undefined && value.y !== undefined) {
				const angle = (Math.abs(value.y) / pieInfo.sum) * (pieInfo.endAngle - pieInfo.startAngle);
				switch (serie.type) {
				case 'doughnut': {
					points = this.getEllipseSegmentPoints(
						pieInfo.xc,
						pieInfo.yc,
						pieInfo.xInnerRadius,
						pieInfo.yInnerRadius,
						pieInfo.xOuterRadius,
						pieInfo.yOuterRadius,
						0,
						currentAngle,
						currentAngle + angle,
						36
					);
					if (MathUtils.isPointInPolygon(points, pt)) {
						value.series = serie;
						value.index = seriesIndex;
						value.pointIndex = index;
						dataPoints.push({
							x: value.x,
							y: value.y,
							axes,
							serie,
							index: seriesIndex,
							pointIndex: index
						});
						return true;
					}
					break;
				}
				case 'pie':
					points = this.getEllipseSegmentPoints(
						pieInfo.xc,
						pieInfo.yc,
						0,
						0,
						pieInfo.xRadius,
						pieInfo.yRadius,
						0,
						currentAngle,
						currentAngle + angle,
						36
					);
					if (MathUtils.isPointInPolygon(points, pt)) {
						value.series = serie;
						value.index = seriesIndex;
						value.pointIndex = index;
						dataPoints.push({
							x: value.x,
							y: value.y,
							axes,
							serie,
							index: seriesIndex,
							pointIndex: index
						});
						return true;
					}
					break;
				default:
					break;
				}
				currentAngle += angle;
			}
			index += 1;
		}

		return false;
	}


	getPlotPoint(axes, ref, info, defPt, index, offset, pt) {
		if (this.getValue(ref, index + offset, pt)) {
			info.index = index + offset;
			pt.x = pt.x === undefined ? defPt.x : pt.x;
			pt.y = pt.y === undefined ? defPt.y : pt.y;
			pt.x = this.scaleToAxis(axes.x, pt.x, undefined, false);
			pt.y = this.scaleToAxis(axes.y, pt.y, info, false);
		} else {
			pt.x = defPt.x;
			pt.y = defPt.y;
			pt.x = this.scaleToAxis(axes.x, pt.x, undefined, false);
			pt.y = this.scaleToAxis(axes.y, pt.y, info, false);
		}
		return pt;
	}

	isSeriesHitMap(serie, ref, index, plotRect, pt, dataPoints) {
		if (!serie.map || !serie.map.mapData) {
			return false;
		}

		const features = serie.map.mapData.features;
		const mapInfo = this.getMapInfo(plotRect, serie, ref);
		if (!mapInfo) {
			return false;
		}

		const dataRect = new ChartRect();
		const axes = this.getAxes(serie);
		const value = {};

		const addDataPoint = (pointIndex, mapIndex) => {
			if (mapIndex === -1) {
				value.y = 0;
			} else {
				this.getValue(ref, mapIndex, value);
			}
			value.x = pointIndex;
			// TODO set correct value
			dataPoints.push({
				x: value.x,
				y: value.y,
				axes,
				serie,
				index,
				pointIndex
			});
		};

		const featuresHit = features.some((feature, pointIndex) => {
			const boxes = feature.boxes.some((box) => {
				const mapIndex = this.findMapIndex(feature.properties, serie, mapInfo.labels);
				const center = this.getFeatureCenter(feature, mapInfo, serie, ref, mapIndex);
				dataRect.left = center.x;
				dataRect.right = center.x;
				dataRect.top = center.y;
				dataRect.bottom = center.y;
				let radius;
				if (mapInfo.dispChart) {
					dataRect.expand(Math.max(150, serie.marker.size * 100));
					radius = serie.marker.size * 100;
					if (mapIndex !== -1 && dataRect.containsPoint(pt)) {
						radius = this.getMapRadius(serie, ref, mapIndex, mapInfo);
					}
					dataRect.expand(-Math.max(150, serie.marker.size * 100));
				} else if (feature.geometry.type === 'Point' || mapInfo.dispRadius) {
					radius = serie.marker.size * 100;
					if (mapInfo.dispRadius) {
						if (mapIndex !== -1 && this.getValue(ref, mapIndex, value)) {
							radius = (value.y / this.yAxes[0].scale.max) * serie.marker.size * 100;
						} else {
							radius = 0;
						}
					}
				}
				if (radius !== undefined) {
					dataRect.expand(Math.max(150, radius));
					if (dataRect.containsPoint(pt)) {
						addDataPoint(pointIndex, mapIndex);
						return true;
					}
					return false;
				}

				if (this.chart.dataMode === 'dataignore' && mapIndex === -1) {
					return false;
				}

				// search in area
				dataRect.left = mapInfo.xOff + (box.xMin - mapInfo.bounds.xMin) * mapInfo.scale;
				dataRect.top = mapInfo.yOff + (mapInfo.bounds.yMax - box.yMin) * mapInfo.scale;
				dataRect.right = mapInfo.xOff + (box.xMax - mapInfo.bounds.xMin) * mapInfo.scale;
				dataRect.bottom = mapInfo.yOff + (mapInfo.bounds.yMax - box.yMax) * mapInfo.scale;
				dataRect.sort();

				if (dataRect.width < 200 || dataRect.height < 200) {
					// small areas
					dataRect.expand(100);
					if (dataRect.containsPoint(pt)) {
						addDataPoint(pointIndex, mapIndex);
						return true;
					}
				} else if (dataRect.containsPoint(pt)) {
					// else check polygon
					let searchPoints = [];
					return this.enumerateMapCoordinates(feature.geometry, (coordinate, idx, final) => {
						if (idx === 0) {
							searchPoints = [];
						}
						searchPoints.push({
							x: mapInfo.xOff + (coordinate[0] - mapInfo.bounds.xMin) * mapInfo.scale,
							y: mapInfo.yOff + (mapInfo.bounds.yMax - coordinate[1]) * mapInfo.scale
						});
						if (final) {
							if (
								feature.geometry.type === 'LineString' ||
								feature.geometry.type === 'MultiLineString' ||
								serie.format.fillStyle === 0
							) {
								for (let i = 0; i < searchPoints.length - 1; i += 1) {
									if (
										MathUtils.getLinePointDistance(searchPoints[i], searchPoints[i + 1], pt) < 150
									) {
										addDataPoint(pointIndex, mapIndex);
										return true;
									}
								}
							} else if (MathUtils.isPointInPolygon(searchPoints, pt)) {
								addDataPoint(pointIndex, mapIndex);
								return true;
							}
						}
						return false;
					});
				}
				return false;
			});
			return boxes;
		});

		return featuresHit;
	}

	isSeriesHitCartesian(serie, ref, index, plotRect, pt, dataPoints) {
		if (!ref) {
			return false;
		}

		const dataRect = new ChartRect();
		const axes = this.getAxes(serie);
		let pointIndex = 0;
		let x;
		let y;
		// eslint-disable-next-line
		let valueSum = 0;
		let barInfo;
		const barWidth = this.getBarWidth(axes, serie, plotRect);
		const info = {
			serie,
			seriesIndex: index,
			categories: axes.y.categories
		};
		const points = [];
		const prevPoints = [];
		const value = {};

		while (this.getValue(ref, pointIndex, value)) {
			info.index = pointIndex;
			if (serie.marker.style === 'vertical' && value.y === undefined) {
				value.y = 0;
			}
			if (value.x !== undefined && value.y !== undefined) {
				x = this.scaleToAxis(axes.x, value.x, undefined, false);
				y = this.scaleToAxis(axes.y, value.y, info, false);

				switch (serie.type) {
				case 'bar':
					barInfo = this.getBarInfo(axes, serie, index, pointIndex, value.y, barWidth);
					dataRect.set(
						plotRect.left + y * plotRect.width - 100 + barInfo.height * plotRect.width,
						plotRect.bottom - x * plotRect.height + barInfo.offset - 100,
						plotRect.left + y * plotRect.width + 100,
						plotRect.bottom - x * plotRect.height + barInfo.offset + 100 + barWidth - barInfo.margin
					);
					break;
				case 'profile':
					dataRect.set(
						plotRect.left + y * plotRect.width - 200,
						plotRect.bottom - x * plotRect.height - 200,
						plotRect.left + y * plotRect.width + 200,
						plotRect.bottom - x * plotRect.height + 200
					);
					points.push({
						x: plotRect.left + x * plotRect.width,
						y: plotRect.bottom - y * plotRect.height
					});
					break;
				case 'column':
					barInfo = this.getBarInfo(axes, serie, index, pointIndex, value.y, barWidth);
					dataRect.set(
						plotRect.left + x * plotRect.width + barInfo.offset - 100,
						plotRect.bottom - y * plotRect.height - 100,
						plotRect.left + x * plotRect.width + barInfo.offset + 100 + barWidth - barInfo.margin,
						plotRect.bottom - y * plotRect.height + 100 - barInfo.height * plotRect.height
					);
					break;
				case 'line':
				case 'scatter':
				case 'bubble':
					if (serie.marker.style === 'vertical') {
						dataRect.set(
							plotRect.left + x * plotRect.width - 200,
							plotRect.top,
							plotRect.left + x * plotRect.width + 200,
							plotRect.bottom
						);
					} else {
						dataRect.set(
							plotRect.left + x * plotRect.width - 200,
							plotRect.bottom - y * plotRect.height - 200,
							plotRect.left + x * plotRect.width + 200,
							plotRect.bottom - y * plotRect.height + 200
						);
					}
					points.push({
						x: plotRect.left + x * plotRect.width,
						y: plotRect.bottom - y * plotRect.height
					});
					break;
				case 'area':
					dataRect.set(
						plotRect.left + x * plotRect.width - 200,
						plotRect.bottom - y * plotRect.height - 200,
						plotRect.left + x * plotRect.width + 200,
						plotRect.bottom - y * plotRect.height + 200
					);
					barInfo = this.getBarInfo(axes, serie, index, pointIndex, value.y, barWidth);
					if (this.chart.step && pointIndex) {
						const ptLast = { x: 0, y: 0 };
						this.getPlotPoint(axes, ref, info, value, pointIndex, -1, ptLast);
						this.toPlot(serie, plotRect, ptLast);
						points.push({
							x: plotRect.left + x * plotRect.width,
							y: points[points.length - 1].y
						});
						prevPoints.push({
							x: plotRect.left + x * plotRect.width,
							y: prevPoints[prevPoints.length - 1].y
						});
					}
					points.push({
						x: plotRect.left + x * plotRect.width,
						y: plotRect.bottom - y * plotRect.height
					});
					prevPoints.push({
						x: plotRect.left + x * plotRect.width,
						y: plotRect.bottom - y * plotRect.height - barInfo.height * plotRect.height
					});
					break;
				default:
					break;
				}
				dataRect.sort();
				if (dataRect.containsPoint(pt)) {
					value.axes = axes;
					value.serie = serie;
					value.index = index;
					value.pointIndex = pointIndex;
					dataPoints.push({
						x: value.x,
						y: value.y,
						axes,
						serie,
						index,
						pointIndex
					});
					if (serie.type !== 'area') {
						return true;
					}
				}
			}
			pointIndex += 1;
		}
		switch (serie.type) {
		case 'area': {
			const searchPoints = [];
			points.forEach((point) => {
				searchPoints.push(point);
			});
			for (let i = prevPoints.length - 1; i >= 0; i -= 1) {
				searchPoints.push(prevPoints[i]);
			}
			if (MathUtils.isPointInPolygon(searchPoints, pt)) {
				return true;
			}
			break;
		}
		case 'profile':
		case 'scatter':
		case 'line': {
			for (let i = 0; i < points.length - 1; i += 1) {
				if (MathUtils.getLinePointDistance(points[i], points[i + 1], pt) < 200) {
					return true;
				}
			}
			break;
		}
		default:
			break;
		}

		return false;
	}

	isChartAdditionHit(plotRect, pt) {
		if (this.chart.hiLoLines.visible === false && this.chart.upBars.visible === false) {
			return undefined;
		}

		let index = 0;
		const value = {};
		const serie = this.getFirstSerieOfType('line');
		if (!serie) {
			return undefined;
		}
		const indices = this.getFirstLastSerieIndicesOfType('line');
		if (indices.first === undefined || indices.last === undefined) {
			return undefined;
		}

		const axes = this.getAxes(serie);
		const ref = this.getDataSourceInfo(serie.formula);
		if (!ref || !axes) {
			return undefined;
		}

		const ptLow = { x: 0, y: 0 };
		const ptHigh = { x: 0, y: 0 };
		const info = {
			serie,
			seriesIndex: 0,
			categories: axes.y.categories
		};
		const hitRect = new ChartRect();
		const barWidth = this.getUpDownBarWidth(axes, plotRect);
		let tmp;
		let x;

		while (this.getValue(ref, index, value)) {
			info.index = index;
			if (value.x !== undefined && value.y !== undefined) {
				x = this.scaleToAxis(axes.x, value.x, undefined, false);
				ptHigh.x = ptLow.x;
				ptLow.y = undefined;
				ptHigh.y = undefined;
				if (this.chart.upBars.visible) {
					ptLow.x = x;
					ptHigh.x = ptLow.x;
					if (axes.y.categories[index].values[indices.first] !== undefined) {
						tmp = axes.y.categories[info.index].values[indices.first].y;
						if (Numbers.isNumber(tmp)) {
							ptLow.y = tmp;
						}
					}
					if (axes.y.categories[index].values[indices.last] !== undefined) {
						tmp = axes.y.categories[info.index].values[indices.last].y;
						if (Numbers.isNumber(tmp)) {
							ptHigh.y = tmp;
						}
					}
					if (ptLow.y !== undefined && ptHigh.y !== undefined) {
						ptLow.y = this.scaleToAxis(axes.y, ptLow.y, info, false);
						ptHigh.y = this.scaleToAxis(axes.y, ptHigh.y, info, false);
						this.toPlot(serie, plotRect, ptLow);
						this.toPlot(serie, plotRect, ptHigh);
						hitRect.set(ptHigh.x - barWidth / 2, ptHigh.y, ptHigh.x + barWidth / 2, ptLow.y);
						hitRect.sort();
						if (hitRect.containsPoint(pt)) {
							if (ptLow.y > ptHigh.y) {
								return {
									element: 'upbars',
									data: this.chart.upBars
								};
							}
							return {
								element: 'downbars',
								data: this.chart.downBars
							};
						}
					}
				}
				if (this.chart.hiLoLines.visible) {
					ptLow.x = x;
					ptHigh.x = ptLow.x;
					ptLow.y = undefined;
					ptHigh.y = undefined;
					for (let i = 0; i < this.series.length; i += 1) {
						if (this.series[i].type === 'line' && axes.y.categories[index].values[i] !== undefined) {
							tmp = axes.y.categories[info.index].values[i].y;
							if (Numbers.isNumber(tmp)) {
								ptLow.y = ptLow.y === undefined ? tmp : Math.min(ptLow.y, tmp);
								ptHigh.y = ptHigh.y === undefined ? tmp : Math.max(ptHigh.y, tmp);
							}
						}
					}
					if (ptLow.y !== undefined && ptHigh.y !== undefined) {
						ptLow.y = this.scaleToAxis(axes.y, ptLow.y, info, false);
						ptHigh.y = this.scaleToAxis(axes.y, ptHigh.y, info, false);
						this.toPlot(serie, plotRect, ptLow);
						this.toPlot(serie, plotRect, ptHigh);
						hitRect.set(ptLow.x - 100, ptHigh.y, ptLow.x + 100, ptLow.y);
						if (hitRect.containsPoint(pt)) {
							return {
								element: 'hilolines',
								data: this.chart.hiLoLines
							};
						}
					}
				}
			}
			index += 1;
		}

		return undefined;
	}

	isSeriesLabelHit(serie, ref, index, plotRect, pt) {
		if (!ref || !JSG.graphics || !this.hasSeriesDataLabel(serie)) {
			return false;
		}

		const axes = this.getAxes(serie);
		let pointIndex = 0;
		const ptValue = { x: 0, y: 0 };
		const barWidth = this.getBarWidth(axes, serie, plotRect);
		const legendData = this.getThresholds();
		const info = {
			serie,
			seriesIndex: index,
			categories: axes.y.categories
		};
		const points = [];
		const prevPoints = [];
		const value = {
			formatX: {},
			formatY: {},
			formatC: {},
		};
		const pieInfo = this.isCircular() ? this.getPieInfo(ref, serie, plotRect, index) : undefined;
		const gaugeInfo = this.isGauge() ? this.getGaugeInfo(plotRect) : undefined;
		const params = {
			graphics: JSG.graphics,
			serie,
			info,
			ref,
			axes,
			plotRect,
			barWidth,
			seriesIndex: index,
			points,
			lastPoints: prevPoints,
			pieInfo,
			gaugeInfo,
			currentAngle: pieInfo ? pieInfo.startAngle : 0,
			valueSum: 0
		};
		const labelAngle =
			serie.dataLabel.format.fontRotation === undefined
				? 0
				: JSG.MathUtils.toRadians(-serie.dataLabel.format.fontRotation);
		let ptCopy;

		this.setFont(
			JSG.graphics,
			serie.dataLabel.format,
			'serieslabel',
			'middle',
			TextFormatAttributes.TextAlignment.CENTER
		);

		if (serie.type === 'boxplot') {
		} else {
			while (this.getValue(ref, pointIndex, value)) {
				info.index = pointIndex;
				if (value.x !== undefined && value.y !== undefined) {
					ptValue.x = this.scaleToAxis(axes.x, value.x, undefined, false);
					ptValue.y = this.scaleToAxis(axes.y, value.y, info, false);
					this.toPlot(serie, plotRect, ptValue);

					const text = this.getDataLabel(value, axes.x, ref, serie, legendData);
					if (text.length) {
						const dataRect = this.getLabelRect(ptValue, value, text, pointIndex, params);
						if (this.hasDataPointLabel(serie, pointIndex) && dataRect) {
							ptCopy = labelAngle
								? MathUtils.getRotatedPoint(pt, dataRect.center, labelAngle)
								: pt.copy();
							if (dataRect.containsPoint(ptCopy)) {
								return true;
							}
						}
					}
				}
				pointIndex += 1;
			}
		}

		return false;
	}

	scaleBubble(axis, plotRect, serie, value) {
		const radiusMax = Math.min(plotRect.width, plotRect.height) / 12; // * (double)Group.GetBubbleScale() / 100.0;

		if (value > 0 && axis.cMaxData > 0) {
			// if( Group.GetSizeRepresents() == ctSizeIsWidth ) {
			// 	iRadius = (int)(dOuterCircle / dMax * dSize);
			// } else {
			const maxArea = radiusMax * radiusMax * Math.PI;
			const objectArea = (value / axis.cMaxData) * maxArea;
			return Math.sqrt(objectArea / Math.PI);
			// }
		}
		return 0;
	}

	measureLabel(label, params) {
		const margin = 200;
		let textSize;
		if (label instanceof Array) {
			textSize = {
				width: 0,
				height: 0
			};
			label.forEach((txt) => {
				const textS = this.measureText(
					params.graphics,
					params.graphics.getCoordinateSystem(),
					params.serie.dataLabel.format,
					'serieslabel',
					txt,
					true
				);
				textSize.width = Math.max(textS.width, textSize.width);
				textSize.height += textS.height;
			});
			textSize.height += (label.length - 1) * 50;
		} else {
			textSize = this.measureText(
				params.graphics,
				params.graphics.getCoordinateSystem(),
				params.serie.dataLabel.format,
				'serieslabel',
				label,
				true
			);
		}
		textSize.height += margin;
		textSize.width += margin;
		textSize.widthRot = textSize.width;
		textSize.heightRot = textSize.height;
		const labelAngle =
			params.serie.dataLabel.format.fontRotation === undefined
				? 0
				: JSG.MathUtils.toRadians(-params.serie.dataLabel.format.fontRotation);
		if (labelAngle) {
			textSize.widthRot =
				Math.abs(Math.sin(labelAngle) * textSize.height) + Math.abs(Math.cos(labelAngle) * textSize.width);
			textSize.heightRot =
				Math.abs(Math.sin(labelAngle) * textSize.width) + Math.abs(Math.cos(labelAngle) * textSize.height);
		}

		return textSize;
	}

	getLabelRect(pt, value, text, index, params) {
		const labelRect = new ChartRect();
		let barInfo;
		const isLineChart = this.isLineType(params.serie);

		if (this.isCircular()) {
			const angle =
				(Math.abs(value.y) / params.pieInfo.sum) * (params.pieInfo.endAngle - params.pieInfo.startAngle);
			const textAngle = params.currentAngle + angle / 2;
			let xInnerRadius;
			let yInnerRadius;
			let xOuterRadius;
			let yOuterRadius;
			let xRadius;
			let yRadius;
			switch (params.serie.type) {
			case 'doughnut':
				xInnerRadius = params.pieInfo.xInnerRadius;
				yInnerRadius = params.pieInfo.yInnerRadius;
				xOuterRadius = params.pieInfo.xOuterRadius;
				yOuterRadius = params.pieInfo.yOuterRadius;
				break;
			case 'pie':
				xInnerRadius = 0;
				yInnerRadius = 0;
				xOuterRadius = params.pieInfo.xRadius;
				yOuterRadius = params.pieInfo.yRadius;
				break;
			default:
				return undefined;
			}
			switch (params.serie.dataLabel.position) {
			case 'center':
				xRadius = (xInnerRadius + xOuterRadius) / 2;
				yRadius = (yInnerRadius + yOuterRadius) / 2;
				break;
			case 'inner':
			case 'outer':
			default:
				xRadius = xOuterRadius;
				yRadius = yOuterRadius;
				break;
			}
			pt.x = params.pieInfo.xc + xRadius * Math.cos(textAngle);
			pt.y = params.pieInfo.yc + yRadius * Math.sin(textAngle);
			params.currentAngle += angle;
			labelRect.set(pt.x, pt.y, pt.x, pt.y);
			if (text.length) {
				const textSize = this.measureLabel(text, params);
				const xOff = Math.cos(textAngle) * (textSize.width / 2 + 150);
				const yOff = Math.sin(textAngle) * (textSize.height / 2 + 150);
				switch (params.serie.dataLabel.position) {
				case 'center':
					labelRect.set(
						labelRect.left - textSize.width / 2,
						labelRect.top - textSize.height / 2,
						labelRect.right + textSize.width / 2,
						labelRect.bottom + textSize.height / 2
					);
					break;
				case 'inner':
					labelRect.set(
						labelRect.left - xOff - textSize.width / 2,
						labelRect.top - yOff - textSize.height / 2,
						labelRect.right - xOff + textSize.width / 2,
						labelRect.bottom - yOff + textSize.height / 2
					);
					break;
				default:
				case 'outer':
					labelRect.set(
						labelRect.left + xOff - textSize.width / 2,
						labelRect.top + yOff - textSize.height / 2,
						labelRect.right + xOff + textSize.width / 2,
						labelRect.bottom + yOff + textSize.height / 2
					);
					break;
				}
			}
		} else if (this.isGauge()) {
		} else {
			switch (params.serie.type) {
			case 'profile':
			case 'scatter':
			case 'line':
			case 'area':
				labelRect.set(pt.x - 100, pt.y - 100, pt.x + 100, pt.y + 100);
				break;
			case 'bubble': {
				const radius = this.scaleBubble(params.axes.y, params.plotRect, params.serie, value.c);
				labelRect.set(pt.x - radius, pt.y - radius, pt.x + radius, pt.y + radius);
				break;
			}
			case 'column':
				barInfo = this.getBarInfo(
					params.axes,
					params.serie,
					params.seriesIndex,
					index,
					value.y,
					params.barWidth
				);
				labelRect.set(
					pt.x + barInfo.offset,
					pt.y,
					pt.x + barInfo.offset + params.barWidth - barInfo.margin,
					pt.y - barInfo.height * params.plotRect.height
				);
				break;
			case 'bar':
				barInfo = this.getBarInfo(
					params.axes,
					params.serie,
					params.seriesIndex,
					index,
					value.y,
					params.barWidth
				);
				labelRect.set(
					pt.x + barInfo.height * params.plotRect.width,
					pt.y + barInfo.offset,
					pt.x,
					pt.y + barInfo.offset + params.barWidth - barInfo.margin
				);
				break;
			default:
				return undefined;
			}
			const center = labelRect.center;
			let offset;
			if (text.length) {
				const textSize = this.measureLabel(text, params);
				switch (params.serie.dataLabel.position) {
				case 'above':
					offset = (textSize.heightRot - textSize.height) / 2;
					labelRect.set(
						center.x - textSize.width / 2,
						labelRect.top - textSize.height - offset,
						center.x + textSize.width / 2,
						labelRect.top - offset
					);
					break;
				case 'below':
					offset = (textSize.heightRot - textSize.height) / 2;
					labelRect.set(
						center.x - textSize.width / 2,
						labelRect.bottom + offset,
						center.x + textSize.width / 2,
						labelRect.bottom + textSize.height + offset
					);
					break;
				case 'left':
					offset = (textSize.widthRot - textSize.width) / 2;
					labelRect.set(
						labelRect.left - textSize.width - offset,
						center.y - textSize.height / 2,
						labelRect.left - offset,
						center.y + textSize.height / 2
					);
					break;
				case 'right':
					offset = (textSize.widthRot - textSize.width) / 2;
					labelRect.set(
						labelRect.right + offset,
						center.y - textSize.height / 2,
						labelRect.right + textSize.width + offset,
						center.y + textSize.height / 2
					);
					break;
				case 'beforestart':
					if (this.isHorizontalChart()) {
						offset = (textSize.widthRot - textSize.width) / 2;
						if (params.axes.y.invert) {
							labelRect.set(
								labelRect.left + textSize.width + offset,
								center.y - textSize.height / 2,
								labelRect.left + offset,
								center.y + textSize.height / 2
							);
						} else {
							labelRect.set(
								labelRect.left - textSize.width - offset,
								center.y - textSize.height / 2,
								labelRect.left - offset,
								center.y + textSize.height / 2
							);
						}
					} else {
						offset = (textSize.heightRot - textSize.height) / 2;
						if (params.axes.y.invert) {
							labelRect.set(
								center.x - textSize.width / 2,
								labelRect.bottom - textSize.height - offset,
								center.x + textSize.width / 2,
								labelRect.bottom - offset
							);
						} else {
							labelRect.set(
								center.x - textSize.width / 2,
								labelRect.bottom + offset,
								center.x + textSize.width / 2,
								labelRect.bottom + textSize.height + offset
							);
						}
					}
					break;
				case 'start':
					if (this.isHorizontalChart()) {
						offset = (textSize.widthRot - textSize.width) / 2;
						if (params.axes.y.invert) {
							labelRect.set(
								labelRect.left - textSize.width - offset,
								center.y - textSize.height / 2,
								labelRect.left - offset,
								center.y + textSize.height / 2
							);
						} else {
							labelRect.set(
								labelRect.left + offset,
								center.y - textSize.height / 2,
								labelRect.left + textSize.width + offset,
								center.y + textSize.height / 2
							);
						}
					} else {
						offset = (textSize.heightRot - textSize.height) / 2;
						if (params.axes.y.invert) {
							labelRect.set(
								center.x - textSize.width / 2,
								labelRect.bottom + offset,
								center.x + textSize.width / 2,
								labelRect.bottom + textSize.height + offset
							);
						} else {
							labelRect.set(
								center.x - textSize.width / 2,
								labelRect.bottom - textSize.height - offset,
								center.x + textSize.width / 2,
								labelRect.bottom - offset
							);
						}
					}
					break;
				case 'default':
				case 'center':
					labelRect.set(
						center.x - textSize.width / 2,
						center.y - textSize.height / 2,
						center.x + textSize.width / 2,
						center.y + textSize.height / 2
					);
					break;
				case 'end':
					if (this.isHorizontalChart()) {
						offset = (textSize.widthRot - textSize.width) / 2;
						if (params.axes.y.invert) {
							labelRect.set(
								labelRect.right + offset,
								center.y - textSize.height / 2,
								labelRect.right + textSize.width + offset,
								center.y + textSize.height / 2
							);
						} else {
							labelRect.set(
								labelRect.right - textSize.width - offset,
								center.y - textSize.height / 2,
								labelRect.right - offset,
								center.y + textSize.height / 2
							);
						}
					} else {
						offset = (textSize.heightRot - textSize.height) / 2;
						if (params.axes.y.invert) {
							labelRect.set(
								center.x - textSize.width / 2,
								labelRect.top - textSize.height - offset,
								center.x + textSize.width / 2,
								labelRect.top - offset
							);
						} else {
							labelRect.set(
								center.x - textSize.width / 2,
								labelRect.top + offset,
								center.x + textSize.width / 2,
								labelRect.top + textSize.height + offset
							);
						}
					}
					break;
				case 'behindend':
					if (this.isHorizontalChart()) {
						offset = (textSize.widthRot - textSize.width) / 2;
						if (
							(params.axes.y.invert && (isLineChart || value.y > 0)) ||
							(!params.axes.y.invert && value.y < 0)
						) {
							labelRect.set(
								labelRect.right - textSize.width - offset,
								center.y - textSize.height / 2,
								labelRect.right - offset,
								center.y + textSize.height / 2
							);
						} else {
							labelRect.set(
								labelRect.right + offset,
								center.y - textSize.height / 2,
								labelRect.right + textSize.width + offset,
								center.y + textSize.height / 2
							);
						}
					} else {
						offset = (textSize.heightRot - textSize.height) / 2;
						if (
							(params.axes.y.invert && (isLineChart || value.y > 0)) ||
							(!params.axes.y.invert && value.y < 0)
						) {
							labelRect.set(
								center.x - textSize.width / 2,
								labelRect.top + offset + textSize.height,
								center.x + textSize.width / 2,
								labelRect.top + offset
							);
						} else {
							labelRect.set(
								center.x - textSize.width / 2,
								labelRect.top - textSize.height - offset,
								center.x + textSize.width / 2,
								labelRect.top - offset
							);
						}
					}
					break;
				default:
					break;
				}
			}
		}

		labelRect.sort();

		if (params.serie.type !== 'pie') {
			if (
				labelRect.left < params.plotRect.left - 100 ||
				labelRect.right > params.plotRect.right + 100 ||
				labelRect.top < params.plotRect.top - 100 ||
				labelRect.bottom > params.plotRect.bottom + 100
			) {
				return undefined;
			}
		}

		return labelRect;
	}

	isElementHit(pt, oldSelection, series = 'yes') {
		let result;
		const dataPoints = [];
		const plotRect = this.plot.position;

		if (!this.isVisible()) {
			return false;
		}

		result = this.actions.filter((action) => action.position.containsPoint(pt));
		if (result.length) {
			return {
				element: 'action',
				data: result[0],
				index: this.actions.indexOf(result[0])
			};
		}

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

		if (series === 'yes') {
			const revSeries = [].concat(this.series).reverse();
			result = revSeries.filter((serie) => {
				if (serie.visible) {
					const index = this.series.indexOf(serie);
					const ref = this.getDataSourceInfo(serie.formula);
					return this.isSeriesLabelHit(serie, ref, index, plotRect, pt, dataPoints);
				}
				return false;
			});
			if (result.length) {
				const index = 0;
				return {
					element: 'serieslabel',
					index: this.series.indexOf(result[index]),
					data: result[0],
					dataPoints
				};
			}
		}

		if (series === 'yes' && this.plot.position.containsPoint(pt)) {
			result = this.isChartAdditionHit(plotRect, pt);
			if (result) {
				return result;
			}
		}

		if (this.isGauge() && !this.chart.gaugePointer) {
			result = this.yAxes.filter((axis) => this.checkAxisGrid(axis, pt, plotRect));
			if (result.length) {
				return {
					element: 'yAxisGrid',
					index: this.yAxes.indexOf(result[0]),
					data: result[0]
				};
			}
		}

		if (series !== 'no' && this.plot.position.containsPoint(pt)) {
			const revSeries = [].concat(this.series).reverse();
			result = revSeries.filter((serie) => {
				if (serie.visible) {
					const index = this.series.indexOf(serie);
					const ref = this.getDataSourceInfo(serie.formula);
					switch (serie.type) {
					case 'pie':
					case 'doughnut':
						return this.isSeriesHitCircular(serie, ref, index, plotRect, pt, dataPoints);
					default:
						return this.isSeriesHitCartesian(serie, ref, index, plotRect, pt, dataPoints);
					}
				}
				return false;
			});
			if (result.length) {
				let index = 0;
				if (oldSelection && oldSelection.element === 'series' && result.length > 1) {
					index = oldSelection.selectionIndex < result.length - 1 ? oldSelection.selectionIndex + 1 : 0;
				}
				const seriesIndex = this.series.indexOf(result[index]);
				if (
					oldSelection &&
					dataPoints.length &&
					(oldSelection.element === 'series' || oldSelection.element === 'point') &&
					result[index].type !== 'boxplot' &&
					seriesIndex === oldSelection.index
				) {
					return {
						element: 'point',
						index: seriesIndex,
						pointIndex: dataPoints[0].pointIndex,
						selectionIndex: index,
						data: result[index],
						dataPoints
					};
				}
				return {
					element: 'series',
					index: seriesIndex,
					selectionIndex: index,
					data: result[index],
					dataPoints
				};
			}
		}

		if (!this.isCircular() && !this.isMap()) {
			if (!this.isGauge()) {
				result = this.xAxes.filter((axis) => this.checkAxis(axis, pt, plotRect));
				if (result.length) {
					return {
						element: 'xAxis',
						index: this.xAxes.indexOf(result[0]),
						data: result[0]
					};
				}

				result = this.xAxes.filter((axis) => this.checkAxisGrid(axis, pt, plotRect));
				if (result.length) {
					return {
						element: 'xAxisGrid',
						index: this.xAxes.indexOf(result[0]),
						data: result[0]
					};
				}

				result = this.xAxes.filter((axis) => axis.title.position.containsPoint(pt));
				if (result.length) {
					return {
						element: 'xAxisTitle',
						index: this.xAxes.indexOf(result[0]),
						data: result[0].title
					};
				}
			}

			result = this.yAxes.filter((axis) => this.checkAxis(axis, pt, plotRect));
			if (result.length) {
				return {
					element: 'yAxis',
					index: this.yAxes.indexOf(result[0]),
					data: result[0]
				};
			}

			result = this.yAxes.filter((axis) => this.checkAxisGrid(axis, pt, plotRect));
			if (result.length) {
				return {
					element: 'yAxisGrid',
					index: this.yAxes.indexOf(result[0]),
					data: result[0]
				};
			}

			if (!this.isGauge()) {
				result = this.yAxes.filter((axis) => axis.title.position.containsPoint(pt));
				if (result.length) {
					return {
						element: 'yAxisTitle',
						index: this.yAxes.indexOf(result[0]),
						data: result[0].title
					};
				}
			}
		}

		if (this.plot.position.containsPoint(pt)) {
			return {
				element: 'plot',
				data: this.plot
			};
		}

		return undefined;
	}

	createSeriesFromSelection(viewer, sheet, selection, type) {
		if (!selection.hasSelection()) {
			return;
		}

		const cmdChart = this.prepareCommand('chart');
		const cmdAxis = this.prepareCommand('axes');
		const cmdLegend = this.prepareCommand('legend');
		const markers = type.indexOf('marker') === -1 ? false : 'rect';
		const line = type !== 'scattermarker';

		this.chart.formula = new Expression(
			0,
			selection.toStringByIndex(0, { item: sheet, useName: true, forceName: true })
		);

		type = this.setChartType(type);

		this.series = [];
		this.updateSeriesFromRange(viewer, sheet, selection, type, line, markers, cmdChart, cmdAxis, cmdLegend, true);
	}

	setChartType(type) {
		this.chart.type = type;
		this.chart.rotation = Math.PI_2;
		this.chart.startAngle = 0;
		this.chart.endAngle = Math.PI * 2;
		this.chart.hole = 0.5;
		this.chart.step = false;
		this.chart.stacked = type.indexOf('stacked') !== -1;
		this.chart.relative = type.indexOf('100') !== -1;
		this.chart.step = type.indexOf('step') !== -1;
		this.chart.hiLoLines.visible = false;
		this.chart.upBars.visible = false;
		this.chart.downBars.visible = false;
		this.xAxes[0].visible = true;
		this.yAxes[0].visible = true;
		this.xAxes[0].invert = false;
		this.yAxes[0].invert = false;
		this.xAxes[0].type = 'linear';
		this.yAxes[0].type = 'linear';
		this.xAxes[0].align = 'bottom';
		this.yAxes[0].align = 'left';
		this.xAxes[0].gridVisible = true;
		this.yAxes[0].gridVisible = true;
		this.chart.varyByCategories = false;

		switch (type) {
		case 'pie':
		case 'pie3d':
		case 'piehalf':
			this.chart.stacked = true;
			this.chart.relative = true;
			this.chart.hole = 0;
			this.chart.rotation = type === 'pie3d' ? Math.PI / 6 : Math.PI / 2;
			this.chart.startAngle = type === 'piehalf' ? Math.PI_2 * 3 : 0;
			this.chart.endAngle = type === 'piehalf' ? Math.PI_2 * 5 : Math.PI * 2;
			this.legend.align = 'bottom';
			this.xAxes[0].type = 'category';
			this.xAxes[0].visible = false;
			this.yAxes[0].visible = false;
			this.chart.varyByCategories = true;
			type = 'pie';
			break;
		case 'doughnut':
			this.chart.stacked = true;
			this.chart.relative = true;
			this.chart.hole = 0.5;
			this.legend.align = 'bottom';
			this.xAxes[0].type = 'category';
			this.xAxes[0].visible = false;
			this.yAxes[0].visible = false;
			this.chart.varyByCategories = true;
			type = 'doughnut';
			break;
		case 'columnstacked100':
		case 'columnstacked':
		case 'column':
			this.xAxes[0].type = 'category';
			type = 'column';
			break;
		case 'barstacked100':
		case 'barstacked':
		case 'bar':
			this.xAxes[0].type = 'category';
			this.xAxes[0].align = 'left';
			this.yAxes[0].align = 'bottom';
			type = 'bar';
			break;
		case 'profile':
			this.xAxes[0].type = 'category';
			this.xAxes[0].align = 'left';
			this.yAxes[0].align = 'bottom';
			type = 'profile';
			break;
		case 'area':
		case 'areastacked':
		case 'areastacked100':
			this.xAxes[0].type = 'category';
			type = 'area';
			break;
		case 'linestep':
		case 'line':
		case 'linestacked':
		case 'linestacked100':
			this.xAxes[0].type = 'category';
			type = 'line';
			break;
		case 'heatmap':
			this.xAxes[0].type = 'linear';
			this.legend.visible = false;
			break;
		case 'scattermarker':
			type = 'scatter';
			this.xAxes[0].type = 'linear';
			break;
		case 'scatterline':
		case 'scatterlinemarker':
			type = 'scatter';
			this.xAxes[0].type = 'linear';
			break;
		case 'bubble':
			this.xAxes[0].type = 'linear';
			break;
		default:
			break;
		}

		return type;
	}

	setChartTypeForSeries(type) {
		this.series.forEach((serie) => {
			serie.dataLabel.content = { x: false, y: true };
			switch (serie.type) {
			case 'state':
			case 'funnelbar':
			case 'funnelcolumn':
				serie.barGap = 0;
				break;
			default:
				serie.barGap = 0.3;
			}
			switch (serie.type) {
			case 'pie':
				serie.dataLabel.position = 'outer';
				break;
				// eslint-disable-next-line no-fallthrough
			case 'line':
			case 'profile':
			case 'scatter':
			case 'bubble':
				serie.dataLabel.position = 'above';
				break;
			default:
				serie.dataLabel.position = 'behindend';
				break;
			}
		});
	}

	updateFormulas(viewer, formula, cmdChart) {
		const sheet = this.getSheet();
		const series = this.series.length ? this.series[0] : undefined;
		const type = series ? series.type : 'line';
		const line = series && series.format.lineStyle !== undefined ? series.format.lineStyle : true;
		const markers = series ? series.marker.style : false;

		const range = JSG.CellRange.parse(formula, sheet, true);
		if (range) {
			range.shiftFromSheet();
			const selection = new JSG.Selection(sheet);
			selection.add(range);
			this.chart.formula = new JSG.Expression(0, formula);
			this.chart.coharentData = true;

			this.updateSeriesFromRange(
				viewer,
				sheet,
				selection,
				this.chart.type ? this.chart.type : type,
				line,
				markers,
				cmdChart,
				undefined,
				undefined,
				false
			);
		}
	}

	updateSeriesFromRange(viewer, sheet, selection, type, line, markers, cmdChart, cmdAxis, cmdLegend, initial) {
		let seriesIndex = 0;
		const createSeries = (ltype, lformula, marker, lline) => {
			let serie;
			if (initial || seriesIndex >= this.series.length) {
				serie = new ChartSeries(ltype, new Expression(0, lformula));
				if (marker) {
					serie.marker._style = marker;
				}
				if (lline === false) {
					serie.format.lineStyle = 0;
				}
				this.series.push(serie);
			} else {
				serie = this.series[seriesIndex];
				serie.formula = new Expression(0, lformula);
			}
			seriesIndex += 1;

			return serie;
		};
		const removeOldSeries = () => {
			const old = this.series.length - seriesIndex;
			if (old > 0) {
				this.series.splice(seriesIndex, old);
			}
		};

		let step = 1;

		switch (type) {
		case 'columnstacked100':
		case 'columnstacked':
			type = 'column';
			break;
		case 'barstacked100':
		case 'barstacked':
			type = 'bar';
			break;
		case 'areastacked':
		case 'areastacked100':
			type = 'area';
			break;
		case 'linestep':
		case 'line':
		case 'linestacked':
		case 'linestacked100':
			type = 'line';
			break;
		case 'scattermarker':
		case 'scatterline':
		case 'scatterlinemarker':
			type = 'scatter';
			break;
			// eslint-disable-next-line no-fallthrough
		case 'heatmap':
		case 'bubble':
			step = 2;
			break;
		default:
			break;
		}

		const range = selection.getAt(0);
		const width = range.getWidth();
		const height = range.getHeight();
		const data = range.getSheet().getDataProvider();
		let time = true;
		let formula;
		let cmd;
		const cmp = new CompoundCommand();

		// check for TIMEAGGREGATES and INFLUX.SELECT
		if (width <= 2 || height <= 2) {
			let colSeriesLabels = false;
			let rowSeriesLabels = false;
			const taRange = range.copy();
			taRange.enumerateCells(true, (pos) => {
				const cell = data.get(pos);
				if (!this.isTimeBasedCell(cell)) {
					time = false;
				}
			});
			if (time === false) {
				time = true;
				if (width === 2) {
					taRange._x1 += 1;
					colSeriesLabels = true;
				} else if (height === 2) {
					taRange._y1 += 1;
					rowSeriesLabels = true;
				}
				taRange.enumerateCells(true, (pos) => {
					const cell = data.get(pos);
					if (!this.isTimeBasedCell(cell)) {
						time = false;
					}
				});
			}
			if (time) {
				if (viewer) {
					cmd = this.prepareCommand('series');
				}
				taRange.enumerateCells(true, (pos) => {
					const cell = data.get(pos);
					const source = new CellRange(taRange.getSheet(), pos.x, pos.y);
					source.shiftToSheet();
					const ref = source.toString({ item: sheet, useName: true, forceName: true });
					const xValue = cell.xvalue;
					let seriesLabel;
					if (colSeriesLabels) {
						const labels = new CellRange(taRange.getSheet(), pos.x - 1, pos.y);
						labels.shiftToSheet();
						seriesLabel = labels.toString({ item: sheet, useName: true, forceName: true });
					} else if (rowSeriesLabels) {
						const labels = new CellRange(taRange.getSheet(), pos.x, pos.y - 1);
						labels.shiftToSheet();
						seriesLabel = labels.toString({ item: sheet, useName: true, forceName: true });
					}

					const values = cell.values;
					if (values && values.time) {
						const fields = Object.keys(values);
						for (let i = 0; i < fields.length; i += 1) {
							const key = fields[i];
							if (key !== xValue && key !== 'time') {
								if (values[key].length && Numbers.isNumber(values[key][0])) {
									const label = seriesLabel || `"${key}"`;
									if (type === 'bubble' || type === 'state' || type === 'heatmap') {
										i += 1;
										for (; i < fields.length; i += 1) {
											const radius = fields[i];
											if (
												values[radius].length &&
												(Numbers.isNumber(values[radius][0]) || type === 'state')
											) {
												formula = `SERIESTIME("${xValue}",${label},${ref},"${xValue}","${key}","${radius}")`;
												break;
											}
										}
										if (formula === undefined) {
											formula = `SERIESTIME("${xValue}",${label},${ref},"${xValue}","${key}")`;
										}
									} else {
										formula = `SERIESTIME("${xValue}",${label},${ref},"${xValue}","${key}")`;
									}
									createSeries(type, formula, markers, line);
								}
							}
						}
					} else {
						formula = `SERIESTIME("${xValue}",,${ref},"${xValue}","value")`;
						createSeries(type, formula, markers, line);
					}
					if (xValue === 'time') {
						if (type === 'scatter' || type === 'bubble') {
							this.xAxes[0].type = 'time';
						} else {
							this.xAxes[0].format.localCulture = `time;en`;
							this.xAxes[0].format.numberFormat = 'h:mm:ss';
						}
					}
				});
				if (!initial) {
					removeOldSeries();
				}
				this.setChartTypeForSeries(type);
				if (viewer) {
					this.finishCommand(cmd, 'series');
					cmp.add(cmd);
				}
			}
		}

		if (!cmp.hasCommands()) {
			let vertical;
			if (initial) {
				vertical = range.getHeight() > range.getWidth() || type === 'map';
				this.chart.dataInRows = vertical;
			} else {
				vertical = this.chart.dataInRows;
			}

			let startI = vertical ? range._x1 : range._y1;
			let endI = vertical ? range._x2 : range._y2;
			const startJ = vertical ? range._y1 : range._x1;
			let endJ = vertical ? range._y2 : range._x2;
			let column;
			let row;
			let refName;
			let seriesLabels = false;
			const tmpRange = new CellRange(range.getSheet(), 0, 0);
			let start = vertical ? range._y1 + 1 : range._x1 + 1;
			let end = vertical ? range._y2 : range._x2;
			let cell;
			let val;
			let categoryLabels = false;

			if (viewer) {
				cmd = this.prepareCommand('series');
			}

			if (initial) {
				for (let i = start; i <= end; i += 1) {
					cell = vertical
						? range
							.getSheet()
							.getDataProvider()
							.getRC(range._x1, i)
						: range
							.getSheet()
							.getDataProvider()
							.getRC(i, range._y1);
					if (cell) {
						val = cell.getValue();
						if (typeof val === 'string' && val.length) {
							categoryLabels = true;
							break;
						}
					}
				}
				switch (type) {
				case 'state':
				case 'bubble':
				case 'scatter':
				case 'heatmap':
					if (!categoryLabels && ((vertical && width > 1) || (!vertical && height > 1))) {
						categoryLabels = true;
					}
					break;
				case 'map':
					categoryLabels = true;
					break;
				default:
					break;
				}
				this.chart.firstCategoryLabels = categoryLabels;
			} else {
				categoryLabels = this.chart.firstCategoryLabels;
			}

			if (categoryLabels) {
				startI += 1;
			}

			endI = Math.max(startI, endI);
			start = vertical ? range._x1 + (categoryLabels ? 1 : 0) : range._y1 + (categoryLabels ? 1 : 0);
			end = vertical ? range._x2 : range._y2;

			if (initial) {
				seriesLabels = true;
				for (let i = start; i <= end; i += 1) {
					cell = vertical
						? range
							.getSheet()
							.getDataProvider()
							.getRC(i, range._y1)
						: range
							.getSheet()
							.getDataProvider()
							.getRC(range._x1, i);
					if (cell) {
						val = cell.getValue();
						if (Numbers.isNumber(val)) {
							seriesLabels = false;
						}
					} else if (type === 'map') {
						seriesLabels = false;
					}
				}
				this.chart.firstSeriesLabels = seriesLabels;
			} else {
				seriesLabels = this.chart.firstSeriesLabels;
			}

			if (this.chart.type === 'gaugevalue') {
				endJ = startJ + (seriesLabels ? 1 : 0);
			}

			for (let i = startI; i <= endI; i += step) {
				formula = 'SERIES(';
				column = vertical ? i : startJ;
				row = vertical ? startJ : i;

				if (seriesLabels) {
					tmpRange.set(column, row, column, row);
					tmpRange.shiftToSheet();
					refName = tmpRange.toString({ item: sheet, useName: true, forceName: true });
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
					refName = tmpRange.toString({ item: sheet, useName: true, forceName: true });
					formula += `${refName},`;
				} else {
					formula += ',';
				}

				if (vertical) {
					tmpRange.set(column, row + (seriesLabels ? 1 : 0), column, row + endJ - startJ);
				} else {
					tmpRange.set(column + (seriesLabels ? 1 : 0), row, column + endJ - startJ, row);
				}

				tmpRange.shiftToSheet();
				refName = tmpRange.toString({ item: sheet, useName: true, forceName: true });
				formula += `${refName}`;

				if (type === 'bubble' || type === 'state' || type === 'heatmap') {
					if (vertical) {
						tmpRange.set(column + 1, row + (seriesLabels ? 1 : 0), column + 1, row + endJ - startJ);
					} else {
						tmpRange.set(column + (seriesLabels ? 1 : 0), row + 1, column + endJ - startJ, row + 1);
					}
					tmpRange.shiftToSheet();
					refName = tmpRange.toString({ item: sheet, useName: true, forceName: true });
					formula += `,${refName}`;
				}

				formula += ')';

				createSeries(type, formula, markers, line);
			}
			if (!initial) {
				removeOldSeries();
			}
			this.setChartTypeForSeries(type);
			if (viewer) {
				this.finishCommand(cmd, 'series');
				cmp.add(cmd);
			}
		}

		this.evaluate();

		if (cmp.hasCommands()) {
			if (cmdChart) {
				this.finishCommand(cmdChart, 'chart');
				cmp.add(cmdChart);
			}
			if (cmdAxis) {
				this.finishCommand(cmdAxis, 'axes');
				cmp.add(cmdAxis);
			}
			if (cmdLegend) {
				this.finishCommand(cmdLegend, 'legend');
				cmp.add(cmdLegend);
			}
			if (viewer) {
				viewer.getInteractionHandler().execute(cmp);
			}
		}
	}

	guessMap(serie) {
		serie.formula.evaluate(this);
		const ref = this.getDataSourceInfo(serie.formula);
		const categoryCount = Math.min(10, this.getCategoryCount(ref));
		let i = 0;
		const labels = [];

		while (i < categoryCount) {
			const label = this.getLabel(ref, undefined, i, false);
			if (label.length) {
				labels.push(label);
			}
			i += 1;
		}

		if (labels.length) {
			let necessaryHits = Math.min(labels.length, 5);

			const fmap = JSG.mapInfo.maps.filter((map) => {
				const hits = labels.filter((label) => map.regions.indexOf(label) !== -1);
				if (hits.length >= necessaryHits) {
					necessaryHits = hits.length;
					return true;
				}
				return false;
			});
			serie.map.name = fmap.length ? fmap[0].file : 'world_countries.json';
		} else {
			serie.map.name = 'world_countries.json';
		}
	}

	newInstance() {
		return new SheetPlotNode();
	}

	get expressions() {
		const exprs = super.expressions;
		const add = (expr => {
			if (expr.hasFormula()) {
				exprs.push(expr);
			}
		});

		this.series.forEach((serie) => {
			add(serie.formula);
		});
		this.xAxes.forEach((axis) => {
			add(axis.formula);
			add(axis.title.formula);
			axis.valueRanges.forEach((range) => {
				add(range.formula);
			});
		});
		this.yAxes.forEach((axis) => {
			add(axis.formula);
			add(axis.title.formula);
			axis.valueRanges.forEach((range) => {
				add(range.formula);
			});
		});
		add(this.title.formula);
		add(this.legend.formula);
		add(this.chart.formula);

		return exprs;
	}

	evaluate() {
		super.evaluate();

		if (this.getGraph() === undefined || this._isFeedback) {
			return;
		}

		if (this.migrationData) {
			const data = this.migrationData;
			this.migrationData = undefined;
			this.migrateData(data);
		}

		this.series.forEach((serie) => {
			serie.formula.evaluate(this);
		});
		this.xAxes.forEach((axis) => {
			axis.formula.evaluate(this);
			axis.title.formula.evaluate(this);
			axis.valueRanges.forEach((range) => {
				range.formula.evaluate(this);
			});
		});
		this.yAxes.forEach((axis) => {
			axis.formula.evaluate(this);
			axis.title.formula.evaluate(this);
			axis.valueRanges.forEach((range) => {
				range.formula.evaluate(this);
			});
		});
		this.title.formula.evaluate(this);
		this.legend.formula.evaluate(this);
		this.chart.formula.evaluate(this);
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		copy.series = [];

		this.series.forEach((serie) => {
			const copySerie = new ChartSeries(serie.type, serie.formula.copy());
			copy.series.push(copySerie);
		});

		return copy;
	}

	savePlot(writer) {
		writer.writeStartElement('plot');
		this.plot.format.save('format', writer);
		writer.writeEndElement();
	}

	saveLegend(writer) {
		writer.writeStartElement('legend');
		writer.writeAttributeNumber('visible', this.legend.visible ? 1 : 0);
		writer.writeAttributeString('align', this.legend.align);
		this.legend.formula.save('formula', writer);
		this.legend.format.save('format', writer);
		writer.writeEndElement();
	}

	saveSeries(writer) {
		writer.writeStartArray('series');

		this.series.forEach((serie) => {
			serie.save(writer);
		});
		writer.writeEndArray('series');
	}

	saveAxes(writer) {
		const save = (data, name) => {
			writer.writeStartArray(name);
			data.forEach((axis) => {
				axis.save(writer, name);
			});
			writer.writeEndArray(name);
		};

		save(this.xAxes, 'xaxis');
		save(this.yAxes, 'yaxis');
	}

	getItemType() {
		return 'streamchart';
	}

	saveContent(writer, absolute) {
		super.saveContent(writer, absolute);

		writer.writeStartElement('plot');

		this.chart.save(writer);
		this.savePlot(writer);
		this.title.save('title', writer);
		this.saveSeries(writer);
		this.saveAxes(writer);
		this.saveLegend(writer);

		writer.writeEndElement();
	}

	fromJSON(json) {
		super.fromJSON(json);

		const reader = new JSONReader();

		reader.iterateObjects(json.chart, (name, child) => {
			switch (name) {
			case 'plot':
				this.readPlot(reader, child);
				break;
			case 'chart':
				this.chart.read(reader, child);
				break;
			case 'title':
				this.title.read(reader, child);
				break;
			case 'legend':
				this.readLegend(reader, child);
				break;
			default:
				break;
			}
		});
		this.readSeries(reader, json.chart);
		this.readAxes(reader, json.chart);
	}

	toJSON() {
		const json = super.toJSON();

		const writer = new JSONWriter();
		writer.writeStartDocument();
		this.chart.save(writer);
		this.savePlot(writer);
		this.title.save('title', writer);
		this.saveSeries(writer);
		this.saveAxes(writer);
		this.saveLegend(writer);
		writer.writeEndDocument();

		json.chart = writer.flush(true);

		json.chart['o-title']['o-formula'].msc = true;

		return json;
	}

	readLegend(reader, object) {
		this.legend.visible =
			reader.getAttribute(object, 'visible') === undefined
				? true
				: !!Number(reader.getAttribute(object, 'visible'));
		this.legend.align =
			reader.getAttribute(object, 'align') === undefined ? 'right' : reader.getAttribute(object, 'align');

		reader.iterateObjects(object, (subName, subChild) => {
			switch (subName) {
			case 'formula':
				this.legend.formula = new Expression(0);
				this.legend.formula.read(reader, subChild);
				break;
			case 'format':
				this.legend.format = new ChartFormat();
				this.legend.format.read(reader, subChild);
				break;
			default:
				break;
			}
		});
	}

	readPlot(reader, object) {
		reader.iterateObjects(object, (subName, subChild) => {
			switch (subName) {
			case 'format':
				this.plot.format = new ChartFormat();
				this.plot.format.read(reader, subChild);
				break;
			default:
				break;
			}
		});
	}

	readSeries(reader, object) {
		let index = 0;

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
			case 'series': {
				let serie;
				if (this.series.length - 1 < index) {
					serie = new ChartSeries();
					this.series.push(serie);
				} else {
					serie = this.series[index];
				}
				serie.read(reader, child);
				index += 1;
				break;
			}
			default:
				break;
			}
		});

		this.series.length = index;
	}

	readAxes(reader, object) {
		this.xAxes = [];
		this.yAxes = [];

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
			case 'xaxis':
			case 'yaxis': {
				const axis = new ChartAxis();
				axis.read(reader, child);
				if (name === 'xaxis') {
					this.xAxes.push(axis);
				} else {
					this.yAxes.push(axis);
				}
				break;
			}
			default:
				break;
			}
		});
	}

	read(reader, object) {
		super.read(reader, object);

		const type = reader.getAttributeString(object, 'type', '');
		if (type === 'chartnode') {
			this.migrate(reader, object);
			return;
		}

		const plot = reader.getObject(object, 'plot');
		if (plot) {
			reader.iterateObjects(plot, (name, child) => {
				switch (name) {
				case 'plot':
					this.readPlot(reader, child);
					break;
				case 'chart':
					this.chart.read(reader, child);
					break;
				case 'title':
					this.title.read(reader, child);
					break;
				case 'legend':
					this.readLegend(reader, child);
					break;
				default:
					break;
				}
			});
			this.readSeries(reader, plot);
			this.readAxes(reader, plot);
		}

		this.getItemAttributes().setContainer(false);
	}

	saveByKey(key) {
		const writer = new JSONWriter();
		writer.writeStartDocument();
		switch (key) {
		case 'title':
			this.title.save('title', writer);
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
		case 'plot':
			this.savePlot(writer);
			break;
		case 'chart':
			this.chart.save(writer);
			break;
		default:
			break;
		}
		writer.writeEndDocument();

		return writer.flush();
	}

	prepareCommand(key) {
		// save current state
		const current = this.saveByKey(key);
		return new SetPlotDataCommand(this, key, undefined, current);
	}

	finishCommand(cmd, key) {
		cmd._data = this.saveByKey(key);
	}

	_assignName(id) {
		const name = this.getGraph().getUniqueName('Streamchart');
		this.setName(name);
	}

	getSheet() {
		let sheet = this;

		while (sheet && !sheet.getCellDescriptors) {
			sheet = sheet.getParent();
		}

		return sheet;
	}

	isZoomed(serie) {
		const cell = getTimeCell(this, serie.formula);
		this.chartZoom =
			this.chartZoom && this.cellValuesMarker !== -1 && cell && cell.valuesMarker !== this.cellValuesMarker;
		return !this.chartZoom;
	}

	spreadZoomInfo(viewer, zoomcmds) {
		const items = new Map();
		const sheet = this.getSheet();
		GraphUtils.traverseItem(
			sheet,
			(item) => {
				if (item instanceof SheetPlotNode) {
					item.chartZoom = false;
					item.series.forEach(({ formula }) => {
						const cell = getTimeCell(item, formula);
						const cellref = isValuesCell(cell) && getCellReference(item, formula);
						item.chartZoom = !!cellref;
						// support multiple items on same reference
						if (item.chartZoom) items.set(item, cellref);
					});
					this.cellValuesMarker = -1;
					item.chartZoomTimestamp = new Date(Date.now());
				}
			},
			false
		);
		if (items.size || zoomcmds.length) {
			const zoomchart = new ZoomChartCommand();
			zoomcmds.forEach((cmd) => zoomchart.add(cmd));
			if (items.size) zoomchart.add(MarkCellValuesCommand.fromItemCellRefMap(items));
			viewer.getInteractionHandler().execute(zoomchart);
		}
	}

	mapZoomPlus() {
		this.chart.mapZoomFactor = Math.min(5, this.chart.mapZoomFactor * 1.1);
	}

	mapZoomMinus() {
		this.chart.mapZoomFactor = Math.max(1, this.chart.mapZoomFactor * 0.9);
	}

	showActionMenu(viewer) {
		viewer
			.getCanvas()
			._jsgEditor.getItemMenuHandler()
			.showMenu(this);
	}

	resetZoom(viewer) {
		const group = this.getAxes().x.zoomGroup;
		const sheet = this.getSheet();
		const zoomcmds = [];

		GraphUtils.traverseItem(
			sheet,
			(item) => {
				if (item instanceof SheetPlotNode) {
					const groupOther = item.getAxes().x.zoomGroup;
					if (item === this || (groupOther.length && group === groupOther)) {
						const cmd = item.setParamValues(
							viewer,
							item.xAxes[0].formula,
							[
								{ index: 4, value: undefined },
								{ index: 5, value: undefined }
							],
							item
						);
						item.chartZoomTimestamp = undefined;
						if (cmd) zoomcmds.push(cmd);
					}
				}
			},
			false
		);

		this.spreadZoomInfo(viewer, zoomcmds);
	}

	isAddLabelAllowed() {
		return false;
	}

	getTemplate() {
		return templates[this.chart.template === 'basic' ? JSG.theme.chart : this.chart.template];
	}

	reAssignAxis(axis, xAxis) {
		if (xAxis) {
			this.series.forEach((serie) => {
				if (serie.xAxis === axis.name) {
					serie.xAxis = this.xAxes[0].name;
				}
			});
		} else {
			this.series.forEach((serie) => {
				if (serie.yAxis === axis.name) {
					serie.yAxis = this.yAxes[0].name;
				}
			});
		}
	}

	getUniqueAxisName(axes) {
		let array;
		let name;
		let i = 1;

		if (axes === 'xAxis') {
			array = this.xAxes;
			name = 'XAxis';
		} else {
			array = this.yAxes;
			name = 'YAxis';
		}

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const test = `${name}${i}`;
			if (!array.some((axis) => axis.name === test)) {
				return test;
			}
			i += 1;
		}
	}

	getAllowZoom(axis) {
		if (this.isCircular()) {
			return false;
		}

		return axis.allowZoom;
	}

	getFirstSerieOfType(type) {
		let ret;

		this.series.some((serie) => {
			if (serie.type === type) {
				ret = serie;
				return true;
			}
			return false;
		});

		return ret;
	}

	getFirstLastSerieIndicesOfType(type) {
		let first;
		let last;

		this.series.forEach((serie, index) => {
			if (serie.type === type) {
				if (first === undefined) {
					first = index;
					last = index;
				}
				if (this.series[first].xAxis === serie.xAxis) {
					last = index;
				}
			}
		});

		return {
			first,
			last
		};
	}

	isCircular() {
		return this.series.length && (this.series[0].type === 'pie' || this.series[0].type === 'doughnut');
	}

	isPie() {
		return this.series.length && this.series[0].type === 'pie';
	}

	isMap() {
		return this.series.length && this.series[0].type === 'map';
	}

	isGauge() {
		return this.series.length && this.series[0].type === 'gauge';
	}

	isType(type) {
		return this.series.length && this.series[0].type === type;
	}

	isBoxPlot() {
		return this.series.length && this.series[0].type === 'boxplot';
	}

	isLineType(serie) {
		return serie.type === 'line' || serie.type === 'profile' || serie.type === 'scatter';
	}

	isHorizontalChart() {
		if (this.series.length === 0) {
			return false;
		}

		const serie = this.series[0];

		return serie.type === 'bar' || serie.type === 'profile' || serie.type === 'funnelbar';
	}

	getDataPoint(series, selection) {
		let point;

		if (series.points[selection.pointIndex]) {
			point = series.points[selection.pointIndex];
		} else {
			point = new ChartPoint();
			series.points[selection.pointIndex] = point;
		}

		return point;
	}

	hasSeriesDataLabel(serie) {
		const ret = serie.points.some((point) => {
			return point.dataLabel && point.dataLabel.visible === true;
		});

		return ret || serie.dataLabel.visible;
	}

	hasDataPointLabel(serie, index) {
		if (
			serie.points[index] &&
			serie.points[index].dataLabel &&
			serie.points[index].dataLabel.visible !== undefined
		) {
			return serie.points[index].dataLabel.visible;
		}

		return serie.dataLabel.visible;
	}

	getBoxPlotValues(ref, axes) {
	}

	getBoxPlotFigures(valueSet) {
	}

	getChartMapBox(labels) {
	}

	getFeatureCenter(feature, mapInfo, serie, ref, mapIndex) {
	}

	getMapInfo(plotRect, serie, ref) {
	}

	getMapBox(features) {
	}

	enumerateMapCoordinates(geometry, func) {
		return false;
	}

	findMapIndex(properties, serie, labels) {
		return -1;
	}

	getMapRadius(serie, ref, mapIndex, mapInfo) {
	}

	/* eslint-disable no-unused-expressions, no-sequences, no-multi-assign, no-bitwise */
	colorShade(percent, colorFrom, colorTo, l) {
		let r;
		let g;
		let b;
		let P;
		let f;
		let t;
		let h;
		const i = parseInt;
		const m = Math.round;
		let a = typeof colorTo === 'string';
		if (
			typeof percent !== 'number' ||
			percent < -1 ||
			percent > 1 ||
			typeof colorFrom !== 'string' ||
			(colorFrom[0] !== 'r' && colorFrom[0] !== '#') ||
			(colorTo && !a)
		)
			return null;
		if (!this.pSBCr)
			this.pSBCr = (d) => {
				let n = d.length;
				const x = {};
				if (n > 9) {
					([r, g, b, a] = d = d.split(',')), (n = d.length);
					if (n < 3 || n > 4) return null;
					(x.r = i(r[3] === 'a' ? r.slice(5) : r.slice(4))),
						(x.g = i(g)),
						(x.b = i(b)),
						(x.a = a ? parseFloat(a) : -1);
				} else {
					if (n === 8 || n === 6 || n < 4) return null;
					if (n < 6) d = `#${d[1]}${d[1]}${d[2]}${d[2]}${d[3]}${d[3]}${n > 4 ? d[4] + d[4] : ''}`;
					d = i(d.slice(1), 16);
					if (n === 9 || n === 5)
						(x.r = (d >> 24) & 255),
							(x.g = (d >> 16) & 255),
							(x.b = (d >> 8) & 255),
							(x.a = m((d & 255) / 0.255) / 1000);
					else (x.r = d >> 16), (x.g = (d >> 8) & 255), (x.b = d & 255), (x.a = -1);
				}
				return x;
			};
		(h = colorFrom.length > 9),
			// eslint-disable-next-line no-nested-ternary
			(h = a ? (colorTo.length > 9 ? true : colorTo === 'c' ? !h : false) : h),
			(f = this.pSBCr(colorFrom)),
			(P = percent < 0),
			(t =
				// eslint-disable-next-line no-nested-ternary
				colorTo && colorTo !== 'c'
					? this.pSBCr(colorTo)
					: P
					? { r: 0, g: 0, b: 0, a: -1 }
					: { r: 255, g: 255, b: 255, a: -1 }),
			(percent = P ? percent * -1 : percent),
			(P = 1 - percent);
		if (!f || !t) return null;
		if (l) (r = m(P * f.r + percent * t.r)), (g = m(P * f.g + percent * t.g)), (b = m(P * f.b + percent * t.b));
		else
			(r = m((P * f.r ** 2 + percent * t.r ** 2) ** 0.5)),
				(g = m((P * f.g ** 2 + percent * t.g ** 2) ** 0.5)),
				(b = m((P * f.b ** 2 + percent * t.b ** 2) ** 0.5));
		// eslint-disable-next-line no-nested-ternary
		(a = f.a), (t = t.a), (f = a >= 0 || t >= 0), (a = f ? (a < 0 ? t : t < 0 ? a : a * P + t * percent) : 0);
		if (h) return `rgb${f ? 'a(' : '('}${r},${g},${b}${f ? `,${m(a * 1000) / 1000}` : ''})`;
		return `#${(4294967296 + r * 16777216 + g * 65536 + b * 256 + (f ? m(a * 255) : 0))
			.toString(16)
			.slice(1, f ? undefined : -2)}`;
	}

	getSeriesLabel(serie) {
		const ref = this.getDataSourceInfo(serie.formula);
		if (ref && ref.yName !== undefined) {
			return ref.yName;
		}

		return String(this.series.indexOf(serie) + 1);
	}

	getPropertyCategories() {
		const cats = [
			{
				key: 'general',
				label: 'GraphItemProperties.General',
				name: '',
			},
			{
				key: 'format',
				label: 'GraphItemProperties.Format',
				name: '',
			},
			{
				key: 'attributes',
				label: 'GraphItemProperties.Attributes',
				name: '',
			},
			{
				key: 'events',
				label: 'GraphItemProperties.Events',
				name: '',
			},
			{
				key: 'chart',
				label: 'StreamChartProperties.Chart',
				name: '',
			},
			{
				key: 'plot',
				label: 'StreamChartProperties.Plot',
				name: '',
			},
			{
				key: 'title',
				label: 'StreamChartProperties.Title',
				name: '',
			},
			{
				key: 'legend',
				label: 'StreamChartProperties.Legend',
				name: '',
			},
			{
				key: 'series',
				label: 'StreamChartProperties.Series',
				name: '',
			},
			{
				key: 'serieslabel',
				label: 'StreamChartProperties.SeriesLabel',
				name: '',
			},
			{
				key: 'axes',
				label: 'StreamChartProperties.Axes',
				name: '',
			},
			{
				key: 'axesgrid',
				label: 'StreamChartProperties.AxesGrid',
				name: '',
			},
			{
				key: 'axestitle',
				label: 'StreamChartProperties.AxesTitle',
				name: '',
			}
		]

		cats.push({
			key: 'point',
			label: 'StreamChartProperties.Point',
			name: '',
		});

		return cats;
	}

	static get templates() {
		return templates;
	}
};
