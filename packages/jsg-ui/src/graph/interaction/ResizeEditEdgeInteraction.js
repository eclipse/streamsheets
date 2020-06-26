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
	Arrays,
	AttachCommand,
	DetachCommand,
	CompoundCommand,
	AddPortCommand,
	ChangeParentCommand,
	SetLinePointAtCommand,
	SetLineShapePointsCommand,
	RotateItemCommand,
	Point,
	Port,
	MathUtils,
	GraphUtils,
	default as JSG
} from '@cedalo/jsg-core';
import InteractionUtils from './InteractionUtils';
import AbstractInteraction from './AbstractInteraction';
import LayerId from '../view/LayerId';
import PositionFeedbackView from '../view/PositionFeedbackView';

/**
 * An interaction to resize and edit, i.e. add new points, {{#crossLink "Edge"}}{{/crossLink}}s.
 * @class ResizeEditEdgeInteraction
 * @extends AbstractInteraction
 * @constructor
 * @param {ConnectionController} linectrlr The <code>ConnectionController</code> which represents
 * the edge to resize or edit.
 * @param {Marker} activeMarker The currently active marker to use for resize or edit.
 * @since 2.0.7
 */
class ResizeEditEdgeInteraction extends AbstractInteraction {
	constructor(linectrlr, activeMarker) {
		super();
		this._marker = activeMarker;
		this._linectrlr = linectrlr;
		this._dragIndex = activeMarker.index;
	}

	activate(viewer) {
		super.activate(viewer);
		viewer.clearSelection();
	}

	doShowPortHighlights() {
		return true;
	}

	_setFeedback(event, viewer) {
		if (this.feedback.length === 0) {
			const feedback = this._linectrlr.createFeedback();
			this._initFeedbackItem(feedback.getFeedbackItem());
			this.feedback.push(feedback);
			viewer.addInteractionFeedback(feedback);
		}
	}

	/**
	 * Initializes the interaction feedback.
	 * @method _initFeedbackItem
	 * @param {Edge} line The feedback object
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The controller viewer on which the interaction happens.
	 * @private
	 */
	_initFeedbackItem(line, event, viewer) {
		if (this._marker.createNew) {
			// insert a new coordinate... -> no need to adjust dragIndex here...
			line.insertPointsAt(this._marker.index, new Point(0, 0));
		}
	}

	createActionFeedback(event, viewer) {
		const feedback = new PositionFeedbackView();
		const loc = event.location.copy();

		viewer.translateFromParent(loc);
		feedback.setPosition(loc);
		return feedback;
	}

	updateActionFeedback(event, viewer) {
		// console.log("update action feedback...");
		if (this.actionFeedback) {
			const loc = event.location.copy();
			viewer.translateFromParent(loc);
			this.actionFeedback.setPosition(loc);
		}
	}

	updateFeedback(event, viewer, offset) {
		this.placeFeedback(event, viewer);
		this._portFeedback = this.showPossiblePortAt(event, viewer);
		event.doRepaint = true;
	}

	/**
	 * Places the interaction feedback. Called on {{#crossLink
	 * "ResizeEditEdgeInteraction/updateFeedback:method"}}{{/crossLink}}.
	 * @method placeFeedback
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The controller viewer on which the interaction happens.
	 */
	placeFeedback(event, viewer) {
		const current = this.alignToGrid(this.currentLocation, viewer, event.event.altKey);
		this._alignOrthogonal(current, event, viewer);
		this.feedback[0].setPointAt(this._dragIndex, current);
	}

