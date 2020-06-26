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
import { default as JSG, Edge, Path, Event, OrthoLineShape, GraphUtils } from '@cedalo/jsg-core';
import GraphItemController from './GraphItemController';
import EdgeFeedback from '../feedback/EdgeFeedback';
import OrthoEdgeFeedback from '../feedback/OrthoEdgeFeedback';
import EdgeView from '../view/EdgeView';
import GraphItemView from '../view/GraphItemView';

/**
 * Inner event handler class.</br>
 * Handles only path change events of observed nodes.
 *
 * @class PathListener
 * @constructor
 * @param {ConnectionController} controller The controller which uses this listener.
 */
class PathListener {
	constructor(controller) {
		this._controller = controller;
	}

	/**
	 * Registers this listener to given node.
	 *
	 * @method registerTo
	 * @param {Node} node The node to register to.
	 */
	registerTo(node) {
		// we handle following events:
		node.addEventListener(Event.PATH, this);
	}

	/**
	 * Unregisters this listener from given node.
	 *
	 * @method deregisterFrom
	 * @param {Node} node The node to register from.
	 */
	deregisterFrom(node) {
		node.removeEventListener(Event.PATH, this);
	}

	/**
	 * Handles any pre events send by observed node.</br>
	 *
	 * @method handlePreEvent
	 * @param {Event} event The pre event send before node change.
	 */
	handlePreEvent(event) {}

	/**
	 * Handles any post events send by observed node. Of course events should be of type
	 * Event.PATH.</br>
	 *
	 * @method handlePostEvent
	 * @param {Event} event The post event send after node changed.
	 */
	handlePostEvent(event) {
		const edge = this._controller.getModel();
		this._controller._verifyEdgeParent(edge, edge.sourceNode, edge.targetNode);
	}
}

/**
 * A controller to determine the behavior of {{#crossLink "Edge"}}{{/crossLink}}s.
 *
 * @class ConnectionController
 * @param {Edge} connection The edge model associated with this controller.
 * @extends GraphItemController
 * @constructor
 */
class ConnectionController extends GraphItemController {
	constructor(connection) {
		super(connection);
		this._sourceport = undefined;
		this._targetport = undefined;
		this._pathListener = new PathListener(this);
		// we may be attached, so register to source- and end-ports:
		this._registerToPortNode(connection.getSourcePort());
		this._registerToPortNode(connection.getTargetPort());
	}

	/**
	 * Create the corresponding view for a ConnectionController.
	 *
	 * @method createView
	 * @param {Edge} model Model to create View for.
	 * @return {EdgeView} New view.
	 */
	createView(model) {
		if (model instanceof Edge) {
			return new EdgeView(model);
		}

		return new GraphItemView(model);
	}

	handlePostEvent(event) {
		let markDirty = false;
		switch (event.id) {
			case Event.EDGEATTACHED:
				this._handleAttach(this.getModel(), event.value);
				markDirty = true;
				break;
			case Event.EDGEDETACHED:
				this._handleDetach(this.getModel(), event.value);
				markDirty = true;
				break;
			default:
				// pass to superclass as default...
				super.handlePostEvent(event);
		}
		this.markGraphDirty(markDirty);
	}

	_handleAttach(edge, port) {
		// we register to attached node to get informed if node parent changes:
		this._registerToPortNode(port);
		// this._deregisterFromPortNode(oldport); //NOT REQUIRED, ATTACH EVENT COMES AFTER DETACH EVENT!
		this._verifyEdgeParent(edge, edge.sourceNode, edge.targetNode);
	}

	_verifyEdgeParent(edge, src, trgt) {
		function findCommonParent(lsrc, ltrgt, ledge) {
			function parentPathOf(node) {
				const parent = node !== undefined ? node.getParent() : ledge.getParent();
				return parent !== undefined ? parent.createPath() : undefined;
			}

			const srcParentPath = parentPathOf(lsrc);
			const trgtParentPath = parentPathOf(ltrgt);
			const graph = ledge.getGraph();
			let parentPath = Path.getCommonPrefix(srcParentPath, trgtParentPath);
			parentPath =
				parentPath === undefined ? (srcParentPath !== undefined ? srcParentPath : trgtParentPath) : parentPath;
			const commonParent = graph.findItemByPath(parentPath);
			// if no common parent exists, simply return graph:
			return commonParent !== undefined ? commonParent : graph;
		}

		function switchParent(ledge, newparent) {
			const graph = newparent.getGraph();
			let angle = ledge.getAngle().getValue();
			const origin = ledge.getOrigin(JSG.ptCache.get());

			function up(item) {
				item.translateToParent(origin);
				angle += item.getAngle().getValue();
			}

			function down(item) {
				item.translateFromParent(origin);
				angle -= item.getAngle().getValue();
			}

			// don't know if new parent is up or down within graph hierarchy, so we first translate up and then down...
			GraphUtils.traverseItemUp(ledge.getParent(), graph, up);
			GraphUtils.traverseItemDown(graph, newparent, down);
			ledge.setAngle(angle);
			ledge.setOriginTo(origin);
			ledge.changeParent(newparent);
			JSG.ptCache.release(origin);
		}

		const commonParent = findCommonParent(src, trgt, edge);
		if (commonParent !== edge.getParent()) {
			switchParent(edge, commonParent);
		}
	}

	/**
	 * Handles detach of associated model.</br>
	 *
	 * @method _handleDetach
	 * @param {Edge} edge The detached edge model.
	 * @param {Port} port The port given edge was detached from.
	 * @private
	 */
	_handleDetach(edge, port) {
		this._deregisterFromPortNode(port);
		// a detach is normally followed by resize, so we wait until resized happened...
		this._pendingDetach = true;
	}

	/**
	 * Registers this controller as listener to the node of given port.</br>
	 *
	 * @method _registerToPortNode
	 * @param {Port} port The port to which parent node we register to.
	 * @private
	 */
	_registerToPortNode(port) {
		if (port !== undefined) {
			const node = port.getParent();
			this._pathListener.registerTo(node);
		}
	}

	/**
	 * Unregisters this controller as listener from the node of given port.</br>
	 *
	 * @method _deregisterFromPortNode
	 * @param {Port} port The port from which parent node we unregister.
	 * @private
	 */
	_deregisterFromPortNode(port) {
		if (port !== undefined) {
			const node = port.getParent();
			this._pathListener.deregisterFrom(node);
		}
	}

	/**
	 * Checks if associated model either has a source or a target node attached.
	 *
	 * @method isAttached
	 * @return {Boolean} <code>true</code> if model is at least attached to a source or target node, <code>false</code>
	 *     otherwise.
	 */
	isAttached() {
		return this.model.sourceNode !== undefined || this.model.targetNode !== undefined;
	}

	containsPoint(point, findFlag) {
		// overwritten to enhance connection hit check

		return this.getModel().containsPoint(point, findFlag, JSG.scaledFindRadius);
	}

	deactivate() {
		// remove ourself as listener from any attached node
		this._deregisterFromPortNode(this.model.getSourcePort());
		this._deregisterFromPortNode(this.model.getTargetPort());

		super.deactivate();
	}

	_newFeedback(fbItem, fbView, model) {
		const FB =
			model.getShape().getType() === OrthoLineShape.TYPE
				? OrthoEdgeFeedback
				: EdgeFeedback;
		return new FB(fbItem, fbView, model);
	}
}

export default ConnectionController;
