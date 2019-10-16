const AbstractItemCommand = require('./AbstractItemCommand');
const MachineGraph = require('../model/MachineGraph');

/**
 * @class AddSheetNameCommand
 * @type {module.AddSheetNameCommand}
 */
module.exports = class DeleteSheetNameCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		const name = item == null ? graph.getSheetName(data.sheetname) : item.getDataProvider().getName(data.sheetname);
		return new DeleteSheetNameCommand(item || graph, name).initWithObject(data);
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
		return data;
	}

	undo() {
		if (this._graphItem instanceof MachineGraph) {
			this._graphItem.addSheetName(this._name);
		} else {
			const data = this._graphItem.getDataProvider();
			data.addName(this._name);
		}

		this._graphItem.getGraph().markDirty();
	}

	redo() {
		if (this._graphItem instanceof MachineGraph) {
			this._graphItem.deleteSheetName(this._name);
		} else {
			const data = this._graphItem.getDataProvider();
			data.deleteName(this._name);
		}

		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo() {}
};
