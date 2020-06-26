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
/* global document */

import {
	Arrays,
	FormatAttributes,
	Point,
	Rectangle,
	GraphSettings,
	StableDictionary,
	WorksheetNode,
	default as JSG
} from '@cedalo/jsg-core';
import GraphItemView from './GraphItemView';
import LayerId from './LayerId';
import ScalableGraphics from '../../ui/graphics/ScalableGraphics';
import ScrollPanel from '../../ui/ScrollPanel';

const useCacheOffset = true;

// there is currently no easy and reliable way to determine canvas max area size....
const determineTileSize = (cs) => {
	return {
		x: cs.getZoom() < 0.1 ? 256 : JSG.isMobileSafari ? Math.floor(4096 / cs.getDeviceRatio()) : 4100,
		y: cs.getZoom() < 0.1 ? 256 : JSG.isMobileSafari ? Math.floor(4096 / cs.getDeviceRatio()) : 2100
	}
};

class CacheElement {
	constructor() {
		this.canvas = document.createElement('canvas');
		this.redraw = true;
	}

	getGraphics(cs, tileSize) {
		const { canvas } = this;

		const sizeX = tileSize.x * cs.getDeviceRatio();
		const sizeY = tileSize.y * cs.getDeviceRatio();
		if (sizeX !== canvas.width) {
			canvas.width = sizeX;
		}
		if (sizeY !== canvas.height) {
			canvas.height = sizeY;
		}

		return new ScalableGraphics(canvas, cs);
	}
}

class Cache {
	constructor() {
		this._tiles = [];
		this._xStart = 0;
		this._yStart = 0;
		this._xCnt = 0;
		this._yCnt = 0;
		this._offset = new Point(2000, 3000);
	}

	getTile(index) {
		if (this._tiles[index] === undefined) {
			this._tiles[index] = new CacheElement();
		}

		return this._tiles[index];
	}

	clear() {
		this._tiles.forEach((canvas) => {
			if (canvas !== undefined) {
				canvas.redraw = true;
			}
		});
	}
}

/**
 * A GraphView to display a Graph model.</br>
 * Besides drawing the content of the given Graph model, this view also provides additional
 * functionality to draw customizable views like selections and feedbacks on top. Currently the drawing order
 * is as follows:
 * <ul>
 * <li> Graph content</li>
 * <li> added feedback views</li>
 * <li> added layer views</li>
 * <li> added overlay views</li>
 * </ul>
 * That means that the Graph content is drawn first, on top of it the interaction feedback views, then the layer views
 * like selection highlights and so on.<br/>
 * The difference between views inside a layer array and views inside an overlay array is that layers are drawn per
 * page
 * and relative to this <code>GraphView</code> whereas overlay views are drawn on top of this <code>GraphView</code>,
 * i.e. relative to its parent.<br/> Use the corresponding methods to add any custom View into one of these
 * categories.</br>
 *
 * @class GraphView
 * @extends GraphItemView
 * @param {Graph} model The Graph model to be displayed by this view.
 * @constructor
 */
class GraphView extends GraphItemView {
	constructor(model) {
		super(model);

		// support special views, currently only selection and feedbacks decorations.
		// maybe we should think of a more general layer feature...
		this._feedbackViews = [];

		this._layerViews = new StableDictionary();
		// define default layer order...
		this._layerOrder = [LayerId.PORTS, LayerId.SELECTION, LayerId.FRIENDS];
		// overlay views which are drawn on top of Graph and Pages...
		this._overlays = new StableDictionary();
		this._overlaysOrder = undefined;

		this._additions = [];
		this._canvasCache = new Cache();
		this._focus = undefined;

		this._item.getFormat().setFillColor('#FFFFFF');
		this._item.getFormat().setLineColor('#777777');
	}

	// overwritten
	dispose() {
		super.dispose();
		this.clearAllLayer();
	}

	getGraphView() {
		return this;
	}

