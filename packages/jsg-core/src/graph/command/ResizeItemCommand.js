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
const InternalResizeItemCommand = require('./InternalResizeItemCommand');
const ResizeEdgeCommand = require('./ResizeEdgeCommand');
const ResizeNodeCommand = require('./ResizeNodeCommand');
const Edge = require('../model/Edge');
const Node = require('../model/Node');

/**
 * Command to resize an object or set a new bounding box.
 *
 * @example
 *     // interactionhandler and item given
 *     // resizing an item to assign a vertical and horizontal size of 2 cm, while keeping the position.
 *     var box = new BoundingBox(2000, 2000);
 *     var origin = item.getOrigin();
 *     box.setTopLeft(origin);
 *     var cmd = new ResizeItemCommand(item, box);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class ResizeItemCommand
 * @extends Command
 * @constructor
 * @param {GraphItem} item GraphItem or line to change.
 * @param {BoundingBox} bbox New item dimensions.
 */
class ResizeItemCommand extends CompoundCommand {
	static createFromObject(data = {}, context) {
		return new ResizeItemCommand().initWithObject(data, context);
	}

	constructor(item, bbox) {
		super();
		if (item) {
			this._item = item;
			if (item instanceof Node) {
				this.add(new ResizeNodeCommand(item, bbox));
			} else if (item instanceof Edge) {
				this.add(new ResizeEdgeCommand(item, bbox));
			} else {
				this.add(new InternalResizeItemCommand(item, bbox));
			}
		}
	}

	initWithObject(data, context) {
		const cmd = super.initWithObject(data, context);
		cmd._item = cmd.commands.length ? cmd.commands[0].getItem() : undefined;
		return cmd._item ? cmd : undefined;
	}

	/**
	 * Get stored GraphItem
	 *
	 * @method getItem
	 * @return {GraphItem} Return handled GraphItem
	 */
	getItem() {
		return this._item;
	}
}

module.exports = ResizeItemCommand;
