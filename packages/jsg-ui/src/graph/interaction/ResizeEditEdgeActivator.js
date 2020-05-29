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
import { default as JSG, Coordinate, Arrays, MathUtils, GraphUtils, Shape, OrthoLineShape } from '@cedalo/jsg-core';
import InteractionActivator from './InteractionActivator';
import ResizeEditOrthoEdgeInteraction from './ResizeEditOrthoEdgeInteraction';
import ResizeEditEdgeInteraction from './ResizeEditEdgeInteraction';
import SelectionMarker from '../view/selection/Marker';
import SelectionStyle from '../view/selection/SelectionStyle';
import Styles from '../view/selection/Styles';
import ConnectionController from '../controller/ConnectionController';
import LayerId from '../view/LayerId';

const MARKER_STYLE = new SelectionStyle();
MARKER_STYLE.markerFillColor = 'yellow';

/**
 * Internally used marker subclass.
 *
 * @class ResizeEditEdgeActivator.Marker
 * @extends SelectionMarker
 * @constructor
 * @param {Number} pointIndex The point index to use, e.g. to specify a direction or a line segment.
 * @param {Coordinate} coordinate The location to place the marker at.
 */
class Marker extends SelectionMarker {
	// overwritten to apply different styles...
	draw(graphics, style) {
		// apply style before we draw marker:
		this._applyStyleTo(graphics, this.style);
		super.draw(graphics, style);
	}

	/**
	 * Applies given style object to specified <code>Graphics</code>
	 * @method _applyStyleTo
	 * @param {Graphics} graphics The Graphics instance to use for drawing.
	 * @param {SelectionHandlerFactory} style The styles to use for drawing.
	 * @private
	 */
	_applyStyleTo(graphics, style) {
		// apply styles:
		if (style) {
			const cs = graphics.getCoordinateSystem();
			this.setSize(cs.metricToLogXNoZoom(style.markerSize));
			graphics.setLineStyle(style.lineStyle);
			graphics.setLineWidth(style.lineWidth);
			graphics.setFillStyle(style.fillStyle);
			graphics.setLineColor(style.markerBorderColor);
			graphics.setFillColor(style.markerFillColor);
		}
	}
}

/**
 * An <code>InteractionActivator</code> used to activate a {{#crossLink
 * "ResizeEditEdgeInteraction"}}{{/crossLink}} or an {{#crossLink
 * "ResizeEditOrthoEdgeInteraction"}}{{/crossLink}}.
 *
 * @class ResizeEditEdgeActivator
 * @extends InteractionActivator
 * @constructor
 * @since 2.0.7
 */
class ResizeEditEdgeActivator extends InteractionActivator {
	constructor() {
		super();
		// we use a global marker to handle resize or creation...
		this._activeMarker = new ResizeEditEdgeActivator.Marker(-1, Coordinate.fromXY(0, 0));
		this._activeMarker.style = ResizeEditEdgeActivator.NEW_MARKER_STYLE;
	}

	getKey() {
		return ResizeEditEdgeActivator.KEY;
	}

	dispose(viewer) {
		super.dispose(viewer);
		this.removeHighlight(viewer);
	}

	onMouseDrag(event, viewer, dispatcher) {
		if (this.doHandleDrag(event, viewer, dispatcher)) {
			const linectrlr = this._activeMarker.controller;
			const interaction = this.createInteraction(linectrlr);
			this.activateInteraction(interaction, dispatcher);
			this.removeActiveMarker(viewer);
			event.hasActivated = true;
		}
	}

	doHandleDrag(event, viewer, dispatcher) {
		let handleIt = !this.isDisposed && this._activeMarker.dist !== -1 && !!this._activeMarker.controller;
		handleIt = handleIt && this._ignoreHandle(dispatcher.getActiveHandle());
		if (handleIt) {
			// check against threshold to prevent unwanted point creation or resize...
			const location = JSG.ptCache
				.get()
				.setTo(dispatcher.currentLocation)
				.subtract(dispatcher.startLocation);
			const threshold = viewer
				.getCoordinateSystem()
				.metricToLogXNoZoom(ResizeEditEdgeActivator.THRESHOLD);
			handleIt = location.length() > threshold;
			JSG.ptCache.release(location);
		}
		return handleIt;
	}

	// check if we should ignore currently active handle...
	_ignoreHandle(handle) {
		// currently we simply ignore handle if we have none :) -> for future versions we may check its type:
		// handle.getType()...
		return !handle;
	}

	createInteraction(controller) {
		if (controller.getModel().getShape() instanceof OrthoLineShape) {
			return new ResizeEditOrthoEdgeInteraction(controller, this._activeMarker);
		}
		return new ResizeEditEdgeInteraction(controller, this._activeMarker);
	}

	_hasActivePortHighlight(viewer) {
		if (viewer.hasLayer(LayerId.PORTS)) {
			const views = viewer.getLayer(LayerId.PORTS);
			return views.length === 1 && views[0]._active === true;
		}
		return false;
	}

