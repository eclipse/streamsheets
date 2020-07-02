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
import { default as JSG, Notification, NotificationCenter, Point } from '@cedalo/jsg-core';
import Widget from '../Widget';
import RangeModel from "./RangeModel";
import ViewPanel from "./ViewPanel";

/**
 * The ViewPort acts like a window to look at the currently visible area of a, usually larger, view. This content view
 * is wrapped within a {{#crossLink "ViewPanel"}}{{/crossLink}} to move the visible area. This
 * movement is realized by using {{#crossLink "RangeModel"}}{{/crossLink}}s for the horizontal and
 * vertical direction. With this indirection it is possible to easily attach {{#crossLink
 * "ScrollBar"}}{{/crossLink}}s to this ViewPort. As an example refer to the {{#crossLink
 * "ScrollView"}}{{/crossLink}} class.
 *
 * A ViewPort sends following notification: </br>
 * <ul>
 *    <li>{{#crossLink "ViewPort/BOUNDS_CHANGED_NOTIFICATION:property"}}{{/crossLink}}</li>
 * </ul>
 *
 *
 * @class ViewPort
 * @extends Widget
 * @constructor
 */
class ViewPort extends Widget {
	constructor() {
		super();

		// ViewPanel offset defines scroll status
		this._vpOffset = new Point(0, 0);
		this._viewpanel = new ViewPanel();
		this.getFormat().setFillColor(JSG.theme.graph);
		// the range models used for scrolling:
		this._vrangemodel = undefined;
		this._hrangemodel = undefined;
		this.setVerticalRangeModel(new RangeModel());
		this.setHorizontalRangeModel(new RangeModel());
	}

	/**
	 * Returns the current ViewPanel of this ViewPort.</br>
	 * See {{#crossLink "ViewPort/setViewPanel:method"}}{{/crossLink}}.
	 *
	 * @method getViewPanel
	 * @return {ViewPanel} The currently used ViewPanel.
	 */
	getViewPanel() {
		return this._viewpanel;
	}

	/**
	 * Sets the ViewPanel belonging to this ViewPort. The ViewPanel is the content of the viewport and is displayed
	 * as a subview within the viewport. The view onto the ViewPanel is displayed with an offset defined by the origin.
	 *
	 * @method setViewPanel
	 * @param {ViewPanel} panel The ViewPanel to set to this viewport.
	 */
	setViewPanel(panel) {
		if (this._viewpanel) {
			this._viewpanel.removeResizeListener(this);
			this.remove(this._viewpanel);
		}
		this._viewpanel = panel;
		this._viewpanel.addResizeListener(this);
		this.add(this._viewpanel);
		this._initOffsets(this.getContentView());
	}

	layout(minBounds) {
		this.relayout();
	}

	// called on validate() phase...
	relayout() {
		const cArea = this.getClientArea();
		const vpBounds = this.getViewPanelBounds(cArea);
		this._viewpanel.setBoundsTo(vpBounds);
		this.setRange(this._hrangemodel, vpBounds.x, vpBounds.getRight(), cArea.width);
		this.setRange(this._vrangemodel, vpBounds.y, vpBounds.getBottom(), cArea.height);
	}

	/**
	 * Convenience method to change given RangeModel. This will also check if the <code>newMin</code> and
	 * <code>newMax</code> bounds can be applied.
	 *
	 * @method setRange
	 * @param {RangeModel} range The RangeModel to change.
	 * @param {Number} newMin The new range minimum.
	 * @param {Number} newMax The new range maximum.
	 * @param {Number} newExtent The new range extent.
	 */
	setRange(range, newMin, newMax, newExtent) {
		const val = range.getValue();
		if (newMin > range.getMin()) {
			if (val < newMin) {
				newMin = val; // range.getMin();
			}
		}
		if (newMax < range.getMax()) {
			if (val + range.getExtent() > newMax) {
				newMax = val + range.getExtent(); // range.getMax();
			}
		}
		range.setAll(newMin, newMax, newExtent);
	}

