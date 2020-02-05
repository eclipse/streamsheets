const AbstractItemCommand = require('./AbstractItemCommand');
const Expression = require('../expr/Expression');

/**
 * @class SetChartFormulaCommand
 * @type {module.SetChartFormulaCommand}
 */
module.exports = class SetChartFormulaCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const item = graph.getItemById(data.itemId);
		if (item) {
			cmd = new SetChartFormulaCommand(
				item,
				data.formula,
				{
					element: data.element,
					index: data.index
				},
			).initWithObject(data);
		}
		return cmd;
	}

	constructor(item, selection, formula) {
		super(item);

		this.element = selection.element;
		this.index = selection.index;
		this.formula = formula;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);

		return cmd;
	}

	toObject() {
		const data = super.toObject();

		data.element = this.element;
		data.index = this.index;
		data.formula = this.formula;

		return data;
	}

	undo() {
	}

	redo() {
		switch (this.element) {
		case 'datarow':
			this._graphItem.dataSources[this.index] = new Expression(0, this.formula);
			break;
		case 'title':
			this._graphItem.title.formula = new Expression(0, this.formula);
			break;
		case 'xAxis':
			this._graphItem.xAxes[0].formula = new Expression(0, this.formula);
			break;
		case 'yAxis':
			this._graphItem.yAxes[0].formula = new Expression(0, this.formula);
			break;
		default:
			break;
		}

		this._graphItem.evaluate();
		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo() {}
};
