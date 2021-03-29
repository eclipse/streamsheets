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
import { default as JSG, TextFormatAttributes, Rectangle } from '@cedalo/jsg-core';
import NodeView from './NodeView';

/**
 * This view is for a {{#crossLink "SplitterNode"}}{{/crossLink}} model. Although it
 * can be instantiated directly the recommended way to create this view is by calling
 * {{#crossLink "NodeController/createView:method"}}{{/crossLink}} method.
 *
 * @class CaptionView
 * @extends NodeView
 * @param {SplitterNode} item The corresponding SplitterNode model.
 * @constructor
 */
export default class CaptionView extends NodeView {
	drawFill(graphics, format, rect) {
		// super.drawFill(graphics, format, rect);
		const item = this.getItem();
		const textFormat = item.getTextFormat();

		const color = item._icon && item._icon === 'disconnected' ? '#ff0022' : format.getFillColor().getValue();

		graphics.setFillColor(color);
		graphics.fillRect(rect);

		textFormat.applyToGraphics(graphics);
		graphics.setFontSize(10.5);
		graphics.setFont();
		graphics.setTextAlignment(TextFormatAttributes.TextAlignment.LEFT);
		graphics.setTextBaseline('middle');
		textFormat.removeFromGraphics(graphics);

		graphics.fillText(item.getName().getValue(), rect.x + 200, rect.y + rect.height / 2 + 20);
		const width = graphics
			.getCoordinateSystem()
			.deviceToLogX(graphics.measureText(item.getName().getValue()).width, true);
		if (width > rect.width - 1025) {
			const rectEl = rect.copy();
			rectEl.x = rect.width - 1200;
			rectEl.width = 1200;
			graphics.setFillColor(color);
			graphics.fillRect(rectEl);
			graphics.setFillColor(JSG.theme.captiontext);
			graphics.fillText('...', rectEl.x, rect.y + rect.height / 2 + 20);
		}
	}
}
