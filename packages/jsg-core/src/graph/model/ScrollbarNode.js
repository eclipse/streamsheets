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
