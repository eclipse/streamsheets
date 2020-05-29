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
import { default as JSG, FormatAttributes, Numbers, Rectangle } from '@cedalo/jsg-core';
import Widget from '../Widget';

/**
 * A ViewPanel is usually used in conjunction with a {{#crossLink "ViewPort"}}{{/crossLink}} to
 * display a view which bounds are larger then the currently available space. That means only a certain area of this
 * view is visible. The visible area is determined by the ViewPort whereas the ViewPanel specifies the correct bounds
 * to use. Note: these bounds can be larger then the view bounds to support kind of endless scrolling in all
 * directions.
 *
 * @class ViewPanel
 * @extends Widget
 * @constructor
 */
class ViewPanel extends Widget {
	constructor() {
		super();

		this._view = undefined;

		this.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
		this.getFormat().setFillStyle(FormatAttributes.FillStyle.NONE);
	}

	/**
	 * Gets the base or content view attached to this ViewPanel.
	 *
	 * @method getView
	 * @return {View} The current base view.
	 */
	getView() {
		return this._view;
	}

	/**
	 * Sets a new base or content view to this ViewPanel. This removes a previously attached view.<br/>
	 * <b>Note:</b> it is not recommended to use this method. To set this view better use
	 * {{#crossLink "ViewPort/setContentView:method"}}{{/crossLink}}
	 *
	 * @method setView
	 * @param {View} view New base view.
	 */
	setView(view) {
		if (this._view) {
			this._view.removeResizeListener(this);
			this.removeView(this._view);
		}
		this._view = view;
		if (view) {
			this.addView(view);
			view.addResizeListener(this);
		}
		this.layout();
	}

	// overwritten to prevent layout call...
	invalidate() {
		this.setValid(false);
	}

	/**
	 * Calculates the preferred bounding Rectangle this view panel needs to draw itself. The optional parameter
	 * can be used to give hints to calculation, e.g. to specify the available space.</br>
	 *
	 * @method getPreferredBounds
	 * @param {Rectangle} [recthint] An optional Rectangle to influence calculation.
	 * @param {Rectangle} [reuserect] An optional Rectangle to reuse, if not supplied a new one will be
	 *     created.
	 * @return {Rectangle} The preferred Rectangle this view panel needs to draw itself.
	 */
	getPreferredBounds(recthint, reuserect) {
		const rect = reuserect || new Rectangle(0, 0, 0, 0);
		const view = this.getView();
		return view ? view.getPreferredBounds(undefined, rect) : rect.reset();
	}

	translateToParent(point) {
		return point;
	}

	layout(minBounds) {
		if (this._view) {
			this._view.layout();
			// update our bounds to match inner view:
			const bbox = this._view.getBoundingBox(JSG.boxCache.get());
			const bounds = bbox.toRectangle(JSG.rectCache.get());
			this.setBoundsTo(bounds);
			JSG.boxCache.release(bbox);
			JSG.rectCache.release(bounds);
		}
	}

	drawClientArea(graphics) {
		this.drawSubViews(graphics);
	}

	// overwritten from base class...
	_setSize(w, h) {
		if (!Numbers.areEqual(this._bounds.width, w, 1) || !Numbers.areEqual(this._bounds.height, h, 1)) {
			this._bounds.width = w;
			this._bounds.height = h;
			if (this._view) {
				this._view.layout();
			}
			// TODO CONTENT_VIEW_TEST, still required? REVIEW
			this._fireOnResize();
		}
	}

	onResize(view) {
		this.layout();
	}

	getVisibleViewRect(reuserect) {
		const parent = this.getParent();
		let rect = parent ? parent.getVisibleViewRect(reuserect) : undefined;
		if (!rect) {
			rect = reuserect || new Rectangle();
			rect.setTo(this._bounds);
		}
		return rect;
	}

	handleMouseEvent(ev) {
		// overwritten, we don't handle mouse events...
		return false;
	}

	handleDragEvent(ev) {
		// overwritten, we don't handle drag events...
		return false;
	}

	handleKeyEvent(ev) {
		// overwritten, we don't handle key events...
		return false;
	}
}

export default ViewPanel;
