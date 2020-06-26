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

const HEIGHT = 500;

/**
 * @class ColumnHeaderNode
 * @extends Node
 * @constructor
 */
module.exports = class ColumnHeaderNode extends HeaderNode {
	newInstance() {
		return new ColumnHeaderNode();
	}

	getDefaultSectionSize() {
		return 2000;
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);
		file.writeAttributeString('type', 'columnheadernode');
	}

	_assignName(id) {
		this.setName(`ColumnHeader${id}`);
	}

	getInitialSection() {
		return -2;
	}

	getSectionTitle(index) {
		switch (index) {
		case 0:
			return 'COMMENT';
		case 1:
			return 'IF';
		}
		return undefined;
	}

	getSections() {
		if (this.getParent()) {
			return this.getParent()
				.getParent()
				.getColumnCount();
		}
		return 50;
	}

	getSectionSize(index) {
		const sheet = this.getSheet();
		const formulas = sheet && sheet._showFormulas;

		let size = super.getSectionSize(index);

		if (formulas) {
			size *= 1.5;
		}

		return size;
	}

	setSectionSize(index, size) {
		const sheet = this.getSheet();
		const formulas = sheet && sheet._showFormulas;

		if (formulas) {
			size /= 1.5;
		}

		super.setSectionSize(index, size);
	}

	getInternalSize() {
		return new Point(this.getSectionsSize(), this.getInternalHeight());
	}

	getInternalHeight() {
		if (this.isItemVisible() === false) {
			return 0;
		}

		return ColumnHeaderNode.HEIGHT + this.getMaxLevel() * 600;
	}

	getSectionFromReference(ref) {
		let colVal = 0;

		switch (ref) {
			case 'COMMENT':
				break;
			case 'IF':
				colVal = 1;
				break;
			default:
				for (let j = 0; j < ref.length; j += 1) {
					colVal =
						26 * colVal +
						ref
							.charAt(j)
							.toUpperCase()
							.charCodeAt(0) -
						65 +
						1; // 65 -> 'A'
				}
				colVal += 1;
				break;
		}

		return this.getOrCreateSectionAt(colVal);
	}

	static get HEIGHT() {
		return HEIGHT;
	}
};