	/**
	 * Returns the current preferred {{#crossLink "ViewPanel"}}{{/crossLink}} bounds.
	 *
	 * @method getViewPanelBounds
	 * @param {Rectangle} [cArea] Optional rectangle to give a hint for preferred bounds.
	 * @return {Rectangle} The preferred ViewPanel bounds.
	 */
	getViewPanelBounds(cArea) {
		return this._viewpanel.getPreferredBounds();
	}

	/**
	 * Returns the preferred bounds of this view-port. An optional <code>boundshint</code> parameter can be passed. If
	 * specified the preferred bounds will at least cover these bounds. This is useful to specify minimum bounds.
	 *
	 * @method getPreferredBounds
	 * @param {Rectangle} [boundshint] Optional rectangle to set minimum preferred bounds.
	 * @param {Rectangle} [reuserect] Optional rectangle to reuse. If not given a new one will be created.
	 * @return {Rectangle} The preferred bounds of this view-port.
	 */
	getPreferredBounds(boundshint, reuserect) {
		const prefbounds = this._viewpanel.getPreferredBounds(undefined, reuserect);
		prefbounds.x += this._vpOffset.x;
		prefbounds.y += this._vpOffset.y;
		if (boundshint) {
			prefbounds.union(boundshint);
		}
		return prefbounds;
	}

	// overwritten to prevent layout call...
	invalidate() {
		this.setValid(false);
	}

	/**
	 * Returns the internal used offset of inner {{#crossLink "ViewPanel"}}{{/crossLink}}.
	 *
	 * @method getViewPanelOffset
	 * @return {Point} The inner ViewPanel offset.
	 * @deprecated. Discouraged access. Subject to be removed!
	 */
	getViewPanelOffset() {
		// TODO review: used only in ContentNodeController. Can we remove? Register controller to RangeModel...
		return this._vpOffset;
	}

	/**
	 * Returns the bounds of currently visible region of registered content view.
	 *
	 * @method getVisibleViewRect
	 * @param {Rectangle} [reuserect] Optional rectangle to reuse. If not given a new one will be created.
	 * @return {Rectangle} The bounds of currently visible region.
	 */
	getVisibleViewRect(reuserect) {
		const bounds = this.getClientArea(reuserect);
		bounds.x = -this._vpOffset.x;
		bounds.y = -this._vpOffset.y;
		return bounds;
	}

	/**
	 * Returns the currently displayed content, i.e. the view registered to inner {{#crossLink
	 * "ViewPanel"}}{{/crossLink}}.
	 *
	 * @method getContentView
	 * @return {View} The currently displayed view.
	 */
	getContentView() {
		return this._viewpanel.getView();
	}

	/**
	 * Sets the new content, i.e. the view which is registered to inner {{#crossLink
	 * "ViewPanel"}}{{/crossLink}}.
	 * <b>Note:</b> the passed view must provide a <code>setScrollTo(point)</code> method which is called by this
	 * view-port to set the scroll position to a certain {{#crossLink "Point"}}{{/crossLink}}.
	 *
	 * @method setContentView
	 * @param {View} view The new view to display.
	 */
	setContentView(view) {
		this._viewpanel.setView(view);
		this._initOffsets(view);
	}

	/**
	 * Initialize offset to inner view panel.
	 * @method _initOffset
	 * @param {View} view The content view of inner view panel, usually a {{#crossLink
	 *     "GraphItemView"}}{{/crossLink}}.
	 * @private
	 */
	_initOffsets(view) {
		if (view && view.getItem) {
			const item = view.getItem();
			const origin = item.getOrigin(JSG.ptCache.get());
			this._vpOffset.setTo(origin);
			JSG.ptCache.release(origin);
		}
	}

	/**
	 * Called when the size of inner ViewPanel has changed.
	 *
	 * @method onResize
	 * @param {ViewPanel} viewpanel The resized ViewPanel.
	 */
	onResize(viewpanel) {
		this.relayout();
	}

	setBounds(x, y, width, height) {
		super.setBounds(x, y, width, height);
		// notify bounds change...
		NotificationCenter.getInstance().send(new Notification(ViewPort.BOUNDS_CHANGED_NOTIFICATION, this));
	}

