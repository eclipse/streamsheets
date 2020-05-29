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
const TextNode = require('../model/TextNode');

/**
 * Command to assign a text format to an item.
 *
 * @example
 *     // interactionhandler given
 *     var newFormat = item.getTextFormat().copy();
 *     //OR var newFormat= new  TextFormatAttributes(); //fresh TextFormat attributes
 *     // set font name to Verdana
 *     newFormat.setFontName('Verdana');
 *     var cmd = new TextFormatItemCommand(item, newFormat);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class TextFormatItemCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item GraphItem to be formatted.
 * @param {TextFormatAttributes} newFormat Format to be applied.
 */
class TextFormatItemCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new TextFormatItemCommand(
					item,
					new Dictionary().setMap(data.map)
			  ).initWithObject(data)
			: undefined;
	}

	constructor(item, newFormat) {
		super(item);

		// this._property = property;
		this._oldFormat = item.getTextFormat().copy();
		this._newFormat = newFormat.copy();
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldFormatMap = new Dictionary().setMap(data.oldmap);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.map = this._newFormat.getMap();
		data.oldmap = this._oldFormatMap.getMap();
		return data;
	}

	/**
	 * Undo the text format operation.
	 *
	 * @method undo
	 */
	undo() {
		// this._setTextFormatTo(this._oldFormat);
		if (this._oldFormat.isEmpty()) {
			this._graphItem.getTextFormat().reset();
		} else {
			this._setTextFormatTo(this._oldFormat);
		}
	}

	/**
	 * Redo the text format operation.
	 *
	 * @method redo
	 */
	redo() {
		this._setTextFormatTo(this._newFormat);
	}

	_setTextFormatTo(format) {
		this._graphItem.getTextFormat().setFormatTo(format);

		if (this._graphItem instanceof TextNode) {
			this._graphItem.updateSize();
		}
	}
}

module.exports = TextFormatItemCommand;
