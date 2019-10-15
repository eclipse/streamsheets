const AbstractItemCommand = require('./AbstractItemCommand');
const SheetName = require('../model/SheetName');
const { restoreExpression, writeExpression } = require('./utils');

/**
 * @class AddGraphCellCommand
 * @type {module.AddGraphCellCommand}
 */
module.exports = class AddGraphCellCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const item = graph.getItemById(data.itemId);
		if (item) {
			const nameexpr = restoreExpression(data.expr, item);
			cmd = new AddGraphCellCommand(
				item,
				new SheetName(data.sheetname, nameexpr)
			).initWithObject(data);
		}
		return cmd;
	}

	constructor(item, name) {
		super(item);
		this._name = name;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.sheetname = this._name.getName();
		data.expr = writeExpression(this._name.getExpression());
		return data;
	}

	undo() {
		const data = this._graphItem.getDataProvider();
		data.deleteGraph(this._name);
		this._graphItem.getGraph().markDirty();
	}

	redo() {
		const data = this._graphItem.getDataProvider();
		data.addGraph(this._name);
		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo() {}
};
