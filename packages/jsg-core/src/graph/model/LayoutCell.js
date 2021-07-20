
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
const NumberAttribute = require('../attr/NumberAttribute');
const StringAttribute = require('../attr/StringAttribute');
const LayoutCellAttributes = require('../attr/LayoutCellAttributes');
const DeleteItemCommand = require('../command/DeleteItemCommand');
const AddItemCommand = require('../command/AddItemCommand');
const ItemAttributes = require('../attr/ItemAttributes');

module.exports = class LayoutCell extends Node {
	constructor() {
		super();

		this.getFormat().setLineStyle(0);
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

	toJSON() {
		const ret = super.toJSON();

		ret.layoutcellattributes = this.getLayoutCellAttributes().toJSON(true);

		return ret;
	}

	fromJSON(json) {
		super.fromJSON(json);

		if (json.layoutcellattributes) {
			this.getLayoutCellAttributes().fromJSON(json.layoutcellattributes);
		}
	}

	layout() {
		const size = this.getSizeAsPoint();
		const margin = 200;
		let yInner = this._expandable ? 600 : 0;
		let xInner = 0;

		this._layoutHeight = undefined;

		switch (this.getLayoutCellAttributes().getLayout().getValue()) {
		case 'row':
			this.subItems.forEach(subItem => {
				subItem._expandable = this._expandable;
				subItem.layout();
				const height = subItem.getHeight().getValue();
				if (!subItem.getWidth().hasFormula()) {
					subItem.setWidth(size.x - margin * 2);
				}
				if (!subItem.getHeight().hasFormula()) {
					subItem.setHeight(height);
				}
				subItem.setOrigin(margin, yInner + margin);
				yInner += height + margin;
			});
			this._layoutHeight = yInner + margin;
			break;
		case 'column':
			this.fixColumnData();
			this.subItems.forEach((subItem, index) => {
				subItem._expandable = this._expandable;
				subItem.layout();
				if (subItem._layoutHeight) {
					this._layoutHeight = this._layoutHeight === undefined ?
						subItem._layoutHeight :
						Math.max(this._layoutHeight, subItem._layoutHeight);
				}
				const width = this._columnData[index].size / 100 * size.x;
				if (!subItem.getWidth().hasFormula()) {
					subItem.setWidth(width);
				}
				subItem.setOrigin(xInner, 0);
				xInner += width;
			});
			this.subItems.forEach((subItem, index) => {
				if (subItem._layoutHeight > size.y) {
					subItem.setHeight(subItem._layoutHeight);
				} else {
					subItem.setHeight(size.y);
				}
			});
			break;
		default:
			break;
		}
	}

	fixColumnData() {
		const itemCnt = Math.max(1, this.getItemCount());

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
		return 'format';
	}

	isValidPropertyCategory(category) {
		return category === 'format' || category === 'layout';
	}

	handleLayoutColumnChange(newColumns, cmp) {
		const currentColumns = this.getItemCount();

		if (currentColumns < newColumns) {
			for (let i = currentColumns; i < newColumns; i+= 1) {
				const node = new LayoutCell();
				// node.getFormat().setFillColor('#DDDDDD');
				cmp.add(new AddItemCommand(node, this, i));
			}
		} else if (currentColumns > newColumns) {
			for (let i = currentColumns - 1; i >= newColumns; i -= 1) {
				cmp.add(new DeleteItemCommand(this.getItemAt(i)));
			}
		}
	}

};

