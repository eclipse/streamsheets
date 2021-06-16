
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
const Numbers = require('../../commons/Numbers');
const Arrays = require('../../commons/Arrays');

JSG.LAYOUT_SHOW_CONTEXT_MENU_NOTIFICATION = 'jsg.show.layout.context.menu';

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

		copy._rows = this._rows;
		copy._columns = this._columns;
		copy._rowData = [];
		copy._columnData = [];
		this._rowData.forEach(row => {
			copy._rowData.push(row.copy());
		});
		this._columnData.forEach(column => {
			copy._columnData.push(column.copy());
		});

		return copy;
	}

	isFeedbackDetailed() {
		return true;
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

	addRow(section, index) {
		if (section) {
			Arrays.insertAt(this.rowData, index, section);
		}
		this._rows += 1;

		for (let i = 0; i < this._columnData.length; i += 1) {
			this.addCell(index, i);
		}

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

	addColumn(section, index) {
		if (section) {
			Arrays.insertAt(this.columnData, index, section);
		}
		this._columns += 1;

		for (let i = 0; i  < this._rowData.length; i += 1) {
			this.addCell(i, index);
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

	prepareResize(row, index) {
		this.resizeInfo = {
			row,
			index,
			sectionSize: row ? this._rowData[index].size : this._columnData[index].size,
			size: row ? this.getHeight().getValue() : this.getWidth().getValue(),
			relativeSize: this.getRelativeSizeInfo()
		};

		if (row) {
			this.resizeInfo.sectionSizes = [];
			this.resizeInfo.sectionSizesSum = 0;
			this._rowData.forEach((rowa, rowIndex) => {
				this.resizeInfo.sectionSizes.push(rowa.size);
				if (rowIndex !== index && rowa.sizeMode === 'relative') {
					this.resizeInfo.sectionSizesSum += rowa.size;
				}
			});
		} else {
			this.resizeInfo.sectionSizes = [];
			this.resizeInfo.sectionSizesSum = 0;
			this._columnData.forEach((column, colIndex) => {
				this.resizeInfo.sectionSizes.push(column.size);
				if (colIndex !== index && column.sizeMode === 'relative') {
					this.resizeInfo.sectionSizesSum += column.size;
				}
			});
		}
	}

	resizeSection(delta) {
		const layoutMode = this.getAttributeValueAtPath('layoutmode');
		const info = this.resizeInfo;
		const data = info.row ?
			this._rowData[info.index] :
			this._columnData[info.index];

		if (data.sizeMode === 'relative') {
			const factor = info.reltiveSize.space ? info.relativeSize.sum / info.relativeSize.space : 1;
			const size = (info.sectionSize + delta * factor) / factor;
			if (size > data.minSize) {
				data.size = Math.max(0, info.sectionSize + delta * factor);
				if (layoutMode === 'resize') {
					const fact = data.size - info.sectionSize;
					this._columnData.forEach((column, index) => {
						if (index !== info.index && column.sizeMode === 'relative') {
							column.size = this.resizeInfo.sectionSizes[index] -
								this.resizeInfo.sectionSizes[index] /
								this.resizeInfo.sectionSizesSum * fact;
						}
					});
				}
			} else {
				return;
			}
		} else {
			data.size = Math.max(0, info.sectionSize + delta);
		}
		if (info.row) {
			this.setHeight(info.size + delta);
		} else if (layoutMode !== 'resize') {
			this.setWidth(info.size + delta);
		}

		this.layout();
	}

	addCell(rowIndex, columnIndex) {
		const node = new Node();

		node.getFormat().setLineStyle(0);
		node.getItemAttributes().setRotatable(false);
		node.getItemAttributes().setMoveable(false);
		node.getItemAttributes().setSizeable(false);
		node.getItemAttributes().setDeleteable(false);
		node.addAttribute(new NumberAttribute('mergecount', 0));
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
		return ((node instanceof JSG.SheetPlotNode) || (node instanceof JSG.StreamSheetWrapper));
	}

	getRelativeSizeInfo() {
		const size = this.getSize().toPoint();
		const ret = {
			sum: 0,
			space: size.x
		};

		this._columnData.forEach(column => {
			switch (column.sizeMode) {
			case 'absolute':
				ret.space -= column.size;
				break;
			case 'relative':
			default:
				ret.sum += column.size;
				break;
			}
		});

		return ret;
	}

	layout() {
		super.layout();

		const size = this.getSize().toPoint();
		const layoutMode = this.getAttributeValueAtPath('layoutmode');

		// get min cell sizes from content


		// do column layout first to get row heights
		let sizeLeftOver = size.x;
		let sumRelative = 0;
		let layoutSize;
		const columns = [];

		// deduct fixed sizes from available space
		this._columnData.forEach(column => {
			switch (column.sizeMode) {
			case 'absolute':
				sizeLeftOver -= column.size;
				break;
			case 'relative':
			default:
				sumRelative += column.size;
				break;
			}
		});

		sumRelative = Math.max(1, sumRelative);
		sizeLeftOver = Math.max(0, sizeLeftOver);

		// check, if min size > relative size
		this._columnData.forEach(column => {
			const colData = {};
			switch (column.sizeMode) {
			case 'absolute':
				colData.size = Math.max(column.minSize, column.size);
				colData.sizeMode = column.sizeMode;
				break;
			case 'relative':
			default:
				layoutSize = column.size / sumRelative * sizeLeftOver;
				if (layoutSize > column.minSize) {
					colData.size = column.size;
					colData.sizeMode = column.sizeMode;
				} else {
					colData.size = column.minSize;
					colData.sizeMode = 'absolute';
				}
				break;
			}
			columns.push(colData);
		});

		sumRelative = 0;
		sizeLeftOver = size.x;

		columns.forEach(column => {
			switch (column.sizeMode) {
			case 'absolute':
				sizeLeftOver -= column.size;
				break;
			case 'relative':
			default:
				sumRelative += column.size;
				break;
			}
		});

		sumRelative = Math.max(1, sumRelative);
		sizeLeftOver = Math.max(0, sizeLeftOver);

		columns.forEach((column, index) => {
			switch (column.sizeMode) {
			case 'absolute':
				this.columnData[index].layoutSize = column.size;
				break;
			case 'relative':
			default:
				this.columnData[index].layoutSize = column.size / sumRelative * sizeLeftOver;
				break;
			}
		});

		const margin = 200;

		size.x = 0;
		size.y = 0;

		this._rowData.forEach((row, rowIndex) => {
			switch (row.sizeMode) {
			case 'absolute':
				row.layoutSize = Numbers.isNumber(row.size) ? row.size : 3000;
				break;
			case 'auto': {
				let height = row._minSize;
				this._columnData.forEach((column, columnIndex) => {
					let usedHeight = margin;
					const node = this.getItemAt(rowIndex * this._columnData.length + columnIndex);
					if (node) {
						node.getItems().forEach(subItem => {
							usedHeight += subItem.getHeight().getValue();
							usedHeight += margin;
						});
					}
					height = Math.max(height, usedHeight);
				});
				row.layoutSize = height;
				row.size = height;
				break;
			}
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

