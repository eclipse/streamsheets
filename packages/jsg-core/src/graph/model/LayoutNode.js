
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
const LayoutCell = require('./LayoutCell');
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
		this._rowData = [new LayoutSection(1000, 'auto'), new LayoutSection(1000, 'auto')];
		this._columnData = [new LayoutSection(50, 'relative'), new LayoutSection(50, 'relative')];
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

	get allowSubMarkers() {
		return false;
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

	addRow(section, index, cells) {
		if (section) {
			Arrays.insertAt(this.rowData, index, section);
		}
		this._rows += 1;

		if (cells) {
			for (let i = 0; i < this._columnData.length; i += 1) {
				this.addItem(cells[this._columnData.length - i - 1], index * this._columnData.length + i);
			}
		} else {
			for (let i = 0; i < this._columnData.length; i += 1) {
				this.addCell(index, i);
			}
		}

		this.updateData();
		this.getGraph().markDirty();
	}

	deleteRow(index) {
		const removedCells = [];
		this._rows -= 1;
		Arrays.removeAt(this._rowData, index);

		for (let i = this._columnData.length - 1; i  >= 0; i -= 1) {
			removedCells.push(this.removeCell(index, i));
		}

		this.updateData();
		this.getGraph().markDirty();

		return removedCells;
	}

	addColumn(section, index, cells) {
		if (section) {
			Arrays.insertAt(this.columnData, index, section);
		}
		this._columns += 1;

		this.columnData.forEach(column => {
			column.size = 100 / this.columnData.length
		});

		if (cells) {
			for (let i = 0; i < this._rowData.length; i += 1) {
				this.addItem(cells[this._rowData.length - i - 1], i * this._columnData.length + index);
			}
		} else {
			for (let i = 0; i < this._rowData.length; i += 1) {
				this.addCell(i, index);
			}
		}

		this.updateData();
		this.getGraph().markDirty();
	}

	deleteColumn(index) {
		const removedCells = [];
		this._columns -= 1;

		for (let i = this._rowData.length - 1; i  >= 0; i -= 1) {
			removedCells.push(this.removeCell(i, index));
		}

		Arrays.removeAt(this._columnData, index);

		this.columnData.forEach(column => {
			column.size = 100 / this.columnData.length
		});

		this.updateData();
		this.getGraph().markDirty();

		return removedCells;
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
			this.resizeInfo.layoutSizes = [];
			this.resizeInfo.sectionSizesSum = 0;
			this._columnData.forEach((column, colIndex) => {
				this.resizeInfo.sectionSizes.push(column.size);
				this.resizeInfo.layoutSizes.push(column.layoutSize);
				if (colIndex !== index && column.sizeMode === 'relative') {
					this.resizeInfo.sectionSizesSum += column.size;
				}
			});
		}

		return this.resizeInfo;
	}

	resizeSection(delta) {
		const info = this.resizeInfo;
		const data = info.row ?
			this._rowData[info.index] :
			this._columnData[info.index];
		const dataNext = info.row ?
			this._rowData[info.index + 1] :
			this._columnData[info.index + 1];

		if (data.sizeMode === 'relative') {
			const totalRelSize = info.sectionSizes[info.index] + info.sectionSizes[info.index + 1];
			const totalAbsSize = info.layoutSizes[info.index] + info.layoutSizes[info.index + 1];
			let leftSize = (info.layoutSizes[info.index] + delta) / totalAbsSize * totalRelSize;
			let rightSize = (info.layoutSizes[info.index + 1] - delta) / totalAbsSize * totalRelSize;
			const leftSizeAbs = leftSize * info.size / 100;
			const rightSizeAbs = rightSize * info.size / 100;
			if (leftSizeAbs < data.minSize && rightSizeAbs < dataNext.minSize) {
				return;
			} else if (leftSizeAbs < data.minSize) {
				leftSize = data.minSize / info.size * 100;
				rightSize = totalRelSize - leftSize;
			} else if (rightSizeAbs < dataNext.minSize) {
				rightSize = dataNext.minSize / info.size * 100;
				leftSize = totalRelSize - rightSize;
			}
			data.size = leftSize;
			dataNext.size = rightSize;
		} else {
			data.size = Math.max(0, info.sectionSize + delta);
		}
		if (info.row) {
			this.setHeight(info.size + delta);
		}

		this.layout();
	}

	addCell(rowIndex, columnIndex) {
		const node = new LayoutCell();

		this.addItem(node, rowIndex * this._columnData.length + columnIndex);

		return node;
	}

	removeCell(rowIndex, columnIndex) {
		const node = this.getItemAt(rowIndex * this._columnData.length + columnIndex);
		this.removeItem(node);

		return node;
	}

	updateData() {
		let node;

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
				if (row.expandable && !row.expanded) {
					height = 800;
				} else {
					this._columnData.forEach((column, columnIndex) => {
						let usedHeight = margin;
						const node = this.getItemAt(rowIndex * this._columnData.length + columnIndex);
						if (node) {
							if (node.getLayout()) {
								node.getLayoutSettings().set(JSG.MatrixLayout.EXPANDABLE, row.expandable);
								node.layout();
								usedHeight = node._layoutHeight;
							} else {
								node.subItems.forEach(subItem => {
									usedHeight += subItem.getHeight().getValue();
									usedHeight += margin;
								});
							}
						}
						height = Math.max(height, usedHeight);
					});
					if (row.expandable) {
						height += 600;
					}
				}
				row.layoutSize = height;
				row.size = height;
				break;
			}
			}
			size.y += row.layoutSize;
		});

		// update
		let x = 0;
		let y = 0;
		let node;

		this._rowData.forEach((row, rowIndex) => {
			this._columnData.forEach((column, columnIndex) => {
				node = this.getItemAt(rowIndex * this._columnData.length + columnIndex);
				if (node) {
					node._merged = false;
				}
			});
			this._columnData.forEach((column, columnIndex) => {
				node = this.getItemAt(rowIndex * this._columnData.length + columnIndex);
				if (node) {
					node.setOrigin(x, y);
					let width = column.layoutSize;
					if (node._merged === false) {
						const mergeCount = node.getAttributeValueAtPath('mergecount');
						node.getItemAttributes().setVisible(true);
						for (let i = columnIndex + 1; i <= columnIndex + mergeCount; i += 1) {
							if (i < this._columnData.length) {
								width += this._columnData[i].layoutSize;
								const mergeNode = this.getItemAt(rowIndex * this._columnData.length + i);
								if (mergeNode) {
									if (mergeNode.isItemVisible()) {
										mergeNode.getItemAttributes().setVisible(false);
									}
									mergeNode._merged = true;
								}
							}
						}
					}
					node.setSize(width, row.layoutSize);
					let yInner = row.expandable ? 600 : 0;
					// if (node.getLayout()) {
					// 	node.layout();
					// }
					node.subItems.forEach(subItem => {
						if (row.expandable && !row.expanded) {
							subItem.getItemAttributes().setVisible(false);
						} else {
							subItem.getItemAttributes().setVisible(true);
							if (!node.getLayout()) {
								const height = subItem.getHeight().getValue();
								if (!subItem.getWidth().hasFormula()) {
									subItem.setWidth(width - margin * 2);
								}
								if (!subItem.getHeight().hasFormula()) {
									subItem.setHeight(height);
								}
								subItem.setOrigin(margin, yInner + margin);
								yInner += height + margin;
							}
						}
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