	/**
	 * Returns the GraphSettings to used for underlying Graph.
	 *
	 * @method getSettings
	 * @return {GraphSettings} The currently used GraphSettings.
	 */
	getSettings() {
		return this._item.getSettings();
	}

	/**
	 * Clears internal used canvas cache.</br>
	 * <b>Note:</b> it should almost never be required to call this method outside framework!
	 *
	 * @method clearCache
	 * @private
	 */
	clearCache() {
		const p = this._getScrollPosition();
		if (p) {
			p.x -= 1000;
			p.y -= 1000;
			this._canvasCache._offset.setTo(p);
			JSG.ptCache.release(p);
		}

		this._canvasCache.clear();
	}

	draw(graphics) {
		this._item.refresh();
		graphics.reset();
		graphics.save();
		this.drawClientArea(graphics);
		this._drawOverlays(graphics);

		graphics.restore();
	}

	drawInteraction(graphics, dplMode) {
		let oldZoom;
		const settings = this.getItem().getSettings();
		this._drawFeedback(graphics);
		this._drawLayers(graphics);
		this._drawOverlay(graphics);
	}

	/**
	 * Draws this GraphView using given graphics.
	 *
	 * @method drawClientArea
	 * @param {Graphics} graphics Graphics class to use for generating output.
	 */
	drawClientArea(graphics) {
		const box = JSG.boxCache.get();
		const graphRect = this._item.getBoundingBox(box).toRectangle(JSG.rectCache.get());
		const format = this._item.getFormat();
		const cs = graphics.getCoordinateSystem();
		// const size = Math.ceil(cs.logToDeviceX(Math.max(graphRect.width, graphRect.height)));
		const tileSize = determineTileSize(cs);
		const logTileSize = {
			x: cs.deviceToLogX(tileSize.x),
			y: cs.deviceToLogX(tileSize.y)
		};
		const graph = this.getItem();
		const settings = graph.getSettings();
		const dplMode = settings.getDisplayMode();
		const tmprect = JSG.rectCache.get();
		const visiblerect = this._getLogScreenRect(tmprect);

		JSG.boxCache.release(box);
		graphics._context2D.imageSmoothingEnabled = false;
		this.orgGraphics = graphics;

		graph.setZoom(cs.getZoom());
		this.createGraphCache(cs, visiblerect, graphRect, tileSize, logTileSize);
		if (this.getItem().isDrawEnabled()) {
			format.applyFillToGraphics(graphics, graphRect);
			format.applyLineToGraphics(graphics);
			graphics.fillRect(graphRect);
			if (settings.getOriginVisible() === true) {
				this._drawOrigin(graphics, graphRect);
			}
		}
		this.drawGraphFromCache(graphics, graphRect, logTileSize);
		JSG.rectCache.release(graphRect, tmprect);
	}

	drawTile(graphics, drawRect) {
		const settings = this.getItem().getSettings();

		if (settings.getGridVisible() === true) {
			this._drawGrid(graphics, drawRect);
		}

		if (settings.getOriginVisible() === true) {
			this._drawOrigin(graphics, drawRect);
		}

		if (this._subviews.length > 0) {
			this.drawSubViews(graphics, drawRect);
		}
	}

