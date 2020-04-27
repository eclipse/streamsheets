const Node = require('./Node');
const ItemAttributes = require('../attr/ItemAttributes');

/**
 * @class CaptionNode
 * @extends Node
 * @constructor
 */
module.exports = class CaptionNode extends Node {
	constructor() {
		super();

		this.getFormat().setFillColor('#1976d2');
		this.getFormat().setLineColor('#777777');
		this.getTextFormat().setFontColor('#FFFFFF');
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setContainer(false);
		this.getItemAttributes().setSnapTo(false);
		this.getItemAttributes().setSelectionMode(ItemAttributes.SelectionMode.NONE);
	}

	newInstance() {
		return new CaptionNode();
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		return copy;
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);

		file.writeAttributeString('type', 'captionnode');
	}

	_assignName() {
		// this.setName('Caption' + id);
	}

	isAddLabelAllowed() {
		return false;
	}

	setIcon(name) {
		this._icon = name;
	}

	setIconLink(link) {
		this._iconLink = link;
	}

	getIconLink() {
		return this._iconLink;
	}
};
