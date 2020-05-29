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
import { Point } from '@cedalo/jsg-core';
import NodeView from './NodeView';
import Arrow from '../../ui/scrollview/Arrow';

export default class ScrollbarView extends NodeView {
	constructor(item) {
		super(item);

		this._pts = [new Point(0, 0), new Point(0, 0), new Point(0, 0)];
	}

	drawFill(graphics, format, rect) {
		super.drawFill(graphics, format, rect);

		if (rect.height < 200) {
			return;
		}

		/* eslint-disable no-mixed-operators */

		const pts = this._pts;
		const arrowRect = rect.copy();
		const drawArrow = (bounds, direction, offset) => {
			switch (direction) {
				case Arrow.NORTH:
					pts[0].set(bounds.x + offset, bounds.y + bounds.height - offset);
					pts[1].set(bounds.x + bounds.width - offset, bounds.y + bounds.height - offset);
					pts[2].set(bounds.x + bounds.width / 2, bounds.y + offset);
					break;
				case Arrow.SOUTH:
					pts[0].set(bounds.x + offset, bounds.y + offset);
					pts[1].set(bounds.x + bounds.width - offset, bounds.y + offset);
					pts[2].set(bounds.x + bounds.width / 2, bounds.y + bounds.height - offset);
					break;
				case Arrow.WEST:
					pts[0].set(bounds.x + bounds.width - offset, bounds.y + offset);
					pts[1].set(bounds.x + bounds.width - offset, bounds.y + bounds.height - offset);
					pts[2].set(bounds.x + offset, bounds.y + bounds.height / 2);
					break;
				case Arrow.EAST:
					pts[0].set(bounds.x + offset, bounds.y + offset);
					pts[1].set(bounds.x + offset, bounds.y + bounds.height - offset);
					pts[2].set(bounds.x + bounds.width - offset, bounds.y + bounds.height / 2);
					break;
				default:
					break;
			}

			graphics.setFillColor('#777777');
			graphics.fillPolyline(pts);
		};

		arrowRect.height = arrowRect.width;

		drawArrow(arrowRect, Arrow.NORTH, arrowRect.width / 3);

		arrowRect.y = rect.height - arrowRect.width;

		drawArrow(arrowRect, Arrow.SOUTH, arrowRect.width / 3);

		graphics.setLineColor('#AAAAAA');
		graphics.drawLine(new Point(rect.getRight(), rect.y), new Point(rect.getRight(), rect.getBottom()));
	}
}
