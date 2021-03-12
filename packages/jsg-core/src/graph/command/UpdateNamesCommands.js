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
const Command = require('./Command');
const CompoundCommand = require('./CompoundCommand');

class SetGraphItemsCommand extends Command {
	static createFromObject(data = {}) {
		const { streamsheetIds, shapes } = data;
		return new SetGraphItemsCommand(streamsheetIds, shapes).initWithObject(data);
	}

	constructor(streamsheetIds = [], graphItems = []) {
		super();
		this._streamsheetIds = streamsheetIds.slice();
		this._graphItems = graphItems.slice();
		this.isVolatile = true;
	}

	toObject() {
		const data = super.toObject();
		data.streamsheetIds = this._streamsheetIds;
		data.graphItems = this._graphItems;
		return data;
	}

	undo() {}

	redo() {}

	doAfterRedo() {}

	doAfterUndo() {}
}

class UpdateSheetNamesCommand extends CompoundCommand {
	static createFromObject(data = {}, context) {
		return new UpdateSheetNamesCommand().initWithObject(data, context);
	}
}

module.exports = {
	UpdateSheetNamesCommand,
	SetGraphItemsCommand
};