	drawClientArea(graphics) {
		if (this._viewpanel) {
			const bounds = this._bounds;
			graphics.setClip(bounds);

			graphics.startGroup();
			graphics.translate(bounds.x + this._vpOffset.x, bounds.y + this._vpOffset.y);
			this.drawSubViews(graphics);
			graphics.endGroup();
		}
	}

	handleMouseEvent(ev) {
		if (this._viewpanel) {
			this.translateFromParent(ev.location);
			this._viewpanel.handleMouseEvent(ev);
		}
	}

	handleDragEvent(ev) {
		if (this._viewpanel) {
			this.translateFromParent(ev.location);
			return this._viewpanel.handleDragEvent(ev);
		}
		return false;
	}

	handleKeyEvent(ev) {
		if (this._viewpanel) {
			this._viewpanel.handleKeyEvent(ev);
		}
	}

	translateFromParent(location) {
		super.translateFromParent(location);
		location.translate(-this._vpOffset.x, -this._vpOffset.y);
		return location;
	}

	translateToParent(location) {
		super.translateToParent(location);
		location.translate(this._vpOffset.x, this._vpOffset.y);
		return location;
	}

	/**
	 * Returns the range model which describes the vertical scroll area.
	 *
	 * @method getVerticalRangeModel
	 * @return {RangeModel} The vertical range model.
	 */
	getVerticalRangeModel() {
		return this._vrangemodel;
	}

	/**
	 * Returns the range model which describes the horizontal scroll area.
	 *
	 * @method getHorizontalRangeModel
	 * @return {RangeModel} The horizontal range model.
	 */
	getHorizontalRangeModel() {
		return this._hrangemodel;
	}

	/**
	 * Sets the new range model which describes the vertical scroll area.
	 *
	 * @method setVerticalRangeModel
	 * @param {RangeModel} rangemodel The new vertical range model.
	 */
	setVerticalRangeModel(rangemodel) {
		this._vrangemodel = this._setRangeModel(this._vrangemodel, rangemodel);
	}

	/**
	 * Sets the new range model which describes the horizontal scroll area.
	 *
	 * @method setHorizontalRangeModel
	 * @param {RangeModel} rangemodel The new horizontal range model.
	 */
	setHorizontalRangeModel(rangemodel) {
		this._hrangemodel = this._setRangeModel(this._hrangemodel, rangemodel);
	}

	/**
	 * Internal convenience method to apply a new range model and take care of unregistering from old range model and
	 * registering to new range model.
	 *
	 * @method _setRangeModel
	 * @param {RangeModel} oldrangemodel The old range model to unregister from.
	 * @param {RangeModel} newrangemodel The new range model to set and to register to.
	 */
	_setRangeModel(oldrangemodel, newrangemodel) {
		newrangemodel = newrangemodel || oldrangemodel;
		if (oldrangemodel) {
			oldrangemodel.removeObserver(this);
		}
		newrangemodel.addObserver(this);
		return newrangemodel;
	}

	/**
	 * Called when one of the internal used RangeModel has changed.<br/>
	 *
	 * @method onRangeChange
	 * @param {RangeModel} rangemodel The RangeModel which has changed.
	 * @param {Number} type    A change type constant which is one of the predefined by RangeModel.
	 */
	onRangeChange(range, type) {
		if (type === RangeModel.CHANGED_VALUE) {
			// we have to adjust thumb size and thumb position...
			this._vpOffset.set(-this._hrangemodel.getValue(), -this._vrangemodel.getValue());
			const content = this.getContentView();
			if (content) {
				// content.getItem().setPinPointTo(this._vpOffset);
				// pass view-panel scroll offset to content view, so that translateFrom/ToParent within
				// Graph/ContentNode works correctly...
				content.setScrollTo(this._vpOffset);
			}
		}
	}
	/**
	 * A global notification send on view-port bounds change.</br>
	 * Refer to {{#crossLink "NotificationCenter"}}{{/crossLink}} for more information about
	 * notifications.
	 *
	 * @property BOUNDS_CHANGED_NOTIFICATION
	 * @type {String}
	 * @static
	 */
	static get BOUNDS_CHANGED_NOTIFICATION() {
		return 'viewport.bounds.changed.notification';
	}
}

export default ViewPort;