	/**
	 * Aligns given point orthogonal to its neighbours. Note: no new point is created!
	 * @method _alignOrthogonal
	 * @param {Point} point The point to align.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The controller viewer on which the interaction happens.
	 * @return {Point} The aligned point for convenience.
	 */
	_alignOrthogonal(point, event, viewer) {
		if (!event.event.altKey) {
			const edge = this.feedback[0].getOriginalItem();
			const graph = edge.getGraph();
			const pt = JSG.ptCache.get().setTo(point);
			const prevpt = JSG.ptCache.get();
			const nextpt = JSG.ptCache.get();
			const dragIndex = this._dragIndex;
			let prev = dragIndex > 0 ? this.feedback[0].getPointAt(dragIndex - 1, prevpt) : undefined;
			let next =
				dragIndex < this.feedback[0].getPointsCount() - 1
					? this.feedback[0].getPointAt(dragIndex + 1, nextpt)
					: undefined;
			GraphUtils.translatePointDown(pt, graph, edge);
			prev = prev ? GraphUtils.translatePointDown(prev, graph, edge) : undefined;
			next = next ? GraphUtils.translatePointDown(next, graph, edge) : undefined;
			if (this._alignPoint(pt, prev, next, graph.getSnapRadius())) {
				GraphUtils.translatePointUp(pt, edge, graph);
				point.setTo(pt);
			}
			JSG.ptCache.release(pt, prevpt, nextpt);
		}
		return point;
	}

	_alignPoint(pt, prev, next, snap) {
		let aligned = false;
		const xprev = prev ? Math.abs(prev.x - pt.x) : snap + 100;
		const yprev = prev ? Math.abs(prev.y - pt.y) : snap + 100;
		const xnext = next ? Math.abs(next.x - pt.x) : snap + 100;
		const ynext = next ? Math.abs(next.y - pt.y) : snap + 100;
		if (xprev < snap) {
			pt.x = prev.x;
			aligned = true;
		}
		if (xnext < snap) {
			pt.x = xnext < xprev ? next.x : pt.x;
			aligned = true;
		}
		if (yprev < snap) {
			pt.y = prev.y;
			aligned = true;
		}
		if (ynext < snap) {
			pt.y = ynext < yprev ? next.y : pt.y;
			aligned = true;
		}
		return aligned;
	}

	/**
	 * Adds visual feedbacks for any possible {{#crossLink "Port"}}{{/crossLink}}s this
	 * {{#crossLink "Edge"}}{{/crossLink}} can attach to.<br/>
	 * The visual feedbacks are added to the {{#crossLink "LayerId/PORTS:property"}}{{/crossLink}}
	 * layer. If an attach is possible the corresponding port feedback view is returned.
	 *
	 * @method showPossiblePortAt
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {PositionFeedbackView} The feedback view of the port to which the edge might connect.
	 */
	showPossiblePortAt(event, viewer) {
		let portfb;
		const dragIndex = this._dragIndex;
		const last = this.feedback[0].getPointsCount() - 1;

		if (dragIndex === 0 || dragIndex === last) {
			viewer.clearLayer(LayerId.PORTS);
			const controller = InteractionUtils.getPortsController(event, viewer);
			if (controller) {
				const ports = InteractionUtils.getPortsFor(controller, this, event.event.altKey);
				const portLayer = viewer.getLayer(LayerId.PORTS);
				Arrays.addAll(portLayer, ports);
				if (ports.length === 1) {
					portfb = ports[0];
				}
			}
		}
		return portfb;
	}

	willFinish(event, viewer, offset) {
		let cmd;
		const interactionHandler = this.getInteractionHandler();

		// eslint-disable-next-line no-cond-assign
		if (interactionHandler && (cmd = this.createCommand(event, viewer))) {
			interactionHandler.execute(cmd, this.executed);
		}
	}

	/**
	 * Creates the command to resize or edit current {{#crossLink "Edge"}}{{/crossLink}}.</br>
	 * Note: this might create an attach or detach command instead. See
	 * {{#crossLink "ResizeEditEdgeInteraction/createAttachCommand:method"}}{{/crossLink}} and
	 * {{#crossLink "ResizeEditEdgeInteraction/createDetachCommand:method"}}{{/crossLink}} too.
	 *
	 * @method createCommand
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {Command} A command to be executed or <code>undefined</code>
	 */
	createCommand(event, viewer) {
		const cmd = this._doCreateCommand(event, viewer);
		if (cmd) {
			// do nothing after undo/redo...
			cmd.doAfterUndo = () => {};
			cmd.doAfterRedo = () => {};
		}
		return cmd;
	}

