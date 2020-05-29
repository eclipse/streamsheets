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

module.exports = class SetHeaderSectionSizeCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const item = graph.getItemById(data.itemId);
		const ranges = item && toCellRanges(data.ranges, graph);
		if (ranges && ranges.length) {
			cmd = new SetHeaderSectionSizeCommand(
				item,
				data.index,
				ranges,
				data.size,
				data.visible,
				data.rows,
				undefined
			).initWithObject(data);
		}
		return cmd;
	}

	constructor(item, index, ranges, size, visible, rows, oldSize) {
		super(item);

		this._item = item;
		this._index = index;
		this._visible = visible;
		this._size = size;
		this._oldSize = oldSize;
		this._rows = rows;
		this._ranges = ranges.map((range) => range.copy());
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldSize = data.oldSize;
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.index = this._index;
		data.size = this._size;
		data.visible = this._visible;
		data.rows = this._rows;
		data.ranges = this._ranges.map((range) => range.toObject());
		data.oldSize = this._oldSize;
		return data;
	}

	undo() {
		this._graphItem.setSectionSize(this._index, this._oldSize);
		this._graphItem.getGraph().markDirty();
	}

	redo() {
		let rangeSet = this._ranges.length > 0;
		let rows = true;
		let cols = true;

		// identify type of change
		this._ranges.forEach((range) => {
			if (range.isSheetRange()) {
				rows = this._rows;
				cols = !this._rows;
			} else if (range.isRowRange()) {
				cols = false;
			} else if (range.isColumnRange()) {
				rows = false;
			} else {
				rangeSet = false;
			}
		});

		if (rangeSet && (cols || rows)) {
			this._ranges.forEach((range) => {
				if (range.isRowRange()) {
					range.enumerateRows((index) => {
						if (this._visible && this._size !== -1) {
							this._graphItem.setSectionSize(index, this._size);
						}
						this._graphItem.setSectionVisible(index, this._visible);
					});
				} else if (range.isColumnRange()) {
					range.enumerateColumns((index) => {
						if (this._visible && this._size !== -1) {
							this._graphItem.setSectionSize(index, this._size);
						}
						this._graphItem.setSectionVisible(index, this._visible);
					});
				}
			});
		} else if (this._index !== -1) {
			this._graphItem.setSectionSize(this._index, this._size);
		}

		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo() {}
};
