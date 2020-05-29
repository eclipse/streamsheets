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
import GraphItemView from "./GraphItemView";

/**
 * Internal listener class used by ContentPaneView. </br>
 * Listens to BoundingBox, Angle, Pin and Size changes of registered items.
 *
 *
 * @class BBoxListener
 * @param {ContentPaneView} cpview The ContentPaneView which should be notified on change.
 * @constructor
 * @private
 */
class BBoxListener {
	constructor(cpview) {
		this._cpview = cpview;
	}

	/**
	 * Registers to given GraphItem, i.e. this listener registers as EventListener to passed item.
	 *
	 * @method registerTo
	 * @param {GraphItem} item The item to register to.
	 * @private
	 */
	registerTo(item) {
		// we handle following events:
		// item.addEventListener(Event.ALL, this); //<-- send after load
		item.addEventListener(Event.BBOX, this);
		item.addEventListener(Event.ANGLE, this);
		item.addEventListener(Event.PIN, this);
		item.addEventListener(Event.SIZE, this);
		item.addEventListener(Event.COLLAPSEDSIZE, this);
	}

	/**
	 * Unregisters from given GraphItem.
	 *
	 * @method deregisterFrom
	 * @param {GraphItem} item The item to register from.
	 * @private
	 */
	deregisterFrom(item) {
		// item.removeEventListener(Event.ALL, this); //<-- send after load
		item.removeEventListener(Event.BBOX, this);
		item.removeEventListener(Event.ANGLE, this);
		item.removeEventListener(Event.PIN, this);
		item.removeEventListener(Event.SIZE, this);
		item.removeEventListener(Event.COLLAPSEDSIZE, this);
	}

	/**
	 * EventListener function. Default implementation does nothing.
	 *
	 * @method handlePreEvent
	 * @param {Event} event The event object.
	 */
	handlePreEvent(event) {}

	/**
	 * EventListener function. Default implementation simply revalidates registered ContentPaneView.
	 *
	 * @method handlePostEvent
	 * @param {Event} event The event object containing more details.
	 */
	handlePostEvent(event) {
		this._cpview.revalidate();
	}
}

/**
 * The default ContentPane view.</br>
 * Registers a listener to all added sub-views to be informed about any size changes.
 *
 * @class ContentPaneView
 * @extends GraphItemView
 * @param {GraphItem} contentpane The ContentNodes content pane.
 * @constructor
 */
class ContentPaneView extends GraphItemView {
	constructor(contentpane) {
		super(contentpane);

		contentpane.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
		contentpane.getFormat().setFillStyle(FormatAttributes.FillStyle.NONE);
		// our resize listener...
		this._bboxListener = new BBoxListener(this);
	}

	addView(view, index) {
		view = super.addView(view, index);
		this._bboxListener.registerTo(view.getItem());
		// this.layout();
		this.revalidate();
		return view;
	}

	removeView(view) {
		this._bboxListener.deregisterFrom(view.getItem());
		const removed = super.removeView(view);
		if (removed === true) {
			// this.layout();
			this.revalidate();
		}
		return removed;
	}

	removeAllViews() {
		this._subviews.forEach((subview) => {
			this._bboxListener.deregisterFrom(subview.getItem());
		});
		super.removeAllViews();
		// this.layout();
		this.revalidate();
	}

	getGraphView() {
		return this.getParent().getGraphView();
		// we should be nested inside a ContentNodeViewPanel...
	}

	getPreferredBounds(recthint, reuserect) {
		const rect = reuserect || new Rectangle(0, 0, 0, 0);
		if (this.hasSubviews()) {
			const tmprect = JSG.rectCache.get();

			let max = this._subviews.some(
				(subview) =>
					subview
						.getItem()
						.getItemAttributes()
						.getViewMode()
						.getValue() === 2
			);

			const graph = this.getItem().getGraph();
			if (graph !== undefined) {
				const view = graph.getViewParams && graph.getViewParams();
				if (view) {
					switch (view.viewMode) {
						case 'name':
						case 'range':
						case 'drawing':
							max = true;
							break;
					}
				}
			}

			if (max) {
				rect.set(0, 0, 100, 100);
			} else {
				this._subviews.forEach((subview) => {
					if (subview.getItem().isItemVisible()) {
						subview.layout();
						rect.union(subview.getItem().getTotalBoundingRect(undefined, tmprect));
					}
				});
			}
			JSG.rectCache.release(tmprect);
		}
		return rect;
	}

	/**
	 * Implemented to fulfill content view constraint.<br/>
	 * See {{#crossLink "ViewPort/setContentView:method"}}{{/crossLink}} too.
	 *
	 * @method setScrollTo
	 * @param {Point} point The scroll position to apply to this content view.
	 * @since 1.6.2
	 */
	setScrollTo(point) {
		this.getItem().setPinPointTo(point);
	}

	translateToParent(point) {
		// we are already translated by ViewPort/ViewPanel!! => don't translate here again...
		return point;
	}

	translateFromParent(point) {
		// we are already translated by ViewPort/ViewPanel!! => don't translate here again...
		return point;
	}

	translateGraphics(graphics) {
		// we are already translated by ViewPort/ViewPanel!! => don't translate here again...
	}

	drawClientArea(graphics) {
		this.drawSubViews(graphics);
	}

	onResize(view) {
		this.revalidate();
	}
}

export default ContentPaneView;
