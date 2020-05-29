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
const GraphItem = require('../model/GraphItem');
const LineConnection = require('../model/LineConnection');
const Pin = require('../Pin');
const Arrays = require('../../commons/Arrays');
const GraphUtils = require('../GraphUtils');
const NumberExpression = require('../expr/NumberExpression');

/**
 * Alignment definitions
 * @class Alignment
 */
const Alignment = {
	/**
	 * Align items to the top.
	 * @property TOP
	 * @type {Number}
	 * @final
	 */
	TOP: 0,
	/**
	 * Align items to the vertical center.
	 * @property MIDDLE
	 * @type {Number}
	 * @final
	 */
	MIDDLE: 1,
	/**
	 * Align items to the bottom.
	 * @property BOTTOM
	 * @type {Number}
	 * @final
	 */
	BOTTOM: 2,
	/**
	 * Align items to the left.
	 * @property LEFT
	 * @type {Number}
	 * @final
	 * @deprecated Use class constants
	 */
	LEFT: 3,
	/**
	 * Align items to the horizontal center.
	 * @property CENTER
	 * @type {Number}
	 * @final
	 */
	CENTER: 4,
	/**
	 * Align items to the right.
	 * @property RIGHT
	 * @type {Number}
	 * @final
	 */
	RIGHT: 5,
	/**
	 * Distribute items evenly in the horizontal direction.
	 * @property HDISTRIBUTE
	 * @type {Number}
	 * @final
	 */
	HDISTRIBUTE: 6,
	/**
	 * Distribute items evenly in the vertical direction.
	 * @property VDISTRIBUTE
	 * @type {Number}
	 * @final
	 */
	VDISTRIBUTE: 7
};

/**
 *
 * The AlignItemsCommand provides a command to align selected GraphItems using different alignment flags.
 * The following example creates AlignItemsCommand and executes it. Using the interaction handler it is automatically
 * added to the undo/redo stack.
 *
 * @example
 *     var alignCommand = new AlignItemsCommand(items, AlignItemsCommand.Alignment.CENTER);
 *     interactionHandler.execute(alignCommand);
 *
 * @class AlignItemsCommand
 * @extends Command
 * @constructor
 * @param {GraphItem[]} items Array of GraphItems to align.
 * @param {AlignItemsCommand.Alignment} alignFlag Defines the alignment direction to use.
 */
class AlignItemsCommand extends Command {
	static createFromObject(data = {}, { graph }) {
		const items = data.items.reduce((allItems, info) => {
			const item = graph.getItemById(info.id);
			if (item) allItems.push(item);
			return allItems;
		}, []);
		return items.length
			? new AlignItemsCommand(items, data.flag).initWithObject(data)
			: undefined;
	}

	constructor(items, alignFlag) {
		super();

		this._iteminfos = [];
		this._alignFlag = alignFlag;

		// TODO same parent verify
		items.forEach((item) => {
			if (!(item instanceof GraphItem)) {
				item = item.getModel();
			}
			if (
				!(item instanceof LineConnection) &&
				item
					.getItemAttributes()
					.getMoveable()
					.getValue()
			) {
				this._iteminfos.push({
					item,
					pin: item.getPin().copy(),
					angle: item.getAngle().copy()
				});
			}
		});
	}

	static get Alignment() {
		return Alignment;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		data.items.forEach((info, index) => {
			const iteminfo = cmd._iteminfos[index];
			if (iteminfo) {
				iteminfo.pin = readObject(
					'pin',
					info.pin,
					new Pin(iteminfo.item)
				);
				iteminfo.angle = readObject(
					'angle',
					info.angle,
					new NumberExpression()
				);
			}
		});
		return cmd;
	}

	toObject() {
		const data = super.toObject();

		data.flag = this._alignFlag;
		data.items = this._iteminfos.map((info) => ({
			id: info.item.getId(),
			pin: writeJSON('pin', info.pin),
			angle: writeJSON('angle', info.angle)
		}));
		return data;
	}

	restoreStateAfterUndo(viewer) {
		this.selectAll(this.getItemsFromInfos(), viewer);
	}

	restoreStateAfterRedo(viewer) {
		this.selectAll(this.getItemsFromInfos(), viewer);
	}

	doAfterRedo(selection /* , viewer */) {
		Arrays.addAll(selection, this.getItemsFromInfos());
	}

	doAfterUndo(selection /* , viewer */) {
		Arrays.addAll(selection, this.getItemsFromInfos());
	}

	getItemsFromInfos() {
		const items = [];

		this._iteminfos.forEach((info) => {
			items.push(info.item);
		});

		return items;
	}

	/**
	 * Execute the alignment of the GraphItems.
	 *
	 * @method execute
	 */
	execute() {
		this.redo();
	}

	/**
	 * Undo the alignment operation. The position of the GraphItems are restored.
	 *
	 * @method undo
	 */
	undo() {
		this._iteminfos.forEach((info) => {
			const { item } = info;
			item.setAngle(info.angle);
			item.getPin().setTo(info.pin);

			item.getAngle().evaluate(item);
			item.getPin().evaluate(item);
		});
	}

