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
	Edge,
	PortMapper,
	TextNode,
	ButtonNode,
	CaptionNode,
	CellsNode,
	ColumnHeaderNode,
	default as JSG,
	InboxContainer,
	StreamSheetContainer,
	RowHeaderNode,
	ScrollbarNode,
	SheetButtonNode,
	SheetCheckboxNode,
	SheetHeaderNode,
	SheetSliderNode,
	SheetKnobNode,
	TreeItemsNode,
	Dictionary,
	Arrays,
	MathUtils,
	GraphUtils,
	Event,
	ItemAttributes,
	AttributeChangeEvent
} from '@cedalo/jsg-core';
import GraphItemController from './GraphItemController';
import RowHeaderView from '../view/RowHeaderView';
import ColumnHeaderView from '../view/ColumnHeaderView';
import SheetHeaderView from '../view/SheetHeaderView';
import CellsView from '../view/CellsView';
import ScrollbarView from '../view/ScrollbarView';
import CaptionView from '../view/CaptionView';
import ButtonView from '../view/ButtonView';
import TreeItemsView from '../view/TreeItemsView';
import SheetButtonView from '../view/SheetButtonView';
import SheetCheckboxView from '../view/SheetCheckboxView';
import SheetSliderView from '../view/SheetSliderView';
import SheetKnobView from '../view/SheetKnobView';
import { createView } from '@cedalo/jsg-extensions/ui';
import NodeView from '../view/NodeView';
import TextView from '../view/TextView';
import StreamSheetContainerView from '../view/StreamSheetContainerView';

/**
 * A controller to determine the behavior of {{#crossLink "Node"}}{{/crossLink}}s. A Node
 * adds ports to a GraphItem.
 *
 * @class NodeController
 * @extends GraphItemController
 * @param {Node} node The node model associated with this controller.
 * @constructor
 */
class NodeController extends GraphItemController {
	constructor(node) {
		super(node);
		this._ports = [];
	}

	_refreshChildren() {
		super._refreshChildren();

		// sync ports:
		const node = this.getModel();
		const portsMap = new Dictionary();
		const ports = this.getPortControllers();

		// map old ports:
		ports.forEach((portController) => {
			portsMap.put(portController.getModel().getId(), portController);
		});

		node._ports.forEach((port) => {
			let portController = portsMap.remove(port.getId());
			if (portController === undefined) {
				portController = this.getViewer()
					.getControllerFactory()
					.createController(port);
				this.addPort(portController);
			}
		});

		// finally remove remaining obsolete ports...
		portsMap.iterate((key, element) => {
			this.removePort(element);
		});
	}

	// overwritten to deactivate all registered ports. important if node was part of a deleted controller hierarchy...
	deactivate() {
		super.deactivate();
		this._ports.forEach((port) => port.deactivate());
	}

	/**
	 * Adds given PortController to the list of registered port controllers.
	 *
	 * @method addPort
	 * @param {PortController} portController The PortController to add.
	 */
	addPort(portController) {
		this._ports.push(portController);
		portController.parent = this;
		this.addPortView(portController);
		if (this.isActive) {
			portController.activate();
		}
		// call refresh to build up port controller hierarchy
		portController.refresh();
	}

	/**
	 * Adds the view of given PortController to the sub views of this controller associated view.
	 *
	 * @method addPortView
	 * @param {PortController} portController The PortController whose view should be added.
	 */
	addPortView(portController) {
		this.getView().addPortView(portController.getView());
	}

	/**
	 * Removes given PortController from the list of registered port controllers.
	 *
	 * @method removePort
	 * @param {PortController} portController The PortController to remove.
	 */
	removePort(portController) {
		if (Arrays.remove(this._ports, portController)) {
			if (this.isActive) {
				portController.deactivate();
			}
			portController.parent = undefined;
			this.removePortView(portController);
		}
	}

	/**
	 * Removes the view of given PortController form the sub views of this controller associated view.
	 *
	 * @method removePortView
	 * @param {PortController} portController The PortController whose view should be removed.
	 */
	removePortView(portController) {
		this.getView().removePortView(portController.getView());
	}

	createView(model) {
		// here we create a view depending on given model...
		if (model instanceof TextNode) {
			return new TextView(model);
		}
		if (model instanceof RowHeaderNode) {
			return new RowHeaderView(model);
		}
		if (model instanceof ColumnHeaderNode) {
			return new ColumnHeaderView(model);
		}
		if (model instanceof SheetHeaderNode) {
			return new SheetHeaderView(model);
		}
		if (model instanceof CellsNode) {
			return new CellsView(model);
		}
		if (model instanceof ScrollbarNode) {
			return new ScrollbarView(model);
		}
		if (model instanceof CaptionNode) {
			return new CaptionView(model);
		}
		if (model instanceof ButtonNode) {
			return new ButtonView(model);
		}
		if (model instanceof TreeItemsNode) {
			return new TreeItemsView(model);
		}
		if (model instanceof SheetButtonNode) {
			return new SheetButtonView(model);
		}
		if (model instanceof SheetCheckboxNode) {
			return new SheetCheckboxView(model);
		}
		if (model instanceof SheetSliderNode) {
			return new SheetSliderView(model);
		}
		if (model instanceof SheetKnobNode) {
			return new SheetKnobView(model);
		}
		if (model instanceof StreamSheetContainer) {
			return new StreamSheetContainerView(model);
		}
		if (model instanceof StreamSheetContainer) {
			return new StreamSheetContainerView(model);
		}

		const extension = createView(model);
		if(extension){
			return extension;
		}

		return new NodeView(model);
	}

