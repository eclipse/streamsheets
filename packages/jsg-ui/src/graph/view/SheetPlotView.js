import {
	default as JSG,
	TextFormatAttributes,
	FormatAttributes
} from '@cedalo/jsg-core';

import NodeView from './NodeView';

export default class SheetPlotView extends NodeView {
	onSelectionChange(selected) {
		if (!selected) {
			this.chartSelection = undefined;
			this.getGraphView().clearLayer('chartselection');
		}
	}

	drawBorder(graphics, format, rect) {
		super.drawBorder(graphics, format, rect);
	}

	drawRect(graphics, rect, item, format, id) {
		const lineColor = format.lineColor || item.getTemplate()[id].format.lineColor;
		const fillColor = format.fillColor || item.getTemplate()[id].format.fillColor;

		graphics.beginPath();
		graphics.setLineWidth(1);
		graphics.setLineColor(lineColor);
		graphics.setFillColor(fillColor);
		graphics.rect(rect.left, rect.top, rect.width, rect.height);
		if (lineColor !== 'none') {
			graphics.stroke();
		}
		if (fillColor !== 'none') {
			graphics.fill();
		}
	}

	drawFill(graphics, format, rect) {
		super.drawFill(graphics, format, rect);

		const item = this.getItem();

		if (item._isFeedback) {
			return;
		}

		const { series } = item;
		const plotRect = item.plot.position;

		this.drawRect(graphics, plotRect, item, item.plot.format, 'plot');
		this.drawAxes(graphics, plotRect, item, true);

		let lastPoints;
		series.forEach((serie, index) => {
			lastPoints = this.drawPlot(graphics, item, plotRect, serie, index, lastPoints);
		});

		this.drawAxes(graphics, plotRect, item, false);
		this.drawLegend(graphics, plotRect, item);
		this.drawTitle(graphics, item, item.title, 'title', 0);
	}

	drawLegend(graphics, plotRect, item) {
		const legendData = item.getLegend();
		const margin = 200;
		const { legend } = item;
		const cs = graphics.getCoordinateSystem();

		if (!legend.visible) {
			return;
		}

		this.drawRect(graphics, legend.position, item, legend.format, 'legend');
		item.setFont(graphics, legend.format, 'legend', 'middle', TextFormatAttributes.TextAlignment.LEFT);
		const textSize = item.measureText(graphics, graphics.getCoordinateSystem(), legend.format, 'legend', 'X');
		let x = legend.position.left + margin;
		let y = legend.position.top + margin;

		legendData.forEach((entry, index) => {
			graphics.beginPath();
			graphics.setLineColor(entry.series.format.lineColor || item.getTemplate().series.line[index]);
			graphics.setLineWidth(entry.series.format.lineWidth || item.getTemplate().series.linewidth);

			switch (entry.series.type) {
			case 'line':
			case 'scatter':
				graphics.moveTo(x, y + textSize.height / 2);
				graphics.lineTo(x + margin * 3, y + textSize.height / 2);
				graphics.stroke();
				break;
			case 'area':
			case 'column':
				graphics.rect(x, y + textSize.height / 10, margin * 3, textSize.height * 2 / 3);
				graphics.setFillColor(entry.series.format.fillColor || item.getTemplate().series.fill[index]);
				graphics.fill();
				graphics.stroke();
				break;
			}

			const fontColor = legend.format.fontColor || item.getTemplate().legend.format.fontColor || item.getTemplate().font.color;

			graphics.setFillColor(fontColor);
			graphics.fillText(entry.name, x + margin * 4, y + textSize.height / 2);

			if (legend.align === 'right' || legend.align === 'left') {
				y += textSize.height * 1.3;
			} else {
				const size = item.measureText(JSG.graphics, cs, legend.format, 'legend', String(entry.name));
				x += size.width + margin * 6;
			}
		});

		graphics.setLineWidth(-1);
	}

