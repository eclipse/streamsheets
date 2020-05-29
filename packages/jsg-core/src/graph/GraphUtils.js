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
/* global window document */
const JSG = require('../JSG');
const Strings = require('../commons/Strings');
const Point = require('../geometry/Point');
const MetricCoordinateSystem = require('../geometry/MetricCoordinateSystem');
const Path = require('./model/Path');

/**
 * This class provides static helper functions for common graph related tasks.
 *
 * @class GraphUtils
 * @constructor
 */
class GraphUtils {
	/**
	 * Traverses view hierarchy from given view, inclusively, up to specified view, exclusively, and
	 * calls given function on any traversed view as only parameter...
	 *
	 * @static
	 * @method traverseUp
	 * @param {Object} fromView
	 * @param {Object} toView
	 * @param {Object} func
	 */
	static traverseUp(fromView, toView, func) {
		if (fromView && /* toView && */ fromView !== toView) {
			let goOn = true;
			while (goOn && fromView && fromView !== toView) {
				goOn = func(fromView);
				fromView = fromView.getParent();
				goOn = goOn !== undefined ? goOn : true;
			}
		}
	}

	/**
	 * Traverses view hierarchy from given view, exclusive, down to specified view, inclusive, and calls
	 * given function with current traversed view as only parameter
	 *
	 * @static
	 * @method traverseDown
	 * @param {Object} fromView
	 * @param {Object} toView
	 * @param {Object} func
	 */
	static traverseDown(fromView, toView, func) {
		if (fromView && toView && fromView !== toView) {
			const views = [];
			let goOn;
			let i;

			while (toView && toView !== fromView) {
				views.push(toView);
				toView = toView._parent;
			}
			goOn = true;

			for (i = views.length - 1; goOn && i >= 0; i -= 1) {
				goOn = func(views[i]);
				goOn = goOn !== undefined ? goOn : true;
			}
		}
	}

	/**
	 * Traverses item hierarchy from given item, inclusively, up to an optional specified item, exclusively, and
	 * calls given function at each traversed <code>GraphItem</code>. The visited item is passed as parameter to the
	 * function which should return <code>false</code> to stop traversal or <code>undefined</code> or <code>true</code>
	 * to go on.
	 *
	 * @method traverseItemUp
	 * @param {GraphItem} fromItem <code>GraphItem</code> to start traversal at.
	 * @param {GraphItem} [toItem] An optional <code>GraphItem</code> to stop traversal at.
	 * @param {Object} [func] The function object to call at each <code>GraphItem</code>. The visited item is passed as
	 *     parameter.
	 * @static
	 */
	static traverseItemUp(fromItem, toItem, func) {
		let goOn = true;
		const stopItem = toItem && toItem.getParent ? toItem : undefined;
		const callback = func || (!stopItem ? toItem : undefined);

		while (goOn && fromItem && fromItem !== stopItem) {
			goOn = callback ? callback(fromItem) : true;
			fromItem = fromItem.getParent();
			goOn = goOn !== undefined ? goOn : true; // check return parameter if passed...
		}
	}

	/**
	 * Traverses item hierarchy from given item, exclusive, down to specified item, inclusive, and calls
	 * given function with current traversed item as only parameter
	 *
	 * @static
	 * @method traverseItemDown
	 * @param {Object} fromItem
	 * @param {Object} toItem
	 * @param {Object} func
	 */
	static traverseItemDown(fromItem, toItem, func) {
		const items = [];
		let goOn;
		let i;

		while (toItem !== undefined && toItem !== fromItem) {
			items.push(toItem);
			toItem = toItem._parent;
		}
		goOn = true;
		for (i = items.length - 1; goOn && i >= 0; i -= 1) {
			goOn = func(items[i]);
			goOn = goOn !== undefined ? goOn : true;
		}
	}

