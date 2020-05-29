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
/* eslint-disable no-cond-assign */

import {
	default as JSG,
	LineConnection,
	GraphUtils,
	OrthoLineShape,
	Point,
	NotificationCenter
} from '@cedalo/jsg-core';

import GraphController from '../controller/GraphController';
import LayerId from '../view/LayerId';
import SnapFeedbackView from '../view/SnapFeedbackView';

let instance;

/**
 * A helper class which implements a snap feature. This feature is used during interactions like
 * {{#crossLink "MoveInteraction"}}{{/crossLink}} or
 * {{#crossLink "DragDropInteraction"}}{{/crossLink}} to align corresponding feedbacks to other
 * {{#crossLink "GraphItem"}}{{/crossLink}}s. The current align position is visualized by showing a so
 * called snap-line which is created by calling {{#crossLink
 * "SnapHelper/createSnapFeedback:method"}}{{/crossLink}}.<br/> To use this feature either call
 * {{#crossLink "SnapHelper/snapToBBox:method"}}{{/crossLink}} or
 * {{#crossLink "SnapHelper/snapToRect:method"}}{{/crossLink}} to determine the offset required
 * to
 * snap. The returned offset can then be used to update the feedback location or as constraint for further alignment.
 *
 * @example
 *    var snaphelper = SnapHelper.getDefault();
 *    snaphelper.init(viewer);
 *    if(snaphelper.doSnap(event, viewer)) {
 *		var bbox = feedback.getBoundingBox();
 *		var offset = snaphelper.snapToBBox(bbox, undefined, viewer);
 *		bbox.setTopLeft(bbox.getTopLeft().add(offset));
 *		feedback.setBoundingBoxTo(bbox);
 *	  }
 *	  snaphelper.release(viewer);
 *
 * The snap-feature can be customized by subclassing this class to overwrite the methods of interest. To globally
 *     register a customized SnapHelper simply replace {{#crossLink
 *     "SnapHelper/getDefault:method"}}{{/crossLink}} with a function which returns an instance
 *     of the subclass. If a global registration is not wanted a customized SnapHelper can be usually registered
 *     directly to any classes which use a SnapHelper.
 *
 * @class SnapHelper
 * @constructor
 */
class SnapHelper {
	/**
	 * Returns the default <code>SnapHelper</code> implementation.<br/>
	 * Subclasses can simply replace this method to globally register a customized <code>SnapHelper</code>.
	 *
	 * @method getDefault
	 * @return {SnapHelper} The global default <code>SnapHelper</code> to use.
	 */
	static getDefault() {
		SnapHelper._instance =
			SnapHelper._instance || new SnapHelper();
		return SnapHelper._instance;
	}

	constructor() {
		this.snapToVisible = true;
		this._visibleControllers = undefined;
	}

	/**
	 * Should be called before each usage.<br/>
	 * See {{#crossLink "SnapHelper/release:method"}}{{/crossLink}} too.
	 *
	 * @method init
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @since 3.0
	 */
	init(viewer) {
		if (this.snapToVisible) {
			this._viewer = viewer;
			this._setVisibleControllers(viewer);
			NotificationCenter.getInstance().register(this, NotificationCenter.SCROLL_NOTIFICATION, '_onScroll');
		}
	}

	_onScroll() {
		if (this._viewer && this.snapToVisible) {
			this._setVisibleControllers(this._viewer);
		}
	}

	_setVisibleControllers(viewer) {
		const controllers = [];
		SnapHelper.traverseVisibleControllers(viewer, (controller, box) => {
			const traverse = controller.getModel().isVisible();
			if (traverse) {
				controllers.push(controller);
			}
			return traverse;
		});
		this._visibleControllers = controllers;
	}

