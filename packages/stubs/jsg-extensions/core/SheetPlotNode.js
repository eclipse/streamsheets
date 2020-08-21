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
	ZoomChartCommand,
	MarkCellValuesCommand,
	SetPlotDataCommand,
	CompoundCommand,
	Chart,
	ChartFormat,
	ChartAxis,
	ChartRect,
	ChartSeries,
	ChartTitle
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
		const fontColor = format.fontColor || this.getTemplate()[id].format.fontColor || this.getTemplate().font.color;
		const fontName = format.fontName || this.getTemplate()[id].format.fontName || this.getTemplate().font.name;
		const fontSize = format.fontSize || this.getTemplate()[id].format.fontSize || this.getTemplate().font.size;
		const fontStyle = format.fontStyle === undefined ? this.getTemplate()[id].format.fontStyle : format.fontStyle;

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

		axis.textSize = {
			width: 1000,
			height: 300,
			firstWidth: 0,
			firstHeight: 0,
			firstPos: 0,
			lastPos: 0,
			lastWidth: 0,
			lastHeight: 0
		};

		if (!axis.position || !axis.scale || !axis.visible) {
			return result;
		}

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
				text = this.getLabel(refLabel, axis, Math.floor(current.value));
			} else {
				text = this.formatNumber(
					current.value,
					axis.format && axis.format.numberFormat ? axis.format : axis.scale.format
				);
			}

			const size = this.measureText(graphics, cs, axis.format, 'axis', text);
			result.width = Math.max(result.width, size.width);
			result.height = Math.max(result.height, size.height);

			result.lastPos = pos;
			result.lastWidth = size.width + 200;
			result.lastHeight = size.height + 200;
			if (result.firstWidth === undefined) {
				result.firstPos = pos;
				result.firstWidth = result.width + 200;
				result.firstHeight = result.height + 200;
			}

			current = this.incrementScale(refLabel, axis, current);
		}

		axis.textSize.width = Math.max(result.width + 150, 1000);
		axis.textSize.height = Math.max(result.height + 100, 300);
		if (result.firstPos !== undefined) {
			axis.textSize.firstWidth = result.firstWidth;
			axis.textSize.firstHeight = result.firstHeight;
			axis.textSize.firstPos = result.firstPos;
		}
		if (result.lastPos !== undefined) {
			axis.textSize.lastWidth = result.lastWidth;
			axis.textSize.lastHeight = result.lastHeight;
			axis.textSize.lastPos = result.lastPos;
		}

		result.width += 300;
		result.height += 300;

		return result;
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
				this.actions.push(
					{
						position: new ChartRect(size.x - 3200, 0, size.x - 500, 800),
						action: this.resetZoom,
						title: JSG.getLocalizedString(
							'Reset Zoom'
						)
					}
				);
			}
		});

		this.actions.push(
			{
				position: new ChartRect(size.x - 500, 0, size.x, 800),
				action: this.showActionMenu,
				title: 'sysicon'
			}
		);


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
			let extra = margin * 4;
			legend.forEach((entry) => {
				textSize = this.measureText(JSG.graphics, cs, this.legend.format, 'legend', String(entry.name));
				if (
					this.legend.align === 'left' ||
					this.legend.align === 'middleleft' ||
					this.legend.align === 'middleright' ||
					this.legend.align === 'right'
				) {
					legendWidth = Math.max(textSize.width, legendWidth);
				} else {
					legendWidth += textSize.width;
				}
				if (!entry.series || entry.series.type !== 'bubble') {
					extra = margin * 6;
				}
			});
			const legendHeight = (legend.length - 1) * textSize.height * 1.3 + textSize.height + margin * 2;
			switch (this.legend.align) {
				case 'left':
				case 'middleleft':
					legendWidth += extra;
					this.legend.position.left = this.plot.position.left;
					this.legend.position.right = this.plot.position.left + legendWidth;
					this.legend.position.top = this.plot.position.top;
					this.legend.position.bottom = this.plot.position.top + legendHeight;
					this.plot.position.left += legendWidth + margin;
					break;
				case 'top':
					legendWidth += extra * legend.length;
					this.legend.position.left = (size.x - legendWidth) / 2;
					this.legend.position.right = (size.x + legendWidth) / 2;
					this.legend.position.top = this.plot.position.top;
					this.legend.position.bottom = this.plot.position.top + textSize.height * 1.5 + margin;
					this.plot.position.top = this.legend.position.bottom + margin;
					break;
				case 'right':
				case 'middleright':
					legendWidth += extra;
					this.plot.position.right -= legendWidth + margin;
					this.legend.position.left = this.plot.position.right + margin;
					this.legend.position.right = size.x - this.chart.margins.right;
					this.legend.position.top = this.plot.position.top;
					this.legend.position.bottom = this.plot.position.top + legendHeight;
					break;
				case 'bottom':
					legendWidth += extra * legend.length;
					this.legend.position.left = (size.x - legendWidth) / 2;
					this.legend.position.right = (size.x + legendWidth) / 2;
					this.legend.position.top = this.plot.position.bottom - textSize.height * 1.5 - margin;
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
						let plot = this.plot.position.bottom - axis.textSize.lastPos * this.plot.position.height;
						if (Math.abs(labelAngle) === Math.PI_2) {
							this.plot.position.top = Math.max(
								this.plot.position.top,
								axis.textSize.lastHeight / 2 - (plot - this.plot.position.top) + 150
							);
						} else if (labelAngle < 0) {
							this.plot.position.top = Math.max(
								this.plot.position.top,
								axis.textSize.lastHeight - (plot - this.plot.position.top) + 150
							);
						}
						plot = this.plot.position.bottom - axis.textSize.firstPos * this.plot.position.height;
						if (Math.abs(labelAngle) === Math.PI_2) {
							this.plot.position.bottom = Math.min(
								this.plot.position.bottom,
								size.y - (plot + axis.textSize.lastHeight / 2 - this.plot.position.bottom)
							);
						} else if (labelAngle > 0) {
							this.plot.position.bottom = Math.min(
								this.plot.position.bottom,
								size.y - (plot + axis.textSize.lastHeight - this.plot.position.bottom)
							);
						}
						break;
					}
					case 'right': {
						let plot = this.plot.position.bottom - axis.textSize.lastPos * this.plot.position.height;
						if (Math.abs(labelAngle) === Math.PI_2) {
							this.plot.position.top = Math.max(
								this.plot.position.top,
								axis.textSize.lastHeight / 2 - (plot - this.plot.position.top) + 150
							);
						} else if (labelAngle > 0) {
							this.plot.position.top = Math.max(
								this.plot.position.top,
								axis.textSize.lastHeight - (plot - this.plot.position.top) + 150
							);
						}
						plot = this.plot.position.bottom - axis.textSize.firstPos * this.plot.position.height;
						if (Math.abs(labelAngle) === Math.PI_2) {
							this.plot.position.bottom = Math.min(
								this.plot.position.bottom,
								size.y - (plot + axis.textSize.lastHeight / 2 - this.plot.position.bottom)
							);
						} else if (labelAngle < 0) {
							this.plot.position.bottom = Math.min(
								this.plot.position.bottom,
								size.y - (plot + axis.textSize.lastHeight - this.plot.position.bottom)
							);
						}
						break;
					}
					case 'top': {
						let plot = axis.textSize.firstPos * this.plot.position.width;
						if (labelAngle === 0) {
							this.plot.position.left = Math.max(
								this.plot.position.left,
								axis.textSize.firstWidth / 2 - plot
							);
						} else if (labelAngle < 0) {
							this.plot.position.left = Math.max(
								this.plot.position.left,
								axis.textSize.firstWidth - plot + 150
							);
						}
						plot = this.plot.position.left + axis.textSize.lastPos * this.plot.position.width;
						if (labelAngle === 0) {
							this.plot.position.right = Math.min(
								this.plot.position.right,
								size.x - (plot + axis.textSize.lastWidth / 2 - this.plot.position.right)
							);
						} else if (labelAngle > 0) {
							this.plot.position.right = Math.min(
								this.plot.position.right,
								size.x - (plot + axis.textSize.lastWidth - this.plot.position.right) - 150
							);
						}
						break;
					}
					case 'bottom': {
						let plot = axis.textSize.firstPos * this.plot.position.width;
						if (labelAngle === 0) {
							this.plot.position.left = Math.max(
								this.plot.position.left,
								axis.textSize.firstWidth / 2 - plot
							);
						} else if (labelAngle > 0) {
							this.plot.position.left = Math.max(
								this.plot.position.left,
								axis.textSize.firstWidth - plot + 150
							);
						}
						plot = this.plot.position.left + axis.textSize.lastPos * this.plot.position.width;
						if (labelAngle === 0) {
							this.plot.position.right = Math.min(
								this.plot.position.right,
								size.x - (plot + axis.textSize.lastWidth / 2 - this.plot.position.right)
							);
						} else if (labelAngle < 0) {
							this.plot.position.right = Math.min(
								this.plot.position.right,
								size.x - (plot + axis.textSize.lastWidth - this.plot.position.right) - 150
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
						let plot = axis.textSize.firstPos * this.plot.position.width;
						if (labelAngle === 0) {
							this.plot.position.left = Math.max(
								this.plot.position.left,
								axis.textSize.firstWidth / 2 - plot
							);
						} else if (labelAngle < 0) {
							this.plot.position.left = Math.max(
								this.plot.position.left,
								axis.textSize.firstWidth - plot + 150
							);
						}
						plot = this.plot.position.left + axis.textSize.lastPos * this.plot.position.width;
						if (labelAngle === 0) {
							this.plot.position.right = Math.min(
								this.plot.position.right,
								size.x - (plot + axis.textSize.lastWidth / 2 - this.plot.position.right)
							);
						} else if (labelAngle > 0) {
							this.plot.position.right = Math.min(
								this.plot.position.right,
								size.x - (plot + axis.textSize.lastWidth - this.plot.position.right) - 150
							);
						}
						break;
					}
					case 'bottom': {
						let plot = axis.textSize.firstPos * this.plot.position.width;
						if (labelAngle === 0) {
							this.plot.position.left = Math.max(
								this.plot.position.left,
								axis.textSize.firstWidth / 2 - plot
							);
						} else if (labelAngle > 0) {
							this.plot.position.left = Math.max(
								this.plot.position.left,
								axis.textSize.firstWidth - plot + 150
							);
						}
						plot = this.plot.position.left + axis.textSize.lastPos * this.plot.position.width;
						if (labelAngle === 0) {
							this.plot.position.right = Math.min(
								this.plot.position.right,
								size.x - (plot + axis.textSize.lastWidth / 2 - this.plot.position.right)
							);
						} else if (labelAngle < 0) {
							this.plot.position.right = Math.min(
								this.plot.position.right,
								size.x - (plot + axis.textSize.lastWidth - this.plot.position.right) - 150
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
				text.push(String(newText));
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
				add(this.getLabel(ref, axis, Math.floor(value.x)));
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
			if (selection) zoomcmd = new JSG.DeleteCellContentCommand(sheet, selection.toStringMulti(), 'all');
			else if (cellData.length) zoomcmd = new JSG.SetCellsCommand(sheet, cellData, false);
		}
		// eslint-disable-next-line consistent-return
		return zoomcmd;
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
				const {operand} = term;
				if (operand instanceof SheetReference && operand._range) {
					return true;
				}
			}
		}

		return false;
	}

	getLegend() {
		const legend = [];

		if (this.series.length && (this.series[0].type === 'pie' || this.series[0].type === 'doughnut')) {
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

		const expr = this.legend.formula;
		if (expr !== undefined) {
			const term = expr.getTerm();
			if (term) {
				const { operand } = term;
				if (operand instanceof SheetReference && operand._range) {
					const range = operand._range.copy();
					range.shiftFromSheet();
					for (let i = 0; i < range.getHeight(); i += 1) {
						const entry = {};
						let cell = range._worksheet.getDataProvider().getRC(range._x1, range._y1 + i);
						entry.name = cell ? cell.getValue() : '';
						cell = range._worksheet.getDataProvider().getRC(range._x1 + 1, range._y1 + i);
						entry.color = cell ? cell.getValue() : '';
						legend.push(entry);
					}
					return legend;
				}
			}
		}

		this.series.forEach((series) => {
			if (series.visible) {
				const ref = this.getDataSourceInfo(series.formula);
				legend.push({
					name: (ref && ref.yName !== undefined) ? ref.yName : '',
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

		this.yAxes.forEach((axis) => {
			axis.categories = [];
		});

		// evaluate min/max for series
		this.series.forEach((serie, index) => {
			if (serie.visible) {
				const ref = this.getDataSourceInfo(serie.formula);
				const axes = this.getAxes(serie);
				axes.x.betweenTicks = (serie.type === 'bar' || serie.type === 'column' || serie.type === 'funnelbar' ||
					serie.type === 'funnelcolumn' || serie.type === 'state') && axes.x.type === 'category';
				if ((this.chart.upBars.visible || this.chart.hiLoLines.visible) && serie.type === 'line') {
					axes.x.betweenTicks = true;
				}
				if (ref) {
					let pointIndex = 0;
					const value = {};
					let xMin = Number.MAX_VALUE;
					let xMax = -Number.MAX_VALUE;
					let yMin = Number.MAX_VALUE;
					let yMax = -Number.MAX_VALUE;
					let cMin = Number.MAX_VALUE;
					let cMax = -Number.MAX_VALUE;
					let valid = false;
					serie.xHasString = false;
					axes.x.xHasString = false;

					while (this.getValue(ref, pointIndex, value)) {
						if (typeof value.x === 'string' && value.x.length) {
							serie.xHasString = true;
							break;
						}
						pointIndex += 1;
					}

					axes.x.xHasString = serie.xHasString;
					pointIndex = 0;
					while (this.getValue(ref, pointIndex, value)) {
						if (Numbers.isNumber(value.x)) {
							xMin = Math.min(value.x, xMin);
							xMax = Math.max(value.x, xMax);
						}
						if (Numbers.isNumber(value.y)) {
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
						if (axes.x.format.linkNumberFormat && index === 0 && pointIndex === 0 && value.formatX) {
							axes.x.format.linkedNumberFormat = value.formatX.numberFormat;
							axes.x.format.linkedLocalCulture = value.formatX.localCulture;
						}
						axes.y.categories[pointIndex].values[index] = {
							x: value.x,
							y: value.y,
							c: value.c,
							axes,
							serie,
							seriesIndex: index
						};
						pointIndex += 1;
						valid = true;
					}
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
					if (!valid) {
						// TODO different values for category axis
						xMin = 0;
						xMax = 100;
						yMin = 0;
						yMax = 100;
						cMin = 0;
						cMax = 100;
					}

					serie.xMin = Numbers.isNumber(xMin) ? xMin : 0;
					serie.xMax = Numbers.isNumber(xMax) ? xMax : 100;
					serie.yMin = Numbers.isNumber(yMin) ? yMin : 0;
					serie.yMax = Numbers.isNumber(yMax) ? yMax : 100;
					serie.cMin = Numbers.isNumber(cMin) ? cMin : 0;
					serie.cMax = Numbers.isNumber(cMax) ? cMax : 100;
					serie.valueCount = pointIndex;
				} else {
					serie.xMin = 0;
					serie.xMax = 100;
					serie.yMin = 0;
					serie.yMax = 100;
					serie.cMin = 0;
					serie.cMax = 100;
					serie.valueCount = 0;
				}
			}
		});

		this.xAxes.forEach((axis) => {
			axis.minData = undefined;
			axis.maxData = undefined;
			axis.xHasString = false;
			this.series.forEach((series) => {
				if (series.visible && series.xAxis === axis.name) {
					axis.minData = axis.minData === undefined ? series.xMin : Math.min(series.xMin, axis.minData);
					axis.maxData = axis.maxData === undefined ? series.xMax : Math.max(series.xMax, axis.maxData);
					axis.xHasString = series.xHasString || axis.xHasString;
					if (series.type === 'bubble') {
						axis.minData -= (axis.maxData - axis.minData) * 0.08;
						axis.maxData += (axis.maxData - axis.minData) * 0.08;
					}
				}
			});
			axis.valueCategories = [];
			if (axis.type === 'category' && this.chart._dataMode === 'hideempty') {
				for (let i = 0; i <= axis.maxData; i+= 1) {
					axis.valueCategories[i] = this.hasCategoryValue(axis, i);
				}
			}
			if (axis.minData === undefined) {
				axis.minData = 0;
			}
			if (axis.maxData === undefined) {
				axis.maxData = 100;
			}
			axis.scale = undefined;
		});

		this.yAxes.forEach((axis) => {
			axis.minData = undefined;
			axis.maxData = undefined;
			this.series.forEach((series) => {
				if (series.visible && series.yAxis === axis.name) {
					axis.minData = axis.minData === undefined ? series.yMin : Math.min(series.yMin, axis.minData);
					axis.maxData = axis.maxData === undefined ? series.yMax : Math.max(series.yMax, axis.maxData);
					if (series.type === 'bubble') {
						axis.minData -= (axis.maxData - axis.minData) * 0.08;
						axis.maxData += (axis.maxData - axis.minData) * 0.08;
					}
				}
			});
			if (axis.minData === undefined) {
				axis.minData = 0;
			}
			if (axis.maxData === undefined) {
				axis.maxData = 100;
			}
			axis.scale = undefined;
		});

		this.yAxes.forEach((axis) => {
			axis.cMinData = undefined;
			axis.cMaxData = undefined;
			this.series.forEach((series) => {
				if (series.visible && (series.type === 'bubble' || series.type === 'heatmap') && series.yAxis === axis.name) {
					axis.cMinData = axis.cMinData === undefined ? series.cMin : Math.min(series.cMin, axis.cMinData);
					axis.cMaxData = axis.cMaxData === undefined ? series.cMax : Math.max(series.cMax, axis.cMaxData);
				}
			});
			if (axis.cMinData === undefined) {
				axis.cMinData = 0;
			}
			if (axis.cMaxData === undefined) {
				axis.cMaxData = 100;
			}
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
		const stepDist = axis.type === 'category' ? 1000 : 1500;
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

				if (input.step === undefined) {
					let timeStep;
					let step;
					let format = {
						localCulture: `time;en`,
						numberFormat: 'h:mm:ss'
					};
					if (diff > 90) {
						timeStep = 'year';
						step = Math.floor(Math.max(1, diff / 300));
						format = {
							localCulture: `date;en`,
							numberFormat: 'dd\\.MM\\.yy'
						};
					} else if (diff > 30) {
						// from 300 to 450
						timeStep = 'quarter';
						step = 1;
						format = {
							localCulture: `date;en`,
							numberFormat: 'dd\\.MM\\.yy'
						};
					} else if (diff > 7) {
						// from 70 to 300
						timeStep = 'month';
						step = 1;
						format = {
							localCulture: `date;en`,
							numberFormat: 'dd\\.MM\\.yy'
						};
					} else if (diff > 3) {
						// from 10 to 70
						timeStep = 'week';
						step = 1;
						format = {
							localCulture: `date;en`,
							numberFormat: 'dd\\.MM\\.yy'
						};
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
						format = {
							localCulture: `date;en`,
							numberFormat: 'dd\\.MM\\.yy'
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
						format = {
							localCulture: `time;en`,
							numberFormat: 'h:mm:ss.000'
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
			case 'category':
				/* Durch vergrößern dieser Zahl verfeinert     */
				/* sich das im Automatikmode generierte Raster */
				stepCount = 8; /* 11 => sehr fein      */

				if (axis.isVertical()) {
					// stepCount = Math.min(15, size / 600);
					stepCount = Math.min(30, size / Math.max(600, stepDistVert * Math.abs(Math.sin(labelAngle))));
				} else {
					stepCount = Math.min(30, size / Math.max(600, stepDist * Math.abs(Math.cos(labelAngle))));
				}

				stepCount = Math.max(1, stepCount);
				//        if(m_fMinimumScaleIsAuto && min > 0.0) min = 0.0;
				if (input.max === undefined && input.maxData < 0.0) {
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
						if (max !== 0.0 && maxLabel <= max + 3) {
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
		const seriesCnt = this.getVisibleSeries(serie.type);
		const visibleIndex = this.getVisibleSeriesIndex(serie.type, index);

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
		if (serie.type === 'pie' && seriesCnt > 1 && ref.yName) {
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
			angle += Math.PI_2 - (angle % Math.PI_2);
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

	getBarInfo(axes, serie, seriesIndex, index, value, barWidth) {
		let height;
		const margin = this.chart.stacked || serie.type === 'state' ? 0 : 150;
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
			return Math.abs(barWidth);
		}

		return 100;
	}

	getLabel(ref, axis, index) {
		let label = index + 1;

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
			} else {
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

	validate(val, allowString) {
		if (this.chart.dataMode === 'datazero' /* || this.chart.stacked */) {
			return allowString || Numbers.isNumber(val) ? val : 0;
		}

		return allowString || Numbers.isNumber(val) ? val : undefined;
	}

	getValueFromRange(range, sheet, index, format, allowString = false) {
		let value;
		const vertical = range.getWidth() === 1;
		if (vertical) {
			if (index <= range._y2 - range._y1) {
				const cell = sheet.getDataProvider().getRC(range._x1, range._y1 + index);
				if (cell) {
					value = cell.getValue();
				}
				const tf = sheet.getTextFormatAtRC(range._x1, range._y1 + index);
				if (tf && format) {
					format.localCulture = tf
						.getLocalCulture()
						.getValue()
						.toString();
					format.numberFormat = tf.getNumberFormat().getValue();
				}
				return this.validate(value, allowString);
			}
		} else if (index <= range._x2 - range._x1) {
			const cell = sheet.getDataProvider().getRC(range._x1 + index, range._y1);
			if (cell) {
				value = cell.getValue();
			}
			const tf = sheet.getTextFormatAtRC(range._x1 + index, range._y1);
			if (tf && format) {
				format.localCulture = tf
					.getLocalCulture()
					.getValue()
					.toString();
				format.numberFormat = tf.getNumberFormat().getValue();
			}
			return this.validate(value, allowString);
		}

		return '#er';
	}

	getValue(ref, index, value) {
		value.x = undefined;
		value.y = undefined;

		if (!this.xAxes.length || !this.yAxes.length) {
			return false;
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
					value.x = this.validate(value.x, true);
				}
				if (values.time && values.time.length > index && index >= 0) {
					if (values[ref.cKey]) {
						value.c = values[ref.cKey][index];
					}
					value.c = this.validate(value.c, true);
					if (values[ref.yKey]) {
						value.y = this.validate(values[ref.yKey][index]);
						return true;
					}
				}
			}

			return false;
		}

		if (this.xAxes[0].type === 'category') {
			value.x = index;
		} else if (ref.x) {
			value.formatX = {};
			value.x = this.getValueFromRange(ref.x.range, ref.x.sheet, index, value.formatX, true);
			// if there is a text in the x values range
			if (this.xAxes[0].xHasString) {
				value.x = index + 1;
			}
		} else {
			value.x = index;
		}

		if (ref.c) {
			value.formatC = {};
			value.c = this.getValueFromRange(ref.c.range, ref.c.sheet, index, value.formatC, true);
		}

		if (ref.y) {
			value.formatY = {};
			value.y = this.getValueFromRange(ref.y.range, ref.y.sheet, index, value.formatY);
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
			if (this.chart.stacked) {
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
								if (value < 0 && (info.serie.type === 'column' || info.serie.type === 'bar')) {
									if (tmp < 0) {
										y += tmp;
									}
								} else if (tmp > 0 || (info.serie.type !== 'column' && info.serie.type !== 'bar')) {
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
				if (this.chart._dataMode === 'hideempty') {
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
		return value / (axis.scale.max - axis.scale.min);
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
					(x / (this.plot.position.right - this.plot.position.left)) * (axes.x.scale.max - axes.x.scale.min - empty),
				y:
					axes.y.scale.min +
					(y / (this.plot.position.bottom - this.plot.position.top)) * (axes.y.scale.max - axes.y.scale.min)
			};
		} else {
			ret = {
				x:
					axes.x.scale.min +
					(y / (this.plot.position.bottom - this.plot.position.top)) * (axes.x.scale.max - axes.x.scale.min - empty),
				y:
					axes.y.scale.min +
					(x / (this.plot.position.right - this.plot.position.left)) * (axes.y.scale.max - axes.y.scale.min)
			};
		}

		ret.x += this.chart._dataMode === 'hideempty' ? this.getEmptyCategoryCountIndex(axes.x, ret.x) : 0;
		ret.x -= (axes.x.betweenTicks ? 0.5 : 0);

		return ret;
	}

	getAxisStart(ref, axis) {
		let start = {
			value: axis.scale.min
		};

		switch (axis.type) {
			case 'time':
				start.value -= 0.0000001;
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
						date.setDate(1);
						date.setMonth(0);
						date.setFullYear(date.getFullYear() + axis.scale.step);
						result = Math.floor(MathUtils.JSDateToExcelDate(date));
						break;
					}
					case 'quarter': {
						const date = MathUtils.excelDateToJSDate(valueInfo.value);
						date.setDate(1);
						date.setMonth(date.getMonth() - (date.getMonth() % 3) + axis.scale.step * 3);
						result = Math.floor(MathUtils.JSDateToExcelDate(date));
						break;
					}
					case 'month': {
						const date = MathUtils.excelDateToJSDate(valueInfo.value);
						date.setDate(1);
						date.setMonth(date.getMonth() + axis.scale.step);
						result = Math.floor(MathUtils.JSDateToExcelDate(date));
						break;
					}
					case 'week': {
						const date = MathUtils.excelDateToJSDate(valueInfo.value);
						const day = date.getDay();
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
						const h = date.getHours();
						if (h % axis.scale.step) {
							date.setHours(h + (axis.scale.step - (h % axis.scale.step)));
						} else {
							date.setHours(h + axis.scale.step);
						}
						date.setMinutes(0);
						date.setSeconds(0);
						date.setMilliseconds(0);
						result = MathUtils.JSDateToExcelDate(date);
						break;
					}
					case 'minute': {
						const date = MathUtils.excelDateToJSDate(valueInfo.value);
						const m = date.getMinutes();
						if (m % axis.scale.step) {
							date.setMinutes(m + (axis.scale.step - (m % axis.scale.step)));
						} else {
							date.setMinutes(m + axis.scale.step);
						}
						date.setSeconds(0);
						date.setMilliseconds(0);
						result = MathUtils.JSDateToExcelDate(date);
						break;
					}
					case 'second': {
						const date = MathUtils.excelDateToJSDate(valueInfo.value);
						const s = date.getSeconds();
						if (s % axis.scale.step) {
							date.setSeconds(s + (axis.scale.step - (s % axis.scale.step)));
						} else {
							date.setSeconds(s + axis.scale.step);
						}
						date.setMilliseconds(0);
						result = MathUtils.JSDateToExcelDate(date);
						break;
					}
					case 'millisecond': {
						const date = MathUtils.excelDateToJSDate(valueInfo.value);
						const ms = date.getMilliseconds();
						if (ms % axis.scale.step) {
							date.setMilliseconds(ms + (axis.scale.step - (ms % axis.scale.step)));
						} else {
							date.setMilliseconds(ms + axis.scale.step);
						}
						result = MathUtils.JSDateToExcelDate(date);
						break;
					}
					default:
						result = valueInfo.value + 1;
						break;
				}
				if (valueInfo.value === result) {
					// to prevent endless loop
					result += 1;
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

		for (let i = 0; i < index; i+= 1) {
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
					const value = this.getValueFromRange(ref.x.range, ref.x.sheet, index, undefined, true);
					if (value !== undefined && (Numbers.isNumber(value) || String(value) !== '')) {
						return true
					}
				}

				if (ref.y) {
					const value = this.getValueFromRange(ref.y.range, ref.y.sheet, index);
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
		if (!axis.position || !axis.scale || !axis.gridVisible || !axis.visible) {
			return false;
		}

		let pos;
		const rect = new ChartRect();
		const ref = this.getDataSourceInfoAxis(axis);
		let current = this.getAxisStart(ref, axis);
		const final = this.getAxisEnd(axis);

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
					break;
				case 'top':
				case 'bottom':
					pos = plotRect.left + pos * plotRect.width;
					rect.set(pos - 100, plotRect.top, pos + 100, plotRect.bottom);
					break;
				default:
					break;
			}
			if (rect.containsPoint(pt)) {
				return true;
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

		for (let i = startAngle; i < endAngle; i += step) {
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

						// // 3d front
						// if (item.chart.rotation < Math.PI / 2) {
						// 	if ((currentAngle >= 0 && currentAngle <= Math.PI) || (currentAngle + angle >= 0 &&
						// currentAngle + angle <= Math.PI)) { graphics.ellipse(pieInfo.xc, pieInfo.yc, pieInfo.xRadius,
						// pieInfo.yRadius, 0, Math.max(0, currentAngle), Math.min(Math.PI, currentAngle + angle), false);
						// const x1 = pieInfo.xc + pieInfo.xRadius * Math.cos(Math.min(Math.PI, currentAngle + angle)); let
						// y = pieInfo.yc + pieInfo.height + pieInfo.yRadius * Math.sin(Math.min(Math.PI, currentAngle +
						// angle)); graphics.lineTo(x1, y);  graphics.ellipse(pieInfo.xc, pieInfo.yc + pieInfo.height,
						// pieInfo.xRadius, pieInfo.yRadius, 0, Math.min(Math.PI, currentAngle + angle), Math.max(0,
						// currentAngle), true); const x2 = pieInfo.xc + pieInfo.xRadius * Math.cos(Math.max(0,
						// currentAngle)); y = pieInfo.yc + pieInfo.yRadius * Math.sin(Math.max(0, currentAngle));
						// graphics.lineTo(x2, y);  } }
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

	isSeriesHitCartesian(serie, ref, index, plotRect, pt, dataPoints) {
		if (!ref) {
			return false;
		}

		const dataRect = new ChartRect();
		const axes = this.getAxes(serie);
		let pointIndex = 0;
		let x;
		let y;
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
				case 'funnelbar':
					barInfo = this.getBarInfo(axes, serie, index, pointIndex, value.y, barWidth);
					const width = Math.abs(barInfo.height * plotRect.width);
					dataRect.set(
						plotRect.left + plotRect.width / 2 - width / 2,
						plotRect.bottom - x * plotRect.height + barInfo.offset - 100,
						plotRect.left + plotRect.width / 2 + width / 2,
						plotRect.bottom - x * plotRect.height + barInfo.offset + 100 + barWidth - barInfo.margin
					);
					break;
				case 'line':
				case 'scatter':
				case 'bubble':
					dataRect.set(
						plotRect.left + x * plotRect.width - 200,
						plotRect.bottom - y * plotRect.height - 200,
						plotRect.left + x * plotRect.width + 200,
						plotRect.bottom - y * plotRect.height + 200
					);
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
		if (this.chart.hiLoLines.visible === false &&
			this.chart.upBars.visible === false) {
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

		const ptLow = {x: 0, y: 0};
		const ptHigh = {x: 0, y: 0};
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
						hitRect.set(ptHigh.x - barWidth / 2, ptHigh.y, ptHigh.x + barWidth / 2, ptLow.y)
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
		if (!ref || !JSG.graphics || !serie.dataLabel.visible) {
			return false;
		}

		const axes = this.getAxes(serie);
		let pointIndex = 0;
		const ptValue = { x: 0, y: 0 };
		const barWidth = this.getBarWidth(axes, serie, plotRect);
		const legendData = this.getLegend();
		const info = {
			serie,
			seriesIndex: index,
			categories: axes.y.categories
		};
		const points = [];
		const prevPoints = [];
		const value = {};
		const pieInfo = this.isCircular() ? this.getPieInfo(ref, serie, plotRect, index) : undefined;
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
			currentAngle: pieInfo ? pieInfo.startAngle : 0
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

		while (this.getValue(ref, pointIndex, value)) {
			info.index = pointIndex;
			if (value.x !== undefined && value.y !== undefined) {
				ptValue.x = this.scaleToAxis(axes.x, value.x, undefined, false);
				ptValue.y = this.scaleToAxis(axes.y, value.y, info, false);
				this.toPlot(serie, plotRect, ptValue);

				const text = this.getDataLabel(value, axes.x, ref, serie, legendData);
				if (text.length) {
					const dataRect = this.getLabelRect(ptValue, value, text, pointIndex, params);
					if (dataRect) {
						dataRect.sort();
						ptCopy = labelAngle ? MathUtils.getRotatedPoint(pt, dataRect.center, labelAngle) : pt.copy();
						if (dataRect.containsPoint(ptCopy)) {
							return true;
						}
					}
				}
			}
			pointIndex += 1;
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

	getLabelRect(pt, value, text, index, params) {
		const labelRect = new ChartRect();
		let barInfo;
		const measure = (label) => {
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
		};

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
				case 'beforestart':
				case 'start':
					xRadius = xInnerRadius;
					yRadius = yInnerRadius;
					break;
				case 'center':
					xRadius = (xInnerRadius + xOuterRadius) / 2;
					yRadius = (yInnerRadius + yOuterRadius) / 2;
					break;
				case 'end':
				case 'behindend':
					xRadius = xOuterRadius;
					yRadius = yOuterRadius;
					break;
				default:
					break;
			}
			pt.x = params.pieInfo.xc + xRadius * Math.cos(textAngle);
			pt.y = params.pieInfo.yc + yRadius * Math.sin(textAngle);
			params.currentAngle += angle;
			labelRect.set(pt.x, pt.y, pt.x, pt.y);
			if (text.length) {
				const textSize = measure(text);
				const xOff = Math.cos(textAngle) * (textSize.width / 2 + 150);
				const yOff = Math.sin(textAngle) * (textSize.height / 2 + 150);
				switch (params.serie.dataLabel.position) {
					case 'beforestart':
					case 'start':
						labelRect.set(
							labelRect.left + xOff - textSize.width / 2,
							labelRect.top + yOff - textSize.height / 2,
							labelRect.right + xOff + textSize.width / 2,
							labelRect.bottom + yOff + textSize.height / 2
						);
						break;
					case 'center':
						labelRect.set(
							labelRect.left - textSize.width / 2,
							labelRect.top - textSize.height / 2,
							labelRect.right + textSize.width / 2,
							labelRect.bottom + textSize.height / 2
						);
						break;
					case 'end':
						labelRect.set(
							labelRect.left - xOff - textSize.width / 2,
							labelRect.top - yOff - textSize.height / 2,
							labelRect.right - xOff + textSize.width / 2,
							labelRect.bottom - yOff + textSize.height / 2
						);
						break;
					case 'behindend':
						labelRect.set(
							labelRect.left + xOff - textSize.width / 2,
							labelRect.top + yOff - textSize.height / 2,
							labelRect.right + xOff + textSize.width / 2,
							labelRect.bottom + yOff + textSize.height / 2
						);
						break;
					default:
						break;
				}
			}
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
				const textSize = measure(text);
				switch (params.serie.dataLabel.position) {
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
							if (params.axes.y.invert) {
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
							if (params.axes.y.invert) {
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
				return {
					element: 'series',
					index: this.series.indexOf(result[index]),
					selectionIndex: index,
					data: result[index],
					dataPoints
				};
			}
		}

		if (!this.isCircular()) {
			result = this.xAxes.filter((axis) => axis.position.containsPoint(pt));
			if (result.length) {
				return {
					element: 'xAxis',
					index: this.xAxes.indexOf(result[0]),
					data: result[0]
				};
			}

			result = this.xAxes.filter((axis) => this.checkAxis(axis, pt, plotRect));
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

			result = this.yAxes.filter((axis) => axis.position.containsPoint(pt));
			if (result.length) {
				return {
					element: 'yAxis',
					index: this.yAxes.indexOf(result[0]),
					data: result[0]
				};
			}

			result = this.yAxes.filter((axis) => this.checkAxis(axis, pt, plotRect));
			if (result.length) {
				return {
					element: 'yAxisGrid',
					index: this.yAxes.indexOf(result[0]),
					data: result[0]
				};
			}

			result = this.yAxes.filter((axis) => axis.title.position.containsPoint(pt));
			if (result.length) {
				return {
					element: 'yAxisTitle',
					index: this.yAxes.indexOf(result[0]),
					data: result[0].title
				};
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

		this.chart.formula = new Expression(0, selection.toStringByIndex(0, { item: sheet, useName: true }));

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
				const cmd = this.prepareCommand('series');
				taRange.enumerateCells(true, (pos) => {
					const cell = data.get(pos);
					const source = new CellRange(taRange.getSheet(), pos.x, pos.y);
					source.shiftToSheet();
					const ref = source.toString({ item: sheet, useName: true });
					const xValue = cell.xvalue;
					let seriesLabel;
					if (colSeriesLabels) {
						const labels = new CellRange(taRange.getSheet(), pos.x - 1, pos.y);
						labels.shiftToSheet();
						seriesLabel = labels.toString({ item: sheet, useName: true });
					} else if (rowSeriesLabels) {
						const labels = new CellRange(taRange.getSheet(), pos.x, pos.y - 1);
						labels.shiftToSheet();
						seriesLabel = labels.toString({ item: sheet, useName: true });
					}

					const values = cell.values;
					if (values && values.time) {
						const fields = Object.keys(values);
						for (let i = 0; i < fields.length; i += 1) {
							const key = fields[i];
							if (key !== xValue && key !== 'time') {
								if (values[key].length && Numbers.isNumber(values[key][0])) {
									if (seriesLabel === undefined) {
										seriesLabel = `"${key}"`;
									}
									if (type === 'bubble' || type === 'state' || type === 'heatmap') {
										i += 1;
										for (; i < fields.length; i += 1) {
											const radius = fields[i];
											if (
												values[radius].length &&
												(Numbers.isNumber(values[radius][0]) || type === 'state')
											) {
												formula = `SERIESTIME("${xValue}",${seriesLabel},${ref},"${xValue}","${key}","${radius}")`;
												break;
											}
										}
										if (formula === undefined) {
											formula = `SERIESTIME("${xValue}",${seriesLabel},${ref},"${xValue}","${key}")`;
										}
									} else {
										formula = `SERIESTIME("${xValue}",${seriesLabel},${ref},"${xValue}","${key}")`;
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
				this.finishCommand(cmd, 'series');
				cmp.add(cmd);
			}
		}

		if (!cmp.hasCommands()) {
			let vertical;
			if (initial) {
				vertical = range.getHeight() > range.getWidth();
				this.chart.dataInRows = vertical;
			} else {
				vertical = this.chart.dataInRows;
			}

			let startI = vertical ? range._x1 : range._y1;
			let endI = vertical ? range._x2 : range._y2;
			const startJ = vertical ? range._y1 : range._x1;
			const endJ = vertical ? range._y2 : range._x2;
			let column;
			let row;
			let refName;
			let seriesLabels = false;
			const tmpRange = new CellRange(range.getSheet(), 0, 0);
			const cmd = this.prepareCommand('series');
			let start = vertical ? range._y1 + 1 : range._x1 + 1;
			let end = vertical ? range._y2 : range._x2;
			let cell;
			let val;
			let categoryLabels = false;

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
					}
				}
				this.chart.firstSeriesLabels = seriesLabels;
			} else {
				seriesLabels = this.chart.firstSeriesLabels;
			}

			for (let i = startI; i <= endI; i += step) {
				formula = 'SERIES(';
				column = vertical ? i : startJ;
				row = vertical ? startJ : i;

				if (seriesLabels) {
					tmpRange.set(column, row, column, row);
					tmpRange.shiftToSheet();
					refName = tmpRange.toString({ item: sheet, useName: true });
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
					refName = tmpRange.toString({ item: sheet, useName: true });
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
				refName = tmpRange.toString({ item: sheet, useName: true });
				formula += `${refName}`;

				if (type === 'bubble' || type === 'state' || type === 'heatmap') {
					if (vertical) {
						tmpRange.set(column + 1, row + (seriesLabels ? 1 : 0), column + 1, row + endJ - startJ);
					} else {
						tmpRange.set(column + (seriesLabels ? 1 : 0), row + 1, column + endJ - startJ, row + 1);
					}
					tmpRange.shiftToSheet();
					refName = tmpRange.toString({ item: sheet, useName: true });
					formula += `,${refName}`;
				}

				formula += ')';

				createSeries(type, formula, markers, line);
			}
			if (!initial) {
				removeOldSeries();
			}
			this.setChartTypeForSeries(type);
			this.finishCommand(cmd, 'series');
			cmp.add(cmd);
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

	newInstance() {
		return new SheetPlotNode();
	}

	get expressions() {
		const expr = [];

		this.series.forEach((serie) => {
			expr.push(serie.formula);
		});
		this.xAxes.forEach((axis) => {
			expr.push(axis.formula);
			expr.push(axis.title.formula);
		});
		this.yAxes.forEach((axis) => {
			expr.push(axis.formula);
			expr.push(axis.title.formula);
		});
		expr.push(this.title.formula);
		expr.push(this.legend.formula);
		expr.push(this.chart.formula);

		return expr;
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
		});
		this.yAxes.forEach((axis) => {
			axis.formula.evaluate(this);
			axis.title.formula.evaluate(this);
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

	saveContent(writer, absolute) {
		super.saveContent(writer, absolute);

		writer.writeAttributeString('type', 'streamchart');

		writer.writeStartElement('plot');

		this.chart.save(writer);
		this.savePlot(writer);
		this.title.save('title', writer);
		this.saveSeries(writer);
		this.saveAxes(writer);
		this.saveLegend(writer);

		writer.writeEndElement();
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
		this.series = [];

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'series': {
					const serie = new ChartSeries();
					serie.read(reader, child);
					this.series.push(serie);
					break;
				}
				default:
					break;
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

	migrate(reader, object) {
		const getJSON = (tag) => {
			const data = reader.getAttribute(object, tag);
			if (data) {
				return JSON.parse(Strings.decodeXML(data));
			}
			return undefined;
		};

		const attrFormula = this.getItemAttributes().getAttribute('sheetformula');
		if (attrFormula) {
			const formula = attrFormula
				.getExpression()
				.getFormula()
				.replace('DRAW.CHART', 'DRAW.STREAMCHART');
			attrFormula.setExpressionOrValue(new Expression(0, formula));
		}

		this.migrationData = {
			data: getJSON('data'),
			title: getJSON('title'),
			legend: getJSON('legend'),
			scales: getJSON('scales')
		};
	}

	migrateData(migrationData) {
		const { data, title, legend, scales } = migrationData;

		if (data.range) {
			const formula = data.range.replace(/^=/, '');
			this.chart.dataInRows = data.direction === 'columns';
			this.updateFormulas(undefined, formula, undefined);
		}

		this.chart.stacked = data.stacked;
		let type = 'line';

		switch (data.chartType) {
			case 'pie':
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
				type = 'doughnut';
				break;
			case 'radar':
			case 'polarArea':
			case 'columnstacked':
			case 'column':
				this.xAxes[0].type = 'category';
				type = 'column';
				break;
			case 'bar':
			case 'barstacked':
				this.xAxes[0].type = 'category';
				this.xAxes[0].align = 'left';
				this.yAxes[0].align = 'bottom';
				type = 'bar';
				break;
			case 'area':
				this.xAxes[0].type = 'category';
				type = 'area';
				break;
			case 'line':
			case 'linestacked':
				this.xAxes[0].type = 'category';
				type = 'line';
				break;
			case 'scatter':
			case 'scatterLine':
				type = 'scatter';
				this.xAxes[0].type = 'linear';
				break;
			case 'bubble':
				this.xAxes[0].type = 'linear';
				break;
			default:
				break;
		}

		this.title.visible = title.title.length > 0;
		this.title.formula = new Expression(title.title);

		if (legend.position === 'none') {
			this.legend.visibe = false;
		} else {
			this.legend.align = legend.position;
			this.legend.visibe = true;
		}

		const migrateAxis = (oldAxis, newAxis) => {
			if (oldAxis.ticks.reverse) {
				newAxis.invert = true;
			}
			const min = oldAxis.ticks.min === undefined ? '' : oldAxis.ticks.min;
			const max = oldAxis.ticks.max === undefined ? '' : oldAxis.ticks.max;
			const step = oldAxis.ticks.stepSize === undefined ? '' : oldAxis.ticks.stepSize;
			newAxis.formula = new Expression(0, `AXIS(${min},${max},${step})`);
			if (oldAxis.ticks.fontStyle === 'italic') {
				newAxis.format.fontStyle = 2;
			}
			if (oldAxis.ticks.fontStyle === 'bold') {
				newAxis.format.fontStyle = 1;
			}
		};

		migrateAxis(scales.xAxes[0], this.xAxes[0]);
		migrateAxis(scales.yAxes[0], this.yAxes[0]);

		this.series.forEach((serie, index) => {
			serie.type = type;
			serie.smooth = data.smooth;
			if (data.series && this.series.length === data.series.length) {
				serie.dataLabel.visible = data.series[index].showDataLabels === true;
				if (data.series[index].fillColor !== undefined) {
					serie.format.fillColor = data.series[index].fillColor;
				}
				if (data.series[index].lineColor !== undefined) {
					serie.format.lineColor = data.series[index].lineColor;
				}
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

	showActionMenu(viewer) {
		viewer.getCanvas()._jsgEditor.getItemMenuHandler().showMenu(this);
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


	static get templates() {
		return templates;
	}
};
