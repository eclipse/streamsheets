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

		GraphUtils.traverseUp(this.chartView, this._graphView, (v) => {
			v.translateToParent(top);
			v.translateToParent(bottom);
			return true;
		});

		graphics.setFillColor(SelectionStyle.MARKER_FILL_COLOR);
		graphics.setFillStyle(FormatAttributes.FillStyle.SOLID);
		graphics.setLineColor(SelectionStyle.MARKER_BORDER_COLOR);
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);

		graphics.beginPath();

		const plotRect = item.plot.position;
		const x = top.x + item.scaleToAxis(item.xAxes[0], this.value, false)  * plotRect.width;

		graphics.moveTo(x, top.y);
		graphics.lineTo(x, bottom.y);

		if (this.endPoint) {
			graphics.moveTo(this.endPoint.x, top.y);
			graphics.lineTo(this.endPoint.x, bottom.y);
			graphics.rect(this.point.x, top.y, this.endPoint.x - this.point.x, bottom.y - top.y);
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
				if (xValue) {
					label = item.formatNumber(value.x, value.axes.x.scale.format);
				} else {
					label = item.formatNumber(value.y, value.axes.y.scale.format);
				}
				if (ref && ref.name !== undefined && !xValue) {
					label = `${ref.name}: W${label}`;
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


			width = graphics.measureText(getLabel(this.selection.dataPoints[0], true)).width;
			this.selection.dataPoints.forEach((value) => {
				width = Math.max(width, graphics.measureText(getLabel(this.selection.dataPoints[0], false)).width);
			});

			width = graphics.getCoordinateSystem().deviceToLogX(width + 300, true);

			graphics.beginPath();
			graphics.setFillColor('#FFFFFF');
			graphics.setLineColor('#AAAAAA');
			graphics.rect(this.point.x + space, this.point.y + space, width + margin * 2,
				margin * 2 + (this.selection.dataPoints.length + 1) * height);
			graphics.fill();
			graphics.stroke();

			graphics.setFillColor('#000000');

			const text = getLabel(this.selection.dataPoints[0], true);

			graphics.fillText(text, this.point.x + space + margin, this.point.y + space + margin);
			this.selection.dataPoints.forEach((value, index) => {
				const label = getLabel(value, false);
				graphics.setFillColor(value.series.format.lineColor || item.getTemplate('basic').series.line[value.seriesIndex]);
				graphics.fillText(label, this.point.x + space + margin, this.point.y + height * (index + 1) + space + margin * 2);
			});
		}
	}
}
