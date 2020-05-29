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
const ItemAttributes = require('../attr/ItemAttributes');
const CellRange = require('./CellRange');
const StringAttribute = require('../attr/StringAttribute');
const Attribute = require('../attr/Attribute');
const Expression = require('../expr/Expression');

module.exports = class SheetKnobNode extends Node {
	constructor() {
		super();

		this.getFormat().setLineColor('#AAAAAA');
		this.getFormat().setFillColor('#DDDDDD');
		this.getTextFormat().setFontSize(9);

		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setContainer(false);
		this.addAttribute(new StringAttribute('title', 'Knob'));
		this.addAttribute(new Attribute('value', new Expression(50)));
		this.addAttribute(new Attribute('min', new Expression(0)));
		this.addAttribute(new Attribute('max', new Expression(100)));
		this.addAttribute(new Attribute('step', new Expression(5)));
		this.addAttribute(new Attribute('start', new Expression(Math.PI / 6)));
		this.addAttribute(new Attribute('end', new Expression(Math.PI * 11 / 6)));
		this.addAttribute(new StringAttribute('marker', ''));
		this.addAttribute(new StringAttribute('scalefont', ''));
		this.addAttribute(new StringAttribute('formatrange', ''));
	}

	newInstance() {
		return new SheetKnobNode();
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		return copy;
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);

		file.writeAttributeString('type', 'sheetknobnode');
	}

	_assignName(id) {
		const name = this.getGraph().getUniqueName('Knob');
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
		const value = this.getAttributeValueAtPath('value');
		if (value === undefined) {
			return 0;
		}

		const sheet = this.getSheet();
		if (sheet && typeof value === 'string') {
			const range = CellRange.parse(value, sheet);
			if (range) {
				range.shiftFromSheet();
				const cell = range.getSheet().getDataProvider().getRC(range.getX1(), range.getY1());
				if (cell) {
					return cell.getValue();
				}
			}
		}

		return value;
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
