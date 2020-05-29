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
const Node = require('./Node');
const FormatAttributes = require('../attr/FormatAttributes');
const ItemAttributes = require('../attr/ItemAttributes');

const BUTTON_CLICKED_NOTIFICATION = 'button_clicked_notification';

/**
 *
 * @class CaptionNode
 * @extends Node
 * @constructor
 */
module.exports = class ButtonNode extends Node {
	constructor() {
		super();

		this.setSize(500, 500);
		// this.getFormat().setFillColor('#1976d2');
		// this.getFormat().setFillColor('#FFDDAA');
		this.getFormat().setFillStyle(FormatAttributes.FillStyle.NONE);
		this.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setContainer(false);
		this.getItemAttributes().setSelectionMode(ItemAttributes.SelectionMode.NONE);
	}

	newInstance() {
		return new ButtonNode();
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		return copy;
	}

	setEventScope(scope) {
		this._eventScope = scope;
	}

	getEventScope(scope) {
		return this._eventScope;
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);

		file.writeAttributeString('type', 'buttonnode');
	}

	_assignName(/* id */) {
		// this.setName(`Button${id}`);
	}

	isAddLabelAllowed() {
		return false;
	}

	static get BUTTON_CLICKED_NOTIFICATION() {
		return BUTTON_CLICKED_NOTIFICATION;
	}
};
