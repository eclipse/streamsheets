const AbstractItemCommand = require('./AbstractItemCommand');
const { toCellRanges } = require('./utils');

module.exports = class SetHeaderSectionLevelCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const item = graph.getItemById(data.itemId);
		const ranges = item && toCellRanges(data.ranges, graph);
		if (ranges && ranges.length) {
			cmd = new SetHeaderSectionLevelCommand(
				item,
				ranges,
				data.key
			).initWithObject(data);
		}
		return cmd;
	}

	constructor(item, ranges, key) {
		super(item);

		this._item = item;
		this._ranges = ranges.map((range) => range.copy());
		this._key = key;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.ranges = this._ranges.map((range) => range.toObject());
		data.key = this._key;
		return data;
	}

	undo() {
		this._graphItem.getGraph().markDirty();
	}

	redo() {
		let i;

		// identify type of change
		this._ranges.forEach((range) => {
			switch (this._key) {
			case 'ArrowLeft':
				for (i = range._y1; i <= range._y2; i += 1) {
					const old = this._graphItem.getSectionLevel(i, 1);
					this._graphItem.setSectionLevel(i, old - 1);
				}
				break;
			case 'ArrowRight':
				for (i = range._y1; i <= range._y2; i += 1) {
					const old = this._graphItem.getSectionLevel(i, 1);
					this._graphItem.setSectionLevel(i, old + 1);
				}
				break;
			case 'ArrowUp':
				for (i = range._x1; i <= range._x2; i += 1) {
					const old = this._graphItem.getSectionLevel(i, 1);
					this._graphItem.setSectionLevel(i, old - 1);
				}
				break;
			case 'ArrowDown':
				for (i = range._x1; i <= range._x2; i += 1) {
					const old = this._graphItem.getSectionLevel(i, 1);
					this._graphItem.setSectionLevel(i, old + 1);
				}
				break;
			}
		});


		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo() {}
};
