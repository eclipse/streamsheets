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
const CompoundCommand = require('./CompoundCommand');
const DetachCommand = require('./DetachCommand');
const InternalDeleteItemCommand = require('./InternalDeleteItemCommand');
const LineConnection = require('../model/LineConnection');

/**
 * Command to delete a Node.<br/>
 * <b>Note:</b> before given note is deleted it will be detached from its {{#crossLink
 * "Edge"}}{{/crossLink}}s. Therefore a {{#crossLink "DetachCommand"}}{{/crossLink}}
 * is added for each attached edge. Subclasses can overwrite {{#crossLink
 * "DeleteNodeCommand/createDetachCommand:method"}}{{/crossLink}} to create a custom detach command.
 *
 * @example
 *     // item and interactionhandler given
 *     var cmd = new DeleteNodeCommand(item);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class DeleteNodeCommand
 * @extends Command
 * @constructor
 * @param {Node} node Node to be deleted.
 */
class DeleteNodeCommand extends CompoundCommand {
	static createFromObject(data = {}, context) {
		return new DeleteNodeCommand().initWithObject(data, context);
	}

	constructor(node) {
		super();
		if (node) {
			this._node = node;
			// first detach any connected edges:
			this.detachEdges(node);
			this.add(new InternalDeleteItemCommand(node));
		}
	}

	toObject() {
		const data = super.toObject();
		if (this._node) data.itemId = this._node.getId();
		return data;
	}

	/**
	 * Will detach edges from deleted node itself or from any sub nodes
	 *
	 * @method detachEdges
	 * @param {Node} node Node to be detach edges from.
	 */
	detachEdges(node) {
		const id = node.getId();
		let parent = node.getParent();

		const detach = (item) => {
			let path;
			if (item instanceof LineConnection) {
				if (item.hasSourceNode()) {
					path = item.getSourceNode().createPath();
					if (path.containsId(id)) {
						this.add(
							this.createDetachCommand(item, item.getSourcePort())
						);
					}
				}
				if (item.hasTargetNode()) {
					path = item.getTargetNode().createPath();
					if (path.containsId(id)) {
						this.add(
							this.createDetachCommand(item, item.getTargetPort())
						);
					}
				}
			}
		};

		while (parent !== undefined) {
			const items = parent.getItems();
			items.forEach((item) => detach(item));
			parent = parent.getParent();
		}
	}

	/**
	 * Creates a new command to use for detaching an edge from given port.<br/>
	 * This method can be overwritten by subclasses to add custom behavior on detach. Default implementation
	 * simply creates a {{#crossLink "DetachCommand"}}{{/crossLink}}.
	 *
	 * @method createDetachCommand
	 * @param {Edge} edge The edge to detach.
	 * @param {Port} port The port to detach from, i.e. either the source or target port of given edge.
	 */
	createDetachCommand(edge, port) {
		return new DetachCommand(edge, port);
	}
}

module.exports = DeleteNodeCommand;
