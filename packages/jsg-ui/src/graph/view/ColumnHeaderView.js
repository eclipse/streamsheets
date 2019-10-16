import { FormatAttributes } from '@cedalo/jsg-core';

import HeaderView from './HeaderView';

/**
 * This view is for a {{#crossLink "ColumnHeaderNode"}}{{/crossLink}} model. Although it
 * c an be instantiated directly the recommended way to create this view is by calling
 * {{#crossLink "NodeController/createView:method"}}{{/crossLink}} method.
 *
 * @class ColumnHeaderView
 * @extends HeaderView
 * @param {ColumnHeaderNode} item The corresponding  ColumnHeaderNode model.
 * @constructor
 */
export default class ColumnHeaderView extends HeaderView {
	draw(graphics) {
		const origin = this.getScrollOffset();

		graphics.translate(0, -origin.y);

		super.draw(graphics);

		graphics.translate(0, origin.y);
	}

	drawBorder(graphics, format, rect) {
		const getCharFromNumber = (columnNumber) => {
			let dividend = columnNumber;
			let columnName = '';
			let modulo;

			while (dividend > 0) {
				modulo = (dividend - 1) % 26;
				columnName = String.fromCharCode(65 + modulo).toString() + columnName;
				dividend = parseInt((dividend - modulo) / 26, 0);
			}
			return columnName;
		};

		const item = this.getItem();
		let size = 0;
		let title;
		let i;
		let n;
		const pixel = graphics.getCoordinateSystem().deviceToLogYNoZoom(1);

		const wsView = this.getWorksheetView();
		if (!wsView) {
			return;
		}

		const viewRect = wsView.getViewPort().getVisibleViewRect();

		let xStart = rect.x;
		let yStart = rect.y;
		let xEnd = rect.x;
		let yEnd = rect.getBottom();

		graphics.setLineColor('#AAAAAA');
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.beginPath();
		graphics.moveTo(xStart, yStart);
		graphics.lineTo(xEnd, yEnd);

		this.setFont(graphics);

		const pix = graphics.getCoordinateSystem().deviceToLogXNoZoom(1);

		for (i = 0, n = item.getSections(); i < n; i += 1) {
			size = item.getSectionSize(i);
			title = item.getSectionTitle(i);

			if (xStart >= viewRect.x - size && size) {
				if (title === undefined) {
					title = getCharFromNumber(i + item.getInitialSection() + 1);
				}
				graphics.fillText(title, xStart + size / 2, rect.y + rect.height / 2 + pixel);
			}

			xStart += size;
			xEnd = xStart;

			const nextSize = item.getSectionSize(i + 1);

			if (xStart >= viewRect.x) {
				if (nextSize === 0) {
					graphics.moveTo(xStart - pix, yStart);
					graphics.lineTo(xEnd - pix, yEnd);
				} else if (size === 0) {
					graphics.moveTo(xStart + pix, yStart);
					graphics.lineTo(xEnd + pix, yEnd);
				} else {
					graphics.moveTo(xStart, yStart);
					graphics.lineTo(xEnd, yEnd);
				}
			}

			if (xStart > viewRect.getRight()) {
				break;
			}
		}

		xStart = rect.x;
		yStart = rect.getBottom();
		xEnd = rect.getRight();
		yEnd = rect.getBottom();

		graphics.moveTo(xStart, yStart);
		graphics.lineTo(xEnd, yEnd);

		graphics.stroke();

		const graph = this.getItem().getGraph();
		const id = graph.getTopStreamSheetContainerId();
		if (id !== undefined && id !== wsView.getItem().getId()) {
			this.drawSelections(graphics);
		}
	}

	drawSelections(graphics) {
		const wsView = this.getWorksheetView();
		if (!wsView) {
			return;
		}

		const ws = wsView.getItem();
		const selection = wsView.getOwnSelection();

		graphics.setLineColor('#F29536');
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.setTransparency(50);

		selection.getRanges().forEach((range) => {
			const selrect = ws.getCellRect(range);
			selrect.y = 0;
			selrect.height = this.getItem().getInternalHeight();

			if (range.isColumnRange()) {
				graphics.setFillColor('#F5CE82');
			} else {
				graphics.setFillColor('#D2D2D2');
			}

			graphics.fillRect(selrect);
		});

		graphics.setTransparency(100);
	}

	getSectionSplit(pos) {
		const item = this.getItem();
		const rowWidth = this.getWorksheetView()
			.getItem()
			.getRows()
			.getInternalWidth();
		const sheetPoint = this.getScrollOffset();

		sheetPoint.x = pos - sheetPoint.x - rowWidth;

		return item.getSectionSplit(sheetPoint.x);
	}
}
