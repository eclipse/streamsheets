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

	drawFill(graphics, format, rect) {
		super.drawFill(graphics, format, rect);

		const item = this.getItem();
		const rowData = item.rowData;
		const columnData = item.columnData;
		let y = 0;
		let x = 0;

		graphics.setLineColor('#FF00DD');
		graphics.beginPath();

		rowData.forEach(row => {
			graphics.moveTo(0, y);
			graphics.lineTo(rect.width, y);

			y += row.layoutSize;
		});

		columnData.forEach(column => {
			graphics.moveTo(x, 0);
			graphics.lineTo(x, rect.height);

			x += column.layoutSize;
		});

		graphics.stroke();

	}
}
