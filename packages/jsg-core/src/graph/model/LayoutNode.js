
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
const JSG = require('../../JSG');
const LayoutSection = require('./LayoutSection');
const FormatAttributes = require('../attr/FormatAttributes');
const StringAttribute = require('../attr/StringAttribute');
const NumberAttribute = require('../attr/NumberAttribute');
const ItemAttributes = require('../attr/ItemAttributes');
const Strings = require('../../commons/Strings');
const Numbers = require('../../commons/Numbers');
const Arrays = require('../../commons/Arrays');
const CompoundCommand = require('../command/CompoundCommand');
const AddItemCommand = require('../command/AddItemCommand');


module.exports = class LayoutNode extends Node {
	constructor() {
		super();

		this._rows = 2;
		this._columns = 2;

		// LayoutSections
		this._rowData = [new LayoutSection(2000)];
		this._columnData = [];
		this._data = [];

		// LayoutCells
		this.updateData();

		this.getItemAttributes().setSelectionMode(ItemAttributes.SelectionMode.AREA);
		this.getFormat().setFillStyle(FormatAttributes.FillStyle.NONE);
		this.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setRotatable(false);
		this.getItemAttributes().setClipChildren(true);

		this.addAttribute(new StringAttribute('layoutmode', 'resize'));
		this.addAttribute(new NumberAttribute('minwidth', 10000));
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

	addRow(section) {
		if (section) {
			this.rowData.push(section);
		}
		this._rows += 1;
		this.updateData();
		this.getGraph().markDirty();
	}

	deleteRow(index) {
		this._rows -= 1;
		Arrays.removeAt(this._rowData, index);

		for (let i = this._columnData.length - 1; i  >= 0; i -= 1) {
			this.removeCell(index, i);
		}

		this.updateData();
		this.getGraph().markDirty();
	}

	addColumn(section) {
		if (section) {
			this.columnData.push(section);
		}
		this._columns += 1;

		for (let i = this._rowData.length - 1; i  >= 0; i -= 1) {
			this.addCell(i, this._columnData.length);
		}
		this.updateData();
		this.getGraph().markDirty();
	}

	deleteColumn(index) {
		this._columns -= 1;

		for (let i = this._rowData.length - 1; i  >= 0; i -= 1) {
			this.removeCell(i, index);
		}

		Arrays.removeAt(this._columnData, index);

		this.updateData();
		this.getGraph().markDirty();
	}

	addCell(rowIndex, columnIndex) {
		const node = new Node();

		node.getFormat().setLineStyle(0);
		node.getItemAttributes().setRotatable(false);
		node.getItemAttributes().setMoveable(false);
		node.getItemAttributes().setSizeable(false);
		node.getItemAttributes().setDeleteable(false);
		this.addItem(node, rowIndex * this._columnData.length + columnIndex);

		return node;
	}

	removeCell(rowIndex, columnIndex) {
		const node = this.getItemAt(rowIndex * this._columnData.length + columnIndex);
		this.removeItem(node);
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
					node = this.addCell(rowIndex, columnIndex);
				}
			});
		});
	}

	fromJSON(json) {
		super.fromJSON(json);

		const layout = json.layout;

		if (!layout) {
			return;
		}

		this._rows = layout.rows;
		this._columns = layout.columns;

		if (layout.rowData) {
			this._rowData = [];
			layout.rowData.forEach(data => {
				const section = new LayoutSection();
				section.fromJSON(data);
				this._rowData.push(section);
			});
		}

		if (layout.columnData) {
			this._columnData = [];
			layout.columnData.forEach(data => {
				const section = new LayoutSection();
				section.fromJSON(data);
				this._columnData.push(section);
			});
		}
	}

	toJSON() {
		const json = super.toJSON();
		const layout = {};

		layout.rows = this._rows;
		layout.columns = this._columns;
		layout.rowData = [];
		layout.columnData = [];

		this._columnData.forEach((section) => {
			layout.columnData.push(section.toJSON());
		});
		this._rowData.forEach((section) => {
			layout.rowData.push(section.toJSON());
		});

		json.layout = layout;

		return json;
	}

	isAutoResizeNode(node) {
		return ((node instanceof JSG.SheetPlotNode) || (node instanceof JSG.StreamSheetContainerWrapper));
	}

	layout() {
		super.layout();

		const size = this.getSize().toPoint();
		const layoutMode = this.getAttributeValueAtPath('layoutmode');

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
		const getAutoSizeCount = (node) => {
			let cnt = 0;
			node.getItems().forEach(subItem => {
				if (this.isAutoResizeNode(subItem)) {
					cnt += 1;
				}
			});

			return cnt;
		}
		const margin = 200;

		size.x = 0;
		size.y = 0;
		this._rowData.forEach((row, rowIndex) => {
			sizeSection = row.size;
			if (Numbers.isNumber(sizeSection)) {
				row.layoutSize = sizeSection;
			} else { // auto size
				let height = Math.max(row._minSize === 'auto' ? 1000 : row._minSize);
				this._columnData.forEach((column, columnIndex) => {
					let usedHeight = margin;
					const node = this.getItemAt(rowIndex * this._columnData.length + columnIndex);
					if (node) {
						// const items = getAutoSizeCount(node);
						node.getItems().forEach(subItem => {
							usedHeight += subItem.getHeight().getValue();
							usedHeight += margin;
						});
					}
					height = Math.max(height, usedHeight);
				});
				row.layoutSize = height;
			}
			size.y += row.layoutSize;
		});

		// update layoutcells
		let x = 0;
		let y = 0;
		let node;

		this._rowData.forEach((row, rowIndex) => {
			this._columnData.forEach((column, columnIndex) => {
				node = this.getItemAt(rowIndex * this._columnData.length + columnIndex);
				if (node) {
					node.setOrigin(x, y);
					node.setSize(column.layoutSize, row.layoutSize);
					node.getFormat().setLineStyle(0);
					let yInner = 0;
					node.getItems().forEach(subItem => {
						const height = subItem.getHeight().getValue();
						subItem.setSize(column.layoutSize - margin * 2, height);
						subItem.setOrigin(margin, yInner + margin);
						yInner += height + margin;
					});
				}
				x += column.layoutSize;
			});
			y += row.layoutSize;
			if (!rowIndex) {
				size.x = x;
			}
			x = 0;
		});

		// set height of layout node
		this.setSizeToPoint(size);
	}

	isAddLabelAllowed() {
		return false;
	}
};

