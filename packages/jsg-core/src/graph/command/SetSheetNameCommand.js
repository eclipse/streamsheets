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
const MachineGraph = require('../model/MachineGraph');
const { restoreExpression, writeExpression } = require('./utils');

/**
 * @class SetSheetNameCommand
 * @type {module.SetSheetNameCommand}
 */
module.exports = class SetSheetNameCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const item = graph.getItemById(data.itemId);
		const name = item ? item.getDataProvider().getGraph(data.newName) : graph.getSheetName(data.sheetname);
		if (name) {
			const newExpression = restoreExpression(data.expr, item || graph);
			cmd = new SetSheetNameCommand(item || graph, name, data.newName, newExpression).initWithObject(data);
		}
		return cmd;
	}

	constructor(item, name, newName, newExpression) {
		super(item);

		this._name = name;
		this._newName = newName;
		this._oldName = name.getName();
		this._newExpression = newExpression;
		this._oldExpression = name.getExpression();
	}

	toObject() {
		const data = super.toObject();
		data.newName = this._newName;
		data.sheetname = this._oldName;
		data.expr = writeExpression(this._newExpression);
		data.undo.expr = writeExpression(this._oldExpression);
		return data;
	}

	undo() {
		this._name.setName(this._oldName);
		this._name.setExpression(this._oldExpression);

		if (this._graphItem instanceof MachineGraph) {
			this._graphItem.invalidateTerms();
			this._graphItem.evaluate(this._graphItem);
		} else {
			const data = this._graphItem.getDataProvider();
			data.invalidateTerms();
			data.evaluate(this._graphItem.getItem());
		}

		this._graphItem.getGraph().markDirty();
	}

	redo() {
		this._name.setName(this._newName);
		this._name.setExpression(this._newExpression);

		if (this._graphItem instanceof MachineGraph) {
			this._graphItem.invalidateTerms();
			this._graphItem.evaluate(this._graphItem);
		} else {
			const data = this._graphItem.getDataProvider();
			data.invalidateTerms();
			data.evaluate(this._graphItem);
		}

		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo() {}
};