	/**
	 * Traverses controller hierarchy and calls given callback for each controller which is visible within currently
	 * displayed Graph section.<br/>
	 *
	 * @method traverseVisibleControllers
	 * @param {GraphViewer} viewer The viewer used to display controller hierarchy.
	 * @param {Function} callback A function which is called with a <code>GraphItemController</code> and its
	 * <code>BoundingBox</code> as parameters. It should return <code>false</code> if sub-controllers should not be
	 * traversed. Note: the provided <code>BoundingBox</code> is relative to graph coordinate-system.
	 * @since 3.0
	 */
	static traverseVisibleControllers(viewer, callback) {
		const graph = viewer.getGraph();
		const ctrlbox = JSG.boxCache.get();
		const ctrlrect = JSG.rectCache.get();
		const visiblerect = viewer.getVisibleGraphRect(JSG.rectCache.get());
		viewer.getGraphController().traverse((controller) => {
			const isGraph = controller instanceof GraphController;
			if (!isGraph) {
				const item = controller.getModel();
				item.getTranslatedBoundingBox(graph, ctrlbox).getBoundingRectangle(ctrlrect);
				// traverse even if parent is not in visible rect, a child may is...
				return ctrlrect.intersect(visiblerect) ? callback(controller, ctrlbox) : true;
			}
			return isGraph;
		});
		JSG.boxCache.release(ctrlbox);
		JSG.rectCache.release(ctrlrect, visiblerect);
	}

	/**
	 * Should be called after usage.<br/>
	 * See {{#crossLink "SnapHelper/init:method"}}{{/crossLink}} too.
	 * @method release
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @since 3.0
	 */
	release(/* viewer */) {
		NotificationCenter.getInstance().unregister(this, NotificationCenter.SCROLL_NOTIFICATION);
	}
	/**
	 * Checks if snap feature should be applied.
	 *
	 * @method doSnap
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {Boolean} <code>true</code> if snap feature is active, <code>false</code> otherwise.
	 */
	doSnap(event, viewer) {
		// TODO move outside? since we don't always have selected items, e.g. DragDropInteraction...
		const settings = viewer.getGraphSettings();
		return (
			settings &&
			((settings.getSnapToShapes() && (!event || !event.event.altKey)) ||
				(!settings.getSnapToShapes() && (!event || event.event.altKey)))
		);
	}

	// snapFeedback(feedback, viewer, reusepoint) {
	// 	var offset = reusepoint || new Point(0, 0);
	// 	var fbbox = feedback.getBoundingBox(JSG.boxCache.get());
	// 	var subfb, subfeedbacks = feedback.getSubFeedbacks();
	// 	var lines = [];
	// 	for (var i = 0, n = subfeedbacks.length; i < n; i++) {
	// 		subfb = subfeedbacks[i].getFeedbackItem();
	// 		if (subfb.isVisible() && subfb instanceof LineConnection) {
	// 			lines.push(subfeedbacks[i]);
	// 		}
	// 	}
	// 	this._feedback = feedback;
	// 	this.snapToBBox(fbbox, lines, viewer, offset);
	// 	JSG.boxCache.release(fbbox);
	// 	this._feedback = undefined;
	// 	return offset;
	// };

	/**
	 * Determines the offset required to snap the bounding rectangle of given <code>BoundingBox</code> to any visible
	 * snap-lines. The offset required to align the <code>BoundingBox</code> is returned.<br/>
	 * Note: the <code>fblines</code> parameter is optional and only used if given <code>BoundingBox</code> should
	 * align to an attached edge. Usually the list contains sub-feedbacks of type {{#crossLink
	 * "Feedback"}}{{/crossLink}}.<br/> This method will add any visible snap-line feedbacks, i.e.
	 * {{#crossLink "SnapFeedbackView"}}{{/crossLink}}, to corresponding snap-line layer.
	 *
	 * @method snapToBBox
	 * @param {BoundingBox} bbox The <code>BoundingBox</code> to align.
	 * @param {Array} [fblines] Optional list of {{#crossLink "Feedback"}}{{/crossLink}}s used for
	 *     snap.
	 * @param {ControllerViewer} viewer The currently used ControllerViewer.
	 * @param {Point} [reusepoint] An optional point to reuse for returned offset. If not provided a new
	 *     one will be created.
	 * @return {Point} The align offset.
	 */
	snapToBBox(bbox, fblines, viewer, reusepoint) {
		const rect = bbox.getBoundingRectangle(JSG.rectCache.get());
		const offset = this.snapToRect(rect, fblines, viewer, reusepoint);
		JSG.rectCache.release(rect);
		return offset;
	}

