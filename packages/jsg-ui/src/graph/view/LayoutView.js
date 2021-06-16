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

export default class LayoutView extends NodeView {
	drawBorder(graphics, format, rect) {
		super.drawBorder(graphics, format, rect);

		const item = this.getItem();
		const viewSettings = item.getGraph().viewSettings;

		if (viewSettings.active) {
			return;
		}

		const rowData = item.rowData;
		const columnData = item.columnData;
		let y = 0;
		let x = 0;
		let node;

		graphics.setLineStyle(3);
		graphics.setLineColor('#BBBBBB');
		graphics.applyLineDash();
		graphics.beginPath();

		rowData.forEach((row, rowIndex) => {
			graphics.moveTo(0, y);
			graphics.lineTo(rect.width, y);

			columnData.forEach((column, columnIndex) => {

				node = item.getItemAt(rowIndex * columnData.length + columnIndex);
				if (node && node._merged === false) {
					graphics.moveTo(x, y);
					graphics.lineTo(x, y + row.layoutSize);
				}
				x += column.layoutSize;
			});

			x = 0;
			y += row.layoutSize;
		});


		graphics.stroke();
		graphics.clearLineDash();

	}
}
