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
import { BoundingBox, Point, GraphUtils, default as JSG } from '@cedalo/jsg-core';
import View from '../../../ui/View';
import SelectionHandle from './SelectionHandle';
import SelectionHandler from './SelectionHandler';
import Styles from './Styles';
import SelectionHandlerFactory from './SelectionHandlerFactory';
import Cursor from '../../../ui/Cursor';

/**
 * explain: handler usage, hint the setSelectionHandlerFactory...
 * A SelectionView is a simple View instance which is used to mark current selection. The actual representation of a
 * selected {{#crossLink "GraphItem"}}{{/crossLink}} or multiple GraphItems is done by a
 * {{#crossLink "SelectionHandler"}}{{/crossLink}}. This SelectionHandler is created via a
 * so called {{#crossLink "SelectionHandlerFactory"}}{{/crossLink}}. Custom applications can
 * exchange the SelectionHandlerFactory with their own implementation to provide own SelectionHandlers.
 *
 * @class SelectionView
 * @extends View
 * @constructor
 */
class SelectionView extends View {
	constructor() {
		super();
		this._views = [];
		this._rotationAngle = 0;
		this._selectionHandler = undefined;
		this._selectionHandle = new SelectionHandle();
		this._handlerFactory = new SelectionHandlerFactory();
		this._selectionStyle = Styles.MARKER; // new SelectionHandlerFactory();
	}

	/**
	 * Adds given view to the list of currently selected views, managed by this SelectionView.<br/>
	 * <b>Note:</b> its required to call {{#crossLink
	 * "SelectionView/_updateSelectionHandler:method"}}{{/crossLink}}
	 *
	 * @method addView
	 * @deprecated Use {{#crossLink "SelectionView/setSelection:method"}}{{/crossLink}}
	 *     instead.
	 */
	addView(view) {
		this._views.push(view);
	}

	/**
	 * Removes all currently registered views
	 *
	 * @method removeAllViews
	 * @deprecated Use {{#crossLink "SelectionView/clearSelection:method"}}{{/crossLink}}
	 *     instead.
	 */
	removeAllViews() {
		this.clearSelection();
	}

	/**
	 * Clears current selection
	 *
	 * @method clearSelection
	 */
	clearSelection() {
		this._views = [];
		this._selectionHandler = undefined;
	}

	/**
	 * Registers the views of given selected {{#crossLink "ModelController"}}{{/crossLink}}s to
	 * this SelectionView<br/> This will replace any formerly registered views. The controllers can be either given as
	 * an array or as an enumeration.
	 *
	 * @example
	 *       selectionView.setSelection([controller1, controller2, controller3]);
	 *       //OR
	 *       selectionView.setSelection(controller1, controller2, controller3);
	 *
	 * Note: as opposed to {{#crossLink "SelectionView/addView:method"}}{{/crossLink}} there
	 *     is no need to call {{#crossLink
	 *     "SelectionView/_updateSelectionHandler:method"}}{{/crossLink}} afterwards!
	 *
	 * @method setSelection
	 * @param {Array|ModelController} selection* A list of ModelControllers whose views should be
	 *     registered.
	 */
	setSelection(...selection) {
		this.clearSelection();

		if (selection.length > 0) {
			if (Array.isArray(selection[0])) {
				selection = selection[0];
			}
			selection.forEach((sel) => {
				if (sel) {
					this._views.push(sel.getView());
				}
			});
		}
		this._updateSelectionHandler();
	}

	/**
	 * Returns the currently registered SelectionHandlerFactory.
	 *
	 * @method getHandlerFactory
	 * @return {SelectionHandlerFactory} The currently registered SelectionHandlerFactory.
	 */
	getHandlerFactory() {
		return this._handlerFactory;
	}

	/**
	 * Registers given SelectionHandlerFactory.<br/>
	 * The factory is used to provide a suitable {{#crossLink
	 * "SelectionHandler"}}{{/crossLink}} for a given selection.
	 *
	 * @method setHandlerFactory
	 * @param {SelectionHandlerFactory} selHandlerFactory The SelectionHandlerFactory to use.
	 */
	setHandlerFactory(selHandlerFactory) {
		this._handlerFactory = selHandlerFactory || this._handlerFactory;
	}

	/**
	 * Returns the currently selected views.</br>
	 * Note: this grants direct access to the underlying views array.
	 *
	 * @method getViews
	 * @return {Array} A list of all selected views.
	 */
	getViews() {
		return this._views;
	}

	/**
	 * Returns the currently used selection style.
	 *
	 * @method getStyle
	 * @return {SelectionHandlerFactory} The selection styles used by this SelectionView.
	 */
	getStyle() {
		return this._selectionStyle;
	}

	/**
	 * Sets new selection styles to use.
	 *
	 * @method setStyle
	 * @param {SelectionHandlerFactory} style The new selection styles to use.
	 */
	setStyle(style) {
		this._selectionStyle = style;
	}

	/**
	 * Called on selection changes to set current {{#crossLink
	 * "SelectionHandler"}}{{/crossLink}}.
	 *
	 * @method _updateSelectionHandler
	 * @private
	 */
	_updateSelectionHandler() {
		this._selectionHandler = this._handlerFactory ? this._handlerFactory.createSelectionHandler(this) : undefined;
		this._selectionHandler = this._selectionHandler || new SelectionHandler();
	}

