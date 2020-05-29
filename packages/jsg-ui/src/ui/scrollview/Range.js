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
import Thumb from './Thumb';
import MouseEvent from '../events/MouseEvent';

/**
 * The {{#crossLink "ScrollBar"}}{{/crossLink}} Range is the region between the two {{#crossLink
 * "Arrow"}}{{/crossLink}} views. The Range view contains a {{#crossLink
 * "Thumb"}}{{/crossLink}} view which can be dragged to initiate scrolling. Additionally a simple
 * click within the visible Range area triggers a scroll too.
 *
 * @class Range
 * @extends Widget
 * @param {Boolean} isVertical <code>true</code>, if this range belongs to a vertical ScrollBar, <code>false</code>
 *     otherwise.
 * @param {Object} observer An observer which gets notified about mouse click and Thumb events. Usually this is an
 *     instance of
 * {{#crossLink "ScrollBar"}}{{/crossLink}}.
 * @constructor
 */
class Range extends Widget {
	constructor(isVertical, observer) {
		super();
		this._isVertical = isVertical;
		// add thumb:
		this._thumb = this.add(new Thumb());
		this._observer = observer;
	}

	/**
	 * Checks if {{#crossLink "Thumb"}}{{/crossLink}} view is currently moved.
	 *
	 * @method isDragThumbFinished
	 * @return {Boolean} <code>true</code> if thumb is currently not dragged, <code>false</code> otherwise.
	 */
	isDragThumbFinished() {
		return this._thumb._isSelected === false;
	}

	/**
	 * Checks if the {{#crossLink "Thumb"}}{{/crossLink}} view is currently selected and therefore should
	 * handle events.
	 *
	 * @method isThumbSelected
	 * @return {Boolean} <code>true</code> if Thumb view is curently selected, <code>false</code> otherwise.
	 */
	isThumbSelected() {
		return this._thumb._isSelected;
	}

	/**
	 * Returns the {{#crossLink "Thumb"}}{{/crossLink}} view used by this Range.
	 *
	 * @method getThumb
	 * @return {Thumb} The Thumb view.
	 */
	getThumb() {
		return this._thumb;
	}

	handleMouseEvent(ev) {
		if (this._isVisible === true) {
			if (ev.type === MouseEvent.MouseEventType.WHEEL) {
				this._handleMouseWheel(ev);
			} else {
				const pt = ev.location.copy();
				this.translateFromParent(ev.location);
				this._thumb.handleMouseEvent(ev);
				if (ev.isConsumed === false && this._bounds.containsPoint(pt)) {
					// not handled by thumb => handle it ourself...
					ev.isConsumed = true;
					if (ev.type === MouseEvent.MouseEventType.DOWN) {
						this._handlePageInDecrement(ev.location);
					}
				}
				ev.location = pt;
			}
		}
	}

	/**
	 * Handles a click within this range, i.e. neither an Arrow view nor a thumb view was hit.<br/>
	 * Note: this might notify registered observer about an <code>onPageUp</code> or <code>onPageDown</code> event.
	 *
	 * @method _handlePageInDecrement
	 * @param {Point} location The event location.
	 * @private
	 */
	_handlePageInDecrement(location) {
		let loc;

		function clickedBefore(bounds) {
			if (loc.y < bounds.y) {
				return true;
			}
			if (loc.y > bounds.getBottom()) {
				return false;
			}
			return undefined;
		}

		if (this._thumb._isVisible === true) {
			// we check against thumb bounds => translate event location:
			loc = location.copy();
			const bounds = this._thumb._bounds.copy();
			if (!this._isVertical) {
				loc.swap();
				bounds.swap();
			}
			const pageClickedBefore = clickedBefore(bounds);
			if (pageClickedBefore !== undefined) {
				if (pageClickedBefore === true) {
					this._observer.onPageUp(this);
				} else {
					this._observer.onPageDown(this);
				}
			}
		}
	}

