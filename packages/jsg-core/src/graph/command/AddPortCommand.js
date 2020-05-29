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
const { readGraphItem } = require('./utils');
const AbstractItemCommand = require('./AbstractItemCommand');
const Point = require('../../geometry/Point');
const JSONWriter = require('../../commons/JSONWriter');

/**
 * A command to add a port to a node. The location of the port must be defined to place the port.
 *
 * @example
 *     // using an existing parent node and interactionhandler
 *     // Create a port at the vertical center of the left border
 *     var cmd = new AddPortCommand(new Port(), new Point(0, 0.5),
 *     parentNode, true); interactionHandler.execute(cmd); interactionHandler.undo();   //undo command
 *     interactionHandler.redo();   //redo it again
 *
 * @class AddPortCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {Port} port Port to add.
 * @param {Point} location Point with location of the port. If relative is true, the x and y values define
 *     the fraction of the extent of the node, where the ports shall be placed, e.g. 0.5, 0.5 places the port at the
 *     center of the node. If relative is false, the given location coordinates are used to calculate the relative
 *     position.
 * @param {Node} parent Node to add the port to.
 * @param {Boolean} [relative] True, if location is given as a relative position between 0 and 1 within the node,
 *     false, if position is given in coordinates. Default value is false.
 */
class AddPortCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const port = readGraphItem(data.json, 'port');
		const parent = graph.getItemById(data.parentId);
		if (parent && port) {
			cmd = new AddPortCommand(
				port,
				new Point(data.location.x, data.location.y),
				parent,
				data.relative
			);
			cmd.initWithObject(data);
		}
		return cmd;
	}

	constructor(port, location, parent, relative) {
		super(port);

		this._parent = parent;
		this._location = location.copy();
		this._relative = relative === undefined ? false : relative;
	}

	/**
	 * Remove previously created node.
	 *
	 * @method undo
	 */
	undo() {
		this._parent.removePort(this._graphItem);
	}

	/**
	 * Recreate from previous undo operation.
	 *
	 * @method redo
	 */
	redo() {
		if (this._relative) {
			this._parent.addPortAtRelativeLocation(
				this._graphItem,
				this._location
			);
		} else {
			this._parent.addPortAtLocation(this._graphItem, this._location);
		}
	}

	doAfterRedo(/* selection, viewer */) {}

	doAfterUndo(/* selection, viewer */) {}

	toObject() {
		const data = super.toObject();

		data.location = this._location;
		data.parentId = this._parent.getId();
		data.relative = this._relative;

		const writer = new JSONWriter();
		writer.writeStartDocument();
		this._graphItem.save(writer);
		writer.writeEndDocument();

		data.json = writer.flush();

		return data;
	}
}

module.exports = AddPortCommand;