	/**
	 * Actually creates the command to resize or edit current {{#crossLink "Edge"}}{{/crossLink}}.</br>
	 * @method _doCreateCommand
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {Command} A command to be executed or <code>undefined</code>
	 * @private
	 */
	_doCreateCommand(event, viewer) {
		const dragIndex = this._dragIndex;
		const feedback = this.feedback[0];

		if (feedback) {
			const line = feedback.getOriginalItem();
			const last = feedback.getPointsCount() - 1;
			// if hit any port
			if (this._portFeedback !== undefined) {
				this._target = {};
				this._target.node = this._portFeedback._model;
				this._target.port = this._portFeedback._model.getPortAtLocation(this._portFeedback._location);
				this._target.location = this._portFeedback._location.copy();
				if (!this._target.port) {
					this._target.port = new Port();
					this._target.isNew = true;
				}
				return this.createAttachCommand(line, this._target.port, event, viewer);
			}
			const attachedPort =
				dragIndex === 0 ? line.getSourcePort() : dragIndex === last ? line.getTargetPort() : undefined;
			if (attachedPort !== undefined) {
				return this.createDetachCommand(line, attachedPort, event, viewer);
			}
			// no detach, so simply resize:
			return this.createResizeOrAddCommand(line, this.currentLocation, event, viewer);
		}
		return undefined;
	}

	/**
	 * Creates a CompoundCommand to perform an attach for current {{#crossLink
	 * "Edge"}}{{/crossLink}}.<br/> Besides the actual attach this involves a resize and a possible
	 * Port creation too.
	 *
	 * @method createAttachCommand
	 * @param {Edge} line The <code>Edge</code> which is currently edited.
	 * @param {Port} port The port to attach to.
	 * @param {ClientEvent} event The current event.
	 * @return {Command} The CompoundCommand to perform attach.
	 */
	createAttachCommand(line, port, event, viewer) {
		let cmd;
		const graph = line.getGraph();
		const dragIndex = this._dragIndex;
		// do we have to detach before?
		const attachedPort = dragIndex === 0 ? line.getSourcePort() : line.getTargetPort();

		const translateAngle = (lline, parent) => {
			let angle = lline.getAngle().getValue();

			const _translateAngle = (item) => {
				angle += item.getAngle().getValue();
			};

			// parent is always equal or "above" line parent!
			GraphUtils.traverseItemUp(lline.getParent(), parent, _translateAngle);
			return angle - lline.getAngle().getValue();
		};

		// if new port is same as current attached => do nothing...
		if (this._target.isNew || !attachedPort || attachedPort.getId() !== port.getId()) {
			cmd = new CompoundCommand();
			// detach from  old port:
			if (attachedPort) {
				cmd.add(new DetachCommand(line, attachedPort));
			}
			// do we have to add new port?
			if (this._target && this._target.isNew) {
				cmd.add(new AddPortCommand(this._target.port, this._target.location, this._target.node));
			}
			// resize edge, in order to snap to old location on undo...
			// doesn't work, port is not added =>
			// port.getConnectionCoordinate().toPoint(new
			// Point(0, 0));
			const portLocation = this._target.location.copy();
			GraphUtils.translatePointUp(portLocation, this._target.node, graph);
			cmd.add(this.createResizeOrAddCommand(line, portLocation, event, viewer));

			// check if attach results in new parent
			let commonParent = GraphUtils.findCommonParent(line.getParent(), this._target.node.getParent(), graph);
			commonParent = commonParent || graph;
			if (commonParent !== line.getParent()) {
				cmd.add(new ChangeParentCommand(line, commonParent));
				// rotate line angle to new parent:
				const rotAngle = translateAngle(line, commonParent);
				if (rotAngle) {
					cmd.add(new RotateItemCommand(line, rotAngle));
				}
			}
			// finally attach
			cmd.add(new AttachCommand(line, port, dragIndex === 0));
		}
		return cmd;
	}