	drawAxes(graphics, plotRect, item, grid) {
		item.xAxes.forEach((axis) => {
			this.drawTitle(graphics, item, axis.title, 'axisTitle', 0);
			this.drawAxis(graphics, plotRect, item, axis, grid);
		});

		item.yAxes.forEach((axis) => {
			this.drawTitle(graphics, item, axis.title, 'axisTitle', Math.PI_2);
			this.drawAxis(graphics, plotRect, item, axis, grid);
		});
	}

	drawAxis(graphics, plotRect, item, axis, grid) {
		if (!axis.position || !axis.scale || (grid && !axis.gridVisible)) {
			return;
		}
		// draw axis line
		if (!grid) {
			graphics.beginPath();
			graphics.setLineColor(axis.format.lineColor || item.getTemplate().axis.format.lineColor);
			switch (axis.align) {
				case 'left':
					graphics.moveTo(axis.position.right, axis.position.top);
					graphics.lineTo(axis.position.right, axis.position.bottom);
					item.setFont(graphics, axis.format, 'axis', 'middle', TextFormatAttributes.TextAlignment.RIGHT);
					break;
				case 'right':
					graphics.moveTo(axis.position.left, axis.position.top);
					graphics.lineTo(axis.position.left, axis.position.bottom);
					item.setFont(graphics, axis.format, 'axis', 'middle', TextFormatAttributes.TextAlignment.LEFT);
					break;
				case 'top':
					graphics.moveTo(axis.position.left, axis.position.bottom);
					graphics.lineTo(axis.position.right, axis.position.bottom);
					item.setFont(graphics, axis.format, 'axis', 'bottom', TextFormatAttributes.TextAlignment.CENTER);
					break;
				case 'bottom':
					graphics.moveTo(axis.position.left, axis.position.top);
					graphics.lineTo(axis.position.right, axis.position.top);
					item.setFont(graphics, axis.format, 'axis', 'top', TextFormatAttributes.TextAlignment.CENTER);
					break;
			}
			graphics.stroke();
		}

		let current = axis.scale.min;
		let pos;
		let plot;
		let text;

		if (grid) {
			graphics.beginPath();
			graphics.setLineColor('#CCCCCC');
		}

		if (axis.type === 'time') {
			current = item.incrementScale(axis, current - 0.0000001);
		}

		let refLabel;
		if (axis.type === 'category') {
			item.series.forEach((series) => {
				if (series.xAxis === axis.name) {
					refLabel = item.getDataSourceInfo(series.formula);
				}
			});
		}

		while (current <= axis.scale.max) {
			if (axis.type === 'category' && current >= axis.scale.max) {
				break;
			}

			pos = item.scaleToAxis(axis, current, undefined, grid);

			if (!grid) {
				if (axis.type === 'category' && refLabel) {
					text = item.getLabel(refLabel, axis, Math.floor(current));
				} else {
					text = item.formatNumber(
						current,
						axis.format && axis.format.numberFormat ? axis.format : axis.scale.format
					);
				}
			}

			switch (axis.align) {
				case 'left':
					plot = plotRect.bottom - pos * plotRect.height;
					if (grid) {
						graphics.moveTo(plotRect.left, plot);
						graphics.lineTo(plotRect.right, plot);
					} else {
						graphics.fillText(`${text}`, axis.position.right - 200, plot);
					}
					break;
				case 'right':
					plot = plotRect.bottom - pos * plotRect.height;
					if (grid) {
						graphics.moveTo(plotRect.left, plot);
						graphics.lineTo(plotRect.right, plot);
					} else {
						graphics.fillText(`${text}`, axis.position.left + 200, plot);
					}
					break;
				case 'top':
					plot = plotRect.left + pos * plotRect.width;
					if (grid) {
						graphics.moveTo(plot, plotRect.top);
						graphics.lineTo(plot, plotRect.bottom);
					} else {
						graphics.fillText(`${text}`, plot, axis.position.bottom - 200);
					}
					break;
				case 'bottom':
					plot = plotRect.left + pos * plotRect.width;
					if (grid) {
						graphics.moveTo(plot, plotRect.top);
						graphics.lineTo(plot, plotRect.bottom);
					} else {
						graphics.fillText(`${text}`, plot, axis.position.top + 200);
					}
					break;
			}

			current = item.incrementScale(axis, current);
		}
		if (grid) {
			graphics.stroke();
		}
	}