	/**
	 * Traverses item hierarchy from given item and calls the provided function on each
	 * visited sub-item.
	 *
	 * @static
	 * @method traverseItem
	 * @param {GraphItem} item The item to start traversal at.
	 * @param {Function} func The function to call for each visited item.
	 * @param {Boolean} include Include given item or not.
	 */
	static traverseItem(item, func, include = true) {
		if (item) {
			if (include) {
				func.call(this, item);
			}
			item.getItems().forEach((litem) => {
				GraphUtils.traverseItem(litem, func);
			});
		}
	}

	/**
	 * @static
	 * @method translatePointUp
	 * @param {Point} point the point to translate
	 * @param {GraphItem} fromItem the item to start translation at (inclusively)
	 * @param {GraphItem} toItem the item to stop translation at (exclusively)
	 * @return {Point} The passed and now translated point as convenience.
	 */
	static translatePointUp(point, fromItem, toItem) {
		GraphUtils.traverseItemUp(fromItem, toItem, (item) => {
			item.translateToParent(point);
		});
		return point;
	}

	/**
	 * @static
	 * @method translatePointDown
	 * @param {Point} point the point to translate
	 * @param {GraphItem} fromItem the item to start translation at (exclusively)
	 * @param {GraphItem} toItem the item to stop translation at (inclusively)
	 * @return {Point} The passed and now translated point as convenience.
	 */
	static translatePointDown(point, fromItem, toItem) {
		GraphUtils.traverseItemDown(fromItem, toItem, (item) => {
			item.translateFromParent(point);
		});
		return point;
	}

	/**
	 * Translates given BoundingBox from given item (inclusively) up to specified parent item (exclusively).
	 *
	 * @method translateBoundingBoxUp
	 * @param {BoundingBox} bbox The BoundingBox to translate.
	 * @param {GraphItem} fromItem The item to start translation at (inclusively).
	 * @param {GraphItem} toItem The item to stop translation at (exclusively).
	 * @return {BoundingBox} The passed and now translated bbox as convenience.
	 * @static
	 */
	static translateBoundingBoxUp(bbox, fromItem, toItem) {
		GraphUtils.traverseItemUp(fromItem, toItem, (item) => {
			item.translateBoundingBoxToParent(bbox);
		});
		return bbox;
	}

	/**
	 * Translates given BoundingBox from given item (exclusively) down to specified sub item (inclusively).
	 *
	 * @method translateBoundingBoxDown
	 * @param {BoundingBox} bbox The BoundingBox to translate.
	 * @param {GraphItem} fromItem The item to start translation at (exclusively).
	 * @param {GraphItem} toItem The item to stop translation at (inclusively).
	 * @return {BoundingBox} The passed and now translated bbox as convenience.
	 * @static
	 */
	static translateBoundingBoxDown(bbox, fromItem, toItem) {
		GraphUtils.traverseItemDown(fromItem, toItem, (item) => {
			item.translateBoundingBoxFromParent(bbox);
		});
		return bbox;
	}

	/**
	 * Traverses the graph hierarchy starting at given item up to graph. If item is not within graph,
	 * undefined is returned
	 * @static
	 * @method getGraph
	 * @param {GraphItem} item
	 * @return {Graph}
	static getGraph(item) {
		let parent = item.getParent();
		while (
			parent !== undefined &&
			!(parent instanceof Graph)
		) {
			parent = parent.getParent();
		}
		return parent;
	}
	 */

	/**
	 * Traverses the hierarchy of given controller up to its {{#crossLink
	 * "GraphController"}}{{/crossLink}} and returns the first {{#crossLink
	 * "GroupController"}}{{/crossLink}} which is found. If no group is within the controller
	 * hierarchy <code>undefined</code> is returned.
	 *
	 * @method getGroupController
	 * @param {ModelController} controller The controller check its hierarchy.
	 * @return {GroupController} The first <code>GroupController</code> found within controller
	 *     hierarchy or <code>undefined</code>.
	 * @static
	 * @since 1.6.18
	 */
	static getGroupController(controller) {
		return controller
			? JSG.isGroup(controller.getModel())
				? controller
				: this.getGroupController(controller.getParent())
			: undefined;
	}

