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

class SetLayoutSectionCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const item = graph.getItemById(data.itemId);
		if (item) {
			cmd = new SetLayoutSectionCommand(item, data.index, data.row, data.size, data.minSize,
				data.sizeMode, data.expandable, data.expanded, data.undo).initWithObject(data);
		}
		return cmd;
	}

	constructor(item, index, row, size, minSize, sizeMode, expandable, expanded, undoState, resizeInfo) {
		super(item);

		this._index = index;
		this._row = row;
		this._size = size;
		this._sizeMode = sizeMode;
		this._minSize = minSize;
		this._expandable = expandable;
		this._expanded = expanded;
		this._undo = undoState
		this._resizeInfo = resizeInfo;
	}

	execute() {
		const section = this._row ? this.getItem().rowData[this._index] : this.getItem().columnData[this._index];

		section.minSize = this._minSize;
		section.size = this._size;
		section.sizeMode = this._sizeMode;
		section.expandable = this._expandable;
		section.expanded = this._expanded;

		this.getItem().getGraph().markDirty();
	}

	undo() {
		const item = this.getItem();
		const section = this._row ? item.rowData[this._index] : item.columnData[this._index];

		section.minSize = this._undo._minSize;
		section.size = this._undo._size;
		section.sizeMode = this._undo._sizeMode;
		section.expandable = this._undo._expandable;
		section.expanded = this._undo._expanded;

		if (this._resizeInfo) {
			const info = this._resizeInfo;
			if (this._row) {
				item.setHeight(info.size);
			} else  {
				item._columnData.forEach((column, index) => {
					column.size = info.sectionSizes[index];
				});
				item.setWidth(info.size);
			}
		}

		item.getGraph().markDirty();
	}

	redo() {
		this.execute();
	}

	toObject() {
		const data = super.toObject();

		data.index = this._index;
		data.row = this._row;
		data.size = this._size;
		data.sizeMode = this._sizeMode;
		data.minSize = this._minSize;
		data.expandable = this._expandable;
		data.expanded = this._expanded;
		data.undo = {
			size: this._undo._size,
			minSize: this._undo._minSize,
			sizeMode: this._undo._sizeMode,
			expandable: this._undo.expandable,
			expanded: this._undo.expanded
		}

		return data;
	}
}

module.exports = SetLayoutSectionCommand;
