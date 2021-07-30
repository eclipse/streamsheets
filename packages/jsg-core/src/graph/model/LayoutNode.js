
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

	getMinimumLayoutSize() {
		let node;
		let total = 0;

		this._columnData.forEach((column, columnIndex) => {
			let minSize = column.minSize;
			this._rowData.forEach((row, rowIndex) => {
				node = this.getItemAt(rowIndex * this._columnData.length + columnIndex);
				if (node && node.getMinimumLayoutSize) {
					minSize = Math.max(minSize, node.getMinimumLayoutSize());
				}
			});
			column._layoutMinSize = minSize;
			this._rowData.forEach((row, rowIndex) => {
				node = this.getItemAt(rowIndex * this._columnData.length + columnIndex);
				if (node) {
					const size = node.getSizeAsPoint();
					if (size.x < column._layoutMinSize) {
						node.setWidth(column._layoutMinSize);
					}
				}
			});
			total += minSize;
		});

		return total;
	}

	layout() {
		const minimumSize = this.getMinimumLayoutSize();
		const size = this.getSizeAsPoint();
		let node;

		this._virtualRowData = [];

		if (size.x < minimumSize) {
			this.setWidth(minimumSize);
			size.x = minimumSize;
		}

		let vRow = 0;

		// create virtual rows for wrapping
		this._rowData.forEach((row, rowIndex) => {
			this._columnData.forEach((column, columnIndex) => {
				node = this.getItemAt(rowIndex * this._columnData.length + columnIndex);
				let wrapValue = 0;
				if (node) {
					if (!this._virtualRowData[vRow]) {
						this._virtualRowData[vRow] = row.copy();
						this._virtualRowData[vRow].columnData = [];
						this._virtualRowData[vRow].index = rowIndex;
						this._virtualRowData[vRow].expandable = columnIndex === 0 && row.expandable;
					}
					const copy = column.copy()
					copy.nodeIndex = rowIndex * this._columnData.length + columnIndex;
					this._virtualRowData[vRow].columnData.push(copy);
					wrapValue = node.getLayoutCellAttributes().getNewLine().getValue();
					if (size.x < wrapValue && columnIndex < this._columns - 1) {
						vRow += 1;
					}
				}
			});
			vRow += 1;
		});

		// do column layout first

		this._virtualRowData.forEach((row, rowIndex) => {
			let absSizes = size.x;
			let relSizes = 0;

			row.columnData.forEach((column, index) => {
				relSizes += column.size;
			});

			row.columnData.forEach((column, index) => {
				if (column.size / relSizes * size.x <= column._layoutMinSize) {
					absSizes -= column._layoutMinSize;
					relSizes -= column.size;
				}
			});

			row.columnData.forEach((column, index) => {
				let width;
				if (column.size / relSizes * absSizes > column._layoutMinSize) {
					width = column.size / relSizes * absSizes;
				} else {
					width = column._layoutMinSize;
				}
				column.layoutSize = width;
			});
		});

		const margin = 200;

		// update

		this._virtualRowData.forEach((row, rowIndex) => {
			row.columnData.forEach((column, columnIndex) => {
				node = this.getItemAt(column.nodeIndex);
				if (node) {
					node._expandable = row.expandable;
					node._merged = false;
				}
			});
			row.columnData.forEach((column, columnIndex) => {
				node = this.getItemAt(column.nodeIndex);
				if (node) {
					let width = column.layoutSize;
					if (node._merged === false && node.getLayoutCellAttributes) {
						const mergeCount = node.getLayoutCellAttributes().getMergeCount().getValue();
						node.getItemAttributes().setVisible(true);
						for (let i = columnIndex + 1; i <= columnIndex + mergeCount; i += 1) {
							if (i < this._columnData.length) {
								width += row.columnData[i].layoutSize;
								const mergeNode = this.getItemAt(column.nodeIndex + i);
								if (mergeNode) {
									if (mergeNode.isItemVisible()) {
										mergeNode.getItemAttributes().setVisible(false);
									}
									mergeNode._merged = true;
								}
							}
						}
					}
					node.setWidth(width);
				}
			});
		});

		// do sublayouts to set all widths and corresponding height

		this.subItems.forEach(subItem => {
			subItem.layout();
		});


		// set height depending on sublayout

		this._virtualRowData.forEach((row, rowIndex) => {
			const expanded = this._rowData[row.index].expanded;
			const expandable = this._rowData[row.index].expandable;
			switch (row.sizeMode) {
			case 'absolute':
				if (expandable && !expanded) {
					row.layoutSize = row.expandable ? 800 : 0;
				} else {
					row.layoutSize = Numbers.isNumber(row.size) ? row.size : 1000;
				}
				break;
			case 'auto': {
				let height = row._minSize;
				if (expandable && !expanded) {
					height = row.expandable ? 800 : 0;
				} else {
					let usedHeight = margin;
					row.columnData.forEach((column, columnIndex) => {
						node = this.getItemAt(column.nodeIndex);
						if (node) {
							if (node._layoutHeight === undefined) {
								// usedHeight = Numbers.isNumber(row.size) ? row.size : 1000;
							} else {
								usedHeight = Math.max(node._layoutHeight, usedHeight);
							}
						}
					});
					height = Math.max(row.minSize, usedHeight);
				}
				row.layoutSize = height;
				row.size = height;
				break;
			}
			}
			size.y += row.layoutSize;
		});

		let x = 0;
		let y = 0;

		this._virtualRowData.forEach((row, rowIndex) => {
			row.columnData.forEach((column, columnIndex) => {
				node = this.getItemAt(column.nodeIndex);
				// let wrapValue = 0;
				if (node) {
					// wrapValue = node.getLayoutCellAttributes().getNewLine().getValue();
					node.setOrigin(x, y);
					node.setHeight(row.layoutSize);
				}

				x += column.layoutSize;
				// if (size.x < wrapValue) {
				// 	x = 0;
				// 	y += row.layoutSize;
				// }
			});
			y += row.layoutSize;
			if (!rowIndex) {
				size.x = x;
			}
			x = 0;
		});

		size.y = y;

		// finally set height of layout node
		this.setSizeToPoint(size);
	}

	isAddLabelAllowed() {
		return false;
	}
};

