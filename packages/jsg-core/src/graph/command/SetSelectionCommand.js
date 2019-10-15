const AbstractItemCommand = require('./AbstractItemCommand');
const Expression = require('../expr/Expression');

module.exports = class SetSelectionCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetSelectionCommand(
					item,
					data.id,
					data.data,
					data.content
			  ).initWithObject(data)
			: undefined;
	}

	constructor(newItem, id, data, content) {
		super(newItem);

		this._id = id;
		this._data = data;
		this._content = content;
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
		data.data = this._data;
		data.content = this._content;
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
		this._graphItem.setSelection(this._id, new Expression(this._data));
		// this._graphItem.getGraph()._isDirty = false;// markDirty();
	}
};
