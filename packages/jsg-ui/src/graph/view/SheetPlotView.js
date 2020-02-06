import {
	default as JSG,
	MathUtils,
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

		const { series } = item;
		const plotRect = item.plot.position;
		const axes = item.getAxes(0, 0);

		series.forEach((serie) => {
			const ref = item.getDataSourceInfo(serie.formula);
			if (ref) {
				this.drawPlot(graphics, item, plotRect, axes, ref);
			}
		});

		this.drawXAxes(graphics, plotRect, item);
		this.drawYAxes(graphics, plotRect, item);
		this.drawTitle(graphics, item);
	}

	drawXAxes(graphics, plotRect, item) {
		const axes = item.xAxes;

		axes.forEach((axis) => {
			// draw axis line
			graphics.beginPath();
			graphics.setLineColor('#AAAAAA');
			graphics.moveTo(axis.position.left, axis.position.top);
			graphics.lineTo(axis.position.right, axis.position.top);
			graphics.stroke();

			graphics.setTextBaseline('top');
			graphics.setFillColor('#000000');
			graphics.setTextAlignment(TextFormatAttributes.TextAlignment.CENTER);

			let current = axis.scale.min;
			let x;

			while (current <= axis.scale.max) {
				x = item.scaleToAxis(axis.scale, current);
				if (axis.scale.format) {
					const text = this.formatNumber(current, axis.scale.format.numberFormat,
						axis.scale.format.localCulture);
					graphics.fillText(`${text}`, plotRect.left + x * plotRect.width, axis.position.top + 150);
				} else {
					graphics.fillText(`${current}`, plotRect.left + x * plotRect.width, axis.position.top + 150);
				}
				current += axis.scale.step;
			}
		});
	}

	drawYAxes(graphics, plotRect, item) {
		const axes = item.yAxes;

		axes.forEach((axis) => {
			graphics.beginPath();
			graphics.setLineColor('#AAAAAA');
			graphics.moveTo(axis.position.right, axis.position.top);
			graphics.lineTo(axis.position.right, axis.position.bottom);
			graphics.stroke();

			graphics.setTextBaseline('middle');
			graphics.setFillColor('#000000');
			graphics.setTextAlignment(TextFormatAttributes.TextAlignment.RIGHT);

			let current = axis.scale.min;
			let y;

			while (current <= axis.scale.max) {
				y = item.scaleToAxis(axis.scale, current);
				if (axis.scale.format) {
					const text = this.formatNumber(current, axis.scale.format.numberFormat,
						axis.scale.format.localCulture);
					graphics.fillText(`${text}`, axis.position.right - 150, plotRect.bottom - y * plotRect.height);
				} else {
					graphics.fillText(`${current}`, axis.position.right - 150, plotRect.bottom - y * plotRect.height);
				}
				current += axis.scale.step;
			}
		});
	}

	drawPlot(graphics, item, plotRect, axes, ref) {
		let index = 0;
		let x;
		let y;
		const value = {};

		graphics.save();
		graphics.beginPath();
		graphics.rect(plotRect.left, plotRect.top, plotRect.width, plotRect.height);
		graphics.clip();

		graphics.beginPath();
		graphics.setLineColor('#FF0000');

		while (item.getValue(ref, index, value)) {
			x = item.scaleToAxis(axes.x.scale, value.x);
			y = item.scaleToAxis(axes.y.scale, value.y);
			if (index) {
				graphics.lineTo(plotRect.left + x * plotRect.width, plotRect.bottom - y * plotRect.height);
			} else {
				graphics.moveTo(plotRect.left + x * plotRect.width, plotRect.bottom - y * plotRect.height);
			}
			index += 1;
		}

		graphics.stroke();
		graphics.restore();
	}

	drawTitle(graphics, item) {
		const { title } = item;

		const text = String(item.getExpressionValue(title.formula));

		graphics.setTextBaseline('top');
		graphics.setFillColor('#000000');
		graphics.setTextAlignment(TextFormatAttributes.TextAlignment.CENTER);
		graphics.fillText(text, title.position.width / 2, title.position.top);
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
		if (this.chartSelection) {
			switch (this.chartSelection.element) {
			case 'datarow':
				return `=${this.chartSelection.data.formula.getFormula()}`;
			case 'title':
				return `=${this.chartSelection.data.formula.getFormula()}`;
			case 'xAxis':
			case 'yAxis':
				return `=${this.chartSelection.data.formula.getFormula()}`;
			default:
				break;
			}
		}

		return super.getSelectedFormula(sheet);
	}
}
