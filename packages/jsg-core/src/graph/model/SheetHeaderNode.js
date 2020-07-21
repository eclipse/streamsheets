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
 * @class SheetHeaderNode

 * @extends Node
 * @constructor
 */
module.exports = class SheetHeaderNode extends Node {
	constructor() {
		super();

		this.getFormat().setLineColor(JSG.theme.frame);
		this.getFormat().setFillColor(JSG.theme.header);
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
