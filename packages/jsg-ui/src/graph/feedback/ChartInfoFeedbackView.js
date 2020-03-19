import { Point, GraphUtils, FormatAttributes, TextFormatAttributes } from '@cedalo/jsg-core';

import View from '../../ui/View';
import SelectionStyle from '../view/selection/SelectionStyle';

export default class ChartInfoFeedbackView extends View {
	constructor(chartView, selection, point, value, viewer) {
		super();

		this.chartView = chartView;
		this.point = point;
		this.selection = selection;
		this.value = value;
	}

	draw(graphics) {
		const item = this.chartView.getItem();
		const top = new Point(item.plot.position.left, item.plot.position.top);
		const bottom = new Point(item.plot.position.left, item.plot.position.bottom);
		const left = new Point(item.plot.position.left, item.plot.position.top);
		const right = new Point(item.plot.position.right, item.plot.position.top);

		GraphUtils.traverseUp(this.chartView, this._graphView, (v) => {
			v.translateToParent(top);
			v.translateToParent(bottom);
			v.translateToParent(left);
			v.translateToParent(right);
			return true;
		});

		graphics.setFillColor(SelectionStyle.MARKER_FILL_COLOR);
		graphics.setFillStyle(FormatAttributes.FillStyle.SOLID);
		graphics.setLineColor(SelectionStyle.MARKER_BORDER_COLOR);
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);

		graphics.beginPath();

		const plotRect = item.plot.position;
		let x;
		let y;

		if (item.xAxes[0].align === 'bottom' || item.xAxes[0].align === 'top') {
			x = top.x + item.scaleToAxis(item.xAxes[0], this.value.x, undefined, false)  * plotRect.width;
			y = top.y;

			if (x  - top.x > plotRect.width || x - top.x < 0) {
				return;
			}
			graphics.moveTo(x, top.y);
			graphics.lineTo(x, bottom.y);

			if (this.endPoint) {
				graphics.moveTo(this.endPoint.x, top.y);
				graphics.lineTo(this.endPoint.x, bottom.y);
				graphics.rect(this.point.x, top.y, this.endPoint.x - this.point.x, bottom.y - top.y);
			}
		} else {
			x = top.x;
			y = bottom.y - item.scaleToAxis(item.xAxes[0], this.value.x, undefined, false)  * plotRect.height;

			if (y - top.y > plotRect.height || y - top.y < 0) {
				return;
			}
			graphics.moveTo(left.x, y);
			graphics.lineTo(right.x, y);

			if (this.endPoint) {
				graphics.moveTo(left.x, this.endPoint.y);
				graphics.lineTo(right.x, this.endPoint.y);
				graphics.rect(left.x, this.point.y, right.x - left.x, this.endPoint.y - this.point.y);
			}
		}

		graphics.stroke();
		graphics.setTransparency(30);
		graphics.fill();
		graphics.setTransparency(100);

		if (this.selection.dataPoints && this.selection.dataPoints.length) {
			let width = 0;
			const space = 400;
			const margin = 100;
			const height = 400;
			const getLabel = (value, xValue) => {
				const { series } = value;
				const ref = item.getDataSourceInfo(series.formula);

				let label = '';
				let axis;
				if (xValue) {
					axis = value.axes.x;
					if (axis.type === 'category' && ref) {
						label = item.getLabel(ref, axis, Math.floor(value.x));
					} else if (axis.type !== 'category' && ref && ref.time && ref.time.xvalue) {
						label = ref.xName;
						axis = value.axes.x;
						label += `: ${item.formatNumber(value.x, axis.format && axis.format.numberFormat ? axis.format : axis.scale.format)}`;
					} else {
						axis = value.axes.x;
						label = item.formatNumber(value.x, axis.format && axis.format.numberFormat ? axis.format : axis.scale.format);
					}
				} else {
					axis = value.axes.y;
					label = item.formatNumber(value.y, axis.format && axis.format.numberFormat ? axis.format : axis.scale.format);
				}
				if (ref && ref.yName !== undefined && !xValue) {
					label = `${ref.yName}: ${label}`;
				} else {
					label = String(label);
				}
				return label;
			};

			graphics.setTextBaseline('top');
			graphics.setTextAlignment(TextFormatAttributes.TextAlignment.LEFT);
			graphics.setFontName('Verdana');
			graphics.setFontSize(9);
			graphics.setFont();

			const values = [];

			item.yAxes.forEach((axis) => {
				if (axis.categories) {
					axis.categories.forEach((data) => {
						if (data.values && data.values[0] && data.values[0].x === this.selection.dataPoints[0].x) {
							data.values.forEach((value) => {
								if (value.x !== undefined && value.y !== undefined) {
									values.push(value);
								}
							});
						}
					});
				}
			});

			if (!values.length) {
				return;
			}

			width = graphics.measureText(getLabel(values[0], true)).width;
			values.forEach((value) => {
				width = Math.max(width, graphics.measureText(getLabel(value, false)).width);
			});

			width = graphics.getCoordinateSystem().deviceToLogX(width, true);

			graphics.beginPath();
			graphics.setFillColor('#FFFFFF');
			graphics.setLineColor('#AAAAAA');
			graphics.rect(x + space, y + space, width + margin * 2,
				margin * 2 + (values.length + 1) * height);
			graphics.fill();
			graphics.stroke();

			graphics.setFillColor('#000000');

			const text = getLabel(values[0], true);

			graphics.fillText(text, x + space + margin, y + space + margin);
			values.forEach((value, index) => {
				const label = getLabel(value, false);
				graphics.setFillColor(value.series.format.lineColor || item.getTemplate().series.line[value.seriesIndex]);
				graphics.fillText(label, x + space + margin, y + height * (index + 1) + space + margin * 2);
			});
		}
	}
}