	/**
	 * Determines the offset required to snap given <code>Rectangle</code> to any visible snap-lines. The offset
	 * required to align the <code>Rectangle</code> is returned.<br/> Note: the <code>fblines</code> parameter is
	 * optional and only used if given <code>Rectangle</code> should align to an attached edge. Usually the list
	 * contains sub-feedbacks of type {{#crossLink "Feedback"}}{{/crossLink}}.<br/> This method will
	 * add any visible snap-line feedbacks, i.e. {{#crossLink "SnapFeedbackView"}}{{/crossLink}}, to
	 * corresponding snap-line layer.
	 *
	 * @method snapToRect
	 * @param {Rectangle} rect The <code>Rectangle</code> to align.
	 * @param {Array} [fblines] Optional list of {{#crossLink "Feedback"}}{{/crossLink}}s used for
	 *     snap.
	 * @param {ControllerViewer} viewer The currently used ControllerViewer.
	 * @param {Point} [reusepoint] An optional point to reuse for returned offset. If not provided a new
	 *     one will be created.
	 * @return {Point} The align offset.
	 */
	snapToRect(rect, fblines, viewer, reusepoint) {
		const offset = reusepoint || new Point();
		const layer = viewer.getLayer(LayerId.SNAPLINES);
		const hlines = {};
		const vlines = {};
		let snapline;

		offset.set(0, 0);
		// -1- align to any visible line:
		let edgelines = fblines ? this.getSnapLinesForLines(fblines, viewer) : undefined;
		edgelines = edgelines && edgelines.length ? edgelines : undefined;
		if (edgelines) {
			this.alignToLines(edgelines, offset);
		}
		// -2- align to min hor/ver snap-lines if they define lesser offset
		const lines = this.getSnapLinesForRect(rect, viewer);
		if (lines.vertical.length > 0) {
			snapline = lines.vertical[0];
			let x = this._getOffsetX(snapline, rect);
			// this might removes any edge feedback
			if (!edgelines || Math.abs(x) < Math.abs(offset.x)) {
				edgelines = undefined;
				offset.x = x;
			}
			// align rect:
			rect.x -= offset.x;
			// calc distance to other snap-lines => only display them if distance === 0
			lines.vertical.forEach((line) => {
				x = this._getOffsetX(line, rect);
				if (Math.abs(x) < 1) {
					if (this._addSnapLine(line, vlines[line.pivot], layer)) {
						vlines[line.pivot] = line;
					}
				}
			});
		}
		if (lines.horizontal.length > 0) {
			snapline = lines.horizontal[0];
			let y = this._getOffsetY(snapline, rect);
			// this might removes any edge feedback
			if (!edgelines || Math.abs(y) < Math.abs(offset.y)) {
				edgelines = undefined;
				offset.y = y;
			}
			// align rect:
			rect.y -= offset.y;
			// calc distance to other snap-lines => only display them if distance === 0
			lines.horizontal.forEach((line) => {
				y = this._getOffsetY(line, rect);
				if (Math.abs(y) < 1) {
					if (this._addSnapLine(line, hlines[line.pivot], layer)) {
						hlines[line.pivot] = line;
					}
				}
			});
		}
		if (edgelines) {
			for (let i = 0; i < edgelines.length; i += 1) {
				layer.push(edgelines[i]);
			}
		}
		// multiply by -1 because offsets are usually added and not subtracted...
		return offset.multiply(-1);
	}

	// _isInFeedback(item) {
	// 	var inFeedback = false;
	// 	if (!!this._feedback && !!item) {
	// 		var id = item.getId();
	// 		var feedbacks = this._feedback.getFeedbacks();
	// 		for (var i = 0; i < feedbacks.length && !inFeedback; i++) {
	// 			inFeedback = feedbacks[i].getOriginalItem().getId() === id;
	// 		}
	// 		// console.log("check feedback items...");
	// 	}
	// 	return inFeedback;
	// };
	/**
	 * Adds snap-line to given layer or extends an optional old-line.
	 * Returns <code>true</code> if snap-line was added, <code>false</code> otherwise.
	 *
	 * @method _addSnapLine
	 * @param {SnapFeedbackView} snapline The snap-line to add to given layer.
	 * @param {SnapFeedbackView} [oldline] An optional old snap-line. If specified this line will be
	 *     extended.
	 * @param {Array} layer The layer array to add the snap-line to.
	 * @return {Boolean} <code>true</code> if given snap-line was added, <code>false</code> if old snap-line was
	 *     extended.
	 * @private
	 */
	_addSnapLine(snapline, oldline, layer) {
		let added = false;
		if (oldline) {
			// combine two lines:
			let x = Math.min(
				Math.min(oldline._origin.x, oldline._target.x),
				Math.min(snapline._origin.x, snapline._target.x)
			);
			let y = Math.min(
				Math.min(oldline._origin.y, oldline._target.y),
				Math.min(snapline._origin.y, snapline._target.y)
			);
			oldline._origin.set(x, y);
			x = Math.max(
				Math.max(oldline._origin.x, oldline._target.x),
				Math.max(snapline._origin.x, snapline._target.x)
			);
			y = Math.max(
				Math.max(oldline._origin.y, oldline._target.y),
				Math.max(snapline._origin.y, snapline._target.y)
			);
			oldline._target.set(x, y);
		} else {
			layer.push(snapline);
			added = true;
		}
		return added;
	}

