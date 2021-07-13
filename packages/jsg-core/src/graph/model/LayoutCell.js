
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
const NumberAttribute = require('../attr/NumberAttribute');
const ItemAttributes = require('../attr/ItemAttributes');

module.exports = class LayoutCell extends Node {
	constructor() {
		super();

		this.getFormat().setLineStyle(0);
		this.getItemAttributes().setRotatable(false);
		this.getItemAttributes().setMoveable(false);
		this.getItemAttributes().setSizeable(false);
		this.getItemAttributes().setDeleteable(false);
		this.addAttribute(new NumberAttribute('mergecount', 0));
	}

	newInstance() {
		return new LayoutCell();
	}

	getItemType() {
		return 'layoutcell';
	}

	get allowSubMarkers() {
		return false;
	}

	layout() {
		super.layout();
	}

	isAddLabelAllowed() {
		return false;
	}

	getPropertyCategories() {
		return [
			{
				key: 'format',
				label: 'GraphItemProperties.Format',
				name: '',
			},
		]
	}

	getDefaultPropertyCategory() {
		return 'format';
	}

	isValidPropertyCategory(category) {
		return category === 'format';
	}

};

