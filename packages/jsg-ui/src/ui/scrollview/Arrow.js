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
import { default as JSG, Point } from '@cedalo/jsg-core';
import Widget from '../Widget';
import MouseEvent from '../events/MouseEvent';

/**
 * A simple view class which displays an arrow to indicate a scroll into a certain direction.
 *
 * @class Arrow
 * @extends Widget
 * @constructor
 * @param {Number} direction The direction the arrowhead points to. Use one of predefined constants.
 * @param {Object} observer An observer which gets notified about mouse up and down events. Usually this is an instance
 *     of
 * {{#crossLink "ScrollBar"}}{{/crossLink}}.
 */
class Arrow extends Widget {
	constructor(direction, observer) {
		super();
		this._pts = [new Point(0, 0), new Point(0, 0), new Point(0, 0)];
		this._observer = observer;
		this._direction = direction;
	}

	/**
	 * Returns indicated direction.
	 *
	 * @method getDirection
	 * @return {Number} One of the predefined direction constants.
	 */
	getDirection() {
		return this._direction;
	}

	handleMouseEvent(ev) {
		if (this.isVisible) {
			switch (ev.type) {
				case MouseEvent.MouseEventType.DOWN:
					if (this._bounds.contains(ev.location.x, ev.location.y)) {
						ev.isConsumed = true;
						if (this._observer) {
							this._observer.onMouseDown(this, ev);
						}
					}
					break;
				case MouseEvent.MouseEventType.UP:
					if (this._bounds.contains(ev.location.x, ev.location.y)) {
						ev.isConsumed = true;
						if (this._observer) {
							this._observer.onMouseUp(this, ev);
						}
					}
					break;
			}
		}
	}

	drawBackground(graphics) {
		const pts = this._pts;
		const bounds = this._bounds;
		const offset = bounds.width / 3;

		switch (this._direction) {
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
		}

		graphics.setFillColor('#777777');
		graphics.fillPolyline(pts);
	}

	/**
	 * Predefined constant to specify up direction.
	 *
	 * @property NORTH
	 * @type {Number}
	 * @static
	 */
	static get NORTH() {
		return 0;
	}
	/**
	 * Predefined constant to specify right direction.
	 *
	 * @property EAST
	 * @type {Number}
	 * @static
	 */
	static get EAST() {
		return 1;
	}
	/**
	 * Predefined constant to specify down direction.
	 *
	 * @property SOUTH
	 * @type {Number}
	 * @static
	 */
	static get SOUTH() {
		return 2;
	}
	/**
	 * Predefined constant to specify left direction.
	 *
	 * @property EWEST
	 * @type {Number}
	 * @static
	 */
	static get WEST() {
		return 4;
	}
}

export default Arrow;
