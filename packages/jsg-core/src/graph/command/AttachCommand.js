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
const JSG = require('../../JSG');
const AbstractItemCommand = require('./AbstractItemCommand');
const Point = require('../../geometry/Point');
const GraphUtils = require('../GraphUtils');

/**
 * This command attaches an edge to a port.
 *
 * @class AttachCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {Edge} edge Edge to attach to the port. The edge must be part of the graph already.
 * @param {Port} toPort Port to attach the edge to. The port must already be part of a Node.
 * @param {Boolean} isSourcePort True, if the edge uses the Port as a source or starting point, otherwise false.
 */
class AttachCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const edge = graph.getItemById(data.itemId);
		const port = graph.getItemById(data.portId);
		if (edge && port) {
			cmd = new AttachCommand(
				edge,
				port,
				data.attachToSourcePort
			).initWithObject(data);
			cmd._oldparent = data.oldParentId ? graph.getItemById(data.oldParentId) : undefined;
			cmd._oldPointsCount = data.oldPointsCount;
		}
		return cmd;
	}

	constructor(edge, toPort, isSourcePort) {
		super(edge);

		this._port = toPort;
		this._attachToSourcePort = isSourcePort;
		this._oldPointsCount = edge.getPointsCount();
		// TODO review: put parent switch into own command?
		this._oldparent = edge.getParent(); // attach may changed parent...
	}

	toObject() {
		const data = super.toObject();
		data.portId = this._port.getId();
		data.oldParentId = this._oldparent ? this._oldparent.getId() : undefined;
		data.oldPointsCount = this._oldPointsCount;
		data.attachToSourcePort = this._attachToSourcePort;
		return data;
	}

	/**
	 * Undo the attach operation.
	 *
	 * @method undo
	 */
	undo() {
		const pointsCount = this._graphItem.getPointsCount();
		const rmPoints = pointsCount - this._oldPointsCount;
		const rmIndex = this._attachToSourcePort ? 0 : pointsCount - rmPoints;

		this._graphItem.detachPort(this._port);
		this._graphItem.removePointsAt(rmIndex, rmPoints);

		if (this._oldparent && this._graphItem.getParent() !== this._oldparent) {
			this._switchToOldParent(this._graphItem, this._oldparent);
		}
	}

	/**
	 * Redo a previously undone attach operation.
	 *
	 * @method redo
	 */
	redo() {
		if (this._attachToSourcePort) {
			this._graphItem.setSourcePort(this._port);
		} else {
			this._graphItem.setTargetPort(this._port);
		}
	}

	_switchToOldParent(edge, parent) {
		function adjustPin() {
			const graph = parent.getGraph();
			const origin = edge.getOrigin(new Point(0, 0));

			GraphUtils.traverseItemUp(edge.getParent(), graph, (item) => {
				item.translateToParent(origin);
			});
			GraphUtils.traverseItemDown(graph, parent, (item) => {
				item.translateFromParent(origin);
			});
			edge.setOriginTo(origin);
		}

		adjustPin();
		edge.changeParent(parent);
	}
}

module.exports = AttachCommand;
