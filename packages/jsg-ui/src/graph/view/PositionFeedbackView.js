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
import { default as JSG, FormatAttributes, Point } from '@cedalo/jsg-core';
import View from '../../ui/View';
import SelectionStyle from './selection/SelectionStyle';

/**
 * This class provides feedback for a specific position within a GraphItem. It is used to visualize feedback during a
 * resize operation.
 *
 * @class PositionFeedbackView
 * @extends View
 * @constructor
 */
class PositionFeedbackView extends View {
	constructor() {
		super();

		this._point = new Point(0, 0);
		this._fillColor = SelectionStyle.MARKER_FILL_COLOR;
		this._lineColor = SelectionStyle.MARKER_BORDER_COLOR;
		this._active = true;
	}

	setPosition(point) {
		this._point.setTo(point);
	}

	getPosition(reusepoint) {
		const pt = reusepoint || new Point();
		return pt.setTo(this._point);
	}

	setFillColor(color) {
		this._fillColor = color;
	}

	isActive() {
		return this._active;
	}

	setActive(active) {
		this._active = active;
	}

	draw(graphics) {
		const rect = JSG.rectCache.get();
		rect.set(
			0,
			0,
			graphics.getCoordinateSystem().metricToLogXNoZoom(SelectionStyle.MARKER_SIZE),
			graphics.getCoordinateSystem().metricToLogYNoZoom(SelectionStyle.MARKER_SIZE)
		);

		rect.x = this._point.x - rect.width / 2;
		rect.y = this._point.y - rect.height / 2;

		graphics.setFillColor(this._fillColor);
		graphics.setLineColor(this._lineColor);
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);

		graphics.drawMarker(rect, this._active);

		JSG.rectCache.release(rect);
	}
}

export default PositionFeedbackView;
