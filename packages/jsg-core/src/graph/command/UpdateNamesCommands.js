const AbstractItemCommand = require('./AbstractItemCommand');
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


class SetGraphCellsCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetGraphCellsCommand(item, data.graphs).initWithObject(data)
			: undefined;
	}

	constructor(item, graphs) {
		super(item);
		this._graphs = graphs;
		this.isVolatile = true;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.graphs = this._graphs;
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
