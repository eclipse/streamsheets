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
const Point = require('../../geometry/Point');
const HeaderNode = require('./HeaderNode');
const CellRange = require('./CellRange');

const WIDTH = 900;
/**
 * @class RowHeaderNode

 * @extends Node
 * @constructor
 */
module.exports = class RowHeaderNode extends HeaderNode {
	constructor() {
		super();

		this.setDefaultSectionSize(500);
	}

	newInstance() {
		return new RowHeaderNode();
	}

	getDefaultSectionSize() {
		return 500;
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);

		file.writeAttributeString('type', 'rowheadernode');
	}

	_assignName(id) {
		this.setName(`RowHeader${id}`);
	}

	getSections() {
		if (this.getParent()) {
			return this.getParent()
				.getParent()
				.getRowCount();
		}
		return 100;
	}

	getInternalSize() {
		return new Point(this.getInternalWidth(), this.getSectionsSize());
	}

	getInternalWidth() {
		if (this.isItemVisible() === false) {
			return 0;
		}

		return RowHeaderNode.WIDTH + this.getMaxLevel() * 600;
	}

	getSectionFromReference(ref) {
		return this.getOrCreateSectionAt(Number(ref) - 1);
	}

	static get WIDTH() {
		return WIDTH;
	}
};
