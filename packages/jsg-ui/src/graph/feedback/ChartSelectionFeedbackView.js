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

		const selection = this.chartView.chartSelection;
		const item = this.chartView.getItem();
		const data = item.getDataFromSelection(selection);
		const plotRect = item.plot.position;
		if (!data) {
			return;
		}

		graphics.save();
		graphics.translate(point.x, point.y);
		// graphics.beginPath();
		// graphics.rect(plotRect.left, plotRect.top, plotRect.width, plotRect.height);
		// graphics.clip();

		graphics.setFillColor(SelectionStyle.MARKER_FILL_COLOR);
		graphics.setLineColor(SelectionStyle.MARKER_BORDER_COLOR);
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.setFillStyle(FormatAttributes.FillStyle.SOLID);

		switch (selection.element) {
		case 'xAxisGrid':
		case 'yAxisGrid': {
			const axis = selection.data;
			if (!axis.position || !axis.scale || !axis.gridVisible) {
				break;
			}

			let current = axis.scale.min;
			let pos;

			if (axis.type === 'time') {
				current = item.incrementScale(axis, current - 0.0000001);
			}

			while (current <= axis.scale.max) {
				if (axis.type === 'category' && current >= axis.scale.max) {
					break;
				}
				pos = item.scaleToAxis(axis, current, undefined, true);

				switch (axis.align) {
				case 'left':
				case 'right':
					pos = plotRect.bottom - pos * plotRect.height;
					rect.set(plotRect.left, pos - 100, plotRect.right, pos + 100);
					rect.set(plotRect.left - 75, pos - 75, 150, 150);
					graphics.drawMarker(rect, true);
					rect.set(plotRect.right - 75, pos - 75, 150, 150);
					graphics.drawMarker(rect, true);
					break;
				case 'top':
				case 'bottom':
					pos = plotRect.left + pos * plotRect.width;
					rect.set(pos - 75, plotRect.top - 75, 150, 150);
					graphics.drawMarker(rect, true);
					rect.set(pos - 75, plotRect.bottom - 75, 150, 150);
					graphics.drawMarker(rect, true);
					break;
				}

				current = item.incrementScale(axis, current);
			}

			}
			break;
		case 'series': {
			const ref = item.getDataSourceInfo(data.formula);
			if (ref) {
				const axes = item.getAxes(data);
				let index = 0;
				let x;
				let y;
				const value = {};
				const serie = data;
				const barWidth = item.getBarWidth(axes, data, plotRect);
				let barInfo;
				const info = {
					serie,
					seriesIndex: selection.index,
					categories: axes.x.categories
				};

				while (item.getValue(ref, index, value)) {
					info.index = index;
					x = plotRect.left + item.scaleToAxis(axes.x, value.x, undefined, false) * plotRect.width;
					y = plotRect.bottom - item.scaleToAxis(axes.y, value.y, info, false) * plotRect.height;
					if (x + 1 >= plotRect.left && x - 1 <= plotRect.right && y + 1 >= plotRect.top && y - 1 <= plotRect.bottom) {
						switch (serie.type) {
						case 'column':
						case 'bar':
							barInfo = item.getBarInfo(axes, serie, selection.index, index, value.y, barWidth);
							rect.set(x + barInfo.offset  - 75, y - 75, 150, 150);
							graphics.drawMarker(rect, true);
							rect.set(x + barInfo.offset + barWidth - barInfo.margin - 75, y - 75, 150, 150);
							graphics.drawMarker(rect, true);
							rect.set(x + barInfo.offset  - 75, y - barInfo.height * plotRect.height - 75, 150, 150);
							graphics.drawMarker(rect, true);
							rect.set(x + barInfo.offset + barWidth - barInfo.margin - 75, y - barInfo.height * plotRect.height - 75, 150, 150);
							graphics.drawMarker(rect, true);
							break;
						case 'area':
							barInfo = item.getBarInfo(axes, serie, selection.index, index, value.y, barWidth);
							rect.set(x - 75, y - 75, 150, 150);
							graphics.drawMarker(rect, true);
							rect.set(x - 75, y - barInfo.height * plotRect.height - 75, 150, 150);
							graphics.drawMarker(rect, true);
							break;
						default:
							rect.set(x - 75, y - 75, 150, 150);
							graphics.drawMarker(rect, true);
							break;
						}
					}
					index += 1;
				}
			}
			break;
		}
		case 'title':
		case 'xAxis':
		case 'xAxisTitle':
		case 'yAxis':
		case 'yAxisTitle':
		case 'plot':
		case 'legend':
			drawMarkerRect(data.position);
			break;
		default:
			break;
		}

		graphics.translate(-point.x, -point.y);
		graphics.restore();
	}
}