	drawGraphFromCache(graphics, bounds, logTileSize) {
		const pt = JSG.ptCache.get();
		const clipRect = JSG.rectCache.get();
		const visibleRect = JSG.rectCache.get();
		const screenRect = this.getScreenRect(bounds, JSG.rectCache.get());
		const settings = this.getItem().getSettings();
		const dplMode = settings.getDisplayMode();

		clipRect.setTo(bounds);
		bounds.intersection(screenRect, visibleRect);

		if (useCacheOffset) {
			bounds.x = this._canvasCache._xStart;
			bounds.y = this._canvasCache._yStart;
			bounds.width += logTileSize.x;
			bounds.height += logTileSize.y;
		}

		const numYTiles = this._canvasCache._yCnt;
		const xStart = Math.floor((visibleRect.x - bounds.x) / logTileSize.x);
		const yStart = Math.floor((visibleRect.y - bounds.y) / logTileSize.y);
		const xEnd = Math.ceil((visibleRect.getRight() - bounds.x) / logTileSize.x);
		const yEnd = Math.ceil((visibleRect.getBottom() - bounds.y) / logTileSize.y);
		let cachedCanvas;
		let i;
		let j;

		for (i = xStart; i < xEnd; i += 1) {
			for (j = yStart; j < yEnd; j += 1) {
				cachedCanvas = this._canvasCache.getTile(i * numYTiles + j);
				if (cachedCanvas && cachedCanvas.canvas) {
					graphics.save();
					graphics.setClip(clipRect);
					graphics.drawImage(cachedCanvas.canvas, i * logTileSize.x + bounds.x, j * logTileSize.y + bounds.y);
					graphics.restore();
				}
			}
		}

		this.drawInteraction(graphics, dplMode);

		JSG.ptCache.release(pt);
		JSG.rectCache.release(clipRect, screenRect, visibleRect);
	}

	isTileVisible(visiblerect, tileRect) {
		return visiblerect ? visiblerect.intersect(tileRect) : true;
	}

	createGraphCache(cs, visibleRect, graphRect, tileSize, logTileSize) {
		// create tiled cache for complete graph, each tile is a canvas element
		let tileCnt = 0;

		const rect = JSG.rectCache.get().set(graphRect.x, graphRect.y, logTileSize.x, logTileSize.y);
		let cacheElement;
		let graphicsCache;

		if (useCacheOffset) {
			rect.x = this._canvasCache._offset.x;
			while (rect.x >= graphRect.x) {
				rect.x -= logTileSize.x;
			}
			rect.y = this._canvasCache._offset.y;
			while (rect.y >= graphRect.y) {
				rect.y -= logTileSize.y;
			}
			this._canvasCache._xStart = rect.x;
			this._canvasCache._yStart = rect.y;
		}

		this._canvasCache._xCnt = 0;
		this._canvasCache._yCnt = 0;

		while (rect.x < graphRect.getRight()) {
			this._canvasCache._yCnt = 0;
			while (rect.y < graphRect.getBottom()) {
				// only create tile, if visible
				if (this.isTileVisible(visibleRect, rect)) {
					cacheElement = this._canvasCache.getTile(tileCnt);
					if (cacheElement.redraw) {
						graphicsCache = cacheElement.getGraphics(cs, tileSize);
						graphicsCache.translate(-rect.x, -rect.y);

						this.drawTile(graphicsCache, rect);

						cacheElement.redraw = false;
					}
				}
				rect.y += logTileSize.y;
				tileCnt += 1;
				this._canvasCache._yCnt += 1;
			}
			if (useCacheOffset) {
				rect.y = this._canvasCache._yStart;
			} else {
				rect.y = graphRect.y;
			}
			rect.x += logTileSize.x;
			this._canvasCache._xCnt += 1;
		}
		JSG.rectCache.release(rect);
	}

	getScreenRect(bounds, reuserect) {
		const rect = this._getLogScreenRect(reuserect);
		if (rect !== undefined) {
			return rect;
		}
		reuserect = reuserect || new Rectangle();
		reuserect.setTo(bounds);

		return reuserect;
	}

	/**
	 * Returns a rectangle of currently visible view bounds relative to graphs parent coordinate-system.
	 *
	 * @method getVisibleViewRect
	 * @param {Rectangle} [reuserect] Optional rectangle to reuse. If not given a new one will be created.
	 * @return {Rectangle} The bounds of currently visible view region.
	 */
	getVisibleViewRect(reuserect) {
		const parent = this.getParent();
		const rect = parent ? parent.getVisibleViewRect(reuserect) : undefined;
		return rect || this.getItem().getTotalBoundingRect(undefined, reuserect);
	}