	onMouseMove(event, viewer, dispatcher) {
		if (this.isDisposed === false) {
			if (this._hasActivePortHighlight(viewer)) {
				return;
			}
			let hlchanged = this.removeHighlight(viewer);
			// create edge is highlighted
			if (!event.isConsumed) {
				hlchanged = this.highlightEdge(event, viewer, dispatcher) || hlchanged;
			}
			event.doRepaint = hlchanged || event.doRepaint;
		}
	}

	/**
	 * Removes any added marker from our used highlight layer.
	 * @method removeHighlight
	 * @param {ControllerViewer} viewer The controller viewer on which the interaction happens.
	 * @return {Boolean} <code>true</code> if at least one highlight was removed, <code>false</code> otherwise.
	 */
	removeHighlight(viewer) {
		this.removeActiveMarker(viewer);
		const layer = viewer ? viewer.clearLayer('resize.edit.line.layer') : undefined;
		return !!layer && layer.length > 0; // any removed layer views?
	}

	/**
	 * Removes only the active marker from our used highlight layer. The active marker indicates where new edge points
	 * should be added.
	 * @method removeActiveHighlight
	 * @param {ControllerViewer} viewer The controller viewer on which the interaction happens.
	 */
	removeActiveMarker(viewer) {
		this._activeMarker.dist = -1;
		this._activeMarker.controller = undefined;
		const layer = viewer ? viewer.getLayer('resize.edit.line.layer') : undefined;
		if (layer) {
			Arrays.remove(layer, this._activeMarker);
		}
	}

	/**
	 * Adds markers to our used highlight layer.
	 * @method addHighlight
	 * @param {ConnectionController} linectrlr The <code>ConnectionController</code> of the edge
	 *     for which markers should be added.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The controller viewer on which the interaction happens.
	 */
	addHighlight(linectrlr, event, viewer) {
		const layer = viewer.getLayer('resize.edit.line.layer');
		const edge = linectrlr.getModel();
		const coordinates = edge.getShape().getCoordinates();
		const last = coordinates.length - 1;
		const graph = edge.getGraph();
		const pospt = JSG.ptCache.get();
		const nextpt = JSG.ptCache.get();
		const mousepos = JSG.ptCache.get().setTo(event.location);
		viewer.translateFromParent(mousepos);
		this._activeMarker.dist = -1;
		this._activeMarker.snap = graph.getSnapRadius();
		this._activeMarker.controller = undefined;
		let i;

		for (i = 0; i < last; i += 1) {
			coordinates[i].toPoint(pospt);
			coordinates[i + 1].toPoint(nextpt);
			GraphUtils.translatePointUp(pospt, edge, graph);
			GraphUtils.translatePointUp(nextpt, edge, graph);
			layer.push(this.createMarker(pospt, ResizeEditEdgeActivator.MARKER_STYLE, i));
			this.placeActiveMarker(mousepos, pospt, nextpt, i);
		}
		// last point:
		coordinates[last].toPoint(pospt);
		GraphUtils.translatePointUp(pospt, edge, graph);
		layer.push(this.createMarker(pospt, ResizeEditEdgeActivator.MARKER_STYLE, last));
		// ports:
		if (ResizeEditEdgeActivator.PORT_MARKER_STYLE.areMarkersVisible) {
			let port;
			if (edge.hasSourceAttached()) {
				port = edge.getSourcePort();
				port.getPinPoint(pospt);
				GraphUtils.translatePointUp(pospt, port.getParent(), graph);
				layer.push(this.createMarker(pospt, ResizeEditEdgeActivator.PORT_MARKER_STYLE));
			}
			if (edge.hasTargetAttached()) {
				port = edge.getTargetPort();
				port.getPinPoint(pospt);
				GraphUtils.translatePointUp(pospt, port.getParent(), graph);
				layer.push(this.createMarker(pospt, ResizeEditEdgeActivator.PORT_MARKER_STYLE));
			}
		}
		// active marker:
		if (this._activeMarker.dist !== -1) {
			this._activeMarker.controller = linectrlr;
			layer.push(this._activeMarker);
		}
		JSG.ptCache.release(pospt, nextpt, mousepos);
	}

	/**
	 * Creates a new marker at given position and with given style.
	 * @method createMarker
	 * @param {Point} pos The position to create marker at.
	 * @param {SelectionHandlerFactory} style The marker style to use.
	 * @param {Number} index The marker index which corresponds to edge point index.
	 * @return {ResizeEditEdgeActivator.Marker} A new marker object.
	 */
	createMarker(pos, style, index) {
		const marker = new ResizeEditEdgeActivator.Marker(index, Coordinate.fromPoint(pos));
		// update style size because of touche device handling...
		style.markerSize = SelectionStyle.MARKER_SIZE;
		marker.style = style;
		return marker;
	}

