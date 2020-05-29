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
const { toCellRanges } = require('./utils');

module.exports = class CreateHeaderLevelsFromRangeCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const item = graph.getItemById(data.itemId);
		const ranges = item && toCellRanges(data.ranges, graph);
		if (ranges && ranges.length) {
			cmd = new CreateHeaderLevelsFromRangeCommand(
				item,
				ranges
			).initWithObject(data);
		}
		return cmd;
	}

	constructor(item, ranges, key) {
		super(item);

		this._item = item;
		this._ranges = ranges.map((range) => range.copy());
	}

	toObject() {
		const data = super.toObject();
		data.ranges = this._ranges.map((range) => range.toObject());
		return data;
	}

	undo() {
		this._graphItem.getGraph().markDirty();
	}

	redo() {
		let i;

		this._graphItem.getHeaderAttributes().setOutlineDirection('above');
		// identify type of change
		this._ranges.forEach((range) => {
			for (i = range._y1; i <= range._y2; i += 1) {
				const attr = range.getSheet().getCellAttributesAtRC(range._x1, i);
				if (attr) {
					const level = attr.getLevel().getValue();
					this._graphItem.setSectionLevel(i, level);
				}
			}
		});


		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo() {}
};