	/**
	 * Refreshes this selection view to update inner state.
	 *
	 * @method refresh
	 */
	refresh() {
		if (this._selectionHandler) {
			this._selectionHandler.refresh(this._rotationAngle);
		}
	}

	/**
	 * Returns if this SelectionView is currently visible or not, i.e. if it has any views to mark.
	 *
	 * @method isVisible
	 * @return {Boolean} <code>true</code> if SelectionView is visible, <code>false</code> otherwise.
	 */
	isVisible() {
		return this._views.length !== 0 && this._isVisible;
	}

	/**
	 * Checks if currently marked selection is based on one view only.
	 *
	 * @method isSingleSelection
	 * @return {Boolean} <code>true</code> if only one view is selected, <code>false</code> otherwise.
	 */
	isSingleSelection() {
		return this._views.length === 1;
	}

	/**
	 * Returns the current rotation angle of this SelectionView.
	 *
	 * @method getRotationAngle
	 * @return {Number} The rotation angle of this SelectionView in radiant.
	 */
	getRotationAngle() {
		return this._rotationAngle;
	}

	/**
	 * Sets the rotation angle of this SelectionView.
	 *
	 * @method setRotationAngle
	 * @param {Number} angle The new rotation angle of this SelectionView in radiant.
	 */
	setRotationAngle(angle) {
		this._rotationAngle = angle;
	}

	/**
	 * Returns the complete BoundingBox of this SelectionView to mark all selected and registered views.
	 *
	 * @method getBoundingBox
	 * @param {BoundingBox} [reusebbox] An optional BoundingBox to reuse, if not given a new one will be
	 *     created.
	 * @return {BoundingBox} The BoundingBox of this SelectionView
	 */
	getBoundingBox(reusebbox) {
		const bbox = reusebbox || new BoundingBox(0, 0);
		bbox.reset();
		return this._selectionHandler ? this._selectionHandler.getBoundingBox(bbox) : bbox;
	}

	/**
	 * Checks if SelectionView contains given point. The point must be relative to {{#crossLink
	 * "GraphView"}}{{/crossLink}} origin.
	 *
	 * @method containsPoint
	 * @param {Point} point The point to check, relative to GraphView origin.
	 * @return {Boolean} <code>true</code> if this SelectionView contains given point, <code>false</code> otherwise.
	 */
	containsPoint(point) {
		if (this._selectionHandler) {
			return this._selectionHandler.containsPoint(point);
		}
		return false;
	}

	/**
	 * Returns the current {{#crossLink "Pin"}}{{/crossLink}} location of this SelectionView as point.
	 *
	 * @method getPinPoint
	 * @param {Point} [reusepoint] An optional point to reuse, if not given a new point will be created.
	 * @return {Point} The pin location.
	 */
	getPinPoint(reusepoint) {
		const pin = reusepoint || new Point(0, 0);
		pin.set(0, 0);
		return this._selectionHandler ? this._selectionHandler.getPinPoint(pin) : pin;
	}

	/**
	 * Returns the RotationMarker for this SelectionView or <code>undefined</code> if none has been set.
	 *
	 * @method getRotationMarker
	 * @return {RotationMarker} The RotationMarker for this SelectionView or
	 *     <code>undefined</code>.
	 */
	getRotationMarker() {
		return this._selectionHandler ? this._selectionHandler.getRotationMarker() : undefined;
	}

	/**
	 * Returns the handle at specified location. The location must be relative to the origin of the
	 * {{#crossLink "GraphView"}}{{/crossLink}}.
	 *
	 * @method getHandleAt
	 * @param {Point} point The location, relative to GraphView, to look for a handle.
	 * @param {ClientEvent} event The current event.
	 * @return {SelectionHandle} The SelectionHandle at given location or
	 *     <code>undefined</code>
	 */
	getHandleAt(point, event) {
		let handle;
		if (this._selectionHandler) {
			const SEL_TYPE = SelectionHandle.TYPE;
			handle = this._selectionHandler.getHandleAt(point, event, this._selectionHandle);
			if (
				(!handle || handle._type === SEL_TYPE.MOVE || handle._type === SEL_TYPE.RESIZE) &&
				this._views.length === 1
			) {
				const view = this._views[0];
				const item = view.getItem();
				const pt = JSG.ptCache.get().setTo(point);
				GraphUtils.translatePointDown(pt, item.getGraph(), item);
				if (view.hitCollapseButton(pt)) {
					handle = new SelectionHandle();
					handle.setCursor(Cursor.Style.AUTO);
				}
				JSG.ptCache.release(pt);
			}
			if (handle && handle._type) {
				return handle;
			}
		}
		return handle;
	}

	/**
	 * Draws this SelectionView if it is visible.
	 *
	 * @method draw
	 * @param {Graphics} graphics The Graphics instance to use for drawing.
	 */
	draw(graphics) {
		if (this.isVisible() && this._selectionHandler) {
			this._selectionHandler.refresh();
			this._selectionHandler.drawSelection(graphics);
		}
	}
}

export default SelectionView;
