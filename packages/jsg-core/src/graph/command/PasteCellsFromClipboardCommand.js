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
const JSONReader = require('../../commons/JSONReader');
const { copycells, toCellRange } = require('./utils');

// TODO: actually this should be a CompoundCommand, but GraphServer splits it into separated commands and this
// is unwanted if cells should be deleted before!!
module.exports = class PasteCellsFromClipboardCommand extends Command {
	static createFromObject(data = {}, context) {
		const target = toCellRange(data.target, context.graph);
		const reader = new JSONReader(data.data);
		const clData = target.getSheet().readFromClipboard(reader);
		return new PasteCellsFromClipboardCommand(
			target,
			clData,
			data.data,
			data.action,
			data.fill
		).initWithObject(data, context);
	}

	constructor(target, data, json, action, fill) {
		super();

		this._data = data;
		this._json = json;
		this._action = action;
		this._fill = fill;
		this._target = target;
		this._cutCmd = undefined;
		this._seriesCmd = undefined;
		this._oldJson = this._target.getSheet().saveForUndo();
	}

	initWithObject(data, { graph, viewer, factory }) {
		const cmd = super.initWithObject(data);
		if (data.cutCmd) {
			// graph is wrong, but is not used yet
			cmd.addCut(factory.createCommand(graph, data.cutCmd, viewer));
		}
		if (data.seriesCmd) {
			cmd.addSeries(
				factory.createCommand(
					cmd._target.getSheet(),
					data.seriesCmd,
					viewer
				)
			);
		}
		cmd._oldJson = data.undo.json;
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.target = this._target.toObject();
		data.action = this._action;
		data.fill = this._fill;
		data.data = this._json;
		data.cutCmd = this._cutCmd && this._cutCmd.toObject();
		data.seriesCmd = this._seriesCmd && this._seriesCmd.toObject();
		// undo info
		data.undo.json = this._oldJson;

		// mserver info:
		// data.targetref = this._target.copy().shiftToSheet().toString();
		// data.sourceref = this._data.range.copy().shiftToSheet().toString();
		// sheet and range doesn't really match here?? with shiftToSheet() cell is not found and without ref is wrong
		const sheet = this._data.range.getSheet();
		const refAdjust = {
			row: 0,
			col: sheet.getColumns().getInitialSection()
		};
		data.sourcecells = copycells(this._data.range, this._action, refAdjust);
		// for undo we need target-cells as well: => TODO: improve!! actually we need only one of them...
		data.targetcells = copycells(
			this._target.copy().shiftToSheet(),
			this._action
		);

		return data;
	}

	get sheet() {
		return this._target ? this._target.getSheet() : undefined;
	}

	addCut(cmd) {
		this._cutCmd = cmd;
	}

	addSeries(cmd) {
		this._seriesCmd = cmd;
	}

	undo() {
		if (this._oldJson) {
			const sheet = this._target.getSheet();
			if (sheet) {
				sheet.readFromUndo(this._oldJson);
			}
			sheet.getGraph().markDirty();
		}
	}

	redo() {
		if (this._cutCmd) {
			this._cutCmd.execute();
		}
		this.paste();
		if (this._seriesCmd) {
			this._seriesCmd.execute();
		}
	}

	getCompleteTargetRange() {
		const sourceRange = this._data.range;
		const selectRange = this._target.copy();
		const width = sourceRange.getWidth();
		const height = sourceRange.getHeight();
		let vertical;
		let repeat = 1;
		let multiples;

		if (width > 1 || height > 1) {
			multiples = this._target.getHeight() / height;
			if (multiples > 1) {
				vertical = true;
			} else {
				multiples = this._target.getWidth() / width;
				if (multiples > 1) {
					vertical = false;
				}
			}
			if (vertical === undefined) {
				vertical = width > height;
			}
			if (multiples > 1) {
				if (this._fill) {
					repeat = Math.ceil(multiples);
				} else if (multiples === Math.floor(multiples)) {
					repeat = multiples;
				}
			}
			if (vertical) {
				if (this._fill) {
					selectRange.setX2(
						Math.min(
							selectRange.getX1() + width - 1,
							this._target.getX2()
						)
					);
					selectRange.setY2(
						Math.min(
							selectRange.getY1() + height * repeat - 1,
							this._target.getY2()
						)
					);
				} else {
					selectRange.setX2(selectRange.getX1() + width - 1);
					selectRange.setY2(
						selectRange.getY1() + height * repeat - 1
					);
				}
			} else if (this._fill) {
				selectRange.setX2(
					Math.min(
						selectRange.getX1() + width * repeat - 1,
						this._target.getX2()
					)
				);
				selectRange.setY2(
					Math.min(
						selectRange.getY1() + height - 1,
						this._target.getY2()
					)
				);
			} else {
				selectRange.setX2(selectRange.getX1() + width * repeat - 1);
				selectRange.setY2(selectRange.getY1() + height - 1);
			}
		}

		return selectRange;
	}

	paste() {
		let vertical;
		let repeat = 1;
		let multiples;
		let i;

		const data = this._data;
		const sourceRange = data.range;
		const width = sourceRange.getWidth();
		const height = sourceRange.getHeight();
		const target = this._target.copy();

		// TODO implement multiples in two directions
		if (width > 1 || height > 1) {
			multiples = this._target.getHeight() / height;
			if (multiples > 1) {
				vertical = true;
			} else {
				multiples = this._target.getWidth() / width;
				if (multiples > 1) {
					vertical = false;
				}
			}
			if (vertical === undefined) {
				vertical = width > height;
			}
			if (multiples > 1) {
				if (this._fill) {
					repeat = Math.ceil(multiples);
				} else if (multiples === Math.floor(multiples)) {
					repeat = multiples;
				}
			}
			if (this._fill) {
				target.setX2(
					Math.min(target.getX1() + width - 1, this._target.getX2())
				);
				target.setY2(
					Math.min(target.getY1() + height - 1, this._target.getY2())
				);
			} else {
				target.setX2(target.getX1() + width - 1);
				target.setY2(target.getY1() + height - 1);
			}
		}

		for (i = 0; i < repeat; i += 1) {
			// first assign sections, so no unnecessary formats are created
			if (sourceRange.isColumnRange()) {
				const columns = target.getSheet().getColumns();
				data.columns.forEach((section) => {
					if (section !== undefined) {
						columns.setSectionAt(
							target.getX1() + section._index,
							section
						);
					}
				});
			}

			if (sourceRange.isRowRange()) {
				const rows = target.getSheet().getRows();
				data.rows.forEach((section) => {
					if (section !== undefined) {
						rows.setSectionAt(
							target.getY1() + section._index,
							section
						);
					}
				});
			}

			target
				.getSheet()
				.getDataProvider()
				.pasteData(data, target, this._action);

			if (vertical) {
				target.set(
					target.getX1(),
					target.getY1() + height,
					target.getX2(),
					Math.min(target.getY1() + height * 2, this._target.getY2())
				);
			} else {
				target.set(
					target.getX1() + width,
					target.getY1(),
					Math.min(target.getX1() + width * 2, this._target.getX2()),
					target.getY2()
				);
			}
		}

		this._target
			.getSheet()
			.getGraph()
			.markDirty();
	}

	execute() {
		this.redo();
	}
};
