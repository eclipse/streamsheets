const AbstractItemCommand = require('./AbstractItemCommand');

/**
 * @class SetChartDataCommand
 * @type {module.SetChartDataCommand}
 */
module.exports = class SetChartDataCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetChartDataCommand(
					item,
					data.key,
					data.json,
					data.jsonOld
			  ).initWithObject(data)
			: undefined;
	}
	constructor(item, key, data, oldData) {
		super(item);

		this._key = key;
		this._oldData = oldData || this._graphItem[key];
		this._data = JSON.parse(JSON.stringify(data));
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.key = this._key;
		data.json = this._data;
		data.jsonOld = this._oldData;
		return data;
	}
	undo() {
		this._graphItem[this._key] = JSON.parse(JSON.stringify(this._oldData));
		this._graphItem.getGraph().markDirty();
	}

	redo() {
		this._graphItem[this._key] = JSON.parse(JSON.stringify(this._data));
		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo(selection, viewer) {
		if (this._graphItem !== undefined) {
			this.selectAll(this._graphItem, viewer);
		}
	}
};
