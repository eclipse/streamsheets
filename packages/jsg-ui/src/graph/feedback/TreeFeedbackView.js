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
 * This class is used to visualize feedback during tree drag operations.
 *
 * @class TreeFeedbackView
 * @extends View
 * @constructor
 */
export default class TreeFeedbackView extends View {
	constructor(title) {
		super();

		this._title = title;
		this._box = new BoundingBox(0, 0);
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
		// this._box.setTo(box);
		this._box.setTopLeftTo(point);
	}

	draw(graphics) {
		const bbox = JSG.boxCache.get().setTo(this._box);
		const topleft = bbox.getTopLeft(JSG.ptCache.get());

		graphics.setTransparency(60);
		graphics.setLineWidth(FormatAttributes.LineStyle.HAIRLINE);
		graphics.setLineColor('#000000');
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.setFillColor('#FFFFFF');
		graphics.setFillStyle(FormatAttributes.FillStyle.SOLID);

		const rect = this._box.getBoundingRectangle();
		rect.height = 500;
		rect.width = 2500;
		rect.x -= 1250;
		rect.y -= 250;

		graphics.setFontSize(8);
		graphics.setTextAlign(TextFormatAttributes.TextAlignment.LEFT);
		graphics.setFont();
		graphics.setTextBaseline('middle');

		const text = this._title;
		const p = rect.getPoints();

		graphics.fillPolyline(p);
		graphics.drawPolyline(p, true);

		graphics.setFillColor('#000000');
		graphics.fillText(text, rect.x + 100, rect.getCenterY());
		graphics.setTransparency(0);

		JSG.boxCache.release(bbox);
		JSG.ptCache.release(topleft);
	}
}
