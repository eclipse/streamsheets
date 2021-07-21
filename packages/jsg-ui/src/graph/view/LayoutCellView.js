/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
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

export default class LayoutCellsView extends NodeView {
	drawSubViews(graphics) {
		super.drawSubViews(graphics);

		const item = this.getItem();
		if (item._columnData) {
			const viewSettings = item.getGraph().viewSettings;
			if (!viewSettings.active) {
				const size = item.getSizeAsPoint();
				const columnData = item._columnData;
				this._subviews.forEach((subview) => {
					const format = subview.getFormat();
					if (subview.isVisible() === true && format.getLineStyle().getValue() === FormatAttributes.LineStyle.NONE) {
						let x = 0;

						graphics.setLineStyle(3);
						graphics.setLineColor('#BBBBBB');
						graphics.applyLineDash();
						graphics.beginPath();

						columnData.forEach((column, columnIndex) => {
							if (columnIndex) {
								graphics.moveTo(x, 0);
								graphics.lineTo(x, size.y);
							}
							x += column.layoutSize;
						});

						graphics.stroke();
						graphics.clearLineDash();
					}
				});
			}
		}
	}
}
