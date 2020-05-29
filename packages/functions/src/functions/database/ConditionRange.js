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
// a structure to manage conditions defined by sheetrange...
const { convert } = require('@cedalo/commons');
const { Operation, Term } = require('@cedalo/parser');


class DatabaseTerm extends Term {

	constructor() {
		super();
		this._value = null;
	}

	get value() {
		return this._value;
	}

	setCell(cell) {
		this._value = cell != null ? cell.value : null;
		return this;
	}
}
class Condition {
	static fromString(value) {
		if (value != null && value !== '') {
			const str = convert.toString(value, '');
			let symbol = str.substr(0, 2);
			let op = Operation.get(symbol);
			if (op == null || op.type !== Operation.TYPE.BOOL) {
				symbol = symbol.charAt(0);
				op = Operation.get(symbol);
			}
			if (op == null || op.type !== Operation.TYPE.BOOL) {
				symbol = '';
				op = Operation.get('==');
			}
			const right = Term.fromValue(str.substring(symbol.length));
			return new Condition(op, right);
		}
		return new Condition();
	}

	constructor(op, right) {
		this.op = op;
		this.left = right != null ? new DatabaseTerm() : null;
		this.right = right;
	}

	isTrue(cell) {
		return this.right != null ? this.op.calc(this.left.setCell(cell), this.right) : true;
	}
}

const index2label = (range) => {
	// first row defines labels:
	const idx2label = [];
	range.iterateRowAt(range.start.row, (cell) => {
		idx2label.push(cell != null ? convert.toString(cell.value, '') : '');
	});
	return idx2label;
};
const conditionsForLabel = (label, conditionsObj) => {
	let conditions = conditionsObj[label];
	if (conditions == null) {
		conditions = [];
		conditionsObj[label] = conditions;
	}
	return conditions;
};

class ConditionRange {

	static fromSheetRange(sheet, range) {
		const startidx = range.start.col;
		const idx2label = index2label(range);
		const conditions = [];
		let condobj;
		range.iterate((cell, index, nextrow) => {
			if (nextrow) {
				condobj = {};
				conditions.push(condobj);
			}
			if (conditions.length > 1) {
				const label = idx2label[index.col - startidx];
				const cond = conditionsForLabel(label, condobj);
				cond.push(Condition.fromString(cell ? cell.value : null));
			}
		});
		conditions.shift();
		return new ConditionRange(sheet, conditions);
	}

	constructor(sheet, conditions) {
		this.sheet = sheet;
		this.conditions = conditions;
	}

	_cellMatchConditions(cell, conditions) {
		return conditions == null || !conditions.some(condition => !condition.isTrue(cell));
	}
	_rowMatchCondition(row, condition, idx2label) {
		return !row.some((cell, index) => {
			const label = idx2label[index];
			return !this._cellMatchConditions(cell, condition[label]);
		});
	}
	_doRowMatch(row, idx2label) {
		return this.conditions.some(condition => this._rowMatchCondition(row, condition, idx2label));
	}
	_rowAt(rowidx, range) {
		const row = [];
		range.iterateRowAt(rowidx, cell => row.push(cell));
		return row;
	}
	forEachMatchingRow(range, callback) {
		const endrow = range.end.row;
		const idx2label = index2label(range);
		for (let rowidx = range.start.row + 1; rowidx <= endrow; rowidx += 1) {
			const row = this._rowAt(rowidx, range);
			const match = this._doRowMatch(row, idx2label);
			if (match && callback) {
				callback(rowidx);
			}
		}
	}
}

module.exports = ConditionRange;
