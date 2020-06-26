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
	TextNode,
	AbstractItemCommand,
	AddItemCommand,
	LineConnection,
	AddPortCommand,
	AttachCommand,
	CompoundCommand,
	Coordinate,
	GraphUtils,
	Arrays,
	Point,
	Shape,
	Port
} from '@cedalo/jsg-core';
import CreateItemInteraction from './CreateItemInteraction';
import GraphController from '../controller/GraphController';
import SelectionVerifier from './SelectionVerifier';
import InteractionUtils from './InteractionUtils';
import LayerId from '../view/LayerId';
import SelectionFeedbackView from '../view/SelectionFeedbackView';
import MouseEvent from '../../ui/events/MouseEvent';
import ClientEvent from '../../ui/events/ClientEvent';
import Cursor from '../../ui/Cursor';

/**
 * An interaction to create an {{#crossLink "Edge"}}{{/crossLink}}.
 *
 * @class CreateEdgeInteraction
 * @extends CreateItemInteraction
 * @param {Edge} graphItem An edge item to use for creation.
 * @param {String} [label] An optional default label for the new edge.
 * @constructor
 */
class CreateEdgeInteraction extends CreateItemInteraction {
	constructor(graphItem, label) {
		super(graphItem, label);
		this._portFeedback = undefined;
	}

	doShowPortHighlights() {
		return true;
	}

	deactivate(viewer) {
		this._portFeedback = undefined;
		super.deactivate(viewer);
	}

	updateFeedback(event, viewer, offset) {
		const last = this._alignedLocation(this.lastLocation, viewer, event);
		if (event.event.shiftKey) {
			const diff = new Point(this.currentLocation.x - this.startLocation.x, this.currentLocation.y - this.startLocation.y);
			let angle = Math.atan2(diff.y, diff.x);
			if (angle < 0) {
				angle += Math.PI * 2;
			}
 			if (angle > Math.PI_8 * 15 ||
				angle < Math.PI_8 ||
				(angle > Math.PI_8 * 7 && angle < Math.PI_8 * 9)) {
				last.y = this.startLocation.y;
			} else if ((angle > Math.PI_8 * 3 && angle < Math.PI_8 * 5) ||
				(angle > Math.PI_8 * 11 && angle < Math.PI_8 * 13)) {
				last.x = this.startLocation.x;
			} else if ((angle > Math.PI_8 && angle < Math.PI_8 * 3) ||
				(angle > Math.PI_8 * 9 && angle < Math.PI_8 * 11)) {
				if (Math.abs(diff.x) > Math.abs(diff.y)) {
					last.x = this.startLocation.x + diff.y;
				} else {
					last.y = this.startLocation.y + diff.x;
				}
			} else if ((angle > Math.PI_8 * 5 && angle < Math.PI_8 * 7) ||
				(angle > Math.PI_8 * 13 && angle < Math.PI_8 * 15)) {
				if (Math.abs(diff.x) > Math.abs(diff.y)) {
					last.x = this.startLocation.x - diff.y;
				} else {
					last.y = this.startLocation.y - diff.x;
				}
			}
		}
		this._graphItem.setEndPointTo(last);
		this._graphItem.refresh();
		// required because we currently don't listen to graphItem changes!!
		//	=> better use feedback => currently can't because CreateInteractions are tight to graphItem
		// which is copied in Controller#createFeedbackView!! => will be improved...
	}

	// overwritten, if edge source is attached, we take port location as pin location, otherwise we align to grid...
	initializeFeedback(fbView, viewer, event) {
		this._graphItem._isFeedback = true;
		this._graphItem.getParent = () => viewer.getGraph();

		if (!this._graphItem.getSourcePort()) {
			super.initializeFeedback(fbView, viewer, event);
		}
	}

	createActionFeedback(event, viewer) {
		return new SelectionFeedbackView(12);
	}

	updateActionFeedback(event, viewer) {
		if (this.actionFeedback && this._graphItem) {
			const box = this._graphItem.getBoundingBox();
			this.actionFeedback._box.setTo(box);
			const last = this.alignToGrid(this.lastLocation, viewer, event.event.altKey, new Point(0, 0));
			this.actionFeedback._point.setTo(last);
		}
	}

	onMouseDown(event, viewer) {
		super.onMouseDown(event, viewer);
		this._setFeedback(event, viewer);
		const start = this._alignedLocation(this.startLocation, viewer, event);

		if (JSG.touchDevice) {
			this.highlightPortsUnderMouse(event, viewer);
		}

		if (this._graphItem === undefined) {
			this.cancelInteraction(event, viewer);
			if (!event.isConsumed && event instanceof MouseEvent) {
				this.getInteractionHandler().handleMouseEvent(event);
			}
			return;
		}

		this._graphItem.setEndPointTo(start);
		this._attachSourcePort();
	}

