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
const Command = require('./Command');
const { readObject, writeJSON } = require('./utils');
const Arrays = require('../../commons/Arrays');
const Size = require('../Size');
const Edge = require('../model/Edge');
const GraphItem = require('../model/GraphItem');

/**
 * Action definitions used in SizeItemsCommand
 * @class SizeItems
 */
const Action = {
	/**
	 * Vertically size items to highest item in group.
	 * @property VERTICALMAX
	 * @type {Number}
	 * @final
	 */
	VERTICALMAX: 0,
	/**
	 * Vertically size items to smallest item in group.
	 * @property VERTICALMIN
	 * @type {Number}
	 * @final
	 */
	VERTICALMIN: 1,
	/**
	 * Horizontally size items to widest item in group.
	 * @property HORIZONTALMAX
	 * @type {Number}
	 * @final
	 */
	HORIZONTALMAX: 2,
	/**
	 * Horizontally size items to smallest item in group.
	 * @property HORIZONTALMIN
	 * @type {Number}
	 * @final
	 */
	HORIZONTALMIN: 3,
	/**
	 * Size items to item with largest width and item with largest height in group.
	 * @property AREAMAX
	 * @type {Number}
	 * @final
	 */
	MAX: 4,
	/**
	 * Size items to item with smallest width and item with smallest height in group.
	 * @property AREAMIN
	 * @type {Number}
	 * @final
	 */
	MIN: 5
};

/**
 * Size a group of items based on a passed flag.
 *
 * @example
 *     // interactionhandler and items given
 *     var cmd = new SizeItemsCommand(items, SizeItemsCommand.Action.HORIZONTALMAX);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class SizeItemsCommand
 * @extends Command
 * @constructor
 * @param {GraphItem[]} items Array of
 *     GraphItems.
 * @param {SizeItemsCommand.Action} sizeFlag Action to execute.
 */
class SizeItemsCommand extends Command {
	static createFromObject(data = {}, { graph }) {
		const items = data.items.reduce((allItems, id) => {
			const item = graph.getItemById(id);
			if (item) allItems.push(item);
			return allItems;
		}, []);
		return items.length
			? new SizeItemsCommand(items, data.flag).initWithObject(data)
			: undefined;
	}

	constructor(items, sizeFlag) {
		super();

		this.items = [];
		this.sizes = [];
		this.sizeFlag = sizeFlag;

		items.forEach((item) => {
			if (!(item instanceof GraphItem)) {
				item = item.getModel();
			}
			if (
				!(item instanceof Edge) &&
				item
					.getItemAttributes()
					.getSizeable()
					.getValue()
			) {
				this.sizes.push(item.getSize(true).copy());
				this.items.push(item);
			}
		});
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd.sizes = data.sizes.map((size) =>
			readObject('size', data.size, new Size())
		);
		return cmd;
	}

	static get Action() {
		return Action;
	}

	toObject() {
		const data = super.toObject();
		data.flag = this.sizeFlag;
		data.items = this.items.map((item) => item.getId());
		data.sizes = this.sizes.map((size) => writeJSON('size', size));
		return data;
	}

	restoreStateAfterUndo(viewer) {
		this.selectAll(this.items, viewer);
	}

	restoreStateAfterRedo(viewer) {
		this.selectAll(this.items, viewer);
	}

	doAfterUndo(selection) {
		// select items
		Arrays.addAll(selection, this.items);
	}

	doAfterRedo(selection) {
		// select items
		Arrays.addAll(selection, this.items);
	}

	/**
	 * Execute size operation.
	 *
	 * @method execute
	 */
	execute() {
		this.redo();
	}

	/**
	 * Undo size command.
	 *
	 * @method undo
	 */
	undo() {
		this.items.forEach((item, i) => {
			item.setSizeTo(this.sizes[i]);
			item.getSize(true).evaluate(item);
		});
	}

	/**
	 * Redo size command.
	 *
	 * @method redo
	 */
	redo() {
		if (!this.items.length) {
			return;
		}

		let width = 0;
		let height = 0;
		let minWidth = this.items[0].getWidth().getValue();
		let maxWidth = minWidth;
		let minHeight = this.items[0].getHeight().getValue();
		let maxHeight = minHeight;
		let minArea = minWidth * minHeight;
		let maxArea = minArea;
		let minAreaWidth = minWidth;
		let minAreaHeight = minHeight;
		let maxAreaWidth = maxWidth;
		let maxAreaHeight = maxHeight;
		let i;
		let item;

		for (i = 1; i < this.items.length; i += 1) {
			item = this.items[i];
			width = item.getWidth().getValue();
			height = item.getHeight().getValue();
			minWidth = Math.min(minWidth, width);
			minHeight = Math.min(minHeight, height);
			maxWidth = Math.max(width, maxWidth);
			maxHeight = Math.max(height, maxHeight);

			if (width * height > maxArea) {
				maxAreaWidth = width;
				maxAreaHeight = height;
				maxArea = width * height;
			}
			if (width * height < minArea) {
				minAreaWidth = width;
				minAreaHeight = height;
				minArea = width * height;
			}
		}

		this.items.forEach((litem) => {
			switch (this.sizeFlag) {
				case SizeItemsCommand.Action.VERTICALMAX:
					litem.setHeight(maxHeight);
					break;
				case SizeItemsCommand.Action.VERTICALMIN:
					litem.setHeight(minHeight);
					break;
				case SizeItemsCommand.Action.HORIZONTALMAX:
					litem.setWidth(maxWidth);
					break;
				case SizeItemsCommand.Action.HORIZONTALMIN:
					litem.setWidth(minWidth);
					break;
				case SizeItemsCommand.Action.MAX:
					litem.setSize(maxAreaWidth, maxAreaHeight);
					break;
				case SizeItemsCommand.Action.MIN:
					litem.setSize(minAreaWidth, minAreaHeight);
					break;
				default:
					break;
			}
		});
	}
}

module.exports = SizeItemsCommand;
