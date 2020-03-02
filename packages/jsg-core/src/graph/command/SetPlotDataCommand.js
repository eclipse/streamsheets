const AbstractItemCommand = require('./AbstractItemCommand');
const JSONReader = require('../../commons/JSONReader');

/**
 * @class SetChartDataCommand
 * @type {module.SetPlotDataCommand}
 */
module.exports = class SetPlotDataCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetPlotDataCommand(
					item,
					data.key,
					data.data,
					data.oldData
			  ).initWithObject(data)
			: undefined;
	}

	constructor(item, key, data, oldData) {
		super(item);

		this._key = key;
		this._data = data;
		this._oldData = oldData;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.key = this._key;
		data.data = this._data;
		data.oldData = this._oldData;
		return data;
	}

	undo() {
		this.read(this._oldData);
	}

	redo() {
		this.read(this._data);
	}

	read(data) {
		const reader = new JSONReader(data);
		const root = reader.getRoot();

		switch (this._key) {
		case 'title':
			this._graphItem.title.read(reader, root);
			break;
		case 'axes':
			this._graphItem.readAxes(reader, root);
			break;
		case 'series':
			this._graphItem.readSeries(reader, root);
			break;
		case 'legend':
			this._graphItem.readLegend(reader, root);
			break;
		case 'plot':
			this._graphItem.readPlot(reader, root);
			break;
		case 'chart':
			this._graphItem.chart.read(reader, root);
			break;
		}

		this._graphItem.evaluate();
		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo(selection, viewer) {
		if (this._graphItem !== undefined) {
			this.selectAll(this._graphItem, viewer);
		}
	}
};
