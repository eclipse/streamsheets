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
const DataProvider = require('./DataProvider');
/**
 * Class that contains the cell area of a worksheet.
 *
 * @class CellsNode
 * @extends Node
 * @constructor
 */
module.exports = class CellsNode extends Node {
	constructor() {
		super();

		this._data = new DataProvider();
		this._merged = [];

		this.getFormat().setFillColor(JSG.theme.sheet);
		this.getItemAttributes().setSelectionMode(ItemAttributes.SelectionMode.NONE);
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
	}

	newInstance() {
		return new CellsNode();
	}

	getMinSize() {
		return 0;
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		copy._data = this._data.copy();

		return copy;
	}

	getDataProvider() {
		if (this._data._sheet === undefined) {
			// init with sheet, if not done yet
			let parent = this.getParent();
			if (parent) {
				parent = parent.getParent();
				this._data._sheet = parent;
			}
		}
		return this._data;
	}

	setDataProvider(provider) {
		this._data = provider;
	}

	getMergedCells() {
		return this._merged;
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);

		file.writeAttributeString('type', 'cellsnode');

		this._data.save(file);
	}

	_assignName(id) {
		this.setName(`Cells${id}`);
	}

	read(reader, object) {
		super.read(reader, object);

		this._data.clear();

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'data':
					this._data.read(reader, child);
					break;
				default:
					break;
			}
		});
	}
};