	/**
	 * Checks if this controller has any {{#crossLink "PortController"}}{{/crossLink}}s registered
	 * to it.
	 *
	 * @method hasPorts
	 * @return {Boolean} <code>true</code> if PortControllers are registered, <code>false</code> otherwise.
	 */
	hasPorts() {
		return this._ports.length !== 0;
	}

	/**
	 * Returns direct access to the {{#crossLink "PortController"}}{{/crossLink}}s list.
	 *
	 * @method getPortControllers
	 * @return {Array} A list of registered PortControllers.
	 */
	getPortControllers() {
		return this._ports;
	}

	handlePreEvent(event) {
		if (event.id === Event.ATTRIBUTE) {
			switch (event.detailId) {
				case AttributeChangeEvent.VALUE:
					this.handlePreAttributeChange(event.getAttribute(), event);
					break;
			}
		}
		super.handlePreEvent(event);
	}

	/**
	 * Called when an attribute is about to be changed.<br/>
	 * To veto the change simply set the <code>doIt</code> flag of passed event object to <code>false</code>.<br/>
	 * The default implementation only handles the
	 * {{#crossLink "ItemAttributes/COLLAPSED:property"}}{{/crossLink}} state change of
	 * a node.<br/> Subclasses might overwrite but should call this base method.
	 *
	 * @method handlePreAttributeChange
	 * @param {Attribute} attribute The attribute which might change.
	 * @param {Event} event The pre event send before attribute might changed.
	 */
	handlePreAttributeChange(attribute, event) {
		if (attribute.getName() === ItemAttributes.COLLAPSED) {
			if (attribute.getValue() === false) {
				event._colledgeinfos = this._handlePreCollapse();
			}
		}
	}

	_handlePreCollapse() {
		const inEdges = [];
		const outEdges = [];
		const edgeinfos = [];
		const node = this.getModel();
		const graph = node.getGraph();
		const nodebox = node.getTranslatedBoundingBox(graph, JSG.boxCache.get());
		const pt0 = JSG.ptCache.get();
		const pt1 = JSG.ptCache.get();
		const interpt = JSG.ptCache.get();
		let p;
		let edgeparent;
		let last;

		this.getInOutEdges(inEdges, outEdges);

		inEdges.forEach((edge) => {
			// get intersection point of edge segment with node bbox:
			edgeparent = edge.getParent();
			last = edge.getPointsCount() - 1;
			for (p = last; p > 0; p -= 1) {
				edge.getPointAt(p, pt0);
				edge.getPointAt(p - 1, pt1);
				this._translateSegment(pt0, pt1, edgeparent, graph);
				if (this._getIntersection(nodebox, pt0, pt1, interpt)) {
					GraphUtils.translatePointDown(interpt, graph, node);
					edgeinfos.push(this.mapPortAt(interpt, node, edge, false));
					break;
				}
			}
		});

		outEdges.forEach((edge) => {
			// get intersection point of edge segment with node bbox:
			edgeparent = edge.getParent();
			last = edge.getPointsCount() - 1;
			for (p = 0; p < last; p += 1) {
				edge.getPointAt(p, pt0);
				edge.getPointAt(p + 1, pt1);
				this._translateSegment(pt0, pt1, edgeparent, graph);
				if (this._getIntersection(nodebox, pt0, pt1, interpt)) {
					GraphUtils.translatePointDown(interpt, graph, node);
					edgeinfos.push(this.mapPortAt(interpt, node, edge, true));
					break;
				}
			}
		});

		JSG.ptCache.release(pt0, pt1, interpt);
		JSG.boxCache.release(nodebox);

		return edgeinfos;
	}

	_translateSegment(pt0, pt1, fromItem, toItem) {
		function translate(item) {
			item.translateToParent(pt0);
			item.translateToParent(pt1);
		}

		GraphUtils.traverseItemUp(fromItem, toItem, translate);
	}

	_getIntersection(box, p0, p1, reusepoint) {
		const corner1 = JSG.ptCache.get();
		const corner2 = JSG.ptCache.get();
		let intersection = JSG.ptCache.get();
		let index = -1;
		let i;

		for (i = 0; i < 4; i += 1) {
			box.getCornerAt(i, corner1);
			box.getCornerAt((i + 1) % 4, corner2);
			if (
				MathUtils.doLinesIntersect(p0, p1, corner1, corner2, intersection) &&
				MathUtils.isPointOnLineSegment(intersection, p0, p1)
			) {
				index = i;
				if (!MathUtils.isPointOnLineSegment(intersection, corner1, corner2)) {
					intersection = MathUtils.isPointInDirectionOfLine(intersection, corner1, corner2)
						? corner2
						: corner1;
				}
				break;
			}
		}
		JSG.ptCache.release(corner1, corner2, intersection);
		return index > -1 ? reusepoint.setTo(intersection) : undefined;
	}

