const AbstractItemCommand = require('./AbstractItemCommand');

module.exports = class RemoveSelectionCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new RemoveSelectionCommand(item, data.id).initWithObject(data)
			: undefined;
	}

	constructor(newItem, id) {
		super(newItem);

		this._id = id;
		this._old = newItem.getSelection(String(this._id));
		this._keepFeedback = true;
		this.isVolatile = true;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.id = this._id;
		return data;
	}

	undo() {
		if (this._old) {
			this._graphItem.setSelection(this._id, this._old.getExpression());
		} else {
			this._graphItem.removeSelection(this._id);
		}
	}

	redo() {
		this._graphItem.removeSelection(this._id);
		// this._graphItem.getGraph().markDirty();
	}
};