	/**
	 * Redo a previously undone alignment command.
	 *
	 * @method redo
	 */
	redo() {
		if (this._iteminfos.length === 0) {
			return;
		}

		let left;
		let right;
		let top;
		let bottom;
		let widthSum = 0;
		let heightSum = 0;
		const sortedItemsX = [];
		// array that contains the items sorted by coordinate position
		const sortedItemsY = [];
		// array that contains the items sorted by coordinate position

		const tmpbox = JSG.boxCache.get();
		const itembox = JSG.boxCache.get();
		const tmprect = JSG.rectCache.get();
		const itemrect = JSG.rectCache.get();
		const graph = this._iteminfos[0].item.getGraph();
		let j;
		let boundingRectSorted;
		let boundingRect;

		this._iteminfos.forEach((info, i) => {
			boundingRect = info.item
				.getTranslatedBoundingBox(graph, itembox)
				.getBoundingRectangle(itemrect);
			if (i) {
				left = Math.min(left, boundingRect.x);
				top = Math.min(top, boundingRect.y);
				right = Math.max(right, boundingRect.getRight());
				bottom = Math.max(bottom, boundingRect.getBottom());
				widthSum += boundingRect.width;
				heightSum += boundingRect.height;
				for (j = 0; j < sortedItemsX.length; j += 1) {
					boundingRectSorted = sortedItemsX[j]
						.getTranslatedBoundingBox(graph, tmpbox)
						.getBoundingRectangle(tmprect);
					if (boundingRectSorted.x >= boundingRect.x) {
						Arrays.insertAt(sortedItemsX, j, info.item);
						break;
					}
				}
				if (j === sortedItemsX.length) {
					sortedItemsX.push(info.item);
				}
				for (j = 0; j < sortedItemsY.length; j += 1) {
					boundingRectSorted = sortedItemsY[j]
						.getTranslatedBoundingBox(graph, tmpbox)
						.getBoundingRectangle(tmprect);
					if (boundingRectSorted.y >= boundingRect.y) {
						Arrays.insertAt(sortedItemsY, j, info.item);
						break;
					}
				}
				if (j === sortedItemsY.length) {
					sortedItemsY.push(info.item);
				}
			} else {
				left = boundingRect.x;
				top = boundingRect.y;
				right = boundingRect.getRight();
				bottom = boundingRect.getBottom();
				widthSum = boundingRect.width;
				heightSum = boundingRect.height;
				sortedItemsX.push(info.item);
				sortedItemsY.push(info.item);
			}
		});

		let currentPosX = left;
		let currentPosY = top;
		let pinPoint = JSG.ptCache.get();
		let center;
		let space;

		this._iteminfos.forEach((info, i) => {
			pinPoint = info.item.getPinPoint(pinPoint);
			boundingRect = info.item
				.getTranslatedBoundingBox(graph, itembox)
				.getBoundingRectangle(itemrect);
			GraphUtils.translatePointUp(pinPoint, info.item.getParent(), graph);
			switch (this._alignFlag) {
				case AlignItemsCommand.Alignment.HDISTRIBUTE:
					if (this._iteminfos.length) {
						space =
							(right - left - widthSum) /
							(this._iteminfos.length - 1);
						const sitemX = sortedItemsX[i];
						info = this._getInfoForItem(sitemX);
						info.item.getPinPoint(pinPoint);
						boundingRect = sitemX
							.getTranslatedBoundingBox(graph, tmpbox)
							.getBoundingRectangle(tmprect);
						pinPoint.x += currentPosX - boundingRect.x;
						sitemX.setPinPointTo(pinPoint);
						currentPosX += space + boundingRect.width;
					}
					break;
				case AlignItemsCommand.Alignment.VDISTRIBUTE:
					if (this._iteminfos.length) {
						space =
							(bottom - top - heightSum) /
							(this._iteminfos.length - 1);
						const sitemY = sortedItemsY[i];
						info = this._getInfoForItem(sitemY);
						info.item.getPinPoint(pinPoint);
						boundingRect = sitemY
							.getTranslatedBoundingBox(graph, tmpbox)
							.getBoundingRectangle(tmprect);
						pinPoint.y += currentPosY - boundingRect.y;
						sitemY.setPinPointTo(pinPoint);
						currentPosY += space + boundingRect.height;
					}
					break;
				case AlignItemsCommand.Alignment.TOP:
					pinPoint.y += top - boundingRect.y;
					this._setPinPoint(pinPoint, graph, info.item);
					break;
				case AlignItemsCommand.Alignment.MIDDLE:
					center = (bottom + top) / 2;
					pinPoint.y += center - boundingRect.getCenterY();
					this._setPinPoint(pinPoint, graph, info.item);
					break;
				case AlignItemsCommand.Alignment.BOTTOM:
					pinPoint.y += bottom - boundingRect.getBottom();
					this._setPinPoint(pinPoint, graph, info.item);
					break;
				case AlignItemsCommand.Alignment.LEFT:
					pinPoint.x += left - boundingRect.x;
					this._setPinPoint(pinPoint, graph, info.item);
					break;
				case AlignItemsCommand.Alignment.CENTER:
					center = (right + left) / 2;
					pinPoint.x += center - boundingRect.getCenterX();
					this._setPinPoint(pinPoint, graph, info.item);
					break;
				case AlignItemsCommand.Alignment.RIGHT:
					pinPoint.x += right - boundingRect.getRight();
					this._setPinPoint(pinPoint, graph, info.item);
					break;
				default:
					break;
			}
		});

		JSG.ptCache.release(pinPoint);
		JSG.boxCache.release(itembox, tmpbox);
		JSG.rectCache.release(itemrect, tmprect);
	}

	_setPinPoint(pinPoint, graph, item) {
		GraphUtils.translatePointDown(pinPoint, graph, item.getParent());
		item.setPinPointTo(pinPoint);
	}

	_getInfoForItem(item) {
		const itemId = item.getId();

		for (let i = 0; i < this._iteminfos.length; i += 1) {
			const info = this._iteminfos[i];
			if (itemId === info.item.getId()) {
				return info;
			}
		}

		return undefined;
	}
}

module.exports = AlignItemsCommand;
