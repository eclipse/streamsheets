import {
	default as JSG,
	GraphUtils,
	MathUtils,
	SheetPlotNode,
	TextFormatAttributes
} from '@cedalo/jsg-core';
import { NumberFormatter } from '@cedalo/number-format';

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

	drawFill(graphics, format, rect) {
		super.drawFill(graphics, format, rect);

		const item = this.getItem();

		if (item._isFeedback) {
			return;
		}

		item.setMinMax();
		item.setScales();

		const { series } = item;
		const plotRect = item.plot.position;

		graphics.setFontSize(8);
		graphics.setFontStyle(TextFormatAttributes.FontStyle.NORMAL);
		graphics.setFont();

		this.drawAxes(graphics, plotRect, item, true);

		series.forEach((serie, index) => {
			this.drawPlot(graphics, item, plotRect, serie, index);
		});

		this.drawAxes(graphics, plotRect, item, false);
		this.drawLegend(graphics, plotRect, item);

		graphics.setFontSize(12);
		graphics.setFontStyle(TextFormatAttributes.FontStyle.BOLD);
		graphics.setFont();

		this.drawTitle(graphics, item);
	}

	drawLegend(graphics, plotRect, item) {
		const legendData = item.getLegend();
		const margin = 200;
		const metrics = GraphUtils.getFontMetricsEx('Verdana', 8);
		const { legend } = item;

		graphics.beginPath();
		graphics.setLineColor(legend.format.lineColor || item.getTemplate('basic').legend.linecolor);
		graphics.rect(legend.position.left, legend.position.top, legend.position.width, legend.position.height);
		graphics.stroke();

		graphics.setTextAlignment(TextFormatAttributes.TextAlignment.LEFT);
		graphics.setTextBaseline('middle');

		let y = legend.position.top + margin;

		legendData.forEach((entry, index) => {
			graphics.beginPath();
			graphics.setLineColor(entry.series.format.lineColor || item.getTemplate('basic').series.line[index]);
			graphics.setLineWidth(entry.series.format.lineWidth || item.getTemplate('basic').series.linewidth);
			graphics.moveTo(legend.position.left + margin, y + metrics.lineheight / 2);
			graphics.lineTo(legend.position.left + margin * 4, y + metrics.lineheight / 2);
			graphics.stroke();

			graphics.fillText(entry.name, legend.position.left + margin * 5, y + metrics.lineheight / 2);
			y += metrics.lineheight;
		});

		graphics.setLineWidth(-1);
	}

	drawAxes(graphics, plotRect, item, grid) {
		item.xAxes.forEach((axis) => {
			this.drawAxis(graphics, plotRect, item, axis, grid);
		});

		item.yAxes.forEach((axis) => {
			this.drawAxis(graphics, plotRect, item, axis, grid);
		});
	}

	drawAxis(graphics, plotRect, item, axis, grid) {
		if (!axis.position || !axis.scale) {
			return;
		}
		// draw axis line
		if (!grid) {
			graphics.beginPath();
			graphics.setLineColor(axis.format.lineColor || item.getTemplate('basic').axis.linecolor);
			switch (axis.align) {
			case 'left':
				graphics.moveTo(axis.position.right, axis.position.top);
				graphics.lineTo(axis.position.right, axis.position.bottom);
				graphics.setTextBaseline('middle');
				graphics.setTextAlignment(TextFormatAttributes.TextAlignment.RIGHT);
				break;
			case 'right':
				graphics.moveTo(axis.position.left, axis.position.top);
				graphics.lineTo(axis.position.left, axis.position.bottom);
				graphics.setTextBaseline('middle');
				graphics.setTextAlignment(TextFormatAttributes.TextAlignment.LEFT);
				break;
			case 'top':
				graphics.moveTo(axis.position.left, axis.position.bottom);
				graphics.lineTo(axis.position.right, axis.position.bottom);
				graphics.setTextBaseline('bottom');
				graphics.setTextAlignment(TextFormatAttributes.TextAlignment.CENTER);
				break;
			case 'bottom':
				graphics.moveTo(axis.position.left, axis.position.top);
				graphics.lineTo(axis.position.right, axis.position.top);
				graphics.setTextBaseline('top');
				graphics.setTextAlignment(TextFormatAttributes.TextAlignment.CENTER);
				break;
			}
			graphics.stroke();

			graphics.setFillColor('#000000');
		}

		let current = axis.scale.min;
		let pos;
		let plot;

		if (grid) {
			graphics.beginPath();
			graphics.setLineColor('#CCCCCC');
		}

		if (axis.type === 'time') {
			current = item.incrementScale(axis, current - 0.0000001);
		}

		while (current <= axis.scale.max) {
			if (axis.type === 'category' && current >= axis.scale.max) {
				break;
			}

			pos = item.scaleToAxis(axis, current, grid);

			switch (axis.align) {
			case 'left':
				plot = plotRect.bottom - pos * plotRect.height;
				if (grid) {
					graphics.moveTo(plotRect.left, plot);
					graphics.lineTo(plotRect.right, plot);
				} else if (axis.scale.format) {
					const text = this.formatNumber(current, axis.scale.format.numberFormat,
						axis.scale.format.localCulture);
					graphics.fillText(`${text}`, axis.position.right - 200, plot);
				} else {
					graphics.fillText(`${current}`, axis.position.right - 200, plot);
				}
				break;
			case 'right':
				plot = plotRect.bottom - pos * plotRect.height;
				if (grid) {
					graphics.moveTo(plotRect.left, plot);
					graphics.lineTo(plotRect.right, plot);
				} else if (axis.scale.format) {
					const text = this.formatNumber(current, axis.scale.format.numberFormat,
						axis.scale.format.localCulture);
					graphics.fillText(`${text}`, axis.position.left + 200, plot);
				} else {
					graphics.fillText(`${current}`, axis.position.left + 200, plot);
				}
				break;
			case 'top':
				plot = plotRect.left + pos * plotRect.width;
				if (grid) {
					graphics.moveTo(plot, plotRect.top);
					graphics.lineTo(plot, plotRect.bottom);
				} else if (axis.scale.format) {
					const text = this.formatNumber(current, axis.scale.format.numberFormat,
						axis.scale.format.localCulture);
					graphics.fillText(`${text}`, plot, axis.position.bottom - 200);
				} else {
					graphics.fillText(`${current}`, plot, axis.position.bottom - 200);
				}
				break;
			case 'bottom':
				plot = plotRect.left + pos * plotRect.width;
				if (grid) {
					graphics.moveTo(plot, plotRect.top);
					graphics.lineTo(plot, plotRect.bottom);
				} else if (axis.scale.format) {
					const text = this.formatNumber(current, axis.scale.format.numberFormat,
						axis.scale.format.localCulture);
					graphics.fillText(`${text}`, plot, axis.position.top + 200);
				} else {
					graphics.fillText(`${current}`, plot, axis.position.top + 200);
				}
				break;
			}

			current = item.incrementScale(axis, current);
		}
		if (grid) {
			graphics.stroke();
		}
	}

	drawPlot(graphics, item, plotRect, serie, seriesIndex) {
		let index = 0;
		let x;
		let y;
		const value = {};

		const ref = item.getDataSourceInfo(serie.formula);
		if (!ref) {
			return;
		}

		const axes = item.getAxes(serie.xAxis, serie.yAxis);
		if (!axes) {
			return;
		}

		graphics.save();
		graphics.beginPath();
		graphics.rect(plotRect.left, plotRect.top, plotRect.width, plotRect.height);
		graphics.clip();

		graphics.beginPath();
		graphics.setLineColor(serie.format.lineColor || item.getTemplate('basic').series.line[seriesIndex]);
		graphics.setLineWidth(serie.format.lineWidth || item.getTemplate('basic').series.linewidth);

		while (item.getValue(ref, index, value)) {
			x = item.scaleToAxis(axes.x, value.x, false);
			y = item.scaleToAxis(axes.y, value.y, false);
			if (index) {
				graphics.lineTo(plotRect.left + x * plotRect.width, plotRect.bottom - y * plotRect.height);
			} else {
				graphics.moveTo(plotRect.left + x * plotRect.width, plotRect.bottom - y * plotRect.height);
			}
			index += 1;
		}

		graphics.stroke();
		graphics.setLineWidth(1);
		graphics.restore();
	}

	drawTitle(graphics, item) {
		const { title } = item;

		const text = String(item.getExpressionValue(title.formula));

		graphics.setTextBaseline('middle');
		graphics.setFillColor('#000000');
		graphics.setTextAlignment(TextFormatAttributes.TextAlignment.CENTER);
		graphics.fillText(text, title.position.left + title.position.width / 2, title.position.top + title.position.height / 2);
	}

	formatNumber(value, numberFormat, localCulture) {
		// somehow the scale value sometimes does not show correct values
		value = MathUtils.roundTo(value, 12);
		if (numberFormat && numberFormat !== 'General' && localCulture) {
			let formattingResult = {
				value,
				formattedValue: value,
				color: undefined,
				type: 'general'
			};
			const type = localCulture.split(';');
			try {
				formattingResult = NumberFormatter.formatNumber(numberFormat, formattingResult.value, type[0]);
			} catch (e) {
				formattingResult.formattedValue = '#####';
			}

			return formattingResult.formattedValue;
		}
		return String(value);
	}

	hasSelectedFormula(sheet) {
		if (this.chartSelection) {
			switch (this.chartSelection.element) {
			case 'datarow':
			case 'title':
			case 'legend':
			case 'xAxis':
			case 'yAxis':
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
			case 'datarow':
			case 'xAxis':
			case 'yAxis':
			case 'title':
			case 'legend': {
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
					useName: true,
				})}`;
				return formula
			} else {
				return expr.getValue();
			}
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
			data.format.lineColor = map.get('linecolor');
			this.getItem().finishCommand(cmd, key);
			viewer.getInteractionHandler().execute(cmd);
		};

		if (this.chartSelection) {
			switch (this.chartSelection.element) {
			case 'datarow':
				update('series');
				return true;
			case 'xAxis':
			case 'yAxis':
				update('axes');
				return true;
			case 'title':
				update('title');
				return true;
			case 'legend':
				update('legend');
				return true;
			default:
				break;
			}
		}
		return false;
	}
}