	drawPlot(graphics, item, plotRect, serie, seriesIndex, lastPoints) {
		let index = 0;
		let x;
		let y;
		let barInfo;
		const value = {};
		const ref = item.getDataSourceInfo(serie.formula);
		const axes = item.getAxes(serie);

		if (!ref || !axes) {
			return undefined;
		}

		if (JSG.zooming && ref.time) {
			if (ref.time.stale) {
				graphics.setFillColor('#CCCCCC');
				graphics.fillText('Retrieving Data...', 100, 500);
			} else {
				JSG.zooming = false;
			}
		}

		graphics.save();
		graphics.beginPath();
		graphics.rect(plotRect.left, plotRect.top, plotRect.width, plotRect.height);
		graphics.clip();

		graphics.beginPath();
		graphics.setLineColor(serie.format.lineColor || item.getTemplate().series.line[seriesIndex]);
		graphics.setLineWidth(serie.format.lineWidth || item.getTemplate().series.linewidth);
		graphics.setFillColor(serie.format.fillColor || item.getTemplate().series.fill[seriesIndex]);

		const barWidth = item.getBarWidth(axes, serie, plotRect);
		const points = [];
		let newLine = true;
		let xFirst;
		let xLast;
		const info = {
			serie,
			seriesIndex,
			categories: axes.x.categories
		};

		while (item.getValue(ref, index, value)) {
			info.index = index;
			if (item.chart.dataMode === 'datainterrupt' || (value.x !== undefined && value.y !== undefined)) {
				x = item.scaleToAxis(axes.x, value.x, undefined, false);
				y = item.scaleToAxis(axes.y, value.y, info, false);
				switch (serie.type) {
				case 'area':
				case 'line':
				case 'scatter':
					if (item.chart.dataMode === 'datainterrupt' && (value.x === undefined || value.y === undefined)) {
						newLine = true;
					} else if (newLine) {
						graphics.moveTo(plotRect.left + x * plotRect.width, plotRect.bottom - y * plotRect.height);
						newLine = false;
						xFirst = x;
						xLast = x;
					} else {
						graphics.lineTo(plotRect.left + x * plotRect.width, plotRect.bottom - y * plotRect.height);
						xLast = x;
					}
					if (serie.type === 'area') {
						if (newLine) {
							y = item.scaleToAxis(axes.y, 0, undefined, false);
							graphics.lineTo(plotRect.left + xLast * plotRect.width, plotRect.bottom - y * plotRect.height);
							graphics.lineTo(plotRect.left + xFirst * plotRect.width, plotRect.bottom - y * plotRect.height);
							graphics.closePath();
							graphics.fill();
							graphics.stroke();
							graphics.beginPath();
						}
						if (item.chart.stacked) {
							points.push({
								x: plotRect.left + x * plotRect.width,
								y: plotRect.bottom - y * plotRect.height
							});
						}
					}
					break;
				case 'column':
					if (value.x !== undefined && value.y !== undefined) {
						barInfo = item.getBarInfo(axes, serie, seriesIndex, index, value.y, barWidth);
						graphics.rect(
							plotRect.left + x * plotRect.width + barInfo.offset,
							plotRect.bottom - y * plotRect.height,
							barWidth - barInfo.margin,
							-barInfo.height * plotRect.height
						);
					}
					break;
				}
			}
			index += 1;
		}

		if (serie.type === 'area') {
			if (seriesIndex && item.chart.stacked && lastPoints) {
				let point;
				for (let i = lastPoints.length - 1; i >= 0; i -= 1) {
					point = lastPoints[i];
					graphics.lineTo(point.x, point.y);
				}
			} else {
				y = item.scaleToAxis(axes.y, 0, undefined, false);
				x = xLast;
				graphics.lineTo(plotRect.left + x * plotRect.width, plotRect.bottom - y * plotRect.height);
				x = xFirst;// item.scaleToAxis(axes.x, xFirst, undefined, false);
				graphics.lineTo(plotRect.left + x * plotRect.width, plotRect.bottom - y * plotRect.height);
			}
			graphics.closePath();
		}

		if (serie.type === 'column' || serie.type === 'area') {
			graphics.fill();
		}
		graphics.stroke();
		graphics.setLineWidth(1);
		graphics.restore();

		return points;
	}

