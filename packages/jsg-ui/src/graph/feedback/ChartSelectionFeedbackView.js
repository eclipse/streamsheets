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

			let pos;
			let current = item.getAxisStart(axis);
			const final = item.getAxisEnd(axis);

			while (current.value <= final) {
				if (axis.type === 'category' && current.value > axis.scale.max) {
					break;
				}
				pos = item.scaleToAxis(axis, current.value, undefined, true);

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
				let barInfo;
				const info = {
					serie,
					seriesIndex: selection.index,
					categories: axes.y.categories
				};
				const pieInfo = item.isCircular() ? item.getPieInfo(ref, serie, plotRect, selection.index) : undefined;
				let currentAngle = pieInfo ? pieInfo.startAngle : 0;

				while (item.getValue(ref, index, value)) {
					info.index = index;
					switch (serie.type) {
						case 'doughnut': {
							const angle = Math.abs(value.y) / pieInfo.sum * (pieInfo.endAngle - pieInfo.startAngle);
							const xOuterRadius = pieInfo.xRadius * (item.chart.hole + (1 - item.chart.hole) * ((selection.index + 1) / item.series.length));
							const yOuterRadius = pieInfo.yRadius * (item.chart.hole + (1 - item.chart.hole) * ((selection.index + 1) / item.series.length));
							const xInnerRadius = pieInfo.xRadius * (item.chart.hole + (1 - item.chart.hole) * (selection.index / item.series.length));
							const yInnerRadius = pieInfo.yRadius * (item.chart.hole + (1 - item.chart.hole) * (selection.index / item.series.length));
							const points = item.getEllipseSegmentPoints(pieInfo.xc, pieInfo.yc, xInnerRadius, yInnerRadius,
								xOuterRadius, yOuterRadius, 0, currentAngle, currentAngle + angle, true);
							points.forEach((pt) => {
								rect.set(pt.x - 75, pt.y - 75, 150, 150);
								graphics.drawMarker(rect, true);
							});
							currentAngle += angle;
							break;
						}
						case 'pie': {
							const angle = Math.abs(value.y) / pieInfo.sum * (pieInfo.endAngle - pieInfo.startAngle);
							const points = item.getEllipseSegmentPoints(pieInfo.xc, pieInfo.yc, 0, 0,
								pieInfo.xRadius, pieInfo.yRadius, 0, currentAngle, currentAngle + angle, true);
							points.forEach((pt) => {
								rect.set(pt.x - 75, pt.y - 75, 150, 150);
								graphics.drawMarker(rect, true);
							});
							currentAngle += angle;
							break;
						}
						case 'bar':
						case 'profile':
							x = plotRect.bottom - item.scaleToAxis(axes.x, value.x, undefined, false) * plotRect.height;
							y = plotRect.left + item.scaleToAxis(axes.y, value.y, info, false) * plotRect.width;
							if (y + 1 >= plotRect.left && y - 1 <= plotRect.right && x + 1 >= plotRect.top && x - 1 <= plotRect.bottom) {
								const barWidth = item.getBarWidth(axes, data, plotRect);
								switch (serie.type) {
								case 'bar':
									barInfo = item.getBarInfo(axes, serie, selection.index, index, value.y, barWidth);
									rect.set(y - 75, x + barInfo.offset - 75, 150, 150);
									graphics.drawMarker(rect, true);
									rect.set(y - 75, x  + barInfo.offset + barWidth - barInfo.margin - 75, 150, 150);
									graphics.drawMarker(rect, true);
									rect.set(y + barInfo.height * plotRect.width - 75, x  + barInfo.offset - 75, 150, 150);
									graphics.drawMarker(rect, true);
									rect.set(y + barInfo.height * plotRect.width - 75, x  + barInfo.offset + barWidth - barInfo.margin - 75, 150, 150);
									graphics.drawMarker(rect, true);
									break;
								default:
									rect.set(y - 75, x - 75, 150, 150);
									graphics.drawMarker(rect, true);
									break;
								}
							}
							break;
						default:
							x = plotRect.left + item.scaleToAxis(axes.x, value.x, undefined, false) * plotRect.width;
							y = plotRect.bottom - item.scaleToAxis(axes.y, value.y, info, false) * plotRect.height;
							if (x + 1 >= plotRect.left && x - 1 <= plotRect.right && y + 1 >= plotRect.top && y - 1 <= plotRect.bottom) {
								const barWidth = item.getBarWidth(axes, data, plotRect);
								switch (serie.type) {
								case 'column':
								case 'state':
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
							break;
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