	/**
	 * @method getVisibleGraphRect
	 * @param reuserect
	 * @deprecated Simply use {{#crossLink "GraphView/getVisibleViewRect:method"}}{{/crossLink}} instead.
	 */
	getVisibleGraphRect(reuserect) {
		reuserect = reuserect || new Rectangle();
		return this._getLogScreenRect(reuserect);
	}

	_getLogScreenRect(reuserect) {
		let view = this;
		let viewRect;
		reuserect = reuserect || new Rectangle();
		while (view && !view._hScrollbar) {
			view = view.getParent();
			if (view instanceof ScrollPanel) {
				viewRect = reuserect.setTo(view._bounds);
			}
		}
		if (view && viewRect) {
			const p = view.getScrollPosition(JSG.ptCache.get());
			viewRect.translate(p.x, p.y);
			JSG.ptCache.release(p);
			return viewRect;
		}
		return undefined;
	}

	_getScrollPosition() {
		let view = this;

		while (view && !view._hScrollbar) {
			view = view.getParent();
		}
		if (view) {
			return view.getScrollPosition(JSG.ptCache.get());
		}
		return undefined;
	}

	/**
	 * Draw each currently registered addition view.
	 * @method _drawAdditions
	 * @param graphics
	 * @param {Rectangle} rect Rectangle which defines currently visible <code>Graph</code> area
	 * @private
	 * @since 1.6.44
	 */
	_drawAdditions(graphics, rect) {
		let addition;
		const allAdditions = this._additions;
		let i;
		const n = allAdditions.length;
		const box = JSG.boxCache.get();
		const bounds = JSG.rectCache.get();

		for (i = 0; i < n; i += 1) {
			addition = allAdditions[i];
			addition.getBoundingBox(box).toRectangle(bounds);
			if (bounds.intersect(rect)) {
				addition.draw(graphics);
			}
		}
		JSG.boxCache.release(box);
		JSG.rectCache.release(bounds);
	}

	drawSubViews(graphics, drawRect) {
		let oldZoom;
		const settings = this.getItem().getSettings();
		const scaledDrawRect = JSG.rectCache.get().setTo(drawRect);
		const prevfilter = this.applyFilter(graphics, settings);
		const box = JSG.boxCache.get();

		if (this._item.isClipChildren()) {
			graphics.save();
			// due to se tting clip area...
			this._shapeRenderer.setClipArea(this._item._shape, graphics);
		}

		let subitem;
		let rect = JSG.rectCache.get();
		// let rectSub;

		this._subviews.forEach((subview) => {
			if (subview.isVisible() === true) {
				subitem = subview.getItem();
				rect = subitem.getTotalBoundingRect(undefined, rect);
				if (scaledDrawRect === undefined || scaledDrawRect.intersect(rect)) {
					subview.draw(graphics);
				}
			}
		});

		JSG.rectCache.release(scaledDrawRect, rect);
		JSG.boxCache.release(box);

		if (this._item.isClipChildren()) {
			graphics.restore();
		}
		graphics.filter = prevfilter;
	}

	/**
	 * Applies current filter to given <code>graphics</code>.
	 * @method applyFilter
	 * @param {Graphics} graphics Graphics class to apply a filter to.
	 * @param {GraphSettings} settings Graph settings which provides the filter to use.
	 * @return {Object} The previously used filter or <code>undefined</code>.
	 */
	applyFilter(graphics, settings) {
		const oldfilter = graphics.filter;
		graphics.filter = settings.getFilter();
		return oldfilter;
	}

	/**
	 * Draws registered overlay view.
	 *
	 * @method _drawOverlay
	 * @param {Graphics} graphics Graphics class to use for drawing.
	 * @private
	 * @deprecated Subject to be remove. New way is to use overlays or layers, see corresponding methods like
	 * {{#crossLink "GraphView/getLayer:method"}}{{/crossLink}}.
	 */
	_drawOverlay(graphics) {
		if (this._overlayView) {
			this._overlayView.draw(graphics);
		}
	}

