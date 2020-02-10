import { Point, GraphUtils, Rectangle, FormatAttributes } from '@cedalo/jsg-core';

import View from '../../ui/View';
import SelectionStyle from '../view/selection/SelectionStyle';

/**
 * This class is used to visualize feedback during cell drag operations.
 *
 * @class CellFeedbackView
 * @extends View
 * @constructor
 */
export default class ChartSelectionFeedbackView extends View {
	constructor(chartView) {
		super();

		this.chartView = chartView;
	}

	draw(graphics) {
		const point = new Point(0, 0);
		const rect = new Rectangle();
		const drawMarkerRect = ((sel) => {
			rect.set(sel.left - 75, sel.top - 75, 150, 150);
			graphics.drawMarker(rect, true);
			rect.set(sel.right - 75, sel.top - 75, 150, 150);
			graphics.drawMarker(rect, true);
			rect.set(sel.left - 75, sel.bottom - 75, 150, 150);
			graphics.drawMarker(rect, true);
			rect.set(sel.right - 75, sel.bottom - 75, 150, 150);
			graphics.drawMarker(rect, true);
		});

		GraphUtils.traverseUp(this.chartView, this._graphView, (v) => {
			v.translateToParent(point);
			return true;
		});

		graphics.save();
		graphics.translate(point.x, point.y);

		const item = this.chartView.getItem();
		const selection = this.chartView.chartSelection;
		graphics.setFillColor(SelectionStyle.MARKER_FILL_COLOR);
		graphics.setLineColor(SelectionStyle.MARKER_BORDER_COLOR);
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.setFillStyle(FormatAttributes.FillStyle.SOLID);

		switch (selection.element) {
		case 'datarow': {
			const ref = item.getDataSourceInfo(selection.data.formula);
			if (ref) {
				const axes = item.getAxes(0, 0);
				let index = 0;
				let x;
				let y;
				const value = {};
				const plotRect = item.plot.position;

				while (item.getValue(ref, index, value)) {
					x = plotRect.left + item.scaleToAxis(axes.x.scale, value.x) * plotRect.width;
					y = plotRect.bottom - item.scaleToAxis(axes.y.scale, value.y) * plotRect.height;
					rect.set(x - 75, y - 75, 150, 150);
					graphics.drawMarker(rect, true);
					index += 1;
				}
			}
			break;
		}
		case 'title':
		case 'xAxis':
		case 'yAxis':
		case 'plot':
		case 'legend':
			drawMarkerRect(selection.data.position);
			break;
		default:
			break;
		}

		graphics.translate(-point.x, -point.y);
		graphics.restore();

	}
}
