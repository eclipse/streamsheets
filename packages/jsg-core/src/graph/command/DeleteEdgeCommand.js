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

/**
 * This command manages the removal of an edge from the graph. The edge is also detached from any port it might be
 * connected to.
 *
 * @class DeleteEdgeCommand
 * @extends Command
 * @constructor
 * @param {Edge} item Edge to remove.
 */
class DeleteEdgeCommand extends CompoundCommand {
	static createFromObject(data = {}, context) {
		const item = context.graph.getItemById(data.itemId);
		return new DeleteEdgeCommand(item).initWithObject(data, context);
	}

	constructor(edge) {
		super();
		if (edge) {
			this._edge = edge;
			// delete edge consists if detaching from source and target ports
			this.add(new DetachCommand(edge, edge.getSourcePort()));
			this.add(new DetachCommand(edge, edge.getTargetPort()));
			// and of deleting edge itself:
			this.add(new InternalDeleteItemCommand(edge));
		}
	}

	toObject() {
		const data = super.toObject();
		if (this._edge) data.itemId = this._edge.getId();
		return data;
	}
}

module.exports = DeleteEdgeCommand;
