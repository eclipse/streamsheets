const SheetReference = require ('../expr/SheetReference');
const Node = require('./Node');
const ItemAttributes = require('../attr/ItemAttributes');
const StringAttribute = require('../attr/StringAttribute');
const Attribute = require('../attr/Attribute');
const Expression = require('../expr/Expression');

class ChartRect {
	constructor(left, top, right, bottom) {
		this.left = left || 0;
		this.top = top || 0;
		this.right = right || 0;
		this.bottom = bottom || 0;
	}

	reset() {
		this.left = 0;
		this.right = 0;
		this.top = 0;
		this.bottom = 0;
	}

	containsPoint(pt) {
		return pt.x >= this.left && pt.x <= this.right && pt.y >= this.top && pt.y <= this.bottom;
	}

	get width() {
		return this.right - this.left;
	}

	get height() {
		return this.bottom - this.top;
	}
}


module.exports = class SheetPlotNode extends Node {
	constructor() {
		super();

		this.getFormat().setLineColor('#AAAAAA');
		this.getFormat().setFillColor('#FFFFFF');
		this.getTextFormat().setFontSize(9);

		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setContainer(false);

		this.dataSources = [];
		this.chart = {
			margins: new ChartRect(150, 150, 150, 150),
		};
		this.xAxes = [{
			type: 'linear',
			align: 'bottom',
			formula: new Expression(0, 'AXIS(E2,E3,E4)'),
			position: new ChartRect(),
			size: 500,
		}];
		this.yAxes = [{
			type: 'linear',
			align: 'left',
			formula: new Expression(0, 'AXIS(F2,F3,F4)'),
			position: new ChartRect(),
			size: 1000,
		}];
		this.plot = {
			position: new ChartRect()
		};
		this.title = {
			title: new Expression(0, 'A1'),
			position: new ChartRect(),
			size: 1000
		};
	}

	getExpressionValue(expr) {
		if (expr === undefined) {
			return '';
		}

		const term = expr.getTerm();
		if (term) {
			const { operand } = term;

			if (operand instanceof SheetReference) {
				const range = operand._range.copy();
				range.shiftFromSheet();
				const cell = range._worksheet.getDataProvider().getRC(range._x1, range._y1);
				return cell ? cell.getValue() : '';
			}
		}

		return expr.getValue();
	}

	layout() {
		const size = this.getSize().toPoint();

		this.plot.position.left = this.chart.margins.left;
		this.plot.position.top = this.chart.margins.top;
		this.plot.position.bottom = size.y - this.chart.margins.bottom;
		this.plot.position.right = size.x - this.chart.margins.right;

		const title = String(this.getExpressionValue(this.title.title));
		if (title.length) {
			this.plot.position.top += this.title.size;
			this.title.position.top = this.chart.margins.top;
			this.title.position.left = this.chart.margins.left;
			this.title.position.right = size.x - this.chart.margins.right;
			this.title.position.bottom = this.chart.margins.top + this.title.size;
		} else {
			this.title.position.reset();
		}

		this.xAxes.forEach((axis) => {
			switch (axis.align) {
			case 'top':
				this.plot.position.top -= axis.size;
				break;
			case 'bottom':
				this.plot.position.bottom -= axis.size;
				break;
			}
		});

		this.yAxes.forEach((axis) => {
			switch (axis.align) {
			case 'left':
				this.plot.position.left += axis.size;
				break;
			case 'right':
				this.plot.position.right -= axis.size;
				break;
			}
		});

		this.xAxes.forEach((axis) => {
			Object.assign(axis.position, this.plot.position);
			switch (axis.align) {
			case 'bottom':
				axis.position.top = this.plot.position.bottom;
				axis.position.bottom = axis.position.top - axis.size;
				break;
			}
		});

		this.yAxes.forEach((axis) => {
			Object.assign(axis.position, this.plot.position);
			switch (axis.align) {
			case 'left':
				axis.position.right = this.plot.position.left;
				axis.position.left = this.plot.position.left - axis.size;
				break;
			}
		});

		super.layout();
	}


	createDataSourcesFromSelection(selection) {
		this.dataSources = [
			new Expression(0, 'DATAROW(B1,A2:A10,B2:B10)'),
			new Expression(0, 'DATAROW(C1,A2:A10,C2:C10)'),
			new Expression(0, 'DATAROW(,A12,A12)')
		];
		this.evaluate();
	}

	newInstance() {
		return new SheetPlotNode();
	}

	evaluate() {
		super.evaluate();
		this.dataSources.forEach((ds) => {
			ds.evaluate(this);
		});
		this.xAxes.forEach((axis) => {
			axis.formula.evaluate(this);
		});
		this.yAxes.forEach((axis) => {
			axis.formula.evaluate(this);
		});
		this.title.title.evaluate(this);
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		this.dataSources.forEach((datasource, index) => {
			copy.dataSources.push(datasource.copy());
		});

		return copy;
	}

	saveContent(writer, absolute) {
		super.saveContent(writer, absolute);

		writer.writeAttributeString('type', 'sheetplotnode');

		writer.writeStartElement('datasources');
		this.dataSources.forEach((datasource, index) => {
			datasource.save(`DS${index}`, writer);
		});
		writer.writeEndElement();
	}

	read(reader, object) {
		super.read(reader, object);

		const ds = reader.getObject(object, 'datasources');

		if (ds) {
			reader.iterateObjects(ds, (name, child) => {
				const expr = new Expression(0);
				expr.read(reader, child);
				this.dataSources.push(expr);
			});
		}
	}

	_assignName(id) {
		const name = this.getGraph().getUniqueName('Plot');
		this.setName(name);
	}

	getSheet() {
		let sheet = this;

		while (sheet && !sheet.getCellDescriptors) {
			sheet = sheet.getParent();
		}

		return sheet;
	}

	isAddLabelAllowed() {
		return false;
	}
};
