const AbstractItemCommand = require('./AbstractItemCommand');
const Command = require('./Command');
const CompoundCommand = require('./CompoundCommand');

class UpdateGraphCellsCommand extends CompoundCommand {
	static createFromObject(data = {}, context) {
		const item = context.graph.getItemById(data.itemId);
		return item	? new UpdateGraphCellsCommand(item).initWithObject(data, context) : undefined;
	}
	constructor(item) {
		super();
		this._graphItem = item;
	}
}


class SetGraphCellsCommand extends Command {
	static createFromObject(data = {}) {
		const { streamsheetIds, cellDescriptors } = data;
		return new SetGraphCellsCommand(streamsheetIds, cellDescriptors).initWithObject(data);
	}

	constructor(streamsheetIds = [], cellDescriptors = []) {
		super();
		this._streamsheetIds = streamsheetIds.slice();
		this._cellDescriptors = cellDescriptors.slice();
		this.isVolatile = true;
	}

	toObject() {
		const data = super.toObject();
		data.streamsheetIds = this._streamsheetIds;
		data.cellDescriptors = this._cellDescriptors;
		return data;
	}

	undo() {}

	redo() {}

	doAfterRedo() {}

	doAfterUndo() {}
}

class SetGraphItemsCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetGraphItemsCommand(item, data.graphItems).initWithObject(
					data
			  )
			: undefined;
	}

	constructor(item, graphItems) {
		super(item);
		this._graphItems = graphItems;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.graphItems = this._graphItems;
		return data;
	}

	undo() {}

	redo() {
		if (this._graphItems) {
			this._graphItem.setGraphItems(this._graphItems);
		}

		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo() {}
}

class UpdateSheetNamesCommand extends CompoundCommand {
	static createFromObject(data = {}, context) {
		return new UpdateSheetNamesCommand().initWithObject(data, context);
	}
}

module.exports = {
	UpdateSheetNamesCommand,
	UpdateGraphCellsCommand,
	SetGraphCellsCommand,
	SetGraphItemsCommand
};
