
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
const Strings = require('../../commons/Strings');
const Numbers = require('../../commons/Numbers');
const CompoundCommand = require('../command/CompoundCommand');
const AddItemCommand = require('../command/AddItemCommand');

class LayoutSection {
	constructor(size) {
		// auto, content, 1/100mm, percent
		this._size = size === undefined ? 'auto' : size;
		// auto, px
		this._minSize = 'auto';
		this._paddingBefore = 300;
		this._paddingAfter = 300;
		this._marginBefore = 300;
		this._marginAfter = 300;
	}

	get size() {
		return this._size === undefined ? 3000 : this._size;
	}
}

module.exports = class LayoutNode extends Node {
	constructor() {
		super();

		this._rows = 3;
		this._columns = 2;

		// LayoutSections
		this._rowData = [new LayoutSection(1000)];
		this._columnData = [];

		// LayoutCells
		this.updateData();

		this.getItemAttributes().setSelectionMode(ItemAttributes.SelectionMode.AREA);
		this.getFormat().setFillStyle(FormatAttributes.FillStyle.NONE);
		this.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
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
		return 'layoutnode';
	}

	get rowData() {
		return this._rowData;
	}

	get columnData() {
		return this._columnData;
	}

	get rows() {
		return this._rows;
	}

	get columns() {
		return this._columns;
	}

	updateData() {
		// allocate missing sections
		for (let i = 0; i < this._rows; i+= 1) {
			if (this._rowData[i] === undefined) {
				this._rowData[i] = new LayoutSection();
			}
		}
		this._rowData.length = this._rows;
		for (let i = 0; i < this._columns; i+= 1) {
			if (this._columnData[i] === undefined) {
				this._columnData[i] = new LayoutSection();
			}
		}
		this._columnData.length = this._columns;

		let rowData;
		let node;
		// const cmd = new CompoundCommand();

		this._rowData.forEach((row, rowIndex) => {
			this._columnData.forEach((column, columnIndex) => {
				node = this.getItemAt(rowIndex * this._columnData.length + columnIndex);
				if (!node) {
					node = new Node();
					node.getItemAttributes().setRotatable(false);
					node.getItemAttributes().setMoveable(false);
					node.getItemAttributes().setSizeable(false);
					this.addItem(node, rowIndex * this._columnData.length + columnIndex);
					// cmd.add(new AddItemCommand(cell._node, this));
				}
			});
		});

	}

	layout() {
		const size = this.getSize().toPoint();

		// get min cell sizes from content


		// do column layout first to get row heights
		let sizeLeftOver = size.x;
		let percentLeftOver = 100;
		let numAuto = 0;
		let sizeSection;

		// deduct fixed sizes from available space
		this._columnData.forEach(column => {
			sizeSection = column.size;
			if (Numbers.isNumber(sizeSection)) {
				sizeLeftOver -= sizeSection;
			} else if (Strings.isString(sizeSection)) {
				if (sizeSection.endsWith('%')) {
					percentLeftOver -= Number(sizeSection.slice(0, -1));
				} else {
					numAuto += 1;
				}
			}
		});

		numAuto = Math.max(1, numAuto);

		this._columnData.forEach(column => {
			sizeSection = column.size;
			if (Numbers.isNumber(sizeSection)) {
				column.layoutSize = sizeSection;
			} else if (Strings.isString(sizeSection)) {
				if (sizeSection.endsWith('%')) {
					sizeSection = Number(sizeSection.slice(0, -1));
					if (Numbers.isNumber(sizeSection)) {
						column.layoutSize = sizeSection / 100 * sizeLeftOver;
					} else {
						column.layoutSize = 3000;
					}
				} else {
					column.layoutSize = percentLeftOver / 100 / numAuto * sizeLeftOver;
				}
			} else {
				column.layoutSize = 3000;
			}
		});

		// do row layout

		size.y = 0;
		this._rowData.forEach(row => {
			sizeSection = row.size;
			if (Numbers.isNumber(sizeSection)) {
				row.layoutSize = sizeSection;
			} else {
				row.layoutSize = 4000;
			}
			size.y += row.layoutSize;
		});

		// update layoutcells
		let x = 0;
		let y = 0;
		let node;
		const margin = 200;

		this._rowData.forEach((row, rowIndex) => {
			this._columnData.forEach((column, columnIndex) => {
				node = this.getItemAt(rowIndex * this._columnData.length + columnIndex);
				if (node) {
					node.setOrigin(x, y);
					node.setSize(column.layoutSize, row.layoutSize);
					node.getItems().forEach(subItem => {
						subItem.setOrigin(margin, margin);
						subItem.setSize(column.layoutSize - margin * 2, row.layoutSize - margin * 2);

					});
				}
				x += column.layoutSize;
			});
			x = 0;
			y += row.layoutSize;
		});

		// set height of layout node
		this.setHeight(size.y);
	}

	isAddLabelAllowed() {
		return false;
	}
};