	/**
	 * Returns the offset in X direction to align given <code>Rectangle</code> to given snap-line.
	 *
	 * @method _getOffsetX
	 * @param {SnapFeedbackView} snapline The snap-line which specifies align.
	 * @param {Rectangle} rect The <code>Rectangle</code> to align.
	 * @return {Number} The align offset in X direction.
	 * @private
	 */
	_getOffsetX(snapline, rect) {
		let x = this._getX(snapline.pivot, rect);
		const origin = snapline.getOrigin(JSG.ptCache.get());
		x -= origin.x;
		JSG.ptCache.release(origin);
		return x;
	}

	/**
	 * Returns the X direction of given <code>Rectangle</code> which should be aligned.
	 *
	 * @method _getX
	 * @param {String} pivot The snap anchor which specifies X direction to align.
	 * @param {Rectangle} rect The <code>Rectangle</code> to align.
	 * @return {Number} The X direction of given <code>Rectangle</code> to be aligned.
	 * @private
	 */
	_getX(pivot, rect) {
		let x;
		switch (pivot) {
			case 'l':
				x = rect.x;
				break;
			case 'r':
				x = rect.getRight();
				break;
			case 'cx':
				x = rect.getCenterX();
				break;
		}
		return x;
	}

	/**
	 * Returns the offset in Y direction to align given <code>Rectangle</code> to given snap-line.
	 *
	 * @method _getOffsetY
	 * @param {SnapFeedbackView} snapline The snap-line which specifies align.
	 * @param {Rectangle} rect The <code>Rectangle</code> to align.
	 * @return {Number} The align offset in Y direction.
	 * @private
	 */
	_getOffsetY(snapline, rect) {
		let y = this._getY(snapline.pivot, rect);
		const origin = snapline.getOrigin(JSG.ptCache.get());
		y -= origin.y;
		JSG.ptCache.release(origin);
		return y;
	}

	/**
	 * Returns the Y direction of given <code>Rectangle</code> which should be aligned.
	 *
	 * @method _getY
	 * @param {String} pivot The snap anchor which specifies Y direction to align.
	 * @param {Rectangle} rect The <code>Rectangle</code> to align.
	 * @return {Number} The Y direction of given <code>Rectangle</code> to be aligned.
	 * @private
	 */
	_getY(pivot, rect) {
		let y;
		switch (pivot) {
			case 't':
				y = rect.y;
				break;
			case 'b':
				y = rect.getBottom();
				break;
			case 'cy':
				y = rect.getCenterY();
				break;
		}
		return y;
	}

	/**
	 * Returns a snap-line with minimum snap-distance for given list of sub-feedbacks. The original items of passed
	 * feedbacks must be instances of {{#crossLink "LineConnection"}}{{/crossLink}}.
	 *
	 * @method getSnapLineForLines
	 * @param {Array} lines A list of {{#crossLink "Feedback"}}{{/crossLink}}s used for snap.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {SnapFeedbackView} A snap-line to align to or <code>undefined</code>.
	 * @deprecated Subject to be removed!
	 * Use {{#crossLink "SnapHelper/getSnapLinesForLines:method"}}{{/crossLink}} instead.
	 */
	getSnapLineForLines(lines, viewer) {
		// snap to lines
		let sline;
		let snapline;

		lines.forEach((line) => {
			sline = this.getSnapLineForLine(line, viewer);
			if (sline) {
				snapline = snapline && snapline.dist < sline.dist ? snapline : sline;
			}
		});

		return snapline;
	}