	_drawOrigin(graphics, drawRect) {
		const settings = this.getItem().getSettings();
		const dplMode = settings.getDisplayMode();

		if (dplMode !== GraphSettings.DisplayMode.ENDLESS) {
			return;
		}

		graphics.setLineWidth(50);
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.setLineColor('#BBBBBB');

		graphics.beginPath();
		graphics.moveTo(-400, 0);
		graphics.lineTo(400, 0);
		graphics.moveTo(0, -400);
		graphics.lineTo(0, 400);
		graphics.stroke();

		// graphics.setTextAlignment(TextFormatAttributes.TextAlignment.RIGHT);
		// graphics.setFillColor('#000000');
		// graphics.setFontSize(8);
		// graphics.setFont();
		// graphics.fillText("(0,0)", -200, -200);
		// graphics.setFillColor('#FFFFFF');

		// reset
		graphics.setLineWidth(FormatAttributes.LineStyle.HAIRLINE);
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.setLineColor('#000000');
	}

	/**
	 * Draws a grid on the GraphView background.
	 *
	 * @method _drawGrid
	 * @param {Graphics} graphics Graphics class to use for drawing.
	 * @param {Rectangle} drawRect A rectangle which defines the grid bounds.
	 * @private
	 */
	_drawGrid(graphics, drawRect) {
		const bbox = this._item.getBoundingBox(JSG.boxCache.get());
		const bounds = bbox.toRectangle(JSG.rectCache.get());
		const major = graphics.getCoordinateSystem().getMajorUnit();
		const minor = graphics.getCoordinateSystem().getMinorUnit();

		graphics.setLineWidth(FormatAttributes.LineStyle.HAIRLINE);
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.setLineColor('#CCCCCC');

		let posMin;
		let posX;
		let posY;
		let pos;

		switch (this.getSettings().getGridStyle()) {
			case GraphSettings.GridStyle.GRID:
				graphics.beginPath();
				pos = Math.floor(drawRect.x / major) * major;
				while (pos < drawRect.getRight()) {
					graphics.moveTo(pos, drawRect.y);
					graphics.lineTo(pos, drawRect.getBottom());
					posMin = 0;
					while (posMin < major) {
						posMin += minor;
						graphics.moveTo(pos + posMin, drawRect.y);
						graphics.lineTo(pos + posMin, drawRect.getBottom());
					}
					pos += major;
				}

				pos = Math.floor(drawRect.y / major) * major;

				while (pos < drawRect.getBottom()) {
					graphics.moveTo(drawRect.x, pos);
					graphics.lineTo(drawRect.getRight(), pos);
					posMin = 0;
					while (posMin < major) {
						posMin += minor;
						graphics.moveTo(drawRect.x, pos + posMin);
						graphics.lineTo(drawRect.getRight(), pos + posMin);
					}
					pos += major;
				}
				graphics.stroke();
				break;
			case GraphSettings.GridStyle.CROSSES:
				graphics.beginPath();
				posX = Math.floor(drawRect.x / major) * major;

				while (posX < drawRect.getRight()) {
					posY = Math.floor(drawRect.y / major) * major;
					while (posY < drawRect.getBottom()) {
						graphics.moveTo(posX - 50, posY);
						graphics.lineTo(posX + 50, posY);
						graphics.moveTo(posX, posY - 50);
						graphics.lineTo(posX, posY + 50);
						posY += minor;
					}

					posX += minor;
				}
				graphics.stroke();
				break;
			case GraphSettings.GridStyle.DOTS:
				posX = Math.floor(drawRect.x / major) * major;

				graphics.setFillColor('#777777');

				while (posX < drawRect.getRight()) {
					posY = Math.floor(drawRect.y / major) * major;
					while (posY < drawRect.getBottom()) {
						graphics.drawPixel(posX, posY);
						posY += minor;
					}

					posX += minor;
				}
				break;
		}

		JSG.boxCache.release(bbox);
		JSG.rectCache.release(bounds);
	}

