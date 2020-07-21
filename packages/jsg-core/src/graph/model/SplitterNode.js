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

const DEFAULT_SIZE = 100;

/**
 * @class SplitterNode
 * @extends Node
 * @constructor
 */
module.exports = class SplitterNode extends Node {
	constructor() {
		super();

		this.setHeight(SplitterNode.DEFAULT_SIZE);
		this.getFormat().setFillColor(JSG.theme.splitter);
		this.getFormat().setLineColor(JSG.theme.splitter);
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setContainer(false);
		this.getItemAttributes().setSnapTo(false);

		this._direction = ItemAttributes.Direction.HORIZONTAL;
	}

	newInstance() {
		return new SplitterNode();
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		copy._containerToResize = this._containerToResize;
		copy._direction = this._direction;

		return copy;
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);

		file.writeAttributeString('type', 'splitternode');
		file.writeAttributeNumber('direction', this._direction);
	}

	_assignName(id) {
		this.setName(`Splitter${id}`);
	}

	setContainerToResize(item) {
		this._containerToResize = item;
	}

	getContainerToResize() {
		return this._containerToResize;
	}

	setItemToResize(item) {
		this._itemToResize = item;
	}

	getItemToResize() {
		return this._itemToResize;
	}

	setDirection(direction) {
		this._direction = direction;
	}

	getDirection() {
		return this._direction;
	}

	isAddLabelAllowed() {
		return false;
	}

	isTabSelectAllowed() {
		return false;
	}

	read(reader, object) {
		super.read(reader, object);

		const direction = reader.getAttribute(object, 'direction');
		if (direction !== undefined) {
			this._direction = Number(direction);
		}
	}

	static get DEFAULT_SIZE() {
		return DEFAULT_SIZE;
	}
};
