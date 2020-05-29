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
import { Arrays, FormatAttributes, default as JSG } from '@cedalo/jsg-core';
import Widget from '../Widget';
import Arrow from './Arrow';
import Range from './Range';
import MouseEvent from '../events/MouseEvent';

/**
 * A Scrollbar is used by a {{#crossLink "ScrollView"}}{{/crossLink}} to move the content view of a
 * {{#crossLink "ViewPort"}}{{/crossLink}}. It consists of two {{#crossLink
 * "Arrow"}}{{/crossLink}} views, a {{#crossLink "Thumb"}}{{/crossLink}} and a
 * {{#crossLink "Range"}}{{/crossLink}} view.<br/> To get notified about scrollbar events it is possible to register
 * listeners which should implement following methods:
 * <code>
 *        onThumbDrag = function(rangemodel, delta);
 *        onUp = function(arrow);
 *        onDown = function(arrow);
 *        onPageUp = function(rangemodel);
 *        onPageDown = function(rangemodel);
 * <code>
 *
 * @class ScrollBar
 * @extends Widget
 * @constructor
 * @param {Boolean} isVertical Flag to indicate, whether this ScrollBar is either vertically or horizontally arranged.
 */
class ScrollBar extends Widget {
	constructor(isVertical) {
		super();
		this._isVertical = isVertical;

		let direction = isVertical === true ? Arrow.NORTH : Arrow.WEST;
		this._arrowStart = new Arrow(direction, this);
		this._arrowStart.getFormat().setFillColor(JSG.bkColorScroll);
		this._arrowStart.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
		this.add(this._arrowStart);

		this._range = new Range(isVertical, this);
		this._range.getFormat().setFillColor(JSG.bkColorScroll);
		this._range.getFormat().setLineColor(JSG.bkColorScroll);
		this._range.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
		this.add(this._range);

		direction = isVertical === true ? Arrow.SOUTH : Arrow.EAST;
		this._arrowEnd = new Arrow(direction, this);
		this._arrowEnd.getFormat().setFillColor(JSG.bkColorScroll);
		this._arrowEnd.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
		this.add(this._arrowEnd);

		this.setVisible(true);
		this.getFormat().setFillColor('#eeeeee');
		this.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);

		// NEW:
		this._rangemodel = undefined;
		this.setMode(JSG.ScrollBarMode.AUTO);