	/**
	 * Creates a CompoundCommand to perform a detach for current {{#crossLink
	 * "Edge"}}{{/crossLink}}.<br/> Besides the detach this involves a resize too.
	 *
	 * @method createDetachCommand
	 * @param {Edge} line The <code>Edge</code> which is currently edited.
	 * @param {Port} port The port to detach from.
	 * @param {ClientEvent} event The current event.
	 * @return {Command} The CompoundCommand to perform detach.
	 */
	createDetachCommand(line, port, event, viewer) {
		const cmd = new CompoundCommand();
		const cmd1 = new DetachCommand(line, port);
		const cmd2 = this.createResizeOrAddCommand(line, this.currentLocation, event, viewer); // due to undo!!
		cmd.add(cmd1);
		cmd.add(cmd2);
		return cmd;
	}

	/**
	 * Creates a Command to perform the resize for current {{#crossLink "Edge"}}{{/crossLink}}.<br/>
	 * For Edges a resize means to set either its start or end point to a new location.
	 *
	 * @method createResizeOrAddCommand
	 * @param {Edge} line The <code>Edge</code> which is currently edited.
	 * @param {Point} location The new position for start or end point.
	 * @param {ClientEvent} event The current event.
	 * @return {SetLinePointAtCommand} The resize command.
	 */
	createResizeOrAddCommand(line, location, event, viewer) {
		const fbItem = this.feedback[0].getFeedbackItem();
		const oldPointsCount = fbItem.getPointsCount();
		this.placeFeedback(event, viewer);
		const newpoints = this.reduce(fbItem);
		if (this._marker.createNew || oldPointsCount !== newpoints.length) {
			// feedback is in Graph coordinate system, so:
			GraphUtils.traverseItemDown(line.getGraph(), line.getParent(), (item) => {
				for (let i = 0; i < newpoints.length; i += 1) {
					item.translateFromParent(newpoints[i]);
				}
			});
			return new SetLineShapePointsCommand(line, newpoints);
		}
		const newlocation = this.feedback[0].getPointAt(this._dragIndex);
		if (newlocation) {
			GraphUtils.translatePointDown(newlocation, line.getGraph(), line.getParent());
			return new SetLinePointAtCommand(line, this._dragIndex, newlocation);
		}

		return undefined;
	}

	/**
	 * Removes all points of given edge which are on same line segment.
	 * @method reduce
	 * @param {Edge} fbItem The feedback item which should be checked.
	 * @return {Array} A list of remove points.
	 */
	reduce(fbItem) {
		// TODO same as in ResizeOrthEdgeInteraction => move to a common place...
		const points = fbItem.getPoints();
		let i;
		const last = points.length - 1;

		const areLinesParallel = (l1Index1, l1Index2, l2Index1, l2Index2) => {
			if (l1Index1 >= 0 && l2Index2 <= last) {
				const l1p1 = points[l1Index1];
				const l1p2 = points[l1Index2];
				const l2p1 = points[l2Index1];
				const l2p2 = points[l2Index2];
				return MathUtils.areLinesParallel(l1p1, l1p2, l2p1, l2p2);
			}
			return false;
		};

		for (i = last; i > 0; i -= 1) {
			if (areLinesParallel(i - 1, i, i, i + 1)) {
				points.splice(i, 1);
			}
		}
		return points;
	}

	didFinish(event, viewer) {
		// remove any added port highlights...
		viewer.clearLayer(LayerId.PORTS);
		viewer.clearLayer('resize.edit.line.layer');
		super.didFinish(event, viewer);
	}
}

export default ResizeEditEdgeInteraction;