	/**
	 * Tries to find the common parent GraphItem of given item1 and item2. <br/>
	 * If no parent could be found undefined is returned. Note: since one item could be the parent of
	 * the other item, it is possible that the common parent is one of given items itself.
	 *
	 * @static
	 * @method findCommonParent
	 * @param {GraphItem} item1
	 * @param {GraphItem} item2
	 * @param {Graph} [graph] Optional Graph instance to look up common parent. If not given either
	 *     item1 or item2 must be added to a Graph instance already!
	 * @return {GraphItem} The common parent of given items or <code>undefined</code> in none could be
	 *     found.
	 */
	static findCommonParent(item1, item2, graph) {
		function pathOf(item) {
			return item !== undefined ? item.createPath() : undefined;
		}

		const path1 = pathOf(item1);
		const path2 = pathOf(item2);
		const parentPath = Path.getCommonPrefix(path1, path2);

		graph = graph || item1.getGraph() || item2.getGraph();
		return graph.findItemByPath(parentPath);
	}

	/**
	 * Returns the font metrics for the given TextFormat.</br>
	 * This either returns a previously cached font metrics or calculates a new one if cache was invalidated or the
	 * font definition is new.
	 *
	 * @static
	 * @method getFontMetrics
	 * @return {metrics} An object with the member 'height'.
	 */
	static getFontMetrics(textformat) {
		return this.getFontMetricsEx(
			textformat.getFontName().getValue(),
			textformat.getFontSize().getValue()
		);
	}

	static getFontMetricsEx(fontname, fontsize) {
		const font = `${fontsize}pt ${fontname}`;
		let metrics;

		if (JSG.fontMetricsCache.contains(font)) {
			metrics = JSG.fontMetricsCache.get(font);
			if (metrics !== undefined) {
				return metrics;
			}
		}

		function objOff(obj) {
			let currleft = 0;
			let currtop = 0;
			if (obj.offsetParent) {
				do {
					currleft += obj.offsetLeft;
					currtop += obj.offsetTop;
					obj = obj.offsetParent;
				} while (obj);
			} else {
				currleft += obj.offsetLeft;
				currtop += obj.offsetTop;
			}
			return [currleft, currtop];
		}

		function getFontMetric(fontName, fontSize) {
			const text = document.createElement('span');
			text.style.lineHeight = 1.2;
			text.style.cssFloat = 'none';
			text.style.whiteSpace = 'nowrap';
			text.innerHTML = 'AÄBCjgq|';

			// if you will use some weird fonts, like handwriting or symbols, then you need to edit this test string
			// for chars that will have most extreme accend/descend values

			const block = document.createElement('div');
			block.style.display = 'inline-block';
			block.style.width = '1px';
			block.style.height = '0px';

			const div = document.createElement('div');
			div.appendChild(text);
			div.appendChild(block);

			// this test div must be visible otherwise offsetLeft/offsetTop will return 0
			// but still let's try to avoid any potential glitches in various browsers
			// by making it's height 0px, and overflow hidden
			div.style.height = '0px';
			div.style.overflow = 'hidden';
			div.style.left = '0px';
			div.style.top = '0px';
			div.style.position = 'absolute';
			div.style.fontFamily = fontName;
			div.style.fontSize = `${fontSize}pt`;

			document.body.appendChild(div);

			block.style.verticalAlign = 'baseline';
			let bp = objOff(block);
			let tp = objOff(text);
			const ascent = bp[1] - tp[1];
			block.style.verticalAlign = 'bottom';
			bp = objOff(block);
			tp = objOff(text);
			const height = bp[1] - tp[1];
			const descent = height - ascent;

			document.body.removeChild(div);

			// return text accent, descent and total height and line height
			return { baseline: ascent, height, descent, lineheight: bp[1] };
		}

		const cs = new MetricCoordinateSystem();

		metrics = getFontMetric(fontname, fontsize);

		metrics.baselinePx = metrics.baseline;
		metrics.baseline = cs.deviceToLogYNoZoom(metrics.baseline);
		metrics.heightPx = metrics.height;
		metrics.height = cs.deviceToLogYNoZoom(metrics.height);
		metrics.lineheightPx = metrics.lineheight;
		metrics.lineheight = cs.deviceToLogYNoZoom(metrics.lineheight);
		metrics.descentPx = metrics.descent;
		metrics.descent = cs.deviceToLogYNoZoom(metrics.descent);

		JSG.fontMetricsCache.put(font, metrics);

		return metrics;
	}

