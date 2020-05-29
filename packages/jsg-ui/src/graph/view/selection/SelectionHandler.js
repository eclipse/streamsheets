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
import { BoundingBox, Point, default as JSG } from '@cedalo/jsg-core';

/**
 * Base class for a selection handler used by SelectionView. This class defines the method a custom selection handler
 * must provide. Selection handlers are registered via SelectionHandlerFactory...
 *
 * @class SelectionHandler
 * @constructor
 * @param {GraphItemView} [views]* The views which represent current selection. Either one or an array
 *     of multiple views can be passed.
 */
class SelectionHandler {
	constructor(views) {
		this._views = views;
		this._selectionView = undefined;
	}

	/**
	 * Registers the base SelectionView to this SelectionHandler.
	 *
	 * @method register
	 * @param {SelectionView} selectionView The SelectionView instance to which this
	 *     SelectionHandler belongs.
	 */
	register(selectionView) {
		this._selectionView = selectionView;
	}

	/**
	 * Returns the currently used selection style.
	 *
	 * @method getSelectionStyle
	 * @return {SelectionHandlerFactory} The selection styles used by the SelectionView.
	 */
	getSelectionStyle() {
		const style = this._selectionView.getStyle();
		style.resize(); // reset();
		return style;
	}

	/**
	 * Checks if given point is within the displayed selection.
	 *
	 * @method containsPoint
	 * @param {Point} point The point to test.
	 * @return {Boolean} <code>true</code> if item contains given point, <code>false</code> otherwise.
	 */
	containsPoint(point) {
		return false;
	}

	/**
	 * Returns the BoundingBox of current displayed selection.
	 *
	 * @method getBoundingBox
	 * @param {BoundingBox} [reusebbox] An optional BoundingBox to reuse, if not supplied a new one will
	 *     be created.
	 * @return {BoundingBox} The BoundingBox of current selection.
	 */
	getBoundingBox(reusebbox) {
		return reusebbox || new BoundingBox();
	}

	/**
	 * Returns the location of the rotation pin as point.
	 *
	 * @method getPinPoint
	 * @param {Point} [reusepoint] An optional point to reuse, if not supplied a new point will be created.
	 * @return {Point} The pin location.
	 */
	getPinPoint(reusepoint) {
		return reusepoint || new Point();
	}

	/**
	 * Returns the RotationMarker to use or <code>undefined</code> if displayed selection cannot be rotated.
	 *
	 * @method getRotationMarker
	 * @param {type} param_name param_description.
	 * @return {RotationMarker} The RotationMarker to use for rotating selection or
	 *     <code>undefined</code>.
	 */
	getRotationMarker() {
		return undefined;
	}

	/**
	 * Returns the handle at specified location. The location must be relative to the origin of the
	 * {{#crossLink "GraphView"}}{{/crossLink}}.
	 *
	 * @method getHandleAt
	 * @param {Point} point The location to look for a handle.
	 * @param {ClientEvent} event The current event which might provides additional information.
	 * @param {ActionHandle} [reusehandle] An optional handle to reuse, if not supplied a new
	 *     handle will be created.
	 * @return {ActionHandle} The handle to use at given location or <code>undefined</code>.
	 */
	getHandleAt(point, event, reusehandle) {
		return reusehandle;
	}

	/**
	 * Draws a selection representation for the current selected views.
	 *
	 * @method drawSelection
	 * @param {type} graphics param_description.
	 * @param {SelectionView} selectionView The main SelectionView instance to which this
	 *     handler is registered.
	 */
	drawSelection(graphics) {}

	/**
	 * Refreshes this SelectionHandler to update inner state. This is usually called before the handle is requested to
	 * draw itself.
	 *
	 * @method refresh
	 */
	refresh() {}
}

export default SelectionHandler;
