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
const ItemAttributes = require('../attr/ItemAttributes');
const ContentNode = require('./ContentNode');
const JSG = require('../../JSG');
const TreeItemsNode = require('./TreeItemsNode');

module.exports = class TreeNode extends ContentNode {
	constructor() {
		super();

		// this.addAttribute(new WorksheetAttributes());
		this.getFormat().setLineColor(JSG.theme.frame);
		this.getFormat().setFillColor(JSG.theme.fill);

		this.getItemAttributes().setSelectionMode(ItemAttributes.SelectionMode.NONE);
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setClipChildren(true);
		this.getItemAttributes().setContainer(false);
		this.getItemAttributes().setLeftMargin(200);
		this.getItemAttributes().setTopMargin(200);

		const items = new TreeItemsNode();
		this.addItem(items);
		this._tree = items;

		this._drawEnabled = false;
	}

	newInstance() {
		return new TreeNode();
	}

	/**
	 * Tree conta iner items.
	 *
	 * @method layout
	 */
	layout() {
		const numOfItems = this._tree.getVisibleTreeItemCount();
		const heightOfItem = this._tree
			.getTreeItemAttributes()
			.getTreeItemHeight()
			.getValue();
		const depthOffset = this._tree
			.getTreeItemAttributes()
			.getDepthOffset()
			.getValue();
		const newBoxHeight = numOfItems * depthOffset + heightOfItem;
		const height = this.getHeight().getValue();
		const width = this.getWidth().getValue();

		const box = JSG.boxCache.get();

		box.setLeft(0);
		box.setTop(0);
		box.setWidth(width - (newBoxHeight > height ? 450 : 0));
		box.setHeight(Math.max(height /* - 450 */, newBoxHeight));

		this._tree.setBoundingBoxTo(box);

		JSG.boxCache.release(box);

		super.layout();
	}

	getTreeItemsNode() {
		return this._tree;
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		copy._assignItems();

		return copy;
	}

	_assignItems() {
		this._tree = this.getContentPane().getItemAt(0);
	}

	isAddLabelAllowed() {
		return false;
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);

		file.writeAttributeString('type', 'treenode');
	}

	_assignName(id) {
		this.setName(`Tree${id}`);
	}

	read(reader, object) {
		super.read(reader, object);

		this._assignItems();
	}
};
