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
import {
	Notification,
	NotificationCenter,
	default as JSG,
} from '@cedalo/jsg-core';
import ScrollView from "./scrollview/ScrollView";
import RangeModel from "./scrollview/RangeModel";
import Scale from './Scale';
import MouseEvent from './events/MouseEvent';

/**
 * The ScrollPanel is the main editor panel to display the current {{#crossLink
 * "GraphView"}}{{/crossLink}}. It adds a horizontal and a vertical {{#crossLink
 * "Scale"}}{{/crossLink}} to the base ScrollView.</br>
 *
 * @class ScrollPanel
 * @extends ScrollView
 * @constructor
 * @param {ScrollableViewer} viewer The controller viewer to use for displaying graph content.
 */
class ScrollPanel extends ScrollView {
	constructor(viewer) {
		super(viewer.getCoordinateSystem());

		this._viewer = viewer;
		this.getFormat().setFillColor(JSG.bkColorHeader);

		// Scales to show coordinate system
		this._hScale = this.add(new Scale(false, viewer));
		this._vScale = this.add(new Scale(true, viewer));
		this._viewport.getVerticalRangeModel().addObserver(this._vScale);
		this._viewport.getHorizontalRangeModel().addObserver(this._hScale);

		this.setScrollBarsMode(JSG.ScrollBarMode.VISIBLE);
	}

	/**
	 * Determines and returns the bounds of the currently visible {{#crossLink
	 * "GraphView"}}{{/crossLink}} region.
	 *
	 * @method getVisibleGraphRect
	 * @param {Rectangle} [reuserect] Optional rectangle to reuse. If not given a new one will be created.
	 * @return {Rectangle} The bounds of currently visible region.
	 * @deprecated Simply use {{#crossLink "ScrollView/getVisibleViewRect:method"}}{{/crossLink}}
	 *     instead.
	 */
	getVisibleGraphRect(reuserect) {
// TODO CHECK USAGE: -> GraphEditor -> editor used by DragDropInteraction & Navigator
		return this.getViewPort().getVisibleViewRect(reuserect);
	}

	destroy() {
		super.destroy();
		this._viewport.getVerticalRangeModel().removeObserver(this._vScale);
		this._viewport.getHorizontalRangeModel().removeObserver(this._hScale);
		this._hScale.destroy();
		this._vScale.destroy();
	}

	layout() {
		const bounds = this.getClientArea(JSG.rectCache.get());
		const hsBounds = JSG.rectCache.get().setTo(bounds);
		const vsBounds = JSG.rectCache.get().setTo(bounds);

		if (this._hScale.isVisible()) {
			bounds.y += this._hScale.getHeight();
			bounds.height -= this._hScale.getHeight();
			hsBounds.y = 0;
			hsBounds.height = this._hScale.getHeight();
			vsBounds.y += hsBounds.height;
			vsBounds.height -= hsBounds.height;
		}
		if (this._vScale.isVisible()) {
			bounds.x += this._vScale.getWidth();
			bounds.width -= this._vScale.getWidth();
			vsBounds.x = 0;
			vsBounds.width = this._vScale.getWidth();
			hsBounds.x += vsBounds.width;
			hsBounds.width -= vsBounds.width;
		}
		this._hScale.setBoundsTo(hsBounds);
		this._vScale.setBoundsTo(vsBounds);
		super.layout(bounds);

		JSG.rectCache.release(bounds, hsBounds, vsBounds);
	}

	areScrollBarsVisible() {
		return this._hScrollbar.isVisible() && this._vScrollbar.isVisible();
	}

	/**
	 * Returns direct access to internal horizontal scrollbar.
	 *
	 * @method getHorizontalScrollBar
	 * @return {ScrollBar} The horizontal scrollbar.
	 * @deprecated. Discouraged access. Subject to be removed!
	 */
	getHorizontalScrollBar() {
// TODO CHECK USAGE: //required by freewebedition to hide scrollbar!! => replace with setScrollBarsMode...
		return this._hScrollbar;
	}

	/**
	 * Returns direct access to internal vertical scrollbar.
	 *
	 * @method getVerticalScrollBar
	 * @return {ScrollBar} The vertical scrollbar.
	 * @deprecated. Discouraged access. Subject to be removed!
	 */
	getVerticalScrollBar() {
// TODO CHECK USAGE: //required by freewebedition to hide scrollbar!! => replace with setScrollBarsMode...
		return this._vScrollbar;
	}

	/**
	 * Shows or hides horizontal and vertical scales.
	 *
	 * @method showScale
	 * @param {Boolean} flag Specify <code>true</code> to show horizontal and vertical scales, <code>false</code>
	 *     otherwise.
	 */
	showScale(flag) {
		this._hScale.setVisible(flag);
		this._vScale.setVisible(flag);
		this.layout();
	}


	doHandleEvent(ev) {
		// overwritten: we need mouse events outside panel to ease scroll behaviour...
		return (ev instanceof MouseEvent) || super.doHandleEvent(ev);
	}

	onRangeChange(range, type) {
		super.onRangeChange(range, type);
		if (type === RangeModel.CHANGED_VALUE) {
			NotificationCenter.getInstance().send(
				new Notification(NotificationCenter.SCROLL_NOTIFICATION, this));
		}
	}

	onThumbDrag(scrollbar, newValue, delta) {
		// on thumb drag we want to stay in range...
		super.setRangeValue(scrollbar.getRangeModel(), newValue);
	}

	// overwritten to allow range extend:
	setRangeValue(rangemodel, newvalue) {
		if (newvalue < rangemodel.getMin()) {
			rangemodel.setRange(newvalue, rangemodel.getMax());
		} else if ((newvalue + rangemodel.getExtent()) > rangemodel.getMax()) {
			rangemodel.setRange(rangemodel.getMin(), newvalue + rangemodel.getExtent());
		}
		super.setRangeValue(rangemodel, newvalue);
	}
}

export default ScrollPanel;
