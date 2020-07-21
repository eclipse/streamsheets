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
import {default as JSG, FormatAttributes, TextFormatAttributes} from '@cedalo/jsg-core';

import NodeView from './NodeView';

export default class ButtonView extends NodeView {
	draw(graphics) {
		graphics.save(this);
		const format = this._item.getFormat();
		const rect = this._item.getSize().toRectangle(JSG.rectCache.get());
		const pattern = format.getAttribute(FormatAttributes.PATTERN).getValue();
		const patternstyle = format.getAttribute(FormatAttributes.PATTERNSTYLE).getValue();

		this.translateGraphics(graphics);

		if (pattern) {
			graphics.setFillStyle(FormatAttributes.FillStyle.PATTERN);
			graphics.setPattern(rect, pattern, patternstyle);
			graphics.fillRect(rect);
		}

		if (this.getItem().label) {
			graphics.setFontSize(9);
			graphics.setFont();
			graphics.setFillColor(JSG.theme.text);
			graphics.setTextAlignment(TextFormatAttributes.TextAlignment.CENTER);
			graphics.setTextBaseline('middle');

			const p = rect.getCenter();
			graphics.fillText(this.getItem().label, p.x, p.y);
		}

		graphics.restore();
		JSG.rectCache.release(rect);
	}
}
