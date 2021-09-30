
/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const Node = require('./Node');
const LayoutSection = require('./LayoutSection');
const GraphUtils = require('../GraphUtils');
const LayoutCellAttributes = require('../attr/LayoutCellAttributes');
const DeleteItemCommand = require('../command/DeleteItemCommand');
const AddItemCommand = require('../command/AddItemCommand');
const ChangeParentCommand = require('../command/ChangeParentCommand');
const ItemAttributes = require('../attr/ItemAttributes');
const FormatAttributes = require('../attr/FormatAttributes');

module.exports = class LayoutCell extends Node {
	constructor() {
		super();

		this.getFormat().setLineStyle(0);
		this.getFormat().setFillStyle(FormatAttributes.FillStyle.NONE);
		this.getItemAttributes().setRotatable(false);
		this.getItemAttributes().setMoveable(false);
		this.getItemAttributes().setSizeable(false);
		this.getItemAttributes().setDeleteable(false);
		this.getItemAttributes().setSelectionMode(ItemAttributes.SelectionMode.AREA);

		this.addAttribute(new LayoutCellAttributes());

		this._columnData = [];
	}

	newInstance() {
		return new LayoutCell();
	}

	getItemType() {
		return 'layoutcell';
	}

	get columnData() {
		return this._columnData;
	}

	get allowSubMarkers() {
		return false;
	}

	getMinimumLayoutSize() {
		this.fixColumnData();

		let minSize = 0;

		this._columnData.forEach((column, index) => {
			const item = this._subItems[index];
			const subSizes = item.getMinimumLayoutSize();
			const size = item.getSizeAsPoint();
			column._layoutMinSize = Math.max(column.minSize, subSizes);
			if (size.x < column._layoutMinSize) {
				item.setWidth(column._layoutMinSize);
			}
			minSize += Math.max(column.minSize, subSizes);
		});


		return minSize;
	}

	layout() {
	}

	subLayout() {
		const attr = this.getLayoutCellAttributes();
		const size = this.getSizeAsPoint();
		const margin = attr.getMargin().getValue();
		const gap = attr.getGap().getValue();
		let yInner = this._expandable ? 600 : 0;
		let xInner = 0;

		this._layoutHeight = undefined;
		if (!this._sourceRow) {
			return;
		}

		switch (attr.getLayout().getValue()) {
		case 'none':
			this.subItems.forEach((subItem, index) => {
				subItem._expandable = this._expandable;
				subItem._expanded = this._sourceRow.expanded;
				subItem.layout();
				if (subItem.isVisible()) {
					const origin = subItem.getOrigin();
					const align = subItem.getItemAttributes().getHorizontalAlignment().getValue();
					switch (align) {
					case 2:
						subItem.setOrigin((size.x - subItem.getWidth().getValue()) / 2, origin.y);
						break;
					case 3:
						subItem.setOrigin(size.x - margin - subItem.getWidth().getValue(), origin.y);
						break;
					case 0:
					case 1:
					default:
						subItem.setOrigin(margin, origin.y);
						break;
					}
				}
				subItem.layout();
			});
			break;
		case 'row':
			yInner += margin;
			if (this._expandable && !this._sourceRow.expanded) {
				this._layoutHeight = 800;
				this.subItems.forEach((subItem, index) => {
					subItem._expandable = this._expandable;
					subItem._expanded = this._sourceRow.expanded;
					subItem.layout();
				});
				this.setHeight(this._layoutHeight);
			} else {
				this.subItems.forEach((subItem, index) => {
					subItem._expandable = this._expandable;
					subItem._expanded = this._sourceRow.expanded;
					if (subItem.isVisible()) {
						subItem.layout();
						const height = subItem.getHeight().getValue();
						yInner += height + (index === this.getItemCount() - 1 ? 0 : gap);
					}
				});
				this._layoutHeight = yInner + margin;
				this.setHeight(this._layoutHeight);
				// this.setRefreshNeeded(true);
				// this._update();
				yInner = this._expandable ? 600 + margin : margin;
				this.subItems.forEach((subItem, index) => {
					if (subItem.isVisible()) {
						const height = subItem.getHeight().getValue();
						const align = subItem.getItemAttributes().getHorizontalAlignment().getValue();
						if (!subItem.getWidth().hasFormula()) {
							if (align === 0) {
								subItem.setWidth(size.x - margin * 2);
							}
						}
						if (!subItem.getHeight().hasFormula()) {
							subItem.setHeight(height);
						}
						switch (align) {
						case 2:
							subItem.setOrigin((size.x - subItem.getWidth().getValue()) / 2, yInner);
							break;
						case 3:
							subItem.setOrigin(size.x - margin - subItem.getWidth().getValue(), yInner);
							break;
						case 0:
						case 1:
						default:
							subItem.setOrigin(margin, yInner);
							break;
						}
						yInner += height + (index === this.getItemCount() - 1 ? 0 : gap);
					}
				});
			}
			break;
		case 'column': {
			let absSizes = size.x;
			let relSizes = 100;
			this.fixColumnData();
			this.subItems.forEach((subItem, index) => {
				const column = this._columnData[index];
				if (column.size / 100 * size.x <= column._layoutMinSize) {
					absSizes -= column._layoutMinSize;
					relSizes -= column.size;
				}
			});
			this.subItems.forEach((subItem, index) => {
				const column = this._columnData[index];
				subItem._expandable = this._expandable;
				subItem._sourceRow = this._sourceRow;
				subItem._expanded = this._sourceRow.expanded;
				subItem.subLayout();
				if (subItem._layoutHeight) {
					this._layoutHeight = this._layoutHeight === undefined ? subItem._layoutHeight :
						Math.max(this._layoutHeight, subItem._layoutHeight);
				}
				let width;
				if (column.size / relSizes * absSizes > column._layoutMinSize) {
					width = column.size / relSizes * absSizes;
				} else {
					width = column._layoutMinSize;
				}
				column.layoutSize = width;
				if (!subItem.getWidth().hasFormula()) {
					subItem.setWidth(width);
				}
				subItem.setOrigin(xInner, 0);
				xInner += width;
			});
			if (xInner >= size.x + 1) {
				let diff = xInner - size.x;
				xInner = 0;
				this.subItems.forEach((subItem, index) => {
					const column = this._columnData[index];
					if (diff > 0) {
						if (column.layoutSize > column._layoutMinSize) {
							const newSize = Math.max(column._layoutMinSize, column.layoutSize - diff);
							column.layoutSize = newSize;
							diff -= newSize;
							if (!subItem.getWidth().hasFormula()) {
								subItem.setWidth(column.layoutSize);
							}
						}
					}
					subItem.setOrigin(xInner, 0);
					xInner += column.layoutSize;
				});

			}
			this.subItems.forEach((subItem, index) => {
				if (subItem._layoutHeight > size.y) {
					subItem.setHeight(subItem._layoutHeight);
				} else {
					subItem.setHeight(size.y);
				}
				const origin = subItem.getOrigin();
				subItem.setOrigin(origin.x, 0);
			});
			this.setHeight(this._layoutHeight);
			break;
		}
		default:
			break;
		}
	}

	fixColumnData() {
		const itemCnt = Math.max(1, this.getItemCount());

		if (this.getLayoutCellAttributes().getLayout().getValue() !== 'column') {
			this._columnData = [];
			return;
		}

		if (itemCnt === this._columnData.length) {
			return;
		}

		this._columnData.length = 0;

		this.subItems.forEach(subItem => {
			this._columnData.push(new LayoutSection(100 / itemCnt, 'relative'));
		});

	}

	isAddLabelAllowed() {
		return false;
	}

	getLayoutCellAttributes() {
		return this.getModelAttributes().getAttribute(LayoutCellAttributes.NAME);
	}

	fromJSON(json) {
		super.fromJSON(json);

		if (json.layoutcellattributes) {
			this.getLayoutCellAttributes().fromJSON(json.layoutcellattributes);
		}

		const layout = json.layout;

		if (!layout) {
			return;
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

		json.layoutcellattributes = this.getLayoutCellAttributes().toJSON(true);
		layout.columnData = [];

		this._columnData.forEach((section) => {
			layout.columnData.push(section.toJSON());
		});

		json.layout = layout;

		return json;
	}

	getPropertyCategories() {
		return [
			{
				key: 'format',
				label: 'GraphItemProperties.Format',
				name: '',
			},
			{
				key: 'layout',
				label: 'GraphItemProperties.Layout',
				name: '',
			},
		]
	}

	getDefaultPropertyCategory() {
		return 'layout';
	}

	isValidPropertyCategory(category) {
		return category === 'format' || category === 'layout';
	}

	handleLayoutColumnChange(newColumns, cmp) {
		const currentColumns = this.getItemCount();

		if (currentColumns < newColumns) {
			for (let i = currentColumns; i < newColumns; i+= 1) {
				const node = new LayoutCell();
				cmp.add(new AddItemCommand(node, this, i));
			}
		} else if (currentColumns > newColumns) {
			for (let i = currentColumns - 1; i >= newColumns; i -= 1) {
				cmp.add(new DeleteItemCommand(this.getItemAt(i)));
			}
		}
	}

	handleLayoutTypeChange(newLayout, cmp) {
		const subItems = [];
		const oldLayout =  this.getLayoutCellAttributes().getLayout().getValue();
		const sections =  this.getLayoutCellAttributes().getSections().getValue();

		if (oldLayout === newLayout) {
			return;
		}

		if (oldLayout === 'column' && (newLayout === 'row' || newLayout === 'none')) {
			// collect non cell sub items and attach them to this node
			GraphUtils.traverseItem(this, item => {
				if (!(item instanceof LayoutCell) && (item.getParent() instanceof LayoutCell)) {
					subItems.push(item);
				}
			}, false);

			subItems.forEach(subItem => {
				cmp.add(new ChangeParentCommand(subItem, this));
				// cmp.add(new AddItemCommand(subItem, this));
			});

			this.handleLayoutColumnChange(0, cmp);

		} else 	if (oldLayout !== 'column' && newLayout === 'column') {
			// move content from current layout to first column
			this.subItems.forEach(subItem => {
				subItems.push(subItem);
			});

			// update layout cells
			for (let i = 0; i < sections; i+= 1) {
				const node = new LayoutCell();
				if (i === 0) {
					// attach subitems to first column
					subItems.forEach(subItem => {
						cmp.add(new ChangeParentCommand(subItem, node));
						// node.addItem(subItem);
					});
				}
				cmp.add(new AddItemCommand(node, this, i));
			}
		}
	}

	isCopyAllowed() {
		return false;
	}
};

