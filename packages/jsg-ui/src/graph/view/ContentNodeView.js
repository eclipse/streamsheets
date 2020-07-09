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
import { default as JSG, Point, Event, Rectangle, FormatAttributes } from '@cedalo/jsg-core';
import NodeView from './NodeView';
import ViewPanel from '../../ui/scrollview/ViewPanel';
import MouseEvent from '../../ui/events/MouseEvent';
import ScrollView from '../../ui/scrollview/ScrollView';
import GraphItemView from "./GraphItemView";

//--------------------------------------------------------------------------------------------------
// OWN VIEWPANEL CLASS
//
/**
 * The default ViewPanel to use for ContentNodeViews {{#crossLink "ScrollView"}}{{/crossLink}}.
 *
 * @class ContentNodeViewPanel
 * @extends ViewPanel
 * @param {ContentNodeView} contentView The parent reference.
 * @constructor
 */
class ContentNodeViewPanel extends ViewPanel {
	constructor(contentView) {
		super();

		this.getFormat().setFillColor(JSG.theme.graph);
		this.getFormat().setFillStyle(FormatAttributes.FillStyle.SOLID);
		this._contentView = contentView;
	}

	/**
	 * Adds given sub-view to this ViewPanels content view.
	 *
	 * @method _addView
	 * @param {View} view View to add.
	 * @param {Number} [index] Index to place the view at in the subviews array. If not supplied, the
	 * view will be added to the end of the view list.
	 * @return {View} View, that was added.
	 */
	_addView(view, index) {
		// pass view to content:
		return this.getView().addView(view, index);
	}

	/**
	 * Removes given sub-view from the sub-view list of this ViewPanels content view.
	 *
	 * @method _removeView
	 * @param {View} view View to remove.
	 * @return {Boolean} <code>true</code> if view was removed otherwise <code>false</code>
	 */
	_removeView(view) {
		return this.getView().removeView(view);
	}

	/**
	 * Removes all sub-views from the sub-view list of this ViewPanels content view.
	 *
	 * @method _removeAllViews
	 */
	_removeAllViews() {
		this.getView().removeAllViews();
	}

	getGraphView() {
		return this._contentView.getGraphView();
	}

	getContentView() {
		return this._contentView;
	}

	// overwritten: we don't want to call fireOnResize...
	_setSize(w, h) {
		this._bounds.width = w;
		this._bounds.height = h;
	}

	translateFromParent(point) {
		// we are already translated by ViewPort!! => don't translate here again...
		return point;
	}

	translateToParent(point) {
		// we are already translated by ViewPort!! => don't translate here again...
		return point;
	}
}

/**
 * The corresponding view for a {{#crossLink "ContentNode"}}{{/crossLink}} model.</br>
 * The ContentNodeView wraps the ContentPane of given ContentNode inside a {{#crossLink
 * "ScrollView"}}{{/crossLink}}. Although this view can be instantiated directly it is recommended to
 * create it by calling
 * {{#crossLink "ContentNodeController/createView:method"}}{{/crossLink}}.
 *
 * @class ContentNodeView
 * @extends NodeView
 * @param {ContentNode} model The corresponding ContentNode model.
 * @constructor
 */
class ContentNodeView extends NodeView {
	constructor(model, cs) {
		super(model);

		// we use a ScrollView inside...
		this._scrollview = super.addView(new ScrollView(cs));
		// set our viewpanel:
		this._viewpanel = new ContentNodeViewPanel(this);

		this._scrollview.setViewPanel(this._viewpanel);
		this._scrollview.setScrollBarsMode(model.getHorizontalScrollbarMode(), model.getVerticalScrollbarMode());

		const self = this;

		// adjust our ViewPort: we want a different behavior on relayout => we keep current scroll settings:
		/* eslint-disable func-names */
		this._scrollview.getViewPort().getViewPanelBounds = function(cArea) {
			// called in scope of ViewPort:
			const vpBounds = this._viewpanel.getPreferredBounds();
			const minbounds = JSG.rectCache
				.get()
				.set(cArea.x - this._vpOffset.x, cArea.y - this._vpOffset.y, cArea.width, cArea.height);
			vpBounds.union(minbounds);
			JSG.rectCache.release(minbounds);

			if (self._item._allowMaximize) {
				const pane = self.getContentPane();
				let max = false;
				pane._subviews.forEach((subview) => {
					max =
						max ||
						subview
							.getItem()
							.getItemAttributes()
							.getViewMode()
							.getValue() === 2;
				});

				if (max) {
					self._scrollview.setScrollPosition(0, 0);
					this._vpOffset.x = 0;
					this._vpOffset.y = 0;
				}
			}

			return vpBounds;
		};
		/* eslint-enable func-names */
	}

