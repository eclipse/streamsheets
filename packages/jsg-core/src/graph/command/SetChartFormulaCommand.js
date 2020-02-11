const AbstractItemCommand = require('./AbstractItemCommand');
const Expression = require('../expr/Expression');
const { restoreExpression, writeExpression } = require('./utils');

/**
 * @class SetChartFormulaCommand
 * @type {module.SetChartFormulaCommand}
 */
module.exports = class SetChartFormulaCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const item = graph.getItemById(data.itemId);
		if (item) {
			const expression = restoreExpression(data.expression, item || graph);
			cmd = new SetChartFormulaCommand(
				item,
				{
					element: data.element,
					index: data.index
				},
				expression,
			).initWithObject(data);
		}
		return cmd;
	}

	constructor(item, selection, expression) {
		super(item);

		this.element = selection.element;
		this.index = selection.index;
		this.expression = expression;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);

		return cmd;
	}

	toObject() {
		const data = super.toObject();

		data.element = this.element;
		data.index = this.index;
		data.expression = writeExpression(this.expression);

		return data;
	}

	undo() {
	}

	redo() {
		switch (this.element) {
		case 'datarow':
			this._graphItem.series[this.index].formula = this.expression;
			break;
		case 'title':
			this._graphItem.title.formula = this.expression;
			break;
		case 'xAxis':
			this._graphItem.xAxes[0].formula = this.expression;
			break;
		case 'yAxis':
			this._graphItem.yAxes[0].formula = this.expression;
			break;
		case 'legend':
			this._graphItem.legend.formula = this.expression;
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