	/**
	 * Draws all registered feedback views.
	 *
	 * @method _drawFeedback
	 * @param {Graphics} graphics Graphics class to use for drawing.
	 * @private
	 */
	_drawFeedback(graphics) {
		this._feedbackViews.forEach((fbView) => {
			if (fbView.layout) {
				fbView.layout();
			}
			fbView.draw(graphics);
		});
	}

	/**
	 * Draws all registered layer views.
	 *
	 * @method _drawLayers
	 * @param {Graphics} graphics Graphics class to use for drawing.
	 * @private
	 */
	_drawLayers(graphics) {
		const drawLayer = (id, layers) => {
			layers.forEach((layer) => {
				layer.draw(graphics);
			});
		};

		this._layerViews.iterate(drawLayer);
	}

	_drawOverlays(graphics) {
		const drawOverlay = (id, overlay) => {
			overlay.forEach((over) => {
				over.draw(graphics);
			});
		};

		this._overlays.iterate(drawOverlay);
	}

	translateFromParent(location) {
		return location;
	}

	translateToParent(location) {
		return location;
	}

	_translateToParent(location) {
		return location;
	}

	/**
	 * Sets the order to use for displaying the layer views.</br>
	 * The parameter is simply an array of layer IDs where the occurrence within the array defines the
	 * order in which the layer views are show. E.g. the last id specifies the layer on top. Layers which are
	 * not covered by this order are simply drawn first in the same order as they were added.</br>
	 * The default order used by this GraphView is: <code>[LayerId.PORTS, LayerId.SELECTION,
	 * LayerId.FRIENDS]</code>.</br> See {{#crossLink "LayerId"}}{{/crossLink}} for predefined layer IDs.
	 *
	 * @method setLayerOrder
	 * @param {Array} order A list of layer IDs or <code>undefined</code> to not apply any order.
	 */
	setLayerOrder(order) {
		this._layerOrder = order;
	}

	/**
	 * Returns the list of views for specified layer. If no layer exists for specified id a new layer array is
	 * created.</br>
	 * To specify an order for the layers use {{#crossLink
	 * "GraphView/setLayerOrder:method"}}{{/crossLink}}.</br>
	 * </br>
	 * The difference between views inside a layer array and views inside an overlay array is that layers are drawn per
	 * page and relative to this <code>GraphView</code> whereas overlay views are drawn on top of this
	 * <code>GraphView</code>, i.e. relative to its parent.<br/> See {{#crossLink "LayerId"}}{{/crossLink}} for
	 * predefined layer IDs.
	 *
	 * @method getLayer
	 * @param {String} layerId The id of the layer to get the views for.
	 * @return {Array} A list of {{#crossLink "View"}}{{/crossLink}}s registered for specified layer.
	 */
	getLayer(layerId) {
		let layer = this._layerViews.get(layerId);
		if (!layer) {
			layer = [];
			this._layerViews.put(layerId, layer);
			this._sort(this._layerViews, this._layerOrder);
		}
		return layer;
	}

	/**
	 * Checks if there is a layer array with given id currently registered.</br>
	 * Note: this method only returns <code>true</code> if a layer array exists for given id and this array
	 * contains at least one view.
	 *
	 * @method hasLayer
	 * @param {String} layerId The id of the layer to check existence of.
	 * @return {Boolean} <code>true</code> if this GraphView has a non empty layer registered with specified id,
	 *     <code>false</code> otherwise.
	 */
	hasLayer(layerId) {
		const layer = this._layerViews.get(layerId);
		return layer !== undefined && layer.length > 0;
	}

	/**
	 * Removes the layer array with specified id and all of its registered views.
	 *
	 * @method clearLayer
	 * @param {String} layerId The id of the layer to remove.
	 * @return {Array} Removed layer array as convenience or <code>undefined</code> if no layer was registered for
	 *     given id.
	 */
	clearLayer(layerId) {
		return this._layerViews.remove(layerId);
	}