	/**
	 * Attaches a simple port dummy object to the edge feedback.<br/>
	 * The port dummy object only implements a <code>getParent</code> and a <code>getConnectionPoint</code> function.
	 *
	 * @method _attachSourcePort
	 * @private
	 */
	_attachSourcePort() {
		if (this._portFeedback !== undefined && this._portFeedback._model.addPortAtLocation !== undefined) {
			const port = this.createPortFromFeedback(this._portFeedback);
			this._graphItem.setSourcePort(port);
		}
	}

	createPortFromFeedback(portFeedback) {
		const port = new Port();
		const node = portFeedback._model;
		const portloc = JSG.ptCache.get().setTo(portFeedback._location);
		// init port:
		port._parent = node;
		port._isFeedback = true; // only because it exists, but actually not required, because a feedback has no ID!!!
		port._original = node.getPortAtLocation(portloc);
		port.setPinPointTo(portloc);
		JSG.ptCache.release(portloc);
		return port;
	}

	/**
	 * Returns the translated port location of given port info object. The resulting port location is relative to the
	 * Graph.
	 *
	 * @method _getPortLocation
	 * @param {Object} portInfo The port info object which provides a port location.
	 * @param {Point} [reusepoint] An optional point to reuse, if not supplied a new point will be
	 *     created.
	 * @return {Point} The translated port location.
	 * @private
	 */
	_getPortLocation(portInfo, reusepoint) {
		const portlocation = reusepoint || new Point(0, 0);
		portlocation.setTo(portInfo.location);
		GraphUtils.translatePointUp(portlocation, portInfo.node, portInfo.node.getGraph());
		return portlocation;
	}

	/**
	 * Aligns given location to the grid if required.
	 *
	 * @method _alignedLocation
	 * @param {Point} location The location to align.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {ClientEvent} event The current event. Used to decide if location should be aligned.
	 * @private
	 */
	_alignedLocation(location, viewer, event) {
		return this.alignToGrid(location, viewer, event.event.altKey);
	}

	onMouseDrag(event, viewer) {
		this.setPortFeedback(viewer, event);
		super.onMouseDrag(event, viewer);
	}

	onMouseMove(event, viewer) {
		// super.onMouseMove(event, viewer);
		this.setPortFeedback(viewer, event);

		if (this._portFeedback === undefined) {
			const controller = this._highlightTargetController(event, viewer) || viewer.getGraphController();
			if (controller.getModel().isContainer()) {
				this.setCursor(Cursor.Style.CROSS);
			} else {
				this.setCursor(Cursor.Style.DENY);
			}
		} else {
			viewer.clearLayer(LayerId.TARGETCONTAINER);
			this.setCursor(Cursor.Style.CROSS);
		}

		event.isConsumed = true;
	}

	/**
	 * Triggers a new port highlighting and setting of port feedbacks.
	 *
	 * @method setPortFeedback
	 * @param {ClientEvent} event The current event. Its <code>doRepaint</code> flag is set to
	 *     <code>true</code>.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	setPortFeedback(viewer, event) {
		this._portFeedback = undefined;
		this.highlightPortsUnderMouse(event, viewer);
		event.doRepaint = true;
	}

	/**
	 * Highlights the ports of a {{#crossLink "ModelController"}}{{/crossLink}} which is located at
	 * current event location. If a controller is found and if it provides port highlights, then these highlights will
	 * be added to the ports layer {{#crossLink "LayerId/PORTS:property"}}{{/crossLink}}.
	 *
	 * @method highlightPortsUnderMouse
	 * @param {ClientEvent} event The current event. Its <code>doRepaint</code> flag is set to
	 *     <code>true</code>.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	highlightPortsUnderMouse(event, viewer) {
		viewer.clearLayer(LayerId.PORTS);
		const controller = InteractionUtils.getPortsController(event, viewer);
		if (controller) {
			const ports = InteractionUtils.getPortsFor(controller, this, event.event.altKey);
			const portLayer = viewer.getLayer(LayerId.PORTS);
			Arrays.addAll(portLayer, ports);
			if (ports.length === 1) {
				this._portFeedback = ports[0];
			}
		}
	}

	onMouseUp(event, viewer) {
		this._attachTargetPort(); // handle mouse up over target port...
		this.finishInteraction(event, viewer);
	}

	willFinish(event, viewer, offset) {
		const condition = (controller) => {
			if (controller.getModel() instanceof TextNode) {
				if (!controller.getParent().isSelected()) {
					return false;
				}
			}
			return controller.isSelectable() && !(controller instanceof GraphController);
		};

		const executed = (command, lviewer) => {
			this.executed(command, lviewer);
		};

		if (this.hasExtend()) {
			const interactionHandler = this.getInteractionHandler();
			if (interactionHandler) {
				interactionHandler.execute(this.createCommand(viewer), executed);
			}
		} else {
			let controller = viewer.findControllerAt(event.location, Shape.FindFlags.AUTOMATIC, condition);
			if (!event.isPressed(ClientEvent.KeyType.CTRL)) {
				viewer.clearSelection();
			}
			if (controller) {
				const selChecker = SelectionVerifier.getDefault();
				controller = selChecker.checkSingle(controller, viewer);
				viewer.select(controller);
			}
		}
	}

	/**
	 * Checks if the connection to create has at least a minimum length. If no minimum is specified a default value of
	 * 50 is taken.
	 *
	 * @method hasExtend
	 * @param {Number} minExtend The minimum to check for.
	 * @return {Boolean} <code>true</code> if connection length is greater the given minimum or <code>false</code>
	 *     otherwise.
	 */
	hasExtend(minExtend) {
		minExtend = minExtend || (JSG.touchDevice ? 500 : 125);
		return this._graphItem.getLength() >= minExtend;
	}

