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
const { readObject, writeJSON } = require('./utils');
const AbstractItemCommand = require('./AbstractItemCommand');
const Expression = require('../expr/Expression');
const StringExpression = require('../expr/StringExpression');

/**
 * Command to assign a new text to a TextNode. The undo text must be provided, as key input is directly
 * assigned to the text node and we do not want to record each new key within the Command chain.
 *
 * @example
 *     // interactionhandler and node given
 *     var cmd = new SetTextCommand(item, 'UndoText', 'NewText);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class SetTextCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {TextNode} item Item to assign attribute to.
 * @param {StringExpression | String} undoText Text to use for undo.
 * @param {String} text New Text to assign to text node.
 */
class SetTextCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetTextCommand(item, data.newName).initWithObject(data)
			: undefined;
	}

	constructor(item, undoText, text) {
		super(item);

		this._oldText =
			undoText instanceof Expression
				? undoText.copy()
				: new StringExpression(undoText);
		this._newText = text;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldText = readObject(
			'oldtext',
			data.oldText,
			new StringExpression()
		);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.newText = this._newText;
		data.oldText = writeJSON('oldtext', this._oldText);
		return data;
	}

	/**
	 * Undo the text change.
	 *
	 * @method undo
	 */
	undo() {
		this._graphItem.setText(this._oldText);
	}

	/**
	 * Redo the text change.
	 *
	 * @method Redo
	 */
	redo() {
		this._graphItem.setText(this._newText);
		this._graphItem.evaluate();
	}
}

module.exports = SetTextCommand;
