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
const CellRange = require('../model/CellRange');
const { restoreExpression, writeExpression } = require('./utils');
const AbstractItemCommand = require('./AbstractItemCommand');
const Point = require('../../geometry/Point');
const NumberExpression = require('../expr/NumberExpression');

const expr2str = (expr, delValue) =>
	writeExpression(expr, (writer) => {
		if (writer.root['o-expr']) {
			if (expr instanceof NumberExpression) writer.root['o-expr'].t = 'n';
			// delete value to indicate machine server to calculate DL-1724
			if (delValue && expr.hasFormula()) delete writer.root['o-expr'].v;
		}
	});


/**
 * @class SetCellDataCommand
 * @type {module.SetCellDataCommand}
 */
module.exports = class SetCellDataCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const item = graph.getItemById(data.itemId);
		if (item) {
			const expr = restoreExpression(data.expr, item);
			cmd = new SetCellDataCommand(
				item,
				data.reference,
				expr,
				data.calc
			).initWithObject(data);
		}
		return cmd;
	}

	constructor(item, reference, expr, calc) {
		super(item);

		const res = CellRange.refToRC(reference, item);
		if (res === undefined) {
			return;
		}
		this._pos = new Point(
			res.column - item.getColumns().getInitialSection(),
			res.row
		);
		this._expr = expr;
		this._calc = calc;
		this._reference = reference;

		const cell = this._graphItem
			.getCells()
			.getDataProvider()
			.get(this._pos);
		this._createdNewCell = !cell;
		this._oldExpr = !this._createdNewCell
			? cell.getExpression()
			: undefined;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		// overwrite oldExpr since it is always set in constructor!!
		cmd._oldExpr = data.undo.expr
			? restoreExpression(data.undo.expr, cmd._graphItem)
			: undefined;
		cmd._createdNewCell = data.createdNewCell;
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		const cellAttr = this._graphItem.getCellAttributesAt(this._pos);
		data.level = cellAttr ? cellAttr.getLevel().getValue() : undefined;
		data.reference = this._reference;
		data.calc = this._calc;
		data.createdNewCell = this._createdNewCell;
		data.expr = expr2str(this._expr, true);
		if (this._oldExpr) data.undo.expr = expr2str(this._oldExpr);
		return data;
	}

	undo() {
		const dataProvider = this._graphItem.getCells().getDataProvider();
		if (this._createdNewCell) dataProvider.setTo(this._pos, undefined);
		else dataProvider.setExpression(this._pos, this._oldExpr);
		this._graphItem.getGraph().markDirty();
	}

	redo() {
		const cell = this._graphItem
			.getCells()
			.getDataProvider()
			.setExpression(this._pos, this._expr);
		if (cell) {
			cell.evaluate(this._graphItem);
			if (this._expr && this._expr.hasFormula()) {
				cell._value = '#CALC';
			}
		}
		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo() {}
};
