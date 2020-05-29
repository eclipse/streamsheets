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
const Attribute = require('../attr/Attribute');
const StringAttribute = require('../attr/StringAttribute');
const FormatAttributes = require('../attr/FormatAttributes');
const Node = require('./Node');
const ItemAttributes = require('../attr/ItemAttributes');
const CellRange = require('./CellRange');

module.exports = class SheetCheckboxNode extends Node {
	constructor() {
		super();

		this.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
		this.getTextFormat().setFontSize(9);

		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setContainer(false);
		this.addAttribute(new StringAttribute('title', 'Checkbox'));
		this.addAttribute(new Attribute('value', false));
	}

	newInstance() {
		return new SheetCheckboxNode();
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		return copy;
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);

		file.writeAttributeString('type', 'sheetcheckboxnode');
	}

	_assignName(id) {
		const name = this.getGraph().getUniqueName('Checkbox');
		this.setName(name);
	}

	getSheet() {
		let sheet = this;

		while (sheet && !sheet.getCellDescriptors) {
			sheet = sheet.getParent();
		}

		return sheet;
	}

	getValue() {
		let value = this.getAttributeValueAtPath('value');
		if (value === undefined) {
			return false;
		}

		if (value === 0 || value === '0' || value === false) {
			return false;
		}
		if (value === 1 || value === '1' || value === true) {
			return true;
		}

		const sheet = this.getSheet();
		if (sheet && typeof value === 'string') {
			const range = CellRange.parse(value, sheet);
			if (range) {
				range.shiftFromSheet();
				const cell = range.getSheet().getDataProvider().getRC(range.getX1(), range.getY1());
				if (cell) {
					value = cell.getValue();
					return !(value === 0 || value === '0' || value === false);
				}
			}
		}

		return false;
	}

	isMoveable() {
		if (
			this.getGraph()
				.getMachineContainer()
				.getMachineState()
				.getValue() === 0
		) {
			return false;
		}

		return super.isMoveable();
	}

	isAddLabelAllowed() {
		return false;
	}
};
