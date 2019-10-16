import { FormatAttributes } from '@cedalo/jsg-core';
import HeaderView from './HeaderView';

/**
 * This view is for a {{#crossLink "RowHeaderNode"}}{{/crossLink}} model. Although it
 * can be instantiated directly the recommended way to create this view is by calling
 * {{#crossLink "NodeController/createView:method"}}{{/crossLink}} method.
 *
 * @class RowHeaderView
 * @extends NodeView
 * @param {RowHeaderNode} item The correspondingRowHeaderNode model.
 * @constructor
 */
export default class RowHeaderView extends HeaderView {
	draw(graphics) {
		const origin = this.getScrollOffset();

		graphics.translate(-origin.x, 0);

		super.draw(graphics);

		graphics.translate(origin.x, 0);
	}

	drawBorder(graphics, format, rect) {
		const item = this.getItem();
		const wsView = this.getWorksheetView();

		if (!wsView) {
			return;
		}

		const viewRect = wsView.getViewPort().getVisibleViewRect();
		let xStart = rect.x;
		let xEnd = rect.getRight();
		let yStart = rect.y;
		let yEnd = rect.y;

		graphics.setLineColor('#AAAAAA');
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.beginPath();
		graphics.moveTo(xStart, yStart);
		graphics.lineTo(xEnd, yEnd);

		this.setFont(graphics);

		let size = 0;
		let i;
		let n;
		const pix = graphics.getCoordinateSystem().deviceToLogYNoZoom(1);

		for (i = 0, n = item.getSections(); i < n; i += 1) {
			size = item.getSectionSize(i);

			if (size && yStart >= viewRect.y - size) {
				graphics.fillText(i + item.getInitialSection() + 1, rect.x + rect.width / 2, yStart + size / 2 + pix);
			}

			yStart += size;
			yEnd = yStart;

			if (yStart >= viewRect.y) {
				const nextSize = item.getSectionSize(i + 1);
				if (nextSize === 0) {
					graphics.moveTo(xStart, yStart - pix);
					graphics.lineTo(xEnd, yEnd - pix);
				} else if (size === 0) {
					graphics.moveTo(xStart, yStart + pix);
					graphics.lineTo(xEnd, yEnd + pix);
				} else {
					graphics.moveTo(xStart, yStart);
					graphics.lineTo(xEnd, yEnd);
				}
			}

			if (yStart > viewRect.getBottom()) {
				break;
			}
		}

		xStart = rect.getRight();
		yStart = rect.y;
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
		let selrect;

		graphics.setLineColor('#F29536');
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.setTransparency(50);

		selection.getRanges().forEach((range) => {
			selrect = ws.getCellRect(range);
			selrect.x = 0;
			selrect.width = this.getItem().getInternalWidth();

			if (range.isRowRange()) {
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
		const columnWidth = this.getWorksheetView()
			.getItem()
			.getColumns()
			.getInternalHeight();
		const sheetPoint = this.getScrollOffset();

		sheetPoint.y = pos - sheetPoint.y - columnWidth;

		return item.getSectionSplit(sheetPoint.y);
	}
}
