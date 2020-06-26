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
const ObjectFactory = require('../../ObjectFactory');
const { readObject, writeJSON } = require('./utils');
const InternalResizeItemCommand = require('./InternalResizeItemCommand');
const ShapePointsMap = require('./ShapePointsMap');
const TextNodeAttributes = require('../attr/TextNodeAttributes');
const BoundingBox = require('../../geometry/BoundingBox');
const TextNode = require('../model/TextNode');

/**
 * Command to resize a node.
 *
 * @example
 *     // interactionhandler and item given
 *     // resizing a node to assign a vertical and horizontal size of 2 cm, while keeping the position.
 *     var box = new BoundingBox(2000, 2000);
 *     var origin = item.getOrigin();
 *     box.setTopLeft(origin);
 *     var cmd = new ResizeNodeCommand(item, box);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class ResizeNodeCommand
 * @extends InternalResizeItemCommand
 * @constructor
 * @param {GraphItem} node The node to resize.
 * @param {BoundingBox} bbox The new node BoundingBox.
 */
class ResizeNodeCommand extends InternalResizeItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		const newbox = readObject('newbox', data.newbox, new BoundingBox());
		return item
			? new ResizeNodeCommand(item, newbox).initWithObject(data)
			: undefined;
	}

	constructor(node, bbox) {
		super(node, bbox);

		// for text nodes we set size mode:
		if (node instanceof TextNode) {
			const sizeMode = node.getItemAttributes().getSizeMode();
			this._oldSizeMode = sizeMode.getExpression().copy();

			if (sizeMode.getValue() !== TextNodeAttributes.SizeMode.NONE) {
				this._newSizeMode =
					sizeMode.getValue() | TextNodeAttributes.SizeMode.WIDTH;
				this._newSizeMode &= ~TextNodeAttributes.SizeMode.TEXT;
			}
		}

		const ports = node.getPorts();
		// preserve current points of each attached edge:
		this._pointsMap = new ShapePointsMap();
		ports.forEach((port) => {
			this._pointsMap.store(port.getIncomingEdges());
			this._pointsMap.store(port.getOutgoingEdges());
		});
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._pointsMap.map.setMap(data.pointsMap);
		cmd._newSizeMode = data.newSizeMode;
		if (data.oldSizeMode) {
			cmd._oldSizeMode = readObject(
				'oldsizemode',
				data.oldSizeMode.json,
				ObjectFactory.create(data.oldSizeMode.type)
			);
		}
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.oldSizeMode = this._oldSizeMode
			? {
					type: this._oldSizeMode.constructor.name,
					json: writeJSON('oldsizemode', this._oldSizeMode)
			  }
			: undefined;
		data.newSizeMode = this._newSizeMode;
		data.pointsMap = this._pointsMap.map.getMap();
		return data;
	}

	redo() {
		// set new size mode first so that size is correctly calculated:
		if (this._newSizeMode !== undefined) {
			this._graphItem.getItemAttributes().setSizeMode(this._newSizeMode);
		}

		super.redo();
	}

	undo() {
		// set old size mode first so that size is correctly calculated:
		if (this._oldSizeMode !== undefined) {
			this._graphItem.getItemAttributes().setSizeMode(this._oldSizeMode);
		}

		super.undo();

		// set old points again:
		const ports = this._graphItem.getPorts();

		ports.forEach((port) => {
			this._pointsMap.restore(port.getIncomingEdges());
			this._pointsMap.restore(port.getOutgoingEdges());
		});
	}
}

module.exports = ResizeNodeCommand;
