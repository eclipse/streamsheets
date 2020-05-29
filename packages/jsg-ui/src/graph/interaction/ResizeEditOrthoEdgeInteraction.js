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
	MathUtils,
	OrthogonalLayout,
	SetLayoutSettingCommand,
	CompoundCommand,
	ItemAttributes,
	GraphUtils,
	Point,
	Port
} from '@cedalo/jsg-core';
import ResizeEditEdgeInteraction from './ResizeEditEdgeInteraction';

/**
 * An interaction to resize and edit, i.e. add new points, orthogonal {{#crossLink
 * "Edge"}}{{/crossLink}}s.
 * @class ResizeEditOrthoEdgeInteraction
 * @extends ResizeEditLineInteraction
 * @constructor
 * @param {ConnectionController} linectrlr The <code>ConnectionController</code> which represents
 * the edge to resize or edit.
 * @param {Marker} activeMarker The currently active marker to use for resize or edit.
 * @since 2.0.7
 */

class ResizeEditOrthoEdgeInteraction extends ResizeEditEdgeInteraction {
	constructor(linectrlr, activeMarker) {
		super(linectrlr, activeMarker);
		this._segend = new Point();
		this._segstart = new Point();
	}

	/**
	 * Inner helper method to receive current layout settings for given edge.
	 * @method _getLayoutSettings
	 * @param {Edge} line The <code>Edge</code> to get the layout settings for.
	 * @return {Settings} The layout settings or <code>undefined</code>.
	 * @private
	 */
	_getLayoutSettings(line) {
		return line.getLayout().getSettings(line);
	}

	_initFeedbackItem(line, event, viewer) {
		// apply layout to set coordinates correctly (e.g. EdgeLayout.DIST_TO_PORT...)
		line.layout();
		const settings = this._getLayoutSettings(line);
		// switch to manual layout of course...
		settings.set(OrthogonalLayout.BEHAVIOR, ItemAttributes.LineBehavior.MANUAL);
		if (this._marker.createNew) {
			let index = this._marker.index;
			const last = line.getPointsCount() - 1;
			const idxpt = JSG.ptCache.get();
			let orthodir = JSG.ptCache.get();
			const location = JSG.ptCache.get().setTo(this.currentLocation);
			const MIN_PORT_SEG_LENGTH = settings.get(OrthogonalLayout.MINPORTSEG, 500);
			const newpoints = [];
			line.getPointAt(index, this._segend);
			line.getPointAt(index - 1, this._segstart);
			location.projectOnLine(this._segstart, this._segend);
			orthodir = MathUtils.getOrthoPointToLine(this._segstart, this._segend, orthodir)
				.normalize()
				.setLength(500);
			idxpt.setTo(location);
			if (index === 1 && line.hasSourceAttached()) {
				idxpt.subtract(this._segstart);
				idxpt.setLength(Math.max(idxpt.length() * 0.5, MIN_PORT_SEG_LENGTH)).add(this._segstart);
			} else if (index === last && line.hasTargetAttached()) {
				index -= 1;
				idxpt.subtract(this._segend);
				idxpt.setLength(Math.max(idxpt.length() * 0.5, MIN_PORT_SEG_LENGTH)).add(this._segend);
			}
			newpoints.push(idxpt.copy());
			newpoints.push(idxpt.add(orthodir).copy());
			line.insertPointsAt(index, newpoints);
			// adjust drag index...
			this._dragIndex = index + newpoints.length - 1;
			JSG.ptCache.release(idxpt, orthodir, location);
		}
	}

	placeFeedback(event, viewer) {
		const line = this.feedback[0].getFeedbackItem();
		const current = this.alignToGrid(this.currentLocation, viewer, event.event.altKey);
		this._alignOrthogonal(current, event, viewer);
		this._limitToPorts(line, current);

		// ignore if we attached to port...
		const edge = this.feedback[0].getFeedbackItem();
		const index = this._dragIndex;
		const last = edge.getPointsCount() - 1;
		const ignore = (index === 0 && edge.hasSourceAttached()) || (index === last && edge.hasTargetAttached());
		if (!ignore) {
			this.feedback[0].setPointAt(index, current);
		}
	}

	_alignOrthogonal(point, event, viewer) {
		super._alignOrthogonal(point, event, viewer);
		if (!event.event.altKey) {
			// have to check against prevprev && nextnext too
			const edge = this.feedback[0].getOriginalItem();
			const graph = edge.getGraph();
			const dragIndex = this._dragIndex;
			const pt = JSG.ptCache.get().setTo(point);
			const last = this.feedback[0].getPointsCount() - 1;
			const prevpt = JSG.ptCache.get();
			const nextpt = JSG.ptCache.get();
			let preprev = dragIndex - 2 >= 0 ? this.feedback[0].getPointAt(dragIndex - 2, prevpt) : undefined;
			let postnext = dragIndex + 2 <= last ? this.feedback[0].getPointAt(dragIndex + 2, nextpt) : undefined;
			preprev = preprev ? GraphUtils.translatePointDown(preprev, graph, edge) : undefined;
			postnext = postnext ? GraphUtils.translatePointDown(postnext, graph, edge) : undefined;
			GraphUtils.translatePointDown(pt, graph, edge);
			if (this._alignPoint(pt, preprev, postnext, graph.getSnapRadius())) {
				GraphUtils.translatePointUp(pt, edge, graph);
				point.setTo(pt);
			}
			JSG.ptCache.release(pt, prevpt, nextpt);
		}
		return point;
	}

