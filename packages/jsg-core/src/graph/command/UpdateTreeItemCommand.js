const AbstractItemCommand = require('./AbstractItemCommand');

/**
 * @class DeleteTreeItemCommand
 * @type {module.DeleteTreeItemCommand}
 */
module.exports = class UpdateTreeItemCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new UpdateTreeItemCommand(
					item,
					data.level,
					data.newItem
			  ).initWithObject(data)
			: undefined;
	}

	constructor(model, level, newItem) {
		super(model);

		this._level = level;
		this._newItem = newItem;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.level = this._level;
		data.newItem = this._newItem;
		return data;
	}

	undo() {
		// TODO
	}

	redo() {
		const item = this._graphItem.getTreeItemAt(this._level);
		if (item === undefined) {
			return;
		}

		item.key = this._newItem.key;
		item.value = this._newItem.value;
		item.depth = this._newItem.depth;
		item.type = this._newItem.type;
		item.visible = this._newItem.visible;
		item.expanded = this._newItem.expanded;
		item.parent = this._newItem.parent;
		item._json = this._newItem._json;

		this._graphItem.updateLevels();
		this._graphItem.getGraph().markDirty();
	}
};
