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
	AddPortCommand,
	AttachCommand,
	DetachCommand,
	RotateItemCommand,
	ChangeParentCommand,
	SetLinePointAtCommand,
	CompoundCommand,
	Port,
	GraphUtils,
	default as JSG, Point
} from '@cedalo/jsg-core';
import AbstractInteraction from './AbstractInteraction';
import InteractionUtils from './InteractionUtils';
import LayerId from "../view/LayerId";
import PositionFeedbackView from '../view/PositionFeedbackView';

/**
 * A special interaction to handle resize of {{#crossLink "Edge"}}{{/crossLink}}s.</br>
 * For a more general resize interaction see {{#crossLink "ResizeItemInteraction"}}{{/crossLink}}.
 *
 * @class ResizeEdgeInteraction
 * @extends AbstractInteraction
 * @constructor
 * @param {SelectionHandle} activeHandle The SelectionHandle to use for resize.
 */
class ResizeEdgeInteraction extends AbstractInteraction {
	constructor(activeHandle) {
		super();
		this._activeHandle = activeHandle;
		this._dragIndex = -1;
		this._dragMaskIndex = 0; //= 1 dragged source, =2 dragged target, =0 dragged point in between
		this._portFeedback = undefined;
		this._target = undefined;
	}

	deactivate(viewer) {
		this._activeHandle = undefined;
		this._dragIndex = -1;
		this._dragMaskIndex = 0;
		this._portFeedback = undefined;
		this._target = undefined;
		super.deactivate(viewer);
	}

	doShowPortHighlights() {
		return true;
	}

	/**
	 * Checks if either start or end point of resized Edge is dragged.
	 *
	 * @method draggedSourceOrTarget
	 * @return {Boolean} <code>true</code> if either start or end point is dragged, <code>false</code> otherwise.
	 */
	draggedSourceOrTarget() {
		return this._dragMaskIndex === 1 || this._dragMaskIndex === 2;
	}

	/**
	 * Checks if start point of resized Edge is dragged.
	 *
	 * @method draggedSourc
	 * @return {Boolean} <code>true</code> if start point is dragged, <code>false</code> otherwise.
	 */
	draggedSource() {
		return this._dragMaskIndex === 1;
	}

	/**
	 * Checks if end point of resized Edge is dragged.
	 *
	 * @method draggedTarget
	 * @return {Boolean} <code>true</code> if end point is dragged, <code>false</code> otherwise.
	 */
	draggedTarget() {
		return this._dragMaskIndex === 2;
	}

	createActionFeedback(event, viewer) {
		const feedback = new PositionFeedbackView();
		const loc = event.location.copy();

		viewer.translateFromParent(loc);
		feedback.setPosition(loc);
		return feedback;
	}

	updateActionFeedback(event, viewer) {
		if (this.actionFeedback) {
			const loc = event.location.copy();
			viewer.translateFromParent(loc);
			this.actionFeedback.setPosition(loc);
		}
	}

	_createSelectionFeedback(controller, viewer) {
		this._dragIndex = this._activeHandle.getPointIndex();
		const points = controller.getModel().getPointsCount();
		this._dragMaskIndex = this._dragIndex === 0 ? 1 : this._dragIndex === points - 1 ? 2 : 0;
		return super._createSelectionFeedback(controller, viewer);
	}

	_alignShift(event, current) {
		if (event.event.shiftKey) {
			if (this.feedback.length) {
				const prevpt = JSG.ptCache.get();
				let prev = this._dragIndex > 0 ? this.feedback[0].getPointAt(this._dragIndex - 1, prevpt) : undefined;
				if (!prev) {
					prev =
						this._dragIndex < this.feedback[0].getPointsCount() - 1
							? this.feedback[0].getPointAt(this._dragIndex + 1, prev)
							: undefined;
				}
				if (prev) {
					const diff = new Point(this.currentLocation.x - prev.x, this.currentLocation.y - prev.y);
					let angle = Math.atan2(diff.y, diff.x);
					if (angle < 0) {
						angle += Math.PI * 2;
					}
					if (angle > Math.PI_8 * 15 ||
						angle < Math.PI_8 ||
						(angle > Math.PI_8 * 7 && angle < Math.PI_8 * 9)) {
						current.y = prev.y;
					} else if ((angle > Math.PI_8 * 3 && angle < Math.PI_8 * 5) ||
						(angle > Math.PI_8 * 11 && angle < Math.PI_8 * 13)) {
						current.x = prev.x;
					} else if ((angle > Math.PI_8 && angle < Math.PI_8 * 3) ||
						(angle > Math.PI_8 * 9 && angle < Math.PI_8 * 11)) {
						if (Math.abs(diff.x) > Math.abs(diff.y)) {
							current.x = prev.x + diff.y;
						} else {
							current.y = prev.y + diff.x;
						}
					} else if ((angle > Math.PI_8 * 5 && angle < Math.PI_8 * 7) ||
						(angle > Math.PI_8 * 13 && angle < Math.PI_8 * 15)) {
						if (Math.abs(diff.x) > Math.abs(diff.y)) {
							current.x = prev.x - diff.y;
						} else {
							current.y = prev.y - diff.x;
						}
					}
				}
				JSG.ptCache.release(prevpt);
			}
		}
		return current;
	}

	updateFeedback(event, viewer, offset) {
		const current = this.alignToGrid(this.currentLocation, viewer, event.event.altKey);
		this._alignOrthogonal(current, viewer);
		this._alignShift(event, current);

		this.feedback[0].setPointAt(this._dragIndex, current);
		this.showPossiblePortAt(event, viewer);
	}