	getSnapLinesForLines(lines, viewer) {
		// snap to lines
		let pivot;
		let sline;
		const snaplines = [];

		lines.forEach((line) => {
			sline = this.getSnapLineForLine(line, viewer);
			if (sline) {
				pivot = pivot && pivot.dist < sline.dist ? pivot : sline;
				snaplines.push(sline);
			}
		});

		return snaplines;
	}

	/**
	 * Returns the offset required to align the source and target point of given snap-line.
	 *
	 * @method alignToLine
	 * @param {SnapFeedbackView} line The snap line to align.
	 * @param {Point} [reusepoint] An optional point to reuse for returned offset. If not provided a new
	 *     one will be created.
	 * @return {Point} The align offset.
	 */
	alignToLine(line, reusepoint) {
		const offset = reusepoint || new Point();
		const lineorigin = line.getOrigin(JSG.ptCache.get());
		const linetarget = line.getTarget(JSG.ptCache.get());
		const pt = line.fbPort.getConnectionPoint(line.fbPort.getParent(), JSG.ptCache.get());
		line.fbPort.getParent().translateToParent(pt);
		offset.setTo(pt).subtract(pt.projectOnLine(lineorigin, linetarget));
		JSG.ptCache.release(lineorigin, linetarget, pt);
		return offset;
	}

	alignToLines(lines, reusepoint) {
		let x;
		let y;
		const offset = reusepoint || new Point();

		lines.forEach((line) => {
			this.alignToLine(line, offset);
			x = x === undefined ? offset.x : Math.abs(x) > Math.abs(offset.x) ? x : offset.x;
			y = y === undefined ? offset.y : Math.abs(y) > Math.abs(offset.y) ? y : offset.y;
		});

		return offset.set(x, y);
	}

	/**
	 * Returns an object which provides vertical and horizontal snap-line feedbacks, i.e. instances of
	 * {{#crossLink "SnapFeedbackView"}}{{/crossLink}}, to which given rectangle should be aligned. That
	 * means the returned object has a <code>horizontal</code> and a <code>vertical</code> property each of type
	 * <code>Array</code>. To create a snap-line feedback
	 * {{#crossLink "SnapHelper/createSnapFeedback:method"}}{{/crossLink}} is called.<br/>
	 * Note: to find a suitable controller to align to a find condition function is used which should be returned by
	 * {{#crossLink "SnapHelper/getSnapControllerCondition:method"}}{{/crossLink}}.
	 *
	 * @method getSnapLinesForRect
	 * @param {Rectangle} rect The rectangle which should be aligned.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {Object} An object with <code>Array</code> properties of snap-line feedbacks to align to.
	 */
	getSnapLinesForRect(rect, viewer) {
		const self = this;
		const snap = viewer.getGraph().getSnapRadius();
		const graph = viewer.getGraph();
		const condition = this.getSnapControllerCondition(viewer);
		const ctrlrbox = JSG.boxCache.get();
		const ctrlrect = JSG.rectCache.get();
		let x;
		let y;
		let line;
		const snaplines = { horizontal: [], vertical: [] };

		const insert = (lline, array, min) => {
			if (min && lline.dist < min.dist) {
				array.unshift(lline);
			} else {
				array.push(lline);
			}
		};

		const setSnapline = (lline, pivot, dist) => {
			const list = pivot === 'l' || pivot === 'cx' || pivot === 'r' ? snaplines.vertical : snaplines.horizontal;
			lline.dist = dist;
			lline.pivot = pivot;
			insert(lline, list, list[0]);
		};

		const setSnaplines = (controller, lrect) => {
			// first check if controller is a suitable snap controller:
			if (condition(controller, lrect)) {
				const item = controller.getModel();
				item.getTranslatedBoundingBox(graph, ctrlrbox);
				ctrlrbox.getBoundingRectangle(ctrlrect);
				// left
				if (
					Math.abs((x = ctrlrect.x) - lrect.x) < snap ||
					Math.abs((x = ctrlrect.getRight()) - lrect.x) < snap
				) {
					line = self._createVerSnapLine(x, ctrlrect, lrect, snap);
					line.snapItem = item;
					setSnapline(line, 'l', Math.abs(x - lrect.x));
				}
				// center x
				x = ctrlrect.getCenterX();
				if (Math.abs(x - lrect.getCenterX()) < snap) {
					//= > extra cases: || (Math.abs(x - lrect.x) < snap) || (Math.abs(x - lrect.getRight()) < snap)) {
					line = self._createVerSnapLine(x, ctrlrect, lrect, snap);
					line.snapItem = item;
					setSnapline(line, 'cx', Math.abs(x - lrect.getCenterX()));
				}
				// right
				if (
					Math.abs((x = ctrlrect.x) - lrect.getRight()) < snap ||
					Math.abs((x = ctrlrect.getRight()) - lrect.getRight()) < snap
				) {
					line = self._createVerSnapLine(x, ctrlrect, lrect, snap);
					line.snapItem = item;
					setSnapline(line, 'r', Math.abs(x - lrect.getRight()));
				}
				// top
				if (
					Math.abs((y = ctrlrect.y) - lrect.y) < snap ||
					Math.abs((y = ctrlrect.getBottom()) - lrect.y) < snap
				) {
					line = self._createHorSnapLine(y, ctrlrect, lrect, snap);
					line.snapItem = item;
					setSnapline(line, 't', Math.abs(y - lrect.y));
				}
				// center y
				y = ctrlrect.getCenterY();
				if (Math.abs(y - lrect.getCenterY()) < snap) {
					//= > extra cases: || (Math.abs(y - lrect.y) < snap) || (Math.abs(y - lrect.getBottom()) < snap)) {
					line = self._createHorSnapLine(y, ctrlrect, lrect, snap);
					line.snapItem = item;
					setSnapline(line, 'cy', Math.abs(y - lrect.getCenterY()));
				}
				// bottom
				if (
					Math.abs((y = ctrlrect.y) - lrect.getBottom()) < snap ||
					Math.abs((y = ctrlrect.getBottom()) - lrect.getBottom()) < snap
				) {
					line = self._createHorSnapLine(y, ctrlrect, lrect, snap);
					line.snapItem = item;
					setSnapline(line, 'b', Math.abs(y - lrect.getBottom()));
				}
			}
		};

		if (this._visibleControllers) {
			this._visibleControllers.forEach((controller) => setSnaplines(controller, rect));
		} else {
			viewer.findControllerByConditionAndBox(rect, setSnaplines);
		}
		JSG.boxCache.release(ctrlrbox);
		JSG.rectCache.release(ctrlrect);

		return snaplines;
	}

