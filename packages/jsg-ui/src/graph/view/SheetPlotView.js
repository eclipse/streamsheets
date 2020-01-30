import {
	SheetReference, TextFormatAttributes
} from '@cedalo/jsg-core';
import NodeView from './NodeView';

const getParamInfo = (term, index) => {
	if (term && term.params && term.params.length >= index) {
		const { operand } = term.params[index];
		if (operand instanceof SheetReference) {
			const range = operand._range.copy();
			range.shiftFromSheet();
			return { sheet: operand._item, range };
		}
	}
	return undefined;
};

const getParamValue = (term, index) => {
	const info = getParamInfo(term, index);
	if (info) {
		const cell = info.sheet.getDataProvider().getRC(info.range._x1, info.range._y1);
		return cell ? cell.getValue() : 0;
	}
	if (term && term.params && term.params.length >= index) {
		return Number(term.params[index].value);
	}
	return 0;
};

const isTimeAggregateRange = (sheet, range) => {
	if (range.getWidth() !== 1 || range.getHeight() !== 1) {
		return undefined;
	}
	const cell = sheet.getDataProvider().getRC(range._x1, range._y1);
	const expr = cell ? cell.getExpression() : undefined;
	if (expr === undefined) {
		return undefined;
	}
	const formula = expr.getFormula();

	if (formula && formula.indexOf('TIMEAGGREGATE') !== -1) {
		return cell;
	}

	return undefined;
};

const getDataSourceInfo = (ds) => {
	const ret = {
		x: getParamInfo(ds.getTerm(), 1),
		y: getParamInfo(ds.getTerm(), 2)
	};
	ret.xTime = isTimeAggregateRange(ret.x.sheet, ret.x.range);
	ret.yTime = isTimeAggregateRange(ret.y.sheet, ret.y.range);

	return ret;
};

const getAxisInfo = (formula) => {
	return {
		min: getParamValue(formula.getTerm(), 0),
		max: getParamValue(formula.getTerm(), 1),
		step: getParamValue(formula.getTerm(), 2),
	};
};

export default class SheetPlotView extends NodeView {
	drawBorder(graphics, format, rect) {
		super.drawBorder(graphics, format, rect);
	}

	drawFill(graphics, format, rect) {
		super.drawFill(graphics, format, rect);

		const item = this.getItem();

		if (item._isFeedback) {
			return;
		}

		const { dataSources } = item;

		const plotRect = item.plot.position;

		dataSources.forEach((ds) => {
			const ref = getDataSourceInfo(ds);
			if (ref) {
				const xAxisInfo = getAxisInfo(item.xAxes[0].formula);
				const yAxisInfo = getAxisInfo(item.yAxes[0].formula);
				if (!this.validateAxis(xAxisInfo) || !this.validateAxis(yAxisInfo)) {
					return;
				}

				this.drawPlot(graphics, item, plotRect, xAxisInfo, yAxisInfo, ref);
				this.drawXAxes(graphics, item, xAxisInfo);
				this.drawYAxes(graphics, item, yAxisInfo);
				this.drawTitle(graphics, item);
			}
		});
	}

	drawXAxes(graphics, item, xAxisInfo) {
		const axes = item.xAxes;

		graphics.beginPath();
		graphics.setLineColor('#AAAAAA');

		axes.forEach((axis) => {
			graphics.moveTo(axis.position.left, axis.position.top);
			graphics.lineTo(axis.position.right, axis.position.top);
		});
		graphics.stroke();
	}

	drawYAxes(graphics, item, yAxisInfo) {
		const axes = item.yAxes;

		graphics.beginPath();
		graphics.setLineColor('#AAAAAA');

		axes.forEach((axis) => {
			graphics.moveTo(axis.position.right, axis.position.top);
			graphics.lineTo(axis.position.right, axis.position.bottom);
		});
		graphics.stroke();
	}

	drawPlot(graphics, item, plotRect, xAxisInfo, yAxisInfo, ref) {
		let index = 0;
		let x;
		let y;
		const value = {};

		graphics.beginPath();
		graphics.setLineColor('#FF0000');

		while (this.getValue(ref, index, value)) {
			x = this.scaleToAxis(xAxisInfo, value.x);
			y = this.scaleToAxis(yAxisInfo, value.y);
			if (index) {
				graphics.lineTo(plotRect.left + x * plotRect.width, plotRect.bottom - y * plotRect.height);
			} else {
				graphics.moveTo(plotRect.left + x * plotRect.width, plotRect.bottom - y * plotRect.height);
			}
			index += 1;
		}

		graphics.stroke();
	}

	drawTitle(graphics, item) {
		const { title } = item;

		const text = String(item.getExpressionValue(title.title));

		graphics.setTextBaseline('top');
		graphics.setFillColor('#000000');
		graphics.setTextAlignment(TextFormatAttributes.TextAlignment.CENTER);
		graphics.fillText(text, title.position.width / 2, title.position.top);
	}

	getValue(ref, index, value) {
		const item = this.getItem();

		if (item.xAxes[0].type === 'category') {
			value.x = index;
		} else if (ref.xTime) {
			const values = ref.xTime.getValues();
			if (values && values.length > index) {
				value.x = values[index].key;
			}
		} else if (index <= ref.x.range._y2 - ref.x.range._y1) {
			const cell = ref.x.sheet.getDataProvider().getRC(ref.x.range._x1, ref.x.range._y1 + index);
			value.x =  cell ? Number(cell.getValue()) : 0;
		}

		if (ref.yTime) {
			const values = ref.yTime.getValues();
			if (values && values.length > index) {
				value.y = values[index].value;
				return true;
			}
		} else if (index <= ref.y.range._y2 - ref.y.range._y1) {
			const cell = ref.y.sheet.getDataProvider().getRC(ref.y.range._x1, ref.y.range._y1 + index);
			value.y =  cell ? Number(cell.getValue()) : 0;
			return true;
		}

		return false;
	}

	validateAxis(axisInfo) {
		return (axisInfo.step > 0 && axisInfo.max > axisInfo.min);
	}

	scaleToAxis(info, value) {

		value = (value - info.min) / (info.max - info.min);

		return value;
	}
}