	/**
	 * Calculates the center position of the currently visible graph region.
	 *
	 * @method getVisibleCenter
	 * @param {GraphEditor} editor The editor which displays the graph.
	 * @param {Point} [reusepoint] An optional point to reuse, if not supplied a new point will be created.
	 * @return {Point} The center position of currently visible graph region.
	 * @static
	 * @since 1.6.0
	 */
	static getVisibleCenter(editor, reusepoint) {
		const center = reusepoint || new Point();
		const rect = editor.getVisibleViewRect(JSG.rectCache.get());
		rect.getCenter(center);
		JSG.rectCache.release(rect);
		return center;
	}

	/**
	 * Returns a color string from given red, green and blue values.
	 *
	 * @method colorFromRGB
	 * @param {Number} red A red color value.
	 * @param {Number} green A green color value.
	 * @param {Number} blue A blue color value.
	 * @return {String} The resulting color string.
	 * @static
	 */
	static colorFromRGB(red, green, blue) {
		return `#${((1 << 24) + (red << 16) + (green << 8) + blue)
			.toString(16)
			.slice(1, 7)}`;
	}

	/**
	 * Returns a rgb color string from given hex color string.
	 *
	 * @method colorToRGB
	 * @param {String} color A hex color definition. Might start with <code>#</code>.
	 * @return {String} The corresponding <code>rgb()</code> color string.
	 * @static
	 * @since 1.6.0
	 */
	static colorToRGB(color) {
		color = Strings.cut(color, '#');
		// cut off a leading #
		color = parseInt(color, 16);
		const r = color >> 16;
		const g = (color >> 8) & 0xff;
		const b = color & 0xff;
		return `rgb(${r},${g},${b})`;
	}

	static colorToRGBObject(color) {
		color = Strings.cut(color, '#');
		// cut off a leading #
		color = parseInt(color, 16);
		const r = color >> 16;
		const g = (color >> 8) & 0xff;
		const b = color & 0xff;

		return { red: r, green: g, blue: b };
	}

	/**
	 * Applies an alpha value to given rgb or hex color string. A passed hex color strings should start with
	 * <code>#</code> and analog a passed rgb color string should start with <code>rgb</code>.<br/> Note: the result
	 * will be either a rgba color string or the given color if aplha could not be applied.
	 *
	 * @method applyAlphaToColor
	 * @param {String} color A hex or rgb color definition to apply the alpha value to.
	 * @param {Number} alpha The alpha value to apply, must be between 0 and 1.
	 * @return {String} The corresponding <code>rgba()</code> color string.
	 * @static
	 * @since 1.6.0
	 */
	static applyAlphaToColor(color, alpha) {
		color = Strings.startsWith(color, '#')
			? GraphUtils.colorToRGB(color)
			: color;
		if (Strings.startsWith(color, 'rgb(')) {
			let rgb = Strings.cut(color, 'rgb');
			rgb = Strings.cut(rgb, undefined, ')');
			return `rgba${rgb},${alpha})`;
		}
		return color;
	}

