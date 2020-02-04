import { Point, GraphUtils, FormatAttributes, TextFormatAttributes } from '@cedalo/jsg-core';

import View from '../../ui/View';
import SelectionStyle from '../view/selection/SelectionStyle';

export default class ChartInfoFeedbackView extends View {
	constructor(chartView, selection, point, viewer) {
		super();

		this.chartView = chartView;
		this.point = point;
		this.selection = selection;
	}

	draw(graphics) {
		const item = this.chartView.getItem();
		const top = new Point(0, item.plot.position.top);
		const bottom = new Point(0, item.plot.position.bottom);

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

		graphics.moveTo(this.point.x, top.y);
		graphics.lineTo(this.point.x, bottom.y);

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

			graphics.setTextBaseline('top');
			graphics.setTextAlignment(TextFormatAttributes.TextAlignment.LEFT);
			graphics.setFontName('Verdana');
			graphics.setFontSize(9);
			graphics.setFont();

			this.selection.dataPoints.forEach((value) => {
				width = Math.max(width, graphics.measureText(String(value.x)).width);
				width = Math.max(width, graphics.measureText(String(value.y)).width);
			});

			width = graphics.getCoordinateSystem().deviceToLogX(width, true);

			graphics.beginPath();
			graphics.setFillColor('#444444');
			graphics.setLineColor('#AAAAAA');
			graphics.rect(this.point.x + space, this.point.y + space, width + margin * 2,
				margin * 2 + (this.selection.dataPoints.length + 1) * height);
			graphics.fill();
			graphics.stroke();

			graphics.setFillColor('#FFFFFF');
			graphics.fillText(String(this.selection.dataPoints[0].x), this.point.x + space + margin, this.point.y + space + margin);
			this.selection.dataPoints.forEach((value, index) => {
				graphics.fillText(String(value.y), this.point.x + space + margin, this.point.y + height * (index + 1) + space + margin * 2);
			});
		}
	}
}
