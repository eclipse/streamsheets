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

module.exports = class LayoutNode extends Node {
	constructor() {
		super();

		this._rows = 2;
		this._columns = 2;

		this._rowData = [];
		this._columnData = [];
		this._data = [];

		this.getFormat().setFillStyle(FormatAttributes.FillStyle.NONE);
		// this.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
	}

	newInstance() {
		return new LayoutNode();
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		return copy;
	}

	getItemType() {
		return 'LayoutNode';
	}

	isAddLabelAllowed() {
		return false;
	}
};
