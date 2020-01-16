module.exports = {};

const { Node, ItemAttributes, StringAttribute, Attribute, Expression } = require('@cedalo/jsg-core');

module.exports.SheetChartStateNode = class SheetChartStateNode extends Node {
	constructor() {
		super();

		this.getFormat().setLineColor('#AAAAAA');
		this.getFormat().setFillColor('#FFFFFF');
		this.getTextFormat().setFontSize(9);

		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setContainer(false);

		this.addAttribute(new StringAttribute('type', ''));
		this.addAttribute(new StringAttribute('range', ''));
		this.addAttribute(new StringAttribute('legend', ''));
		this.addAttribute(new StringAttribute('title', 'ChartState'));
		this.addAttribute(new Attribute('min', new Expression('')));
		this.addAttribute(new Attribute('max', new Expression('')));
		this.addAttribute(new StringAttribute('step', 'minute'));
		this.addAttribute(new StringAttribute('scalefont', ''));
	}

	newInstance() {
		return new SheetChartStateNode();
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		return copy;
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);

		file.writeAttributeString('type', 'sheetchartstatenode');
	}

	_assignName(id) {
		const name = this.getGraph().getUniqueName('ChartState');
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
