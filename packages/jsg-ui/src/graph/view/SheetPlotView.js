import {
	SheetReference, TextFormatAttributes
} from '@cedalo/jsg-core';
import NodeView from './NodeView';

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
			const ref = item.getDataSourceInfo(ds);
			if (ref) {
				const xAxisInfo = item.getAxisInfo(item.xAxes[0].formula);
				const yAxisInfo = item.getAxisInfo(item.yAxes[0].formula);
				if (!item.validateAxis(xAxisInfo) || !item.validateAxis(yAxisInfo)) {
					return;
				}

				this.drawPlot(graphics, item, plotRect, xAxisInfo, yAxisInfo, ref);
			}
		});

		this.drawXAxes(graphics, item);
		this.drawYAxes(graphics, item);
		this.drawTitle(graphics, item);
	}

	drawXAxes(graphics, item, xAxisInfo) {
		const axes = item.xAxes;

		axes.forEach((axis) => {
			const info = item.getAxisInfo(axis.formula);
			// draw axis line
			graphics.beginPath();
			graphics.setLineColor('#AAAAAA');
			graphics.moveTo(axis.position.left, axis.position.top);
			graphics.lineTo(axis.position.right, axis.position.top);
			graphics.stroke();

			graphics.setTextBaseline('top');
			graphics.setFillColor('#000000');
			graphics.setTextAlignment(TextFormatAttributes.TextAlignment.CENTER);
			graphics.fillText(`${info.min}`, axis.position.left, axis.position.top);
			graphics.fillText(`${info.max}`, axis.position.right, axis.position.top);
		});
	}

	drawYAxes(graphics, item) {
		const axes = item.yAxes;

		axes.forEach((axis) => {
			const info = item.getAxisInfo(axis.formula);

			graphics.beginPath();
			graphics.setLineColor('#AAAAAA');
			graphics.moveTo(axis.position.right, axis.position.top);
			graphics.lineTo(axis.position.right, axis.position.bottom);
			graphics.stroke();

			graphics.setTextBaseline('middle');
			graphics.setFillColor('#000000');
			graphics.setTextAlignment(TextFormatAttributes.TextAlignment.RIGHT);
			graphics.fillText(`${info.min}`, axis.position.right, axis.position.bottom);
			graphics.fillText(`${info.max}`, axis.position.right, axis.position.top);
		});
	}

	drawPlot(graphics, item, plotRect, xAxisInfo, yAxisInfo, ref) {
		let index = 0;
		let x;
		let y;
		const value = {};

		graphics.beginPath();
		graphics.setLineColor('#FF0000');

		while (item.getValue(ref, index, value)) {
			x = item.scaleToAxis(xAxisInfo, value.x);
			y = item.scaleToAxis(yAxisInfo, value.y);
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

}
