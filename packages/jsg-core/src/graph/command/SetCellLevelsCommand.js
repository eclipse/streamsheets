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
const Point = require('../../geometry/Point');
const CellRange = require('../model/CellRange');
const { toCellRanges } = require('./utils');

module.exports = class SetCellLevelsCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const ranges = toCellRanges(data.ranges, graph);
		const sheet = graph.getItemById(data.ranges[0].id);
		return ranges && ranges.length
			? new SetCellLevelsCommand(sheet, ranges, data.down).initWithObject(
					data
			  )
			: undefined;
	}
	constructor(item, ranges, down) {
		super(item);

		this._ranges = [];
		this._levels = {};

		const sheet = this._graphItem;
		const tmprange = new CellRange(sheet, 0, 0, 0, 0);

		ranges.forEach((range) => {
			this._ranges.push(range.copy());
			range.enumerateCells(false, (pos) => {
				const cellAttr = sheet.getCellAttributesAt(pos);
				tmprange.set(pos.x, pos.y);
				tmprange.shiftToSheet();
				this._levels[
					tmprange.toString()
				] = cellAttr.getLevel().getValue();
			});
		});
		this._down = down;
	}
	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._levels = data.levels;
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		const sheet = this._graphItem;
		const tmprange = new CellRange(sheet, 0, 0, 0, 0);

		data.down = this._down;
		data.ranges = [];
		data.levels = {};

		this._ranges.forEach((range) => {
			data.ranges.push(range.toObject());
			range.enumerateCells(false, (pos) => {
				const cellAttr = sheet.getCellAttributesAt(pos);
				tmprange.set(pos.x, pos.y);
				tmprange.shiftToSheet();
				data.levels[
					tmprange.toString()
				] = cellAttr.getLevel().getValue();
			});
		});

		return data;
	}

	undo() {
		const data = this._graphItem.getCells().getDataProvider();

		Object.entries(this._levels).forEach(([reference, level]) => {
			const res = CellRange.refToRC(reference, this._graphItem);
			const pos = new Point(
				res.column - this._graphItem.getColumns().getInitialSection(),
				res.row
			);
			const cell = data.get(pos);
			if (cell) {
				cell.getAttributes().setLevel(level);
			}
		});
	}

	redo() {
		const sheet = this._graphItem;
		const data = sheet.getDataProvider();

		this._ranges.forEach((range) => {
			range.enumerateCells(false, (pos) => {
				// get format for cell
				const attr = sheet.getCellAttributesAt(pos);
				if (attr.getKey().getValue()) {
					let currentLevel = attr.getLevel().getValue();
					const cell = data.create(pos);
					const newAttr = cell.getOrCreateAttributes();
					if (this._down) {
						if (currentLevel) {
							currentLevel -= 1;
						}
					} else {
						const attrAbove = sheet.getCellAttributesAtRC(
							pos.x,
							pos.y - 1
						);
						const aboveLevel = attrAbove.getLevel().getValue();
						if (currentLevel <= aboveLevel) {
							currentLevel += 1;
						}
					}
					newAttr.setLevel(currentLevel);
				}
			});
		});

		sheet.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo() {}
};
