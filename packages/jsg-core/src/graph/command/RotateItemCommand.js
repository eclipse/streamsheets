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
const AbstractItemCommandProxy = require('./AbstractItemCommandProxy');
const InternalRotateItemCommand = require('./InternalRotateItemCommand');
const RotateEdgeCommand = require('./RotateEdgeCommand');
const RotateNodeCommand = require('./RotateNodeCommand');
const NoOpCommand = require('./NoOpCommand');
const Edge = require('../model/Edge');
const Node = require('../model/Node');

const createCommand = (item, angle, point) => {
	if (item instanceof Node)
		return new RotateNodeCommand(item, angle, point);
	if (item instanceof Edge)
		return new RotateEdgeCommand(item, angle, point);
	return item
		? new InternalRotateItemCommand(item, angle, point)
		: new NoOpCommand();
};

/**
 * Command to rotate an item.
 *
 * @example
 *     // interactionhandler and item given
 *     // Assigning a rotation around the center of an item.
 *     var cmd = new RotateItemCommand(item, Math.PI / 4, item.getBoundingBox().getCenter());
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class RotateItemCommand
 * @extends AbstractItemCommandProxy
 * @constructor
 * @param {GraphItem} item The item to rotate.
 * @param {Number} angle The rotation Angle in radians.
 * @param {Point} [point] An optional rotation point.
 */
class RotateItemCommand extends AbstractItemCommandProxy {
	static createFromObject(data = {}, context) {
		let cmd;
		const item = context.graph.getItemById(data.itemId);
		if (item) {
			cmd = new RotateItemCommand().initWithObject(data);
			if (item instanceof Node) {
				cmd._cmd = RotateNodeCommand.createFromObject(data, context);
			} else if (item instanceof Edge) {
				cmd._cmd = RotateEdgeCommand.createFromObject(data, context);
			} else {
				cmd._cmd = InternalRotateItemCommand.createFromObject(
					data,
					context
				);
			}
		}
		return cmd;
	}

	constructor(item, angle, point) {
		const cmd = createCommand(item, angle, point);
		super(cmd);
	}
}

module.exports = RotateItemCommand;