	/**
	 * Returns a function which is used as a condition to select a suited controller for the snap feature. The returned
	 * function will be called with a controller and a rectangle as parameters. It should return <code>true</code> if
	 * passed controller is suitable for snap and <code>false</code> otherwise.
	 *
	 * @method getSnapControllerCondition
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {Function} A condition function to use for selecting a suitable snap controller.
	 */
	getSnapControllerCondition(viewer) {
		return this._condition;
	}

	_condition(controller, box) {
		const item = controller.getModel();
		// a valid item must be moveable, selectable, visible and no line...
		let valid = item.isMoveable();
		valid = valid && item.isSelectable();
		// isVisible is checked by isSelectable too!!!
		// valid = valid && item.isVisible();
		valid =
			valid &&
			item
				.getItemAttributes()
				.getSnapTo()
				.getValue();
		valid = valid && !(item instanceof LineConnection);
		return valid;
	}

	/**
	 * Creates a vertical snap-line feedback by calling
	 * {{#crossLink "SnapHelper/createSnapFeedback:method"}}{{/crossLink}}.
	 *
	 * @method _createVerSnapLine
	 * @param {Number} x The location for the vertical snap-line.
	 * @param {Rectangle} trgtrect The target rectangle from which the snap-line starts (or ends).
	 * @param {Rectangle} rect The rectangle at which the snap-line ends (or starts).
	 * @param {Number} snap Distance to add to line.
	 * @return {SelectionFeedbackView} A new vertical snap-line feedback or the given old snap-line.
	 * @private
	 */
	_createVerSnapLine(x, trgtrect, rect, snap) {
		const overlap = snap * 2;
		const y1 = Math.min(trgtrect.y, rect.y);
		const y2 = Math.max(trgtrect.getBottom(), rect.getBottom());
		return this.createSnapFeedback(x, y1 - overlap, x, y2 + overlap);
	}

