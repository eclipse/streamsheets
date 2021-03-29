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

class SetPointSourceCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetPointSourceCommand(item, data.newSource).initWithObject(data)
			: undefined;
	}

	constructor(item, source) {
		super(item);

		this._oldSource = item.getShape().getSource().copy();
		this._newSource = source.copy();
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldSource = readObject(
			'oldsource',
			data.oldSource,
			new Expression()
		);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.newSource = writeJSON('newsource', this._newSource);
		data.oldSource = writeJSON('oldsource', this._oldSource);
		return data;
	}

	/**
	 * Undo the text change.
	 *
	 * @method undo
	 */
	undo() {
		this._graphItem.getShape().setSource(this._oldSource);
	}

	/**
	 * Redo the text change.
	 *
	 * @method Redo
	 */
	redo() {
		this._graphItem.getShape().setSource(this._newSource);
		this._graphItem.evaluate();
	}
}

module.exports = SetPointSourceCommand;
