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
import { default as JSG, SetHeaderSectionOutlineFlagCommand, FormatAttributes, RowHeaderNode } from '@cedalo/jsg-core';
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

		const rectTmp = rect.copy();
		const itemSize = item.getSizeAsPoint();
		rectTmp.x = itemSize.x - RowHeaderNode.WIDTH;
		rectTmp.width = RowHeaderNode.WIDTH;
		const viewRect = wsView.getViewPort().getVisibleViewRect();
		let xStart = rectTmp.x;
		let xEnd = rectTmp.getRight();
		let yStart = rectTmp.y;
		let yEnd = rectTmp.y;

		graphics.setLineColor(JSG.theme.frame);
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
		const pix = graphics.getCoordinateSystem().deviceToLogYNoZoom(1);

		if (levelMax) {
			item.updateParents();
			this.setFont(graphics, 9, JSG.theme.headertext, 1);
			const outlineDirection = item.getHeaderAttributes().getOutlineDirection().getValue();
			if (outlineDirection === 'below') {
				levelLine[0] = yStart;
			}
			graphics.setLineColor(JSG.theme.frame);
			for (i = 0, n = item.getSections(); i < n; i += 1) {
				size = item.getSectionSize(i);
				level = item.getSectionLevel(i);

				if (outlineDirection === 'above') {
					levelNext = item.getSectionLevel(i + 1);
					if (levelLine[levelNext] !== undefined && levelNext < level) {
						for (j = levelNext; j < level; j += 1) {
							if (levelLine[j] !== undefined) {
								graphics.moveTo(rect.x + j * 600 + 300, levelLine[j]);
								graphics.lineTo(rect.x + j * 600 + 300, yStart + size);
								graphics.lineTo(rect.x + j * 600 + 400, yStart + size);
								levelLine[j] = undefined;
							}
						}
					}
					if (levelNext > level) {
						if (size) {
							graphics.rect(rect.x + 100 + level * 600, yStart + size / 2 - 200, 400, 400);
							graphics.fillText(item.getSectionClosed(i) ? '+' : '-', rect.x + level * 600 + 280,
								yStart + size / 2);
						}
						if (item.getSectionClosed(i) || !item.getSectionSize(i)) {
							levelLine[level] = undefined;
						} else {
							levelLine[level] = yStart + size / 2 + 200;
						}
					}
					if (item.getSectionClosed(i) || !item.getSectionSize(i)) {
						levelLine[level] = undefined;
					}
				} else {
					levelPrev = item.getSectionLevel(i - 1);
					if (levelPrev > level) {
						if (size) {
							graphics.rect(rect.x + 100 + level * 600, yStart + size / 2 - 200, 400, 400);
							graphics.fillText(item.getSectionClosed(i) ? '+' : '-', rect.x + level * 600 + 280,
								yStart + size / 2);
						}
						if (!item.getSectionClosed(i) && item.getSectionSize(i)) {
							if (levelLine[level] !== undefined) {
								graphics.moveTo(rect.x + level * 600 + 300, yStart + size / 2 - 200);
								graphics.lineTo(rect.x + level * 600 + 300, levelLine[level]);
								graphics.lineTo(rect.x + level * 600 + 400, levelLine[level]);
								levelLine[level] = undefined;
								lastMax = level;
							}
						}
					}
					if (levelPrev < level) {
						lastMax = level;
					}
						for (j = level; j < levelMax; j += 1) {
							levelLine[j] = yStart + size;
						}
				}

				// graphics.fillText(level, rectTmp.x, yStart + size / 2 + pix);
				// const par = item.getSectionParent(i);
				// if (par !== undefined) {
				// 	graphics.fillText(par, rectTmp.x - 500, yStart + size / 2 + pix);
				// }

				yStart += size;
				yEnd = yStart;

				if (yStart > viewRect.getBottom()) {
					break;
				}
			}
		}

		graphics.stroke();
		graphics.beginPath();
		this.setFont(graphics, 9, JSG.theme.headertext);
		graphics.setLineColor(JSG.theme.frame);
		yStart = rectTmp.y;

		for (i = 0, n = item.getSections(); i < n; i += 1) {
			size = item.getSectionSize(i);
			if (size && yStart >= viewRect.y - size) {
				graphics.fillText(i + item.getInitialSection() + 1, rectTmp.x + rectTmp.width / 2, yStart + size / 2 + pix);
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


		xStart = rectTmp.getRight();
		yStart = rectTmp.y;
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
		let selrect;
		const itemSize = this.getItem().getSizeAsPoint();

		graphics.setLineColor('#F29536');
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.setTransparency(50);

		selection.getRanges().forEach((range) => {
			selrect = ws.getCellRect(range);
			selrect.x = itemSize.x - RowHeaderNode.WIDTH;
			selrect.width = RowHeaderNode.WIDTH;

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
