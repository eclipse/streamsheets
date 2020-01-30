import {
	SheetReference,
} from '@cedalo/jsg-core';
import NodeView from './NodeView';

const getDataSourceInfo = (ds) => {
	const term = ds.getTerm();
	if (term && term.params && term.params.length >= 2) {
		const { operand } = term.params[2];
		if (operand instanceof SheetReference) {
			const range = operand._range.copy();
			range.shiftFromSheet();
			return { sheet: operand._item, range };
		}
	}
	return undefined;
};

const isTimeAggregateRange = (sheet, range) => {
	if (range.getWidth() !== 1 || range.getHeight() !== 1) {
		return false;
	}
	const cell = sheet.getDataProvider().getRC(range._x1, range._y1);
	const expr = cell ? cell.getExpression() : undefined;
	if (expr === undefined) {
		return false;
	}
	const formula = expr.getFormula();

	return formula ? formula.indexOf('TIMEAGGREGATE') !== -1 : false;
};


export default class SheetPlotView extends NodeView {
	drawBorder(graphics, format, rect) {
		super.drawBorder(graphics, format, rect);
	}

	drawFill(graphics, format, rect) {
		super.drawFill(graphics, format, rect);

		const item = this.getItem();
		graphics.fillText('Hase', 200, 200);

		const { dataSources } = item;

		dataSources.forEach((ds) => {
			const ref = getDataSourceInfo(ds);
			if (ref) {
				const { sheet, range } = ref;
				graphics.beginPath();
				graphics.setLineColor('#FF0000');
				graphics.moveTo(0, 0);
				for (let i = range._y1; i < range._y2; i += 1) {
					const cell = sheet.getDataProvider().getRC(range._x1, i);
					const value = cell ? cell.getValue() : undefined;
					if (value) {
						graphics.lineTo((i - range._y1) * 1000, value);
					}

				}
				graphics.stroke();
			}
		});
	}
}
