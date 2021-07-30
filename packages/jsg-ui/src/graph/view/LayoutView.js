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
// import {default as JSG, FormatAttributes, TextFormatAttributes} from '@cedalo/jsg-core';

import NodeView from './NodeView';
import { default as JSG, ImagePool, FormatAttributes } from '@cedalo/jsg-core';

export default class LayoutView extends NodeView {
	drawSubViews(graphics) {
		super.drawSubViews(graphics);

		let tmprect = JSG.rectCache.get()

		this._subviews.forEach((subview) => {
			const format = subview.getFormat();
			if (subview.isVisible() === true && format.getLineStyle().getValue() !== FormatAttributes.LineStyle.NONE) {
				tmprect = subview.getItem().getSize().toRectangle(tmprect);
				graphics.save();
				subview.translateGraphics(graphics);
				subview.drawBorder(graphics, format, tmprect);
				graphics.restore();
			}
		});

		JSG.rectCache.release(tmprect);
	}

	drawBorder(graphics, format, rect) {
		super.drawBorder(graphics, format, rect);

		const item = this.getItem();
		const viewSettings = item.getGraph().viewSettings;
		const rowData = item._virtualRowData;
		// const columnData = item.columnData;
		let y = 0;
		let x = 0;
		let node;

		graphics.setLineStyle(3);
		graphics.setLineColor('#BBBBBB');
		graphics.applyLineDash();
		graphics.beginPath();

		rowData.forEach((row, rowIndex) => {

			if (!viewSettings.active) {
				graphics.moveTo(0, y);
				graphics.lineTo(rect.width, y);

				row.columnData.forEach((column, columnIndex) => {

					node = item.getItemAt(column.nodeIndex);
					if (node && node._merged === false) {
						graphics.moveTo(x, y);
						graphics.lineTo(x, y + row.layoutSize);
					}
					x += column.layoutSize;
				});
			}

			x = 0;

			if (row.expandable) {
				const size = 650;
				const icon = JSG.imagePool.get(row.expanded ? ImagePool.SVG_MOVE_UP : ImagePool.SVG_MOVE_DOWN);
				graphics.drawImage(icon, rect.getRight() - 700, y + 100, size, size);
			}

			y += row.layoutSize;
		});

		graphics.stroke();
		graphics.clearLineDash();

	}
}
