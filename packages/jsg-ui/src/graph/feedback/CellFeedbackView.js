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
import { default as JSG, BoundingBox, FormatAttributes, TextFormatAttributes } from '@cedalo/jsg-core';

import View from '../../ui/View';

/**
 * This class is used to visualize feedback during cell drag operations.
 *
 * @class CellFeedbackView
 * @extends View
 * @constructor
 */
export default class CellFeedbackView extends View {
	constructor(cell, title, left, top) {
		super();

		this._cellBorderColor = '#000000';
		this._reference = false;
		this._cell = cell;
		this._title = title;
		this._left = left;
		this._top = top;
		this._box = new BoundingBox(0, 0);
	}

	setCellBorderColor(color) {
		this._cellBorderColor = color;
	}

	setReference(flag) {
		this._reference = flag;
	}

	setColorRect(rect, color) {
		this._colorRect = rect;
		this._color = color;
	}

	setBoundingBox(box) {
		this._box.setTo(box);
	}

	getBoundingBox(reusebox) {
		const box = reusebox || new BoundingBox();
		box.setTo(this._box);
		return box;
	}

	setLocationTo(point) {
		this._box.setTopLeftTo(point);
	}

	setDeleteWidth(size) {
		this._deleteWidth = size;
	}

	setDeleteHeight(size) {
		this._deleteHeight = size;
	}

	draw(graphics) {
		if (this._reference) {
			return;
		}

		const bbox = JSG.boxCache.get().setTo(this._box);
		const topleft = bbox.getTopLeft(JSG.ptCache.get());

		const rect = this._box.getBoundingRectangle();
		const p = rect.getPoints();

		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.setFillStyle(FormatAttributes.FillStyle.SOLID);
		graphics.setLineColor(this._cellBorderColor);

		if (this._reference) {
			graphics.setLineWidth(FormatAttributes.LineStyle.HAIRLINE);
			graphics.setFillColor(this._cellBorderColor);
			graphics.setTransparency(10);
			graphics.fillPolyline(p);
			graphics.setTransparency(100);
			graphics.drawPolyline(p, true);
		} else {
			if (this._deleteHeight || this._deleteWidth) {
				const deleteRect = rect.copy();
				if (this._deleteHeight) {
					deleteRect.y += rect.height;
					deleteRect.height = this._deleteHeight;
				} else {
					deleteRect.x += rect.width;
					deleteRect.width = this._deleteWidth;
				}

				const pDelete = deleteRect.getPoints();
				graphics.setFillColor('#FFFFFF');
				graphics.setTransparency(100);
				graphics.fillPolyline(pDelete);
				graphics.setTransparency(100);
			}

			graphics.setLineWidth(50);
			graphics.setFillColor('#FFFFFF');

			if (this._title !== undefined) {
				graphics.fillPolyline(p);

				if (this._colorRect) {
					graphics.setFillColor(this._color);
					graphics.fillRect(this._colorRect);
				}

				graphics.setFontSize(9);
				graphics.setFontStyle(TextFormatAttributes.FontStyle.BOLD);
				graphics.setTextAlign(
					this._left ? TextFormatAttributes.TextAlignment.LEFT : TextFormatAttributes.TextAlignment.RIGHT
				);
				graphics.setFont();
				graphics.setTextBaseline('middle');
				graphics.setFillColor(this._color ? '#FFFFFF' : '#000000');
				graphics.fillText(
					this._title,
					this._left ? rect.x + 100 : rect.getRight() - 100,
					this._top ? rect.y + 250 : rect.getBottom() - 250
				);
				graphics.setFontStyle(TextFormatAttributes.FontStyle.NORMAL);
			}

			graphics.drawPolyline(p, true);
			graphics.setLineWidth(FormatAttributes.LineStyle.HAIRLINE);
		}

		JSG.rectCache.release(rect);
		JSG.ptCache.release(topleft);
	}
}
