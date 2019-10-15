const Node = require('./Node');
const ItemAttributes = require('../attr/ItemAttributes');

/**
 * @class SheetHeaderNode

 * @extends Node
 * @constructor
 */
module.exports = class SheetHeaderNode extends Node {
	constructor() {
		super();

		this.getFormat().setLineColor('#AAAAAA');
		this.getFormat().setFillColor('#F2F2F2');
		this.getItemAttributes().setSelectionMode(ItemAttributes.SelectionMode.NONE);
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setContainer(false);
	}

	newInstance() {
		return new SheetHeaderNode();
	}

	_assignName(id) {
		this.setName(`SheetHeader${id}`);
	}

	read(reader, object) {
		super.read(reader, object);
		// overwrite old settings
		this.getFormat().setFillColor('#F2F2F2');
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);
		file.writeAttributeString('type', 'sheetheadernode');
	}
};
