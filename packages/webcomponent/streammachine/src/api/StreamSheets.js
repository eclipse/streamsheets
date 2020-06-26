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
import JSG from '@cedalo/jsg-ui';

const { Dictionary } = JSG;

const applyMap = (sheet, ranges, map) => {
	const cmd = new JSG.FormatCellsCommandWC(ranges, map);
	sheet._graphEditor.getInteractionHandler().execute(cmd);
};
const applyFormats = (sheet, ranges, formats) => {
	const map = new Dictionary();
	map.put('formats', formats);
	applyMap(sheet, ranges, map);
};
const applyAttributes = (sheet, ranges, attributes) => {
	const map = new Dictionary();
	map.put('attributes', attributes);
	applyMap(sheet, ranges, map);
};

export class CellRange {
	constructor(sheet, range) {
		this.sheet = sheet;
		this.range = range;
	}

	set bold(flag) {
		applyFormats(this.sheet, [this.range], { text: { fontstyle: flag ? 1 : 0 } });
	}

	set italic(flag) {
		applyFormats(this.sheet, [this.range], { text: { fontstyle: flag ? 2 : 0 } });
	}

	set fontSize(fontsize) {
		applyFormats(this.sheet, [this.range], 'formats', 'text', {fontsize});
	}

	set fillColor(fillcolor) {
		applyFormats(this.sheet, [this.range], { styles: { fillcolor, fillstyle: 1 } });
	}

	set key(flag) {
		applyAttributes(this.sheet, [this.range], { key: flag });
	}

	set level(level) {
		applyAttributes(this.sheet, [this.range], { level });
	}

	set value(value) {
		const expr = this.sheet.textToExpression(value);
		if (expr) {
			this.range.shiftToSheet();
			const cmd = new JSG.SetCellDataCommand(this.sheet, this.range.toString(), expr.expression, true);
			this.range.shiftFromSheet();
			this.sheet._graphEditor.getInteractionHandler().execute(cmd);
		}
	}
}

export class Selection {
	constructor(sheet) {
		this.sheet = sheet;
	}

	set bold(flag) {
		const selection = this.sheet.getOwnSelection();
		const ranges = selection.getRanges();
		applyFormats(this.sheet, ranges, { text: { fontstyle: flag ? 1 : 0 } });
	}

	set italic(flag) {
		const selection = this.sheet.getOwnSelection();
		const ranges = selection.getRanges();
		applyFormats(this.sheet, ranges, { text: { fontstyle: flag ? 2 : 0 } });
	}

	set fillColor(color) {
		const selection = this.sheet.getOwnSelection();
		const ranges = selection.getRanges();
		applyFormats(this.sheet, ranges, { styles: { fillcolor: color, fillstyle: 1 } });
	}

	forEach(callback) {
		const selection = this.sheet.getOwnSelection();
		const ranges = selection.getRanges();

		ranges.forEach(range => {
			const cellRange = new CellRange(this.sheet, range);
			callback(cellRange);
		});
	}
}

export class StreamSheet {
	constructor(sheet) {
		this.sheet = sheet;
	}

	get name() {
		return this.sheet.getName().getValue();
	}

	get selection() {
		return this.sheet.getOwnSelection().hasSelection() ? new Selection(this.sheet) : undefined;
	}

	get activeCell() {
		const cell = this.sheet.getOwnSelection().getActiveCell();
		return cell ? new CellRange(this.sheet, new JSG.CellRange(this.sheet, cell.x, cell.y)) : undefined;
	}

	range(reference) {
		const range = JSG.CellRange.parse(reference, this.sheet);
		range.shiftFromSheet();
		return range ? new CellRange(this.sheet, range) : undefined;
	}
}

