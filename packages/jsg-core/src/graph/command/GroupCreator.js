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
const JSG = require('../../JSG');
/* eslint-disable no-unused-vars */
const GraphItem = require('../model/GraphItem');
/* eslint-enable no-unused-vars */
const ItemAttributes = require('../attr/ItemAttributes');
const FormatAttributes = require('../attr/FormatAttributes');
const NumberExpression = require('../expr/NumberExpression');
const RectangleShape = require('../model/shapes/RectangleShape');
const Group = require('../model/Group');
const Node = require('../model/Node');

/**
 * The default object used by {{#crossLink "AbstractGroupUngroupCommand"}}{{/crossLink}} to create and
 * initialize a new {{#crossLink "Group"}}{{/crossLink}} item.</br>
 * To create this object simply call <code>GroupCreator()</code>, i.e. without <code>new</code>.
 *
 * @class GroupCreator
 * @constructor
 */
class GroupCreator {
	/**
	 * Creates and returns a new group object.
	 *
	 * @method create
	 * @return {GraphItem} A newly created group.
	 */
	create() {
		const group = new Group();
		group.getFormat().setFillStyle(FormatAttributes.FillStyle.NONE);
		group.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
		return group;
	}

	/**
	 * Initializes given group.
	 *
	 * @method initGroup
	 * @param {GraphItem} group The group item to initialize.
	 * @param {BoundingBox} groupbox The bounding.box to use for the group.
	 */
	initGroup(newGroup, groupbox) {
		//		var origin = groupbox.getCenter(JSG.ptCache.get(), true);
		const origin = groupbox.getTopLeft(JSG.ptCache.get(), true);
		newGroup.setOriginTo(origin);
		newGroup.setBoundingBoxTo(groupbox);
		newGroup.setName(`group${newGroup.getId()}`);
		JSG.ptCache.release(origin);
	}

	/**
	 * Initializes given group item, e.g. adjust certain attribute values or set a relative pin position.<br/>
	 *
	 * @method initItem
	 * @param {GraphItem} item The item to initialize.
	 * @param {BoundingBox} groupbox The bounding-box of the group to which given item belongs.
	 */
	initItem(item, groupbox) {
		const attributes = item.getItemAttributes();
		const info = {};
		// copy things we change to support restore:
		info.selmode = attributes
			.getSelectionMode()
			.getExpression()
			.copy();
		item._groupchangeinfo = info;

		const groupWidth = groupbox.getWidth();
		const groupHeight = groupbox.getHeight();
		const Expression = NumberExpression;
		const pin = item.getPin();
		let xExpr =
			groupWidth !== 0
				? `${pin.getX().getValue() / groupWidth} * Parent!WIDTH`
				: 0;
		let yExpr =
			groupHeight !== 0
				? `${pin.getY().getValue() / groupHeight} * Parent!HEIGHT`
				: 0;
		pin.setCoordinate(new Expression(0, xExpr), new Expression(0, yExpr));

		const size = item.getSize();
		xExpr =
			groupWidth !== 0
				? `${size.getWidth().getValue() / groupWidth} * Parent!WIDTH`
				: 0;
		yExpr =
			groupHeight !== 0
				? `${size.getHeight().getValue() / groupHeight} * Parent!HEIGHT`
				: 0;
		item.setSize(new Expression(0, xExpr), new Expression(0, yExpr));

		// why does this not work... => selection is done in MarqueeActivator
		attributes.setSelectionMode(ItemAttributes.SelectionMode.SELECTPARENT);
	}

	/**
	 * Restores attributes values of given group item which was changed by {{#crossLink
	 * "GroupCreator/initItem:method"}}{{/crossLink}}.<br/>
	 *
	 * @method restoreItem
	 * @param {GraphItem} item The item to restore.
	 * @since  1.6.18
	 */
	restoreItem(item) {
		const info = item._groupchangeinfo;
		const attributes = item.getItemAttributes();
		if (info && info.selmode) {
			attributes.setSelectionMode(info.selmode);
		}
	}
}

/**
 * Another object to create a simple group based on a rectangle {{#crossLink
 * "Group"}}{{/crossLink}}.</br> Please refer to {{#crossLink
 * "GroupCreator"}}{{/crossLink}} too.
 *
 * @class GroupCreatorSimple
 * @constructor
 */
class GroupCreatorSimple {
	create() {
		const group = new Node(
			new RectangleShape()
		);
		group.setType('group');
		group.setItemAttribute(
			ItemAttributes.SELECTIONMODE,
			ItemAttributes.SelectionMode.AREA |
				ItemAttributes.SelectionMode.SELECTPARENT
		);
		group.getFormat().setFillStyle(FormatAttributes.FillStyle.NONE);
		group.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
		return group;
	}

	initGroup(newGroup, groupbox) {
		const origin = groupbox.getTopLeft(JSG.ptCache.get());
		newGroup.setBoundingBoxTo(groupbox);
		newGroup.setOriginTo(origin);
		newGroup.setName(`group${newGroup.getId()}`);
		JSG.ptCache.release(origin);
	}

	initItem(item, groupbox) {
		const groupWidth = groupbox.getWidth();
		const groupHeight = groupbox.getHeight();
		const attributes = item.getItemAttributes();
		// copy things we change to support restore:
		const info = {};
		info.selmode = attributes
			.getSelectionMode()
			.getExpression()
			.copy();
		info.moveable = attributes
			.getMoveable()
			.getExpression()
			.copy();
		info.sizeable = attributes
			.getSizeable()
			.getExpression()
			.copy();
		item._groupchangeinfo = info;

		attributes.setMoveable(ItemAttributes.Moveable.NONE);
		attributes.setSizeable(false);

		const Expression = NumberExpression;
		const pin = item.getPin();
		let xExpr =
			groupWidth !== 0
				? `${pin.getX().getValue() / groupWidth} * Parent!WIDTH`
				: 0;
		let yExpr =
			groupHeight !== 0
				? `${pin.getY().getValue() / groupHeight} * Parent!HEIGHT`
				: 0;
		pin.setCoordinate(new Expression(0, xExpr), new Expression(0, yExpr));

		const size = item.getSize();
		xExpr =
			groupWidth !== 0
				? `${size.getWidth().getValue() / groupWidth} * Parent!WIDTH`
				: 0;
		yExpr =
			groupHeight !== 0
				? `${size.getHeight().getValue() / groupHeight} * Parent!HEIGHT`
				: 0;
		item.setSize(new Expression(0, xExpr), new Expression(0, yExpr));
	}

	restoreItem(item, group) {
		const attributes = item.getItemAttributes();
		// defaults:
		let sizeable = true;
		let moveable = ItemAttributes.Moveable.BOTH;
		let selectionMode = group
			.getItemAttributes()
			.getSelectionMode()
			.getValue();
		const info = item._groupchangeinfo;
		if (info) {
			moveable = info.moveable !== undefined ? info.moveable : moveable;
			sizeable = info.sizeable !== undefined ? info.sizeable : sizeable;
			selectionMode =
				info.selmode !== undefined ? info.selmode : selectionMode;
		}
		attributes.setMoveable(moveable);
		attributes.setSizeable(sizeable);
		attributes.setSelectionMode(selectionMode);
	}
}

module.exports = {
	GroupCreatorSimple,
	GroupCreator
};
