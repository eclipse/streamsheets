/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const JSG = require('../../JSG');
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

		this.getFormat().setFillColor(JSG.theme.caption);
		this.getFormat().setLineColor(JSG.theme.frame);
		this.getTextFormat().setFontColor(JSG.theme.captiontext);
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
