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
const CompoundCommand = require('./CompoundCommand');
const DeleteEdgeCommand = require('./DeleteEdgeCommand');
const DeleteNodeCommand = require('./DeleteNodeCommand');
const InternalDeleteItemCommand = require('./InternalDeleteItemCommand');
const Edge = require('../model/Edge');
const Node = require('../model/Node');

/**
 * Command to delete a GraphItem.
 *
 * @example
 *     // item and interactionhandler given
 *     var cmd = new DeleteItemCommand(item);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class DeleteItemCommand
 * @extends Command
 * @constructor
 * @param {GraphItem} graphItem GraphItem to be deleted.
 */
class DeleteItemCommand extends CompoundCommand {
	static createFromObject(data = {}, context) {
		return new DeleteItemCommand().initWithObject(data, context);
	}
	constructor(graphItem) {
		super();
		if (graphItem) {
			if (graphItem instanceof Node) {
				this.add(new DeleteNodeCommand(graphItem));
			} else if (graphItem instanceof Edge) {
				this.add(new DeleteEdgeCommand(graphItem));
			} else {
				this.add(new InternalDeleteItemCommand(graphItem));
			}
		}
	}
}

module.exports = DeleteItemCommand;