		// should implement onPageUp/Down onThumbDrag, onUp/Down:
		this._listeners = [];
	}

	/**
	 * Returns the RangeModel used by this scrollbar.
	 *
	 * @method getRangeModel
	 * @return {RangeModel} The used RangeModel.
	 */
	getRangeModel() {
		return this._rangemodel;
	}

	/**
	 * Sets the RangeModel to use. This will register this scrollbar to given RangeModel.
	 *
	 * @method setRangeModel
	 * @param {RangeModel} rangemodel The RangeModel to use.
	 */
	setRangeModel(rangemodel) {
		if (this._rangemodel) {
			this._rangemodel.removeObserver(this);
		}
		this._rangemodel = rangemodel;
		this._rangemodel.addObserver(this);
	}

	/**
	 * Adds given listener to the list of all listeners which will be notified about scrollbar events.<br/>
	 * The listener object must provide following methods:<br/>
	 * <code>
	 *        onThumbDrag = function(rangemodel, delta);
	 *        onUp = function(arrow);
	 *        onDown = function(arrow);
	 *        onPageUp = function(rangemodel);
	 *        onPageDown = function(rangemodel);
	 * <code>
	 *
	 * @method addListener
	 * @param {Object} listener The listener to add.
	 */
	addListener(listener) {
		if (!Arrays.contains(this._listeners, listener)) {
			this._listeners.push(listener);
		}
	}

	/**
	 * Removes given listener from the list of all registered listeners.
	 *
	 * @method removeListener
	 * @param {Object} listener The listener to remove.
	 */
	removeListener(listener) {
		Arrays.remove(this._listeners, listener);
	}

	/**
	 * Internal helper method to notify all registered listeners. Beside the function name, this method takes additional
	 * arguments which are passed as parameters to called function.
	 *
	 * @method _notify
	 * @param {String} func    The function to call on each registered listener.
	 * @private
	 */
	_notify(func) {
		const listeners = this._listeners;
		// keep old approach due to problems in IE 10
		// eslint-disable-next-line prefer-rest-params
		const args = arguments;
		// without "use strict" we have to preserve function name, otherwise it will be replaced due to args[0] = this!!
		const funcstr = func;
		args[0] = this;
		listeners.forEach((listener) => {
			if (typeof listener[funcstr] === 'function') {
				listener[funcstr](...args);
			}
		});
	}

	/**
	 * Checks if {{#crossLink "Thumb"}}{{/crossLink}} is currently moved.
	 *
	 * @method isDragThumbFinished
	 * @return {Boolean} <code>true</code> if thumb is currently not dragged, <code>false</code> otherwise.
	 */
	isDragThumbFinished() {
		return this._range.isDragThumbFinished();
	}

	/**
	 * Returns the currently used display mode which determines the scrollbar visibility.</br>
	 * See {{#crossLink "JSG.ScrollBarMode"}}{{/crossLink}} too.
	 *
	 * @method getMode
	 * @return {Number} Should be one of the predefined mode constants.
	 */
	getMode() {
		return this._mode;
	}

	/**
	 * Sets the new display mode which determines the scrollbar visibility.</br>
	 * See {{#crossLink "JSG.ScrollBarMode"}}{{/crossLink}} too.
	 *
	 * @method setMode
	 * @param {Number} mode The new display mode to use.
	 */
	setMode(mode) {
		this._mode = mode;
		this.setVisible(this.isVisible());
	}

	// overwritten to take current mode into account...
	setVisible(visible) {
		if (this._mode !== JSG.ScrollBarMode.AUTO) {
			visible = this._mode === JSG.ScrollBarMode.VISIBLE || this._mode === JSG.ScrollBarMode.PLACEHOLDER;
		}
		super.setVisible(visible);
	}

	/**
	 * Layouts this scrollbar, i.e. the position and size of its sub-views {{#crossLink "Arrow"}}{{/crossLink}},
	 * {{#crossLink "Thumb"}}{{/crossLink}} and {{#crossLink "Range"}}{{/crossLink}}.
	 *
	 * @method layout
	 */
	layout() {
		if (this.isVisible() === true) {
			const sbBounds = this.getClientArea();

			if (this._mode === JSG.ScrollBarMode.PLACEHOLDER) {
				this._arrowStart.setVisible(false);
				this._range.setVisible(false);
				this._arrowEnd.setVisible(false);
			} else {
				if (this._isVertical) {
					this._arrowStart._bounds.set(0, 0, sbBounds.width, sbBounds.width);
					this._range._bounds.set(0, sbBounds.width, sbBounds.width, sbBounds.height - 2 * sbBounds.width);
					this._arrowEnd._bounds.set(0, sbBounds.height - sbBounds.width, sbBounds.width, sbBounds.width);
				} else {
					this._arrowStart._bounds.set(0, 0, sbBounds.height, sbBounds.height);
					this._range._bounds.set(sbBounds.height, 0, sbBounds.width - 2 * sbBounds.height, sbBounds.height);
					this._arrowEnd._bounds.set(sbBounds.width - sbBounds.height, 0, sbBounds.height, sbBounds.height);
				}

				this._range.layout(this);
			}
		}
	}

	/**
	 * Checks if given event is handled by this ScrollBar.
	 *
	 * @method doHandleEvent
	 * @param {ClientEvent} ev The event to check.
	 * @return {Boolean} <code>true</code> if ScrollBar handles event, <code>false</code> otherwise.
	 */
	doHandleEvent(ev) {
		return (
			(this._range.isThumbSelected() &&
				(ev.type === MouseEvent.MouseEventType.MOVE || ev.type === MouseEvent.MouseEventType.UP)) ||
			(this.isVisible() && this.getBounds().contains(ev.location.x, ev.location.y))
		);
	}

	/**
	 * Handles given mouse event.
	 *
	 * @method handleMouseEvent
	 * @param {MouseEvent} ev The mouse event to handle.
	 */
	handleMouseEvent(ev) {
		if (this.isVisible() === true && this._mode !== JSG.ScrollBarMode.PLACEHOLDER) {
			const pt = ev.location.copy();
			this.translateFromParent(ev.location);

			this._range.handleMouseEvent(ev);
			this._arrowStart.handleMouseEvent(ev);
			this._arrowEnd.handleMouseEvent(ev);

			ev.location = pt;

			if (this._bounds.contains(ev.location.x, ev.location.y)) {
				ev.isConsumed = true;
			}
		}
	}

	/**
	 * Called when the {{#crossLink "Thumb"}}{{/crossLink}} was dragged.<br/>
	 * Note: this will notify all registered listeners.
	 *
	 * @method onThumbDrag
	 * @param {Thumb} range The ScrollBar range the thumb is part of.
	 * @param {Number} delta The drag amount.
	 */
	onThumbDrag(range, delta) {
		const rangemodel = this._rangemodel;
		const rangeBounds = range.getClientArea();
		const thumbBounds = range.getThumb().getBounds();
		let newValue;
		const valuerange = rangemodel.getMax() - rangemodel.getMin() - rangemodel.getExtent();
		if (this._isVertical === true) {
			thumbBounds.y += delta.y;
			newValue = thumbBounds.y;
			newValue = (newValue * valuerange) / (rangeBounds.height - thumbBounds.height) + rangemodel.getMin();
			// rangemodel.setValue(newValue);
		} else {
			thumbBounds.x += delta.x;
			newValue = thumbBounds.x;
			newValue = (newValue * valuerange) / (rangeBounds.width - thumbBounds.width) + rangemodel.getMin();
			// rangemodel.setValue(newValue);
		}
		this._notify('onThumbDrag', newValue, delta);
	}

	/**
	 * Called on mouse up event on a {{#crossLink "Arrow"}}{{/crossLink}} view.<br/>
	 * Note: this event is not handled.
	 *
	 * @method onMouseUp
	 * @param {Arrow} arrow The arrow view on which the mouse up occurred.
	 */
	onMouseUp(arrow) {}

	/**
	 * Called on mouse down event on a {{#crossLink "Arrow"}}{{/crossLink}} view.<br/>
	 * Note: this will notify all registered listeners.
	 *
	 * @method onMouseDown
	 * @param {Arrow} arrow The arrow view on which the mouse down occurred.
	 */
	onMouseDown(arrow) {
		this._notify(arrow === this._arrowStart ? 'onUp' : 'onDown');
	}

	/**
	 * Called on mouse click event on a {{#crossLink "Range"}}{{/crossLink}} view. A page-up signals that
	 * the mouse click was between up/left-{{#crossLink "Arrow"}}{{/crossLink}} and {{#crossLink
	 * "Thumb"}}{{/crossLink}} position.<br/> Note: this will notify all registered listeners.
	 *
	 * @method onPageUp
	 * @param {Range} range The range view on which the mouse event occurred.
	 */
	onPageUp(range) {
		this._notify('onPageUp');
	}

	/**
	 * Called on mouse click event on a {{#crossLink "Range"}}{{/crossLink}} view. A page-down signals that
	 * the mouse click was between down/right-{{#crossLink "Arrow"}}{{/crossLink}} and {{#crossLink
	 * "Thumb"}}{{/crossLink}} position.<br/> Note: this will notify all registered listeners.
	 *
	 * @method onPageDown
	 * @param {Range} range The range view on which the mouse event occurred.
	 */
	onPageDown(range) {
		this._notify('onPageDown');
	}

	/**
	 * Called on RangModel change.
	 *
	 * @method onRangeChange
	 * @param {RangeModel} rangemodel The RangeModel which has changed.
	 */
	onRangeChange(rangemodel) {
		this._range.layout(this);
	}
	/**
	 * The default scrollbar size.
	 *
	 * @property SIZE
	 * @type {Number}
	 * @static
	 */
	static get SIZE() {
		return 450;
	}
}

export default ScrollBar;