	_alignOrthogonal(point, viewer) {
		if (this.feedback.length) {
			const edge = this.feedback[0].getOriginalItem();
			const graph = edge.getGraph();
			const pt = JSG.ptCache.get().setTo(point);
			const prevpt = JSG.ptCache.get();
			const nextpt = JSG.ptCache.get();
			let prev = this._dragIndex > 0 ? this.feedback[0].getPointAt(this._dragIndex - 1, prevpt) : undefined;
			let next =
				this._dragIndex < this.feedback[0].getPointsCount() - 1
					? this.feedback[0].getPointAt(this._dragIndex + 1, nextpt)
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
		let controller;
		let ports;
		let portLayer;

		this._portFeedback = undefined;

		if (this.draggedSourceOrTarget()) {
			viewer.clearLayer(LayerId.PORTS);
			controller = InteractionUtils.getPortsController(event, viewer);
			if (controller) {
				ports = InteractionUtils.getPortsFor(controller, this, event.event.altKey);
				portLayer = viewer.getLayer(LayerId.PORTS);
				Arrays.addAll(portLayer, ports);
				if (ports.length === 1) {
					this._portFeedback = ports[0];
				}
			}
		}
		return this._portFeedback;
	}

	willFinish(event, viewer, offset) {
		// no valid dragIndex -> cancel interaction...
		if (this._dragIndex < 0) {
			this.cancelInteraction(event, viewer);
		} else {
			super.willFinish(event, viewer, offset);
		}
	}

	/**
	 * Creates the command to resize selected {{#crossLink "Edge"}}{{/crossLink}}.</br>
	 * Note: this might create an attach or detach command instead. See
	 * {{#crossLink "ResizeEdgeInteraction/createAttachCommand:method"}}{{/crossLink}} and
	 * {{#crossLink "ResizeEdgeInteraction/createDetachCommand:method"}}{{/crossLink}} too.
	 *
	 * @method createCommand
	 * @param {Point} offset The offset between start and current event. Usually the difference between
	 *     start and current location.
	 * @param {ConnectionController} selectedController The currently selected connection
	 *     controller.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {Command} A command to be executed or <code>undefined</code>
	 */
	createCommand(offset, selectedController, event, viewer) {
		let line;
		let attachedPort;

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
			return this.createAttachCommand(selectedController, this._target.port, event);
		}
		if (this.draggedSourceOrTarget()) {
			line = selectedController.getModel();
			attachedPort = this.draggedSource() ? line.getSourcePort() : line.getTargetPort();
			if (attachedPort !== undefined) {
				return this.createDetachCommand(selectedController, attachedPort, event);
			}
		}
		// no detach, so simply resize:
		return this.createResizeCommand(selectedController, this.currentLocation, event);
	}

	/**
	 * Creates a CompoundCommand to perform an attach for selected {{#crossLink
	 * "Edge"}}{{/crossLink}}.<br/> Besides the actual attach this involves a resize and a possible
	 * Port creation too.
	 *
	 * @method createAttachCommand
	 * @param {ConnectionController} controller The currently selected connection controller.
	 * @param {Port} port The port to attach to.
	 * @param {ClientEvent} event The current event.
	 * @return {Command} The CompoundCommand to perform attach.
	 */
	createAttachCommand(controller, port, event) {
		let cmd;
		const line = controller.getModel();
		const graph = line.getGraph();
		// do we have to detach before?
		const attachedPort = this.draggedSource() ? line.getSourcePort() : line.getTargetPort();

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
			const portLocation = this._target.location.copy();

			// doesn't work, port is not added => port.getConnectionCoordinate().toPoint(new Point(0, 0));

			GraphUtils.translatePointUp(portLocation, this._target.node, graph);
			cmd.add(this.createResizeCommand(controller, portLocation, event));

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
			cmd.add(new AttachCommand(line, port, this.draggedSource()));
		}
		return cmd;
	}

	/**
	 * Creates a CompoundCommand to perform a detach for selected {{#crossLink
	 * "Edge"}}{{/crossLink}}.<br/> Besides the detach this involves a resize too.
	 *
	 * @method createDetachCommand
	 * @param {ConnectionController} controller The currently selected connection controller.
	 * @param {Port} port The port to detach from.
	 * @param {ClientEvent} event The current event.
	 * @return {Command} The CompoundCommand to perform detach.
	 */
	createDetachCommand(controller, port, event) {
		const cmd = new CompoundCommand();
		const cmd1 = new DetachCommand(controller.getModel(), port);
		const cmd2 = this.createResizeCommand(controller, this.currentLocation, event); // due to undo!!
		cmd.add(cmd1);
		cmd.add(cmd2);
		return cmd;
	}

	/**
	 * Creates a Command to perform the resize for selected {{#crossLink "Edge"}}{{/crossLink}}.<br/>
	 * For Edges a resize means to set either its start or end point to a new location.
	 *
	 * @method createResizeCommand
	 * @param {ConnectionController} controller The currently selected connection controller.
	 * @param {Point} location The new position for start or end point.
	 * @param {ClientEvent} event The current event.
	 * @return {SetLinePointAtCommand} The resize command.
	 */
	createResizeCommand(controller, location, event) {
		const viewer = controller.getViewer();
		const parent = controller.getView().getParent();
		const rootView = viewer.rootController.getView();
		const newlocation = this.alignToGrid(location, viewer, event.event.altKey);
		this._alignOrthogonal(newlocation, viewer);
		this._alignShift(event, newlocation);
		GraphUtils.traverseDown(rootView, parent, (v) => {
			v.translateFromParent(newlocation);
		});
		return new SetLinePointAtCommand(controller.getModel(), this._dragIndex, newlocation);
	}

	didFinish(event, viewer) {
		// remove any added port highlights...
		viewer.clearLayer(LayerId.PORTS);
		super.didFinish(event, viewer);
	}
}

export default ResizeEdgeInteraction;