	static createDummyPortFrom(portNode, portLocation) {
		return {
			getParent() {
				return portNode;
			},
			getConnectionPoint(parent, reusepoint) {
				parent = parent !== undefined ? parent : this.getParent();
				return GraphUtils.translatePointUp(
					portLocation.copy(),
					this.getParent(),
					parent
				);
			}
		};
	}
	/**
	 * Traverses given <code>View</code> (inclusive) and calls specified callback function for each. Traversal is
	 * stopped immediately if provided callback returns <code>true</code>.
	 * @method traverse
	 * @param {View} view The <code>View</code> to traverse.
	 * @param {Function} callback A function to call for each visited <code>View</code>. Should return
	 *     <code>true</code>
	 * to stop traversal.
	 * @static
	 * @since 2.0.4
	 * @deprecated DON'T USE!! SUBJECT TO CHANGE!!
	 */
	static traverse(view, callback, stop) {
		if (!stop) {
			stop = callback(view);
			const subviews = view.getSubviews();
			let i;
			const n = subviews.length;
			for (i = 0; !stop && i < n; i += 1) {
				stop = GraphUtils.traverse(subviews[i], callback, stop);
			}
		}
		return stop;
	}

	/**
	 * Translates the bounding box coordinates of the given GraphItem to canvas
	 * coordinates
	 *
	 * @method translateToCanvasRect
	 * @param {GraphEditor} editor Editor, that contains the item.
	 * @param {GraphItem} item Item to retrieve coordinates for.
	 * @return Rectangle Pixel position of GraphItem relative to canvas element.
	 * @static
	 * @since 2.1.0.1
	 */
	static translateToCanvasRect(editor, item) {
		const viewer = editor.getGraphViewer();
		const scrollPanel = viewer.getScrollPanel();
		const scrollPos = scrollPanel.getScrollPosition(JSG.ptCache.get());
		const graph = item.getGraph();
		const settings = graph.getSettings();
		const cs = editor.getCoordinateSystem();
		const rect = item
			.getTranslatedBoundingBox(graph)
			.getBoundingRectangle();

		rect.x = cs.logToDeviceX(rect.x - scrollPos.x);
		rect.y = cs.logToDeviceX(rect.y - scrollPos.y);
		rect.width = cs.logToDeviceX(rect.width);
		rect.height = cs.logToDeviceX(rect.height);

		if (settings.getScaleVisible()) {
			rect.x += cs.logToDeviceXNoZoom(750);
			rect.y += cs.logToDeviceYNoZoom(750);
		}

		JSG.ptCache.release(scrollPos);

		return rect;
	}

	/**
	 * Scrolls the view to make the given item visible.
	 *
	 * @method scrollItemIntoView
	 * @param {GraphEditor} editor Editor, that contains the item.
	 * @param {GraphItem} item Item to make visible.
	 * @static
	 * @since 2.1.0.1
	 */
	static scrollItemIntoView(editor, item) {
		const viewer = editor.getGraphViewer();
		const scrollPanel = viewer.getScrollPanel();
		const scrollPos = scrollPanel.getScrollPosition(JSG.ptCache.get());
		const graph = item.getGraph();
		const box = item.getTranslatedBoundingBox(graph);
		const tl = box.getTopLeft();
		const br = box.getBottomRight();
		const visibleRect = scrollPanel.getVisibleViewRect(JSG.rectCache.get());

		tl.x -= 1000;
		tl.y -= 1000;
		br.x += 1000;
		br.y += 1000;

		let scroll = false;

		if (tl.x < scrollPos.x) {
			scrollPos.x = tl.x;
			scroll = true;
		}
		if (tl.y < scrollPos.y) {
			scrollPos.y = tl.y;
			scroll = true;
		}
		if (br.x > scrollPos.x + visibleRect.width) {
			scrollPos.x = br.x - visibleRect.width;
			scroll = true;
		}
		if (br.y > scrollPos.y + visibleRect.height) {
			scrollPos.y = br.y - visibleRect.height;
			scroll = true;
		}

		if (scroll) {
			scrollPanel.setScrollPosition(scrollPos.x, scrollPos.y);
			editor.invalidate();
		}

		JSG.ptCache.release(scrollPos);
		JSG.rectCache.release(visibleRect);
	}
}

module.exports = GraphUtils;
