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
	default as JSG,
	Rectangle
} from '@cedalo/jsg-core';
import ViewPanel from "./scrollview/ViewPanel";

/**
 * A ViewPanel subclass to display a graph view.</br>
 * This is just a convenience class to register a GraphViewer instance and to provide custom preferred bounds.
 *
 * @class GraphViewPanel
 * @extends ViewPanel
 * @constructor
 * @param {GraphViewer} viewer The GraphViewer instance which provides the graph view.
 */
class GraphViewPanel extends ViewPanel {
	constructor(viewer) {
		super();
		this._viewer = viewer;
		this._margin = 500;
	}

	layout() {
		const view = this._view;
		if (view) {
			view.layout();
			const bounds = this._getViewBounds(view, JSG.rectCache.get());
			this.setBoundsTo(bounds);
			JSG.rectCache.release(bounds);
			this._repaint();
		}
	}

	/**
	 * Triggers a paint request to the GraphicSystem of internal used viewer.
	 *
	 * @method _repaint
	 * @private
	 */
	_repaint() {
		const gfxsys = (this._viewer && this._viewer.getGraphicSystem) ? this._viewer.getGraphicSystem() : undefined;
		if (gfxsys) {
			gfxsys.paint();
		}
	}

	setBoundsMargin(margin) {
		this._margin = margin;
	}

	getPreferredBounds(recthint, reuserect) {
		const view = this._view;
		const bounds = reuserect || new Rectangle(0, 0, 0, 0);
		if (view) {
			this._getViewBounds(view, bounds);
			bounds.expandBy(this._margin);
		}
		return bounds;
	}


	/**
	 * Calculates the bounds of given graph view.</br>
	 * Note: the bounds depend on current display mode settings and are therefore not necessarily the same as the
	 * bounds of the corresponding {{#crossLink "Graph"}}{{/crossLink}} model.</br> For more
	 * information about supported display modes refer to {{#crossLink
	 * "GraphSettings"}}{{/crossLink}}.
	 *
	 * @method _getViewBounds
	 * @param {GraphView} view The graph view to calculate the bounds of.
	 * @param {Rectangle} [reuserect] An optional rectangle to reuse, if not given a new one will be
	 *     created.
	 * @return {Rectangle} The view bounds.
	 * @private
	 */
	_getViewBounds(view, reuserect) {
		const bbox = view.getBoundingBox(JSG.boxCache.get());
		const bounds = bbox.toRectangle(reuserect);
		JSG.boxCache.release(bbox);
		return bounds;
	}
}

export default GraphViewPanel;