	/**
	 * Clears all currently registered layers.
	 *
	 * @method clearAllLayer
	 */
	clearAllLayer() {
		this._layerViews.clear();
	}

	_sort(map, order) {
		function compare(id1, id2) {
			const i1 = order.indexOf(id1);
			const i2 = order.indexOf(id2);
			return i1 - i2;
		}

		if (map && order) {
			map.sort(compare);
		}
	}

	/**
	 * Returns the list of views for specified overlay. If no overlay exists for specified id a new overlay array is
	 * created.</br>
	 * To specify an order for the overlay arrays use {{#crossLink
	 * "GraphView/setOverlayOrder:method"}}{{/crossLink}}.</br>
	 * </br>
	 * The difference between views inside a layer array and views inside an overlay array is that layers are drawn per
	 * page and relative to this <code>GraphView</code> whereas overlay views are drawn on top of this
	 * <code>GraphView</code>, i.e. relative to its parent.
	 *
	 * @method getOverlay
	 * @param {String} id The id of the overlay array to get.
	 * @return {Array} A list of {{#crossLink "View"}}{{/crossLink}}s registered for specified overlay.
	 */
	getOverlay(id) {
		let overlay = this._overlays.get(id);
		if (!overlay) {
			overlay = [];
			this._overlays.put(id, overlay);
			this._sort(this._overlays, this._overlaysOrder); // .sort(compare);
		}
		return overlay;
	}

	/**
	 * Sets the order to use for displaying the overlay views.</br>
	 * The parameter is simply an array of overlay IDs where the occurrence within the array defines the
	 * order in which the overlay arrays are shown. E.g. the last id specifies that views in this overlay are drawn on
	 * top. Overlay arrays which are not covered by this order are simply drawn first in the same order as they were
	 * added.</br> By default, no order is specified.
	 *
	 * @method setOverlayOrder
	 * @param {Array} order A list of overlay IDs or <code>undefined</code> to not apply any order.
	 */
	setOverlayOrder(idArray) {
		this._overlaysOrder = idArray && idArray.length > 0 ? Arrays.addAll([], idArray) : undefined;
	}

	/**
	 * Checks if there is a layer with given id currently registered.</br>
	 * Note: this method only returns <code>true</code> if a layer exists for given id and this layer
	 * contains at least one view.
	 *
	 * @method hasLayer
	 * @param {String} layerId The id of the layer to check existence of.
	 * @return {Boolean} <code>true</code> if this GraphView has a non empty layer registered with specified id,
	 *     <code>false</code> otherwise.
	 */
	hasOverlay(id) {
		const overlay = this._overlays.get(id);
		return overlay && overlay.length > 0;
	}

	/**
	 * Removes the overlay array with specified id and therefore all of its registered views.
	 *
	 * @method clearOverlay
	 * @param {String} id The id of the overlay to remove.
	 * @return {Array} Removed overlay array as convenience or <code>undefined</code> if no overlay was registered for
	 *     given id.
	 */
	clearOverlay(id) {
		return this._overlays.remove(id);
	}

	/**
	 * Clears all currently registered overlay arrays.
	 *
	 * @method clearAllOverlays
	 */
	clearAllOverlays() {
		this._overlays.clear();
	}

	/**
	 * Adds given View to the list of registered feedbacks.
	 *
	 * @method addFeedback
	 * @param {View} view The view to add.
	 */
	addFeedback(view) {
		this._feedbackViews.push(view);
	}

	/**
	 * Checks if there are any feedbacks currently registered.
	 *
	 * @method hasFeedback
	 * @return {Boolean} <code>true</code> if this GraphView has registered feedbacks, <code>false</code> otherwise.
	 */
	hasFeedback() {
		return this._feedbackViews.length !== 0;
	}

	/**
	 * Removes given View from the list of registered feedbacks.
	 *
	 * @method removeFeedback
	 * @param {View} view The view to remove.
	 */
	removeFeedback(view) {
		Arrays.remove(this._feedbackViews, view);
	}