	drawTitle(graphics, item, title, id, angle) {
		if (!title.visible) {
			return;
		}

		const text = String(item.getExpressionValue(title.formula));

		this.drawRect(graphics, title.position, item, title.format, id);
		item.setFont(graphics, title.format, id, 'middle', TextFormatAttributes.TextAlignment.CENTER);

		if (angle) {
			graphics.translate(
				title.position.left + title.position.width / 2,
				title.position.top + title.position.height / 2 + 50
			);
			graphics.rotate(-angle);

			graphics.fillText(text, 0, 0);

			graphics.rotate(angle);
			graphics.translate(
				-(title.position.left + title.position.width / 2),
				-(title.position.top + title.position.height / 2 + 50)
			);
		} else {
			graphics.fillText(text,
				title.position.left + title.position.width / 2,
				title.position.top + title.position.height / 2 + 50
			);
		}
	}

	getSelectedFormat() {
		const f = new FormatAttributes();

		if (this.chartSelection) {
			const data = this.getItem().getDataFromSelection(this.chartSelection);
			const template = this.getItem().getTemplate();
			if (data) {
				switch (this.chartSelection.element) {
				case 'series':
					f.setFillColor(data.format.fillColor || template.series.fill[this.chartSelection.index]);
					f.setLineColor(data.format.lineColor || template.series.line[this.chartSelection.index]);
					break;
				case 'title':
				case 'legend':
					f.setFillColor(data.format.fillColor || template[this.chartSelection.element].format.fillColor);
					f.setLineColor(data.format.lineColor || template[this.chartSelection.element].format.lineColor);
					break;
				case 'xAxis':
				case 'yAxis':
					f.setLineColor(data.format.lineColor || template.axis.format.lineColor);
					f.setFillColor(data.format.fillColor || template.axis.format.fillColor);
					break;
				case 'xAxisTitle':
				case 'yAxisTitle':
					f.setLineColor(data.format.lineColor || template.axisTitle.format.lineColor);
					f.setFillColor(data.format.fillColor || template.axisTitle.format.fillColor);
					break;
					default:
						break;
				}
			}
		}

		return f;
	}

	getSelectedTextFormat() {
		const tf = new TextFormatAttributes();

		if (this.chartSelection) {
			const data = this.getItem().getDataFromSelection(this.chartSelection);
			const template = this.getItem().getTemplate();
			if (data) {
				switch (this.chartSelection.element) {
				case 'series':
				case 'title':
				case 'legend':
					tf.setFontName(
						data.format.fontName ||
							template[this.chartSelection.element].format.fontName ||
							template.font.name
					);
					tf.setFontSize(
						data.format.fontSize ||
							template[this.chartSelection.element].format.fontSize ||
							template.font.size
					);
					if (data.format.fontStyle !== undefined) {
						tf.setFontStyle(data.format.fontStyle);
					} else if (template[this.chartSelection.element].format.fontStyle !== undefined) {
						tf.setFontStyle(template[this.chartSelection.element].format.fontStyle);
					} else {
						tf.setFontStyle(template.font.style);
					}
					break;
				case 'xAxis':
				case 'yAxis':
					tf.setFontName(data.format.fontName || template.axis.format.fontName || template.font.name);
					tf.setFontSize(data.format.fontSize || template.axis.format.fontSize || template.font.size);
					if (data.format.fontStyle !== undefined) {
						tf.setFontStyle(data.format.fontStyle);
					} else if (template.axis.format.fontStyle !== undefined) {
						tf.setFontStyle(template.axis.format.fontStyle);
					} else {
						tf.setFontStyle(template.font.style);
					}
					break;
				case 'xAxisTitle':
				case 'yAxisTitle':
					tf.setFontName(data.format.fontName || template.axisTitle.format.fontName || template.font.name);
					tf.setFontSize(data.format.fontSize || template.axisTitle.format.fontSize || template.font.size);
					if (data.format.fontStyle !== undefined) {
						tf.setFontStyle(data.format.fontStyle);
					} else if (template.axisTitle.format.fontStyle !== undefined) {
						tf.setFontStyle(template.axisTitle.format.fontStyle);
					} else {
						tf.setFontStyle(template.font.style);
					}
					break;
				default:
					break;
				}
			}
		}

		return tf;
	}