	/**
	 * Places the active marker at specified position.
	 * @method placeActiveMarker
	 * @param {Point} pos The position to place active marker at.
	 * @param {Point} pt1 Edge segment start point.
	 * @param {Point} pt2 Edge segment end point.
	 * @param {Number} index The marker index which corresponds to edge point index.
	 */
	placeActiveMarker(pos, pt1, pt2, index) {
		// we use markerpt which is closest to line segment...
		const dist = this._activeMarker.dist > -1 ? this._activeMarker.dist : 10000;
		const actdist = MathUtils.getLinePointDistance(pt1, pt2, pos);
		if (actdist < dist) {
			const markerpt = JSG.ptCache.get().setTo(pos);
			markerpt.projectOnLine(pt1, pt2);
			const ptindex = this.getNearestPointIndex(markerpt, pt1, pt2, index);
			if (ptindex === index) {
				markerpt.setTo(pt1);
			} else if (ptindex === index + 1) {
				markerpt.setTo(pt2);
			}
			this._activeMarker.setPositionTo(markerpt);
			this._activeMarker.dist = actdist;
			this._activeMarker.index = ptindex === -1 ? index + 1 : ptindex;
			this._activeMarker.createNew = ptindex === -1;
			JSG.ptCache.release(markerpt);
		}
		// update style size because of touche device handling...
		const style = this._activeMarker.style;
		if (style) {
			style.markerSize = SelectionStyle.MARKER_SIZE;
		}
	}

	/**
	 * Returns the index of point which is nearest to specified position.
	 * @method getNearestPointIndex
	 * @param {Point} pos The position to check against.
	 * @param {Point} pt1 Edge segment start point.
	 * @param {Point} pt2 Edge segment end point.
	 * @param {Number} index The marker index which corresponds to edge point index.
	 * @return {Number} The index of nearest point.
	 */
	getNearestPointIndex(pos, pt1, pt2, index) {
		let ptindex = -1;
		let nextdist;
		let lastdist = -1;
		const snap = this._activeMarker.snap * this._activeMarker.snap;
		const distpt = JSG.ptCache.get();

		nextdist = distpt
			.setTo(pos)
			.subtract(pt1)
			.lengthSquared();
		if (nextdist < snap) {
			lastdist = nextdist;
			ptindex = index;
		}
		nextdist = distpt
			.setTo(pos)
			.subtract(pt2)
			.lengthSquared();
		if (nextdist < snap && (lastdist === -1 || nextdist < lastdist)) {
			ptindex = index + 1;
		}
		JSG.ptCache.release(distpt);
		return ptindex;
	}

	/**
	 * Highlights the <code>Edge</code> under mouse, if one could be found.
	 * @method highlightEdge
	 * @param {ClientEvent} event The current event or <code>undefined</code>.
	 * @param {ControllerViewer} viewer The current ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The <code>InteractionDispatcher</code> to which
	 * this activator is registered.
	 * @return {Boolean} <code>true</code> if an edge was highlighted, <code>false</code> otherwise.
	 */
	highlightEdge(event, viewer, dispatcher) {
		const linectrlr = this._findController(event.location, viewer, dispatcher);
		const highlight = !!linectrlr;
		if (highlight) {
			// draw markers
			this.addHighlight(linectrlr, event, viewer);
		}
		return highlight;
	}

	_findController(location, viewer, dispatcher) {
		// controller must be selectable to signal that it can be edited... alternative might be to use editMask
		// attribute...
		return viewer.filterFoundControllers(
			Shape.FindFlags.AUTOMATIC,
			(controller) =>
				!controller.isSelected() && controller.isSelectable() && controller instanceof ConnectionController
		);
		//
		// const linectrlr = dispatcher.getControllerAt(location, undefined, (controller, llocation) => {
		// 	let valid = false;
		// 	// controller must be selectable to signal that it can be edited... alternative might be to use editMask
		// 	// attribute...
		// 	if (!controller.isSelected() && controller.isSelectable() &&
		// 		controller instanceof ConnectionController) {
		// 		// is selectable:
		// 		if (controller.containsPoint(llocation)) {
		// 			valid = true;
		// 		}
		// 	}
		// 	return valid;
		// });
		//
		// return linectrlr;
	}

	/**
	 * Constant which defines if markers are visible on mouse approach.
	 * @property THRESHOLD
	 * @type {Number}
	 * @static
	 */
	static get THRESHOLD() {
		return 40;
	}
	/**
	 * Default marker style.
	 * @property MARKER_STYLE
	 * @type {SelectionHandlerFactory}
	 * @static
	 */
	static get MARKER_STYLE() {
		return MARKER_STYLE;
	}

	/**
	 * Default style for marker which indicates point add location.
	 * @property NEW_MARKER_STYLE
	 * @type {SelectionHandlerFactory}
	 * @static
	 */
	static get NEW_MARKER_STYLE() {
		return Styles.ADD_POINT_MARKER;
	}
	/**
	 * Default style for port marker.
	 * @property PORT_MARKER_STYLE
	 * @type {SelectionHandlerFactory}
	 * @static
	 */
	static get PORT_MARKER_STYLE() {
		return Styles.PORT_MARKER;
	}

	/**
	 * The unique key under which this activator is registered to {{#crossLink
	 * "GraphInteraction"}}{{/crossLink}}.
	 * @property KEY
	 * @type {String}
	 * @static
	 */
	static get KEY() {
		return 'resize.edit.line.activator';
	}

	static get Marker() {
		return Marker;
	}

}

export default ResizeEditEdgeActivator;
