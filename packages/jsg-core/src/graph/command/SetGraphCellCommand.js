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
const { restoreExpression, writeExpression } = require('./utils');
const AbstractItemCommand = require('./AbstractItemCommand');
const Expression = require('../expr/Expression');

module.exports = class SetGraphCellCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		const name = item && item.getDataProvider().getGraph(data.newName);
		return name
			? new SetGraphCellCommand(
					item,
					name,
					data.newName,
					data.newExprStr
			  ).initWithObject(data)
			: undefined;
	}

	constructor(item, name, newName, newExpression) {
		super(item);

		this._name = name;
		this._newName = newName;
		this._oldName = name.getName();
		this._newExprStr = newExpression;
		this._oldExpression = name.getExpression();
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldName = cmd._graphItem
			.getDataProvider()
			.getGraph(data.sheetname)
			.getName();
		if (data.undo.expr)
			cmd._oldExpression = restoreExpression(
				data.undo.expr,
				cmd._graphItem
			);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.newName = this._newName;
		data.sheetname = this._oldName;
		data.newExprStr = this._newExprStr;
		// written for machine-server :-(
		data.expr = writeExpression(this._name.getExpression());
		// oldExpression might not be defined...
		if (this._oldExpression)
			data.undo.expr = writeExpression(this._oldExpression);
		return data;
	}

	undo() {
		const data = this._graphItem.getDataProvider();

		this._name.setName(this._oldName);
		this._name.setExpression(this._oldExpression);

		data.invalidateTerms();
		data.evaluate(this._graphItem);

		this._graphItem.getGraph().markDirty();
	}

	redo() {
		const data = this._graphItem.getDataProvider();

		this._name.setName(this._newName);
		this._name.setExpression(new Expression(0, this._newExprStr));

		data.invalidateTerms();
		data.evaluate(this._graphItem);

		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo() {}
};
