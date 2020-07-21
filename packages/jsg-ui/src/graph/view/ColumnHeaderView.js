/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
import {default as JSG, FormatAttributes, ColumnHeaderNode, RowHeaderNode, SetHeaderSectionOutlineFlagCommand} from '@cedalo/jsg-core';

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
		let title;
		const pixel = graphics.getCoordinateSystem().deviceToLogYNoZoom(1);

		const wsView = this.getWorksheetView();
		if (!wsView) {
			return;
		}

		const rectTmp = rect.copy();
		const itemSize = item.getSizeAsPoint();
		rectTmp.y = itemSize.y - ColumnHeaderNode.HEIGHT;
		rectTmp.height = ColumnHeaderNode.HEIGHT;
		const viewRect = wsView.getViewPort().getVisibleViewRect();

		let xStart = rectTmp.x;
		let yStart = rectTmp.y;
		let xEnd = rectTmp.x;
		let yEnd = rectTmp.getBottom();

		graphics.setLineColor(JSG.theme.outline);
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.beginPath();
		graphics.moveTo(xStart, yStart);
		graphics.lineTo(xEnd, yEnd);

		let size = 0;
		let level;
		let levelNext = 0;
		let levelPrev = 0;
		const levelLine = [];
		const levelMax = item.getMaxLevel();
		let lastMax = 0;
		let i;
		let j;
		let n;
		const pix = graphics.getCoordinateSystem().deviceToLogXNoZoom(1);

		if (levelMax) {
			item.updateParents();
			this.setFont(graphics, 9, JSG.theme.headertext, 1);
			const outlineDirection = item.getHeaderAttributes().getOutlineDirection().getValue();
			if (outlineDirection === 'below') {
				levelLine[0] = xStart;
			}
			graphics.setLineColor(JSG.theme.outline);
			for (i = 0, n = item.getSections(); i < n; i += 1) {
				size = item.getSectionSize(i);
				level = item.getSectionLevel(i);

				if (outlineDirection === 'above') {
					levelNext = item.getSectionLevel(i + 1);
					if (levelLine[levelNext] !== undefined && levelNext < level) {
						for (j = levelNext; j < level; j += 1) {
							if (levelLine[j] !== undefined) {
								graphics.moveTo(levelLine[j], rect.y + j * 600 + 300);
								graphics.lineTo(xStart + size, rect.y + j * 600 + 300);
								graphics.lineTo(xStart + size, rect.y + j * 600 + 400);
								levelLine[j] = undefined;
							}
						}
					}
					if (levelNext > level) {
						if (size) {
							graphics.rect(xStart + size / 2 - 200, rect.y + 100 + level * 600, 400, 400);
							graphics.fillText(item.getSectionClosed(i) ? '+' : '-', xStart + size / 2, rect.y + level * 600 + 300);
						}
						if (item.getSectionClosed(i) || !item.getSectionSize(i)) {
							levelLine[level] = undefined;
						} else {
							levelLine[level] = xStart + size / 2 + 200;
						}
					}
					if (item.getSectionClosed(i) || !item.getSectionSize(i)) {
						levelLine[level] = undefined;
					}
				} else {
					levelPrev = item.getSectionLevel(i - 1);
					if (levelPrev > level) {
						if (size) {
							graphics.rect(xStart + size / 2 - 200,rect.y + 100 + level * 600,  400, 400);
							graphics.fillText(item.getSectionClosed(i) ? '+' : '-', xStart + size / 2, rect.y + level * 600 + 300);
						}
						if (!item.getSectionClosed(i) && item.getSectionSize(i)) {
							if (levelLine[level] !== undefined) {
								graphics.moveTo(xStart + size / 2 - 200, rect.y + level * 600 + 300);
								graphics.lineTo(levelLine[level], rect.y + level * 600 + 300);
								graphics.lineTo(levelLine[level], rect.y + level * 600 + 400);
								levelLine[level] = undefined;
								lastMax = level;
							}
						}
					}
					if (levelPrev < level) {
						lastMax = level;
					}
					for (j = level; j < levelMax; j += 1) {
						levelLine[j] = xStart + size;
					}
				}

				// graphics.fillText(level, rectTmp.x, yStart + size / 2 + pix);
				// const par = item.getSectionParent(i);
				// if (par !== undefined) {
				// 	graphics.fillText(par, rectTmp.x - 500, yStart + size / 2 + pix);
				// }

				xStart += size;
				xEnd = xStart;

				if (xStart > viewRect.getRight()) {
					break;
				}
			}
		}

		graphics.stroke();
		graphics.beginPath();
		this.setFont(graphics, 9, JSG.theme.headertext);
		graphics.setLineColor(JSG.theme.frame);
		xStart = rectTmp.x;

		for (i = 0, n = item.getSections(); i < n; i += 1) {
			size = item.getSectionSize(i);
			title = item.getSectionTitle(i);

			if (xStart >= viewRect.x - size && size) {
				if (title === undefined) {
					title = getCharFromNumber(i + item.getInitialSection() + 1);
				}
				graphics.fillText(title, xStart + size / 2, rectTmp.y + rectTmp.height / 2 + pixel);
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

		xStart = rectTmp.x;
		yStart = rectTmp.getBottom();
		xEnd = rectTmp.getRight();
		yEnd = rectTmp.getBottom();

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
		const itemSize = this.getItem().getSizeAsPoint();

		graphics.setLineColor('#F29536');
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.setTransparency(50);

		selection.getRanges().forEach((range) => {
			const selrect = ws.getCellRect(range);
			selrect.y = itemSize.y - ColumnHeaderNode.HEIGHT;
			selrect.height = ColumnHeaderNode.HEIGHT;

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

	handleOutlineMouseDown(index, viewer) {
		const item = this.getItem();
		const closed = item.getSectionClosed(index);

		viewer.getInteractionHandler().execute(
			new SetHeaderSectionOutlineFlagCommand(
				item,
				index,
				!closed
			)
		);

	}
}