	/**
	 * Removes all currently registered feedbacks.
	 *
	 * @method clearFeedback
	 */
	clearFeedback() {
		this._feedbackViews = [];
	}

	/**
	 * Returns the view used for drawing current selection or <code>undefined</code> if none was registered.<br/>
	 * <b>Note:</b> the framework uses an instance of {{#crossLink
	 * "SelectionView"}}{{/crossLink}} to visualize current selection. To retrieve it, it is
	 * recommended to use {{#crossLink "GraphViewer/getSelectionView:method"}}{{/crossLink}}.
	 *
	 * @method getSelectionView
	 * @return {View} view The current selection view or <code>undefined</code>.
	 * @deprecated The selection view is managed by {{#crossLink "GraphViewer"}}{{/crossLink}}. Therefore
	 *     use
	 * {{#crossLink "GraphViewer/getSelectionView:method"}}{{/crossLink}}.
	 */
	getSelectionView() {
		const layer = this.getLayer(LayerId.SELECTION);
		return layer[0];
	}

	/**
	 * Sets the view to use for drawing and/or marking current selection. This will replace any previous added
	 * selection view.
	 *
	 * @method setSelectionView
	 * @param {View} view The new selection view.
	 * @deprecated The selection view is managed by {{#crossLink "GraphViewer"}}{{/crossLink}}. Therefore
	 *     use
	 * {{#crossLink "GraphViewer/setSelectionView:method"}}{{/crossLink}}.
	 */
	setSelectionView(view) {
		const layer = this.getLayer(LayerId.SELECTION);
		layer[0] = view;
	}

	/**
	 * Clears the selection layer, i.e. the layer with id {{#crossLink "LayerId/SELECTION:property"}}{{/crossLink}}.
	 *
	 * @method removeSelectionView
	 */
	removeSelectionView() {
		this.clearLayer(LayerId.SELECTION);
	}

	/**
	 * Sets the new overlay view to draw.</br>
	 * Note that the overlay view will be drawn after all layer views are drawn.
	 *
	 * @method setOverlayView
	 * @param {View} view The new overlay view.
	 * @deprecated New way is to use overlays or layers, see corresponding methods like
	 * {{#crossLink "GraphView/getLayer:method"}}{{/crossLink}} or {{#crossLink
	 *     "GraphView/getOverlay:method"}}{{/crossLink}}.
	 */
	setOverlayView(view) {
		this.clearFeedback();
		this.removeSelectionView();
		this._overlayView = view;
	}

	/**
	 * Removes current overlay view.
	 *
	 * @method removeOverlayView
	 * @deprecated New way is to use overlays or layers, see corresponding methods like
	 * {{#crossLink "GraphView/getLayer:method"}}{{/crossLink}} or {{#crossLink
	 *     "GraphView/getOverlay:method"}}{{/crossLink}}.
	 */
	removeOverlayView() {
		this._overlayView = undefined;
	}

	getPreferredBounds(recthint, reuserect) {
		return this.getItem().getTotalBoundingRect(undefined, reuserect);
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
		//    this.getItem().setPinPointTo(this._vpOffset);
	}

	setFocus(controller) {
		if (this._focus === undefined || controller === undefined || controller.getModel().getId() !== this._focus.getModel().getId()) {
			let mark = true;
			if (this._focus && controller) {
				const focusS = this._focus.getModel().getItemAttributes().getAttribute('sheetformula');
				const controllerS = controller.getModel().getItemAttributes().getAttribute('sheetformula');
				const focusM = this._focus.getModel() instanceof WorksheetNode;
				const controllerM = controller.getModel() instanceof WorksheetNode;
				if ((focusS && controllerS) || (focusS && controllerM) || (focusM && controllerS)) {
					mark = false;
				}
			}
			if (mark) {
				this.getItem().markDirty();
			}
			this._focus = controller;
		}
	}

	getFocus() {
		return this._focus;
	}
}

export default GraphView;