	/**
	 * Handles a mouse wheel event.<br/>
	 * Note: this might notify registered observer about an <code>onThumbDrag</code> event.
	 *
	 * @method _handleMouseWheel
	 * @param {MouseEvent} ev The mouse event.
	 * @private
	 */
	_handleMouseWheel(ev) {
		if ((this._isVertical && ev.isWheelY()) || (!this._isVertical && ev.isWheelX())) {
			ev.isConsumed = true;
			let delta = ev.getWheelDelta();
			delta = -delta * 500; // this._parent._getCoordinateSystem().deviceToLogX(delta * 10);
			const deltaPoint = this._isVertical ? new Point(0, delta) : new Point(delta, 0);
			this._observer.onThumbDrag(this, deltaPoint);
		}
	}

	layout(scrollbar) {
		const bounds = this.getClientArea(JSG.rectCache.get());
		const rangemodel = scrollbar.getRangeModel();
		if (scrollbar.isVisible() === true) {
			if (scrollbar._isVertical === true) {
				this._placeThumbVertical(rangemodel, bounds);
			} else {
				this._placeThumbHorizontal(rangemodel, bounds);
			}
		}
		JSG.rectCache.release(bounds);
	}

	/**
	 * Places thumb of a vertical scrollbar. </br>
	 * Note: this also adjusts the visibility of the thumb.
	 *
	 * @method _placeThumbVertical
	 * @param {RangeModel} rangemodel The RangeModel to use for placing thumb.
	 * @param {Rectangle} cArea The currently available client area within the thumb is placed.
	 * @private
	 */
	_placeThumbVertical(rangemodel, cArea) {
		const thumb = this._thumb;
		const range = rangemodel.getMax() - rangemodel.getMin();
		const valuerange = range - rangemodel.getExtent();
		const gap = cArea.width / 5;
		if (range !== 0 && valuerange !== 0) {
			const thumbSize = Math.max(thumb.getMinimumSize(), (cArea.height * rangemodel.getExtent()) / range);
			const thumbY = ((cArea.height - thumbSize) * (rangemodel.getValue() - rangemodel.getMin())) / valuerange;
			thumb._bounds.x = gap;
			thumb._bounds.y = thumbY;
			thumb.setSize(cArea.width - 2 * gap, thumbSize);
			thumb._isVisible = cArea.height > thumbSize;
			rangemodel._thumb = thumbSize;
		} else {
			thumb._isVisible = false;
		}
	}

	/**
	 * Places thumb of a horizontal scrollbar. </br>
	 * Note: this also adjusts the visibility of the thumb.
	 *
	 * @method _placeThumbHorizontal
	 * @param {RangeModel} rangemodel The RangeModel to use for placing thumb.
	 * @param {Rectangle} cArea The currently available client area within the thumb is placed.
	 * @private
	 */
	_placeThumbHorizontal(rangemodel, cArea) {
		const thumb = this._thumb;
		const range = rangemodel.getMax() - rangemodel.getMin();
		const valuerange = range - rangemodel.getExtent();
		const gap = cArea.height / 5;
		if (range !== 0 && valuerange !== 0) {
			const thumbSize = Math.max(thumb.getMinimumSize(), (cArea.width * rangemodel.getExtent()) / range);
			const thumbX = ((cArea.width - thumbSize) * (rangemodel.getValue() - rangemodel.getMin())) / valuerange;
			thumb._bounds.x = thumbX;
			thumb._bounds.y = gap;
			thumb.setSize(thumbSize, cArea.height - 2 * gap);
			thumb._isVisible = cArea.width > thumbSize;
			rangemodel._thumb = thumbSize;
		} else {
			thumb._isVisible = false;
		}
	}

	/**
	 * Notifies registered observer that the {{#crossLink "Thumb"}}{{/crossLink}} was dragged.<br/>
	 *
	 * @method onThumbDrag
	 * @param {Number} delta The drag amount.
	 */
	onThumbDrag(delta) {
		this._observer.onThumbDrag(this, delta);
	}
}

export default Range;