	hasSelectedFormula() {
		if (this.chartSelection) {
			switch (this.chartSelection.element) {
				case 'series':
				case 'title':
				case 'legend':
				case 'xAxis':
				case 'xAxisTitle':
				case 'yAxis':
				case 'yAxisTitle':
					return true;
				default:
					return false;
			}
		}

		return false;
	}

	getSelectedFormula(sheet) {
		let expr;

		if (this.chartSelection) {
			switch (this.chartSelection.element) {
				case 'series':
				case 'xAxis':
				case 'yAxis':
				case 'title':
				case 'legend':
				case 'xAxisTitle':
				case 'yAxisTitle': {
					const data = this.getItem().getDataFromSelection(this.chartSelection);
					if (!data) {
						return super.getSelectedFormula(sheet);
					}
					expr = data.formula;
					break;
				}
				default:
					break;
			}
		}

		if (expr) {
			if (expr.getTerm()) {
				const formula = `=${expr.getTerm().toLocaleString(JSG.getParserLocaleSettings(), {
					item: sheet,
					useName: true
				})}`;
				return formula;
			}
			return expr.getValue();
		}

		return super.getSelectedFormula(sheet);
	}

	applyAttributes(map, viewer) {
		const update = (key) => {
			const cmd = this.getItem().prepareCommand(key);
			const data = this.getItem().getDataFromSelection(this.chartSelection);
			if (!data) {
				return;
			}
			let value = map.get('linecolor');
			if (value) {
				data.format.lineColor = map.get('linecolor');
			}
			value = map.get('fillcolor');
			if (value) {
				data.format.fillColor = map.get('fillcolor');
			}
			value = map.get('fontcolor');
			if (value) {
				data.format.fontColor = map.get('fontcolor');
			}
			value = map.get('fontname');
			if (value) {
				data.format.fontName = map.get('fontname');
			}
			value = map.get('fontsize');
			if (value) {
				data.format.fontSize = Number(map.get('fontsize'));
			}
			value = map.get('fontstyle');
			if (value !== undefined) {
				data.format.fontStyle = Number(map.get('fontstyle'));
			}
			value = map.get('numberformat');
			if (value === 'General') {
				data.format.numberFormat = undefined;
				data.format.localCulture = undefined;
			} else {
				if (value !== undefined) {
					data.format.numberFormat = map.get('numberformat');
				}
				value = map.get('localculture');
				if (value !== undefined) {
					data.format.localCulture = map.get('localculture');
				}
			}
			this.getItem().finishCommand(cmd, key);
			viewer.getInteractionHandler().execute(cmd);
		};

		if (this.chartSelection) {
			switch (this.chartSelection.element) {
				case 'series':
					update('series');
					return true;
				case 'xAxis':
				case 'yAxis':
				case 'xAxisTitle':
				case 'yAxisTitle':
					update('axes');
					return true;
				case 'title':
					update('title');
					return true;
				case 'legend':
					update('legend');
					return true;
				case 'plot':
					update('plot');
					return true;
				default:
					break;
			}
		}
		return false;
	}
}
