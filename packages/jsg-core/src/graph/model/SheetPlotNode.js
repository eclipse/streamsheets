const Node = require('./Node');
const ItemAttributes = require('../attr/ItemAttributes');
const StringAttribute = require('../attr/StringAttribute');
const Attribute = require('../attr/Attribute');
const Expression = require('../expr/Expression');

module.exports = class SheetPlotNode extends Node {
	constructor() {
		super();

		this.getFormat().setLineColor('#AAAAAA');
		this.getFormat().setFillColor('#FFFFFF');
		this.getTextFormat().setFontSize(9);

		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setContainer(false);

		this.dataSources = [];
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
		this.dataSources.forEach((ds) => {
			ds.evaluate(this);
		});
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