	/**
	 * Sets the ViewPanel to use within internal ScrollView.
	 *
	 * @method setViewPanel
	 * @param {ViewPanel} viewpanel The new ViewPanel to use inside ScrollView.
	 */
	setViewPanel(viewpanel) {
		this._viewpanel = viewpanel;
		this._scrollview.setViewPanel(viewpanel);
	}

	getViewPanel() {
		return this._viewpanel;
	}

	getContentPane() {
		return this._viewpanel.getView();
	}

	init() {
		const scroll = this._viewpanel
			.getView()
			.getItem()
			.getPinPoint(JSG.ptCache.get());
		this._scrollview.setScrollPosition(-scroll.x, -scroll.y);
		JSG.ptCache.release(scroll);
	}

	/**
	 * Sets the new ContentPane view to use within ScrollViews ViewPanel.
	 *
	 * @method setContentPaneView
	 * @param {GraphItemView} cpView The new ContentPane view.
	 */
	setContentPaneView(cpView) {
		if (cpView !== undefined) {
			this._scrollview.getViewPort().setContentView(cpView);
		}
	}

	getScrollView() {
		return this._scrollview;
	}

	getViewPort() {
		return this._scrollview.getViewPort();
	}

	getScrollOffset() {
		if (this._scrollview) {
			return this.getViewPort()
				.getViewPanelOffset()
				.copy();
		}
		return new Point(0, 0);
	}

	addView(view, index) {
		this._viewpanel._addView(view, index);
		return view;
	}

	removeView(view) {
		this._viewpanel._removeView(view);
		return view;
	}

	removeAllViews() {
		this._viewpanel._removeAllViews();
	}

	invalidate() {}

	layout() {
		const box = JSG.boxCache.get();
		const bounds = this.getBoundingBox(box).toRectangle(JSG.rectCache.get());
		JSG.boxCache.release(box);

		const model = this.getItem();
		this._scrollview.setScrollBarsMode(model.getHorizontalScrollbarMode(), model.getVerticalScrollbarMode());

		bounds.x = 0;
		bounds.y = 0;
		this._scrollview.setBoundsTo(bounds);
		this._scrollview.layout();
		JSG.rectCache.release(bounds);
	}

	/**
	 * Checks if given event at specified location is directly handled by ContentNodeView. Directly means
	 * that this event is consumed by ContentNodeView itself and should not be passed to any sub-views.
	 *
	 * @method doHandleEventAt
	 * @param {Point} location The location at which the event occurred.
	 * @param {MouseEvent} event The event to handle.
	 * @return {Boolean} <code>true</code> if the event will be consumed by ContentNodeView directly,
	 *     <code>false</code> if it should be passed to its sub-views.
	 */
	doHandleEventAt(location, event) {
		// content hidden -> ignore
		if (!this.getItem().isVisible()) {
			return false;
		}

		return this._scrollview.hitsScrollBar(location);
		// we handle it, if location hits a scrollbar...
	}

	handleMouseWheel(event) {
		this.handleMouseEvent(event);
	}

	handleMouseEvent(ev) {
		// content hidden -> ignore
		if (!this.getItem().isVisible()) {
			return;
		}

		if (ev.type === MouseEvent.MouseEventType.DOWN) {
			this._didScroll = true;
		}
		// this.translateFromParent(ev.location); event location is already translated...
		this._scrollview.handleMouseEvent(ev);
		if (ev.isConsumed) {
			const node = this.getItem();
			// TODO can we get away with just mark ourself as required to repaint...
			node.getGraph().markDirty();
			// ev.doRepaint = true; <-- NOT ENOUGH: does not clear cache...
		}
	}
}

export default ContentNodeView;
