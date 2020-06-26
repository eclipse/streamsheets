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
const Point = require('../../geometry/Point');
const Command = require('./Command');
const Node = require('../model/Node');
const Pin = require('../Pin');
const { readObject, writeJSON } = require('./utils');
const ShapePointsMap = require('./ShapePointsMap');

/**
 * Command to translate the {{#crossLink "Pin"}}{{/crossLink}} of one or several
 * {{#crossLink "GraphItem"}}{{/crossLink}} by a specified offset, which must be
 * passed as last parameter.
 *
 * @example
 *     // interactionhandler and items given
 *     // translate items by 1cm to the right and down
 *     var cmd = new TranslateItemsCommand(item1, item2, new Point(1000, 1000));
 *     //analog command: new TranslateItemsCommand([item1, item2], new Point(1000,
 *     1000)); interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class TranslateItemsCommand
 * @extends Command
 * @constructor
 * @param {GraphItem} items* GraphItem(s) to be moved.
 * @param {Point} translation Offset to move by.
 */
class TranslateItemsCommand extends Command {
	static createFromObject(data = {}, { graph }) {
		const items = data.items.reduce((allItems, info) => {
			const item = graph.getItemById(info.id);
			if (item) allItems.push(item);
			return allItems;
		}, []);
		const offset = new Point(data.offset.x, data.offset.y);
		return items.length
			? new TranslateItemsCommand(items, offset).initWithObject(data)
			: undefined;
	}

	constructor(...args) {
		super();

		let i;
		let j;
		const n = args.length;

		// to preserve points of each attached edge:
		this._pointsMap = new ShapePointsMap();

		const addEdgePointsOf = (node, map) => {
			const ports = node.getPorts();
			// preserve current points of each attached edge:
			ports.forEach((port) => {
				map.store(port.getIncomingEdges());
				map.store(port.getOutgoingEdges());
			});
		};

		const pushItem = (item) => {
			this._items.push(item);
			this._itempins.push(item.getPin().copy());
			if (item instanceof Node) {
				addEdgePointsOf(item, this._pointsMap);
			}
		};

		this.translation = args[n - 1].copy();
		this._items = [];
		this._itempins = [];

		for (i = 0; i < n - 1; i += 1) {
			if (Array.isArray(args[i])) {
				const items = args[i];
				for (j = 0; j < items.length; j += 1) {
					pushItem(items[j]);
				}
			} else {
				pushItem(args[i]);
			}
		}
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._itempins = data.itempins.map((pin, index) =>
			readObject('pin', pin, new Pin(cmd._items[index]))
		);
		cmd._pointsMap.map.setMap(data.pointsMap);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.offset = this.translation;
		data.items = this._items.map((item) => item.getId());
		data.itempins = this._itempins.map((pin) => writeJSON('pin', pin));
		data.pointsMap = this._pointsMap.map.getMap();
		return data;
	}

	execute() {
		this.redo();
	}

	undo() {
		function restoreAttachedEdges(node, map) {
			const ports = node.getPorts();

			ports.forEach((port) => {
				map.restore(port.getIncomingEdges());
				map.restore(port.getOutgoingEdges());
			});
		}

		this._items.forEach((item, i) => {
			item.getPin().setTo(this._itempins[i]);
			item.getPin().evaluate(item);
			if (item instanceof Node) {
				restoreAttachedEdges(item, this._pointsMap);
			}
		});
	}

	redo() {
		const offset = this.translation;

		this._items.forEach((item) => {
			item.translate(offset.x, offset.y);
		});
	}
}

module.exports = TranslateItemsCommand;
