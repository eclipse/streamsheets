const Node = require('./Node');
const FormatAttributes = require('../attr/FormatAttributes');
const ItemAttributes = require('../attr/ItemAttributes');

/**
 * @class ScrollbarNode
 * @extends Node
 * @constructor
 */
module.exports = class ScrollbarNode extends Node {
	constructor() {
		super();

		this.getFormat().setFillColor('#EEEEEE');
		this.getFormat().setLineColor('#AAAAAA');
		this.getFormat().setLineStyle(FormatAttributes.LineStyle.SOLID);

		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setContainer(false);
	}

	newInstance() {
		return new ScrollbarNode();
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);

		file.writeAttributeString('type', 'scrollbarnode');
	}

	_assignName(id) {
		this.setName(`Scrollbar${id}`);
	}

	isAddLabelAllowed() {
		return false;
	}
};
