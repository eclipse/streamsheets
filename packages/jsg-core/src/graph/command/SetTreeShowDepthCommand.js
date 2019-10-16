const AbstractItemCommand = require('./AbstractItemCommand');

/**
 * @class SetTreeShowDepthCommand
 * @type {module.SetTreeShowDepthCommand}
 */
module.exports = class SetTreeShowDepthCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetTreeShowDepthCommand(item, data.depth).initWithObject(data)
			: undefined;
	}

	constructor(model, depth) {
		super(model);

		this._depth = depth;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.depth = this._depth;
		return data;
	}

	undo() {
		// TODO
	}

	redo() {
		this._graphItem._currentExpandToDepth = this._depth;
		this._graphItem.expandTreeToDepth(this._depth);
	}
};
