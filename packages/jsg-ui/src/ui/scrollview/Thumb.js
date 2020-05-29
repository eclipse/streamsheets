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
import Widget from '../Widget';
import MouseEvent from '../events/MouseEvent';

/**
 * A Thumb view for a {{#crossLink "Range"}}{{/crossLink}} to initiate scrolling by dragging it.
 *
 * @class Thumb
 * @extends Widget
 * @constructor
 */
class Thumb extends Widget {
	constructor() {
		super();

		this._isSelected = false;
		this._startLocation = new Point(0, 0);
		this.getFormat().setFillColor('#CCCCCC');
		this.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
	}

	/**
	 * Returns the default minimum Thumb size.
	 *
	 * @method getMinimumSize
	 * @return {Number} The minimum Thumb size.
	 */
	getMinimumSize() {
		return 500;
	}

	handleMouseEvent(ev) {
		if (this._isVisible === true) {
			const TYPE = MouseEvent.MouseEventType;
			// special case: MouseMove => we not require mouse to be on thumb if started drag...
			if (ev.type === TYPE.MOVE && this._isSelected === true) {
				ev.isConsumed = true;
				this._dragTo(ev.location);
			} else if (this._bounds.containsPoint(ev.location)) {
				ev.isConsumed = true;
				if (ev.type === TYPE.DOWN) {
					this._isSelected = true;
					this._startLocation.setTo(ev.location);
				} else {
					this._isSelected = false;
				}
			} else {
				this._isSelected = false;
			}
		}
	}

	/**
	 * Called when the Thumb is dragged.</br>
	 * Note: this will call <code>onThumbDrag</code> on its parent.
	 *
	 * @method _dragTo
	 * @param {Point} location The new Thumb location.
	 * @private
	 */
	_dragTo(location) {
		const delta = location.copy().subtract(this._startLocation);
		this._parent.onThumbDrag(delta);
		this._startLocation.setTo(location);
	}
}

export default Thumb;