	getInOutEdges(inedges, outedges) {
		const node = this.getModel();
		let nodeparent = node.getParent();
		let subItems;

		while (nodeparent !== undefined) {
			// nodeparent is not enough!! => need edges from above parents too!!
			subItems = nodeparent.getItems();
			subItems.forEach((item) => {
				if (item instanceof Edge) {
					if (this.isItemInsideNode(item.getSourceNode())) {
						outedges.push(item);
					} else if (this.isItemInsideNode(item.getTargetNode())) {
						inedges.push(item);
					}
				}
			});
			nodeparent = nodeparent.getParent();
		}
	}

	isItemInsideNode(item) {
		const node = this.getModel();
		let parent = item ? item.getParent() : undefined;
		let inside = parent === node;

		while (!inside && parent && parent !== node.getParent()) {
			parent = parent.getParent();
			inside = parent === node;
		}

		return inside;
	}

	mapPortAt(point, node, edge, isSourcePort) {
		const port = isSourcePort ? edge.getSourcePort() : edge.getTargetPort();
		let nodeport = node.getPortAtLocation(point);

		if (!nodeport || !nodeport.isMapper) {
			nodeport = new PortMapper();
			node.addPortAtLocation(nodeport, point);
		}
		nodeport.mapPort(edge, port);

		return {
			edge,
			isIncomingEdge: !isSourcePort,
			virtualPort: nodeport
		};
	}

	handlePostEvent(event) {
		if (event.id === Event.NODE) {
			// check ports add or remove:
			switch (event.detailId) {
				case Event.PORTADD:
				case Event.PORTREMOVE:
				case Event.PORTREMOVEALL:
					this.refresh();
					break;
			}
		} else if (event.id === Event.ATTRIBUTE) {
			switch (event.detailId) {
				case AttributeChangeEvent.VALUE:
					this.handlePostAttributeChange(event.getAttribute(), event);
					break;
			}
		}
		super.handlePostEvent(event);
	}

	/**
	 * Called when an attribute has changed.<br/>
	 * <b>Note:</b> a change could be vetoed by other classes. This is the case if the <code>doIt</code> flag
	 * of passed event object is set to <code>false</code>!<br/>
	 * The default implementation only handles the
	 * {{#crossLink "ItemAttributes/COLLAPSED:property"}}{{/crossLink}} state change of
	 * a node.<br/> Subclasses might overwrite but should call this base method.
	 *
	 * @method handlePostAttributeChange
	 * @param {Attribute} attribute The attribute which might was changed.
	 * @param {Event} event The post event send after attribute might changed.
	 */
	handlePostAttributeChange(attribute, event) {
		if (attribute.getName() === ItemAttributes.COLLAPSED) {
			if (attribute.getValue() === true) {
				this._didCollapse(event);
			} else {
				this._didExpand(event);
			}
			event._colledgeinfos = undefined;
		}
	}

	_didCollapse(event) {
		const edgeinfos = event._colledgeinfos;

		if (edgeinfos) {
			edgeinfos.forEach((info) => {
				if (info.isIncomingEdge) {
					info.edge.setTargetPort(info.virtualPort);
				} else {
					info.edge.setSourcePort(info.virtualPort);
				}
			});
		}
	}

	_didExpand(event) {
		// expand => collect edges which have virtual port & node as source/target...
		const node = this.getModel();
		const ports = this.getPortControllers();
		const delPorts = [];
		let edges;

		ports.forEach((port) => {
			if (port.isMapper) {
				edges = port.getIncomingEdges();
				edges.forEach((edge) => {
					edge.setTargetPort(port.getMappedPort(edge.getId()));
				});
				edges = port.getOutgoingEdges();
				edges.forEach((edge) => {
					edge.setSourcePort(port.getMappedPort(edge.getId()));
				});
				delPorts.push(port);
			}
		});

		delPorts.forEach((port) => {
			node.removePort(port);
		});
	}

	// overwritten to update port controller...
	update() {
		super.update();
		// update our port controller
		const ports = this.getPortControllers();
		ports.forEach((port) => {
			port.update();
		});
	}

	// overwritten to look for port controller...
	_findModelControllerByPath(path) {
		const id = path ? path.peekNextId() : undefined;
		let controller = super._findModelControllerByPath(path);

		if (!controller && id !== undefined) {
			// check our ports:
			let i;
			let port;
			const ports = this._ports;

			for (i = 0; i < ports.length && !controller; i += 1) {
				port = ports[i];
				controller = port.getModel().getId() === id ? port : undefined;
			}
		}
		return controller;
	}
}

export default NodeController;