	/**
	 * Ensures that given location respects defined distance to ports.
	 * @method _limitToPorts
	 * @param {Edge} line The currently edited edge.
	 * @param {Point} location The location to limit.
	 * @private
	 */
	_limitToPorts(line, location) {
		const settings = this._getLayoutSettings(line);
		const MIN_PORT_SEG_LENGTH = settings.get(OrthogonalLayout.MINPORTSEG, 500);
		const dragidx = this._dragIndex;
		const segend = JSG.ptCache.get();
		const segstart = JSG.ptCache.get();
		if (line.hasSourceAttached() && (dragidx === 1 || dragidx === 2)) {
			line.getPointAt(1, segend);
			line.getPointAt(0, segstart);
			this._limitToSegment(segstart, segend, location, MIN_PORT_SEG_LENGTH);
		}
		const last = line.getPointsCount() - 1;
		if (line.hasTargetAttached() && (dragidx === last - 1 || dragidx === last - 2)) {
			line.getPointAt(last, segstart);
			line.getPointAt(last - 1, segend);
			this._limitToSegment(segstart, segend, location, MIN_PORT_SEG_LENGTH);
		}
		JSG.ptCache.release(segstart, segend);
	}

	_limitToSegment(segstart, segend, location, distance) {
		const dirvec = JSG.ptCache.get();
		const loc = JSG.ptCache
			.get()
			.setTo(location)
			.projectOnLine(segstart, segend);
		location.subtract(loc); // perpendicular vector: loc -> location
		// ensure that loc is between start- & end-point:
		dirvec
			.setTo(segend)
			.subtract(segstart)
			.setLength(distance)
			.add(segstart);
		if (MathUtils.isPointBehind(loc, segstart, dirvec)) {
			loc.setTo(dirvec);
		}
		location.add(loc);
		JSG.ptCache.release(loc, dirvec);
	}

	updateFeedback(event, viewer, offset) {
		super.updateFeedback(event, viewer, offset);
		const edge = this.feedback[0].getFeedbackItem();
		const last = edge.getPointsCount() - 1;
		const port =
			this._dragIndex === 0 ? edge.getSourcePort() : this._dragIndex === last ? edge.getTargetPort() : undefined;

		this._detachFromPort(port, edge);
		if (this._portFeedback) {
			this._attachToPort(this._portFeedback, edge);
		}
	}

	_createPortFromFeedback(portfb) {
		const node = portfb._model;
		const port = new Port();
		const portloc = JSG.ptCache.get().setTo(portfb._location);
		// init port:
		port._parent = node;
		port._isFeedback = true; // only because it exists, but actually not required, because a feedback has no ID!!!
		port._original = node.getPortAtLocation(portloc);
		port.setPinPointTo(portloc);
		JSG.ptCache.release(portloc);
		return port;
	}

	_attachToPort(portfb, edge) {
		const port = this._createPortFromFeedback(portfb);
		const isSrc = this._dragIndex === 0;
		const lineshape = edge.getShape();
		const refreshState = lineshape.disableRefresh();
		edge.pointsCount = edge.getPointsCount();
		if (isSrc) {
			edge.setSourcePort(port);
		} else {
			edge.setTargetPort(port);
		}
		edge.layout(); // getLayout().layoutFrom(edge, port);
		if (refreshState) {
			lineshape.enableRefresh();
		}
		if (!isSrc) {
			this._dragIndex = edge.getShape()._coordinates.length - 1;
		}
	}

	_detachFromPort(port, edge) {
		if (port) {
			edge.pointsCount = edge.pointsCount !== undefined ? edge.pointsCount : edge.getShape()._coordinates.length;
			const index = edge.getSourcePort() === port ? 1 : edge.pointsCount;
			edge.detachPort(port);
			// remove coordinates added by attach...
			if (edge.pointsCount > 0) {
				const diff = edge.getPointsCount() - edge.pointsCount;
				if (diff > 0) {
					const lineshape = edge.getShape();
					lineshape.removeCoordinatesAt(index, diff);
				}
				edge.pointsCount = undefined;
			}
			this._dragIndex = index === 1 ? 0 : edge.getShape()._coordinates.length - 1;
		}
	}

	createCommand(event, viewer) {
		let cmd = super.createCommand(event, viewer);
		if (cmd) {
			// no command indicates some problems, so ignore...
			if (this._changeBehaviour()) {
				const line = this.feedback[0].getOriginalItem();
				const cmds = new CompoundCommand();
				cmds.add(
					new SetLayoutSettingCommand(line, OrthogonalLayout.BEHAVIOR, ItemAttributes.LineBehavior.MANUAL)
				);
				cmds.add(cmd);
				// do nothing after undo/redo...
				cmds.doAfterUndo = () => {};
				cmds.doAfterRedo = () => {};
				cmd = cmds;
			}
		}
		return cmd;
	}

	_changeBehaviour() {
		const fbedge = this.feedback[0].getFeedbackItem();
		const orgedge = this.feedback[0].getOriginalItem();
		const oldBehavior = this._getLayoutSettings(orgedge).get(OrthogonalLayout.BEHAVIOR);
		let change = oldBehavior === ItemAttributes.LineBehavior.AUTO;
		if (change) {
			// we keep AUTO behaviour if we are still attached and dragged start-/endpoint!!
			const last = fbedge.getPointsCount() - 1;
			const dragIndex = this._dragIndex;
			if ((dragIndex === 0 && fbedge.hasSourceAttached()) || (dragIndex === last && fbedge.hasTargetAttached())) {
				change = false;
			}
		}
		return change;
	}
}

export default ResizeEditOrthoEdgeInteraction;