	/**
	 * Creates a horizontal snap-line feedback by calling
	 * {{#crossLink "SnapHelper/createSnapFeedback:method"}}{{/crossLink}}.
	 *
	 * @method _createHorSnapLine
	 * @param {Number} y The location for the horizontal snap-line.
	 * @param {Rectangle} trgtrect The target rectangle from which the snap-line starts (or ends).
	 * @param {Rectangle} rect The rectangle at which the snap-line ends (or starts).
	 * @param {Number} snap Distance to add to line.
	 * @return {SelectionFeedbackView} A new horizontal snap-line feedback or the given old snap-line.
	 * @private
	 */
	_createHorSnapLine(y, trgtrect, rect, snap) {
		const overlap = snap * 2;
		const x1 = Math.min(trgtrect.x, rect.x);
		const x2 = Math.max(trgtrect.getRight(), rect.getRight());
		return this.createSnapFeedback(x1 - overlap, y, x2 + overlap, y);
	}

	/**
	 * Creates a new snap-line feedback with a default blue color and a line width of 50.
	 *
	 * @method createSnapFeedback
	 * @param {Number} x1 The x coordinate of line start point.
	 * @param {Number} y1 The y coordinate of line start point.
	 * @param {Number} x2 The x coordinate of line end point.
	 * @param {Number} y2 The y coordinate of line end point.
	 * @return {SelectionFeedbackView} A new snap-line feedback.
	 */
	createSnapFeedback(x1, y1, x2, y2) {
		const fb = new SnapFeedbackView();
		fb.setOrigin(x1, y1);
		fb.setTarget(x2, y2);
		return fb;
	}

	/**
	 * Returns a snap-line feedback to which given line feedback should be aligned. The snap-line feedback is created by
	 * calling {{#crossLink "SnapHelper/createSnapFeedback:method"}}{{/crossLink}}.<br/>
	 *
	 * @method getSnapLineForLine
	 * @param {Feedback} line A feedback which represents the line to align.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {SelectionFeedbackView} A snap-line feedback to align to.
	 */
	getSnapLineForLine(line, viewer) {
		let snapline;
		const edge = line.getOriginalItem();
		// for snap we use only attached line:
		if (edge.hasSourceAttached() && edge.hasTargetAttached()) {
			const snap = viewer.getGraph().getSnapRadius();
			let start = JSG.ptCache.get();
			let next = JSG.ptCache.get();
			let end = JSG.ptCache.get();

			line = line.getFeedbackItem();
			// align to source if target node has no id -> feedbacks have no IDs...
			const alignToSource = line.getTargetNode() && !line.getTargetNode().getId();
			end = alignToSource ? line.getEndPoint(end) : line.getStartPoint(end);
			// to align more exactly we have use port location...
			start = alignToSource
				? edge.getSourcePort().getConnectionPoint(edge.getGraph(), start)
				: edge.getTargetPort().getConnectionPoint(edge.getGraph(), start);
			// define next point:
			if (edge.getShape() instanceof OrthoLineShape) {
				next = alignToSource ? edge.getPointAt(1, next) : edge.getPointAt(edge.getPointsCount() - 2, next);
				GraphUtils.translatePointUp(next, edge.getParent(), edge.getGraph());
			} else {
				// determine direction of next:
				next.setTo(end).subtract(start);
				if (Math.abs(next.x) > Math.abs(next.y)) {
					next.set(10, 0);
				} else {
					next.set(0, 10);
				}
				next.add(start);
			}
			const ptdist = end.distanceToLine(start, next);
			if (ptdist < snap) {
				snapline = this.createEdgeSnapLine(start, end.projectOnLine(start, next));
				snapline.dist = ptdist;
				snapline.pivot = 'line';
				snapline.fbPort = alignToSource ? line.getTargetPort() : line.getSourcePort();
			}
			JSG.ptCache.release(start, next, end);
		}
		return snapline;
	}

	createEdgeSnapLine(start, end) {
		const snapline = this.createSnapFeedback(start.x, start.y, end.x, end.y);
		snapline.setLineWidth(50);
		snapline.setLineColor('rgba(0,255,0, 1)');
		return snapline;
	}

	static get _instance() {
		return instance;
	}

	static set _instance(inst) {
		instance = inst;
	}
}

export default SnapHelper;