	createCommand(viewer) {
		const cmd = new CompoundCommand();
		const newItem = this._graphItem.copy();
		const rootParent = viewer
			.getRootController()
			.getContent()
			.getModel();
		const parent = this._initNewItem(newItem, rootParent, this._graphItem);

		function addCreatePortCmd(port) {
			if (port) {
				if (!port._original) {
					// no original port available, have to add a new one
					const node = port.getParent(); // preserve because it gets lost on copy...
					port = port.copy();
					cmd.add(new AddPortCommand(port, port.getPinPoint(), node));
				} else {
					port = port._original;
				}
			}
			return port;
		}

		const srcport = addCreatePortCmd(this._graphItem.getSourcePort());
		const trgtport = addCreatePortCmd(this._graphItem.getTargetPort());
		cmd.add(new AddItemCommand(newItem, parent));
		if (srcport) {
			cmd.add(new AttachCommand(newItem, srcport, true));
		}
		if (trgtport) {
			cmd.add(new AttachCommand(newItem, trgtport, false));
		}
		return cmd.commands.length === 1 ? cmd.commands[0] : cmd;
	}

	_initNewItem(newItem, rootParent, fbItem) {
		let angle = fbItem.getAngle().getValue();
		const origin = fbItem.getOrigin();
		const points = fbItem.getPoints();

		const findCommonParent = () => {
			const srcnode = fbItem.getSourceNode();
			const trgtnode = fbItem.getTargetNode();
			// edge parent is defined by first mouse down...
			const edgeparent = this._parent ? this._parent.getModel() : rootParent;
			let comparent;
			if (!srcnode && !trgtnode) {
				// not attached
				comparent = edgeparent;
			} else if (srcnode && !trgtnode) {
				// src attached -> node parent
				comparent = srcnode.getParent();
			} else if (!srcnode && trgtnode) {
				// trgt attached -> common parent from edge & node parent
				comparent = GraphUtils.findCommonParent(edgeparent, trgtnode.getParent(), rootParent);
			} else {
				// both attachend
				comparent = GraphUtils.findCommonParent(srcnode.getParent(), trgtnode.getParent(), rootParent);
			}
			return comparent || rootParent;
		};

		const translateFrom = (item) => {
			points.forEach((point) => {
				item.translateFromParent(point);
			});
			item.translateFromParent(origin);
			angle -= item.getAngle().getValue();
			return true;
		};

		const parent = findCommonParent();
		GraphUtils.traverseItemDown(rootParent, parent, translateFrom);

		newItem.setAngle(angle);
		newItem.setOriginTo(origin);
		newItem.setPoints(points);
		newItem.getPin().setLocalCoordinateTo(Coordinate.fromXY(0, 0));

		if (this._label) {
			const label = new TextNode('Text');
			newItem.addLabel(label);
		}

		return parent;
	}

	/**
	 * Attaches a simple port dummy object to the edge feedback.<br/>
	 * The port dummy object only implements a <code>getParent</code> and a <code>getConnectionPoint</code> function.
	 *
	 * @method _attachTargetPort
	 * @private
	 */
	_attachTargetPort() {
		if (this._portFeedback !== undefined && this._portFeedback._model.addPortAtLocation !== undefined) {
			const port = this.createPortFromFeedback(this._portFeedback);
			this._graphItem.setTargetPort(port);
		}
	}

	executed(command, viewer) {
		const getItemFromCommand = (cmd) => {
			let i;
			let item;
			let _item;

			if (cmd instanceof CompoundCommand) {
				const cmds = cmd.commands;
				for (i = 0; i < cmds.length; i += 1) {
					if (cmds[i] instanceof AbstractItemCommand) {
						_item = cmds[i].getItem();
						if (_item instanceof LineConnection) {
							item = _item;
							break;
						}
					}
				}
				return item;
			}
			return cmd.getItem();
		};

		// select item:
		const item = getItemFromCommand(command);
		this._createdItem(item, viewer);
	}

	/**
	 * Called after execution of corresponding interaction command.
	 *
	 * @method _createItem
	 * @param {Edge} item The created item.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @private
	 */
	_createdItem(item, viewer) {
		// select item:
		viewer
			.getRootController()
			.getContent()
			.selectItem(item, true);
	}

	didFinish(event, viewer) {
		// remove any added port highlights...
		viewer.clearLayer(LayerId.PORTS);
		super.didFinish(event, viewer);
	}
}

export default CreateEdgeInteraction;
