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
const Dictionary = require('../../commons/Dictionary');
const AbstractItemCommand = require('./AbstractItemCommand');

/**
 * Command to apply a given format to an item.<br/>
 *
 * @example
 *     // interactionhandler given
 *     var format = new FormatAttributes();
 *     // set fill color to red
 *     format.setFillColor("#FF0000");
 *     var cmd = new FormatItemCommand(item, format);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class FormatItemCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item GraphItem to be formatted.
 * @param {Dictionary} newFormat Format to be applied.
 */
class FormatItemCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new FormatItemCommand(
					item,
					new Dictionary().setMap(data.map)
			  ).initWithObject(data)
			: undefined;
	}

	constructor(item, newFormat) {
		super(item);

		this._newFormatMap = newFormat.toMap();
		this._oldFormatMap = item.getFormat().toMap();
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldFormatMap = new Dictionary().setMap(data.oldmap);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.map = this._newFormatMap.getMap();
		data.oldmap = this._oldFormatMap.getMap();
		return data;
	}

	/**
	 * Undo the format operation.
	 *
	 * @method undo
	 */
	undo() {
		this._graphItem.getFormat().reset();
		this._graphItem
			.getFormat()
			.applyMap(this._oldFormatMap, this._graphItem);
	}

	/**
	 * Redo the format operation.
	 *
	 * @method redo
	 */
	redo() {
		this._graphItem
			.getFormat()
			.applyMap(this._newFormatMap, this._graphItem);
	}
}

module.exports = FormatItemCommand;
