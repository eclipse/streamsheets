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
const AbstractItemCommand = require('./AbstractItemCommand');
const TextNode = require('../model/TextNode');

/**
 * A command that handles adding a label to a GraphItem. The label is added as a sub item of the parent item provided,
 * if the command gets executed.
 *
 * @example
 *     var parent = new GraphItem(new RectangleShape());
 *     var cmd = new AddLabelCommand(parent, "New Label");
 *     interactionHandler.execute(cmd);
 *
 * @class AddLabelCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} parent Parent item of the label.
 * @param {String} text Text content of the label.
 */
class AddLabelCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const item = graph.getItemById(data.itemId);
		if (item) {
			cmd = new AddLabelCommand(item, data.text).initWithObject(data);
			cmd._label = graph.getItemById(data.labelId);
		}
		return cmd;
	}

	constructor(parent, text) {
		super(parent);

		this._text = text;
		this._index = 0;
		this._label = undefined;
	}

	// overwritten to keep added/removed label! old version didn't work if added label is removed afterwards (by
	// DeleteItemCommand) and undo/redo is used several times (e.g. 10x)...
	execute() {
		const label = new TextNode(this._text);
		this._label = this._graphItem.addLabel(label);
		this._index = this._label.getIndex();
	}

	/**
	 * Undo the previously executed operation. The label will be removed from the GraphItem.
	 *
	 * @method undo
	 */
	undo() {
		this._graphItem.removeItem(this._label);
	}

	/**
	 * Redo the command. Here the label is attached to the GraphItem again.
	 *
	 * @method redo
	 */
	redo() {
		this._graphItem.addItem(this._label, this._index);
	}

	doAfterRedo(/* selection, viewer */) {}

	doAfterUndo(/* selection, viewer */) {}

	toObject() {
		const data = super.toObject();

		data.text = this._text;
		data.labelId = this._label.getId();

		return data;
	}
}

module.exports = AddLabelCommand;
