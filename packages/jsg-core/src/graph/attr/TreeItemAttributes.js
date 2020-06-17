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
const NumberAttribute = require('./NumberAttribute');
const StringAttribute = require('./StringAttribute');
const AttributeList = require('./AttributeList');


// PREDEFINED ATTRIBUTES:
const TREE_ITEM_WIDTH = 'treeitemwidth';
const TREE_ITEM_HEIGHT = 'treeitemheight';

const ACTIVE_ELEMENT = 'activeelement';
const INDENT_OFFSET = 'indentoffset';
const DEPTH_OFFSET = 'depthoffset';

const COLOR_JSON_VALUE = 'colorjsonvalue';
const COLOR_JSON_STRING = 'colorjsonstring';
const COLOR_JSON_BOOLEAN = 'colorjsonboolean';
const COLOR_JSON_NUMBER = 'colorjsonnumber';
const COLOR_JSON_OBJECT = 'colorjsonobject';
const COLOR_JSON_ARRAY = 'colorjsonarray';
const COLOR_JSON_KEY_TEXT = 'colorjsonkeytext';
const COLOR_SELECTED_OVERLAY = 'colorselectedoverlay';

// UNIQUE NAME:
const NAME = 'TreeItemAttributes';
const TemplateID = 'TreeItemAttributes.Template';

/**
 * @class TreeItemAttributes
 * @extends AttributeList
 * @constructor
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined attributes.
 */
const TreeItemAttributes = class TreeItemAttributes extends AttributeList {
	constructor(mapExpr) {
		super(TreeItemAttributes.NAME, mapExpr);

		this.setParent(TreeItemAttributes.template);
	}

	newInstance(mapExpr) {
		return new TreeItemAttributes(mapExpr);
	}

	getClassString() {
		return 'JSG.TreeItemAttributes';
	}

	static createTemplate() {
		const ATTR = TreeItemAttributes;
		const attributes = new TreeItemAttributes();

		const addAttribute = (attribute, value, constraint) => {
			if (constraint) {
				attribute.getExpression().setConstraint(constraint);
			}
			value =
				value === undefined && constraint ? constraint.defValue : value;
			attribute.setExpressionOrValue(value);
			attributes.addAttribute(attribute);
		};

		// simply add default attributes:
		addAttribute(new NumberAttribute(ATTR.TREE_ITEM_WIDTH), 2500);
		addAttribute(new NumberAttribute(ATTR.TREE_ITEM_HEIGHT), 550);
		addAttribute(new NumberAttribute(ATTR.INDENT_OFFSET), 250);
		addAttribute(new NumberAttribute(ATTR.DEPTH_OFFSET), 700);
		// addAttribute(new StringAttribute(ATTR.COLOR_JSON_VALUE), '#dae3f4');
		// addAttribute(new StringAttribute(ATTR.COLOR_JSON_BOOLEAN), '#B1C639');
		// addAttribute(new StringAttribute(ATTR.COLOR_JSON_STRING), '#009408');
		// addAttribute(new StringAttribute(ATTR.COLOR_JSON_NUMBER), '#497B8D');
		// addAttribute(new StringAttribute(ATTR.COLOR_JSON_OBJECT), '#E17000');
		// addAttribute(new StringAttribute(ATTR.COLOR_JSON_ARRAY), '#2D5B89');
		// addAttribute(new StringAttribute(ATTR.COLOR_JSON_KEY_TEXT), '#FAFBF7');
		// addAttribute(
		// 	new StringAttribute(ATTR.COLOR_SELECTED_OVERLAY),
		// 	'#CCE8FF'
		// );
		addAttribute(new StringAttribute(ATTR.COLOR_JSON_VALUE), '#F0F0F0');
		addAttribute(new StringAttribute(ATTR.COLOR_JSON_BOOLEAN), '#B1C639');
		addAttribute(new StringAttribute(ATTR.COLOR_JSON_STRING), '#009408');
		addAttribute(new StringAttribute(ATTR.COLOR_JSON_NUMBER), '#497B8D');
		addAttribute(new StringAttribute(ATTR.COLOR_JSON_OBJECT), '#E17000');
		addAttribute(new StringAttribute(ATTR.COLOR_JSON_ARRAY), '#2D5B89');
		addAttribute(new StringAttribute(ATTR.COLOR_JSON_KEY_TEXT), '#FAFBF7');
		addAttribute(
			new StringAttribute(ATTR.COLOR_SELECTED_OVERLAY),
			'#CCE8FF'
		);
		addAttribute(new StringAttribute(ATTR.ACTIVE_ELEMENT), '[Artikel]');
		return attributes.toTemplate(TreeItemAttributes.TemplateID);
	}

	setTreeItemWidth(value) {
		this.setAttribute(TreeItemAttributes.TREE_ITEM_WIDTH, value);
	}

	getTreeItemWidth() {
		return this.getAttribute(TreeItemAttributes.TREE_ITEM_WIDTH);
	}

	setTreeItemHeight(value) {
		this.setAttribute(TreeItemAttributes.TREE_ITEM_HEIGHT, value);
	}

	getTreeItemHeight() {
		return this.getAttribute(TreeItemAttributes.TREE_ITEM_HEIGHT);
	}

	setIndentOffset(value) {
		this.setAttribute(TreeItemAttributes.INDENT_OFFSET, value);
	}

	getIndentOffset() {
		return this.getAttribute(TreeItemAttributes.INDENT_OFFSET);
	}

	setColorJsonValue(value) {
		this.setAttribute(TreeItemAttributes.COLOR_JSON_VALUE, value);
	}

	getColorJsonValue() {
		return this.getAttribute(TreeItemAttributes.COLOR_JSON_VALUE);
	}

	setColorJsonString(value) {
		this.setAttribute(TreeItemAttributes.COLOR_JSON_STRING, value);
	}

	getColorJsonString() {
		return this.getAttribute(TreeItemAttributes.COLOR_JSON_STRING);
	}

	setColorJsonNumber(value) {
		this.setAttribute(TreeItemAttributes.COLOR_JSON_NUMBER, value);
	}

	getColorJsonNumber() {
		return this.getAttribute(TreeItemAttributes.COLOR_JSON_NUMBER);
	}

	setColorJsonBoolean(value) {
		this.setAttribute(TreeItemAttributes.COLOR_JSON_BOOLEAN, value);
	}

	getColorJsonBoolean() {
		return this.getAttribute(TreeItemAttributes.COLOR_JSON_BOOLEAN);
	}

	setColorJsonObject(value) {
		this.setAttribute(TreeItemAttributes.COLOR_JSON_OBJECT, value);
	}

	getColorJsonObject() {
		return this.getAttribute(TreeItemAttributes.COLOR_JSON_OBJECT);
	}

	setColorJsonArray(value) {
		this.setAttribute(TreeItemAttributes.COLOR_JSON_ARRAY, value);
	}

	getColorJsonArray() {
		return this.getAttribute(TreeItemAttributes.COLOR_JSON_ARRAY);
	}

	setColorJsonKeyText(value) {
		this.setAttribute(TreeItemAttributes.COLOR_JSON_KEY_TEXT, value);
	}

	getColorJsonKeyText() {
		return this.getAttribute(TreeItemAttributes.COLOR_JSON_KEY_TEXT);
	}

	setDepthOffset(value) {
		this.setAttribute(TreeItemAttributes.DEPTH_OFFSET, value);
	}

	getDepthOffset() {
		return this.getAttribute(TreeItemAttributes.DEPTH_OFFSET);
	}

	setActiveElement(value) {
		this.setAttribute(TreeItemAttributes.ACTIVE_ELEMENT, value);
	}

	getActiveElement() {
		return this.getAttribute(TreeItemAttributes.ACTIVE_ELEMENT);
	}

	setSelectionOverlayColor(value) {
		this.setAttribute(TreeItemAttributes.COLOR_SELECTED_OVERLAY, value);
	}

	getSelectionOverlayColor() {
		return this.getAttribute(TreeItemAttributes.COLOR_SELECTED_OVERLAY);
	}

	doSaveParentRef() {
		return (
			this._parent &&
			this._parent.getName() !== TreeItemAttributes.TemplateID
		);
	}

	static get NAME() {
		return NAME;
	}

	static get TREE_ITEM_WIDTH() {
		return TREE_ITEM_WIDTH;
	}

	static get TREE_ITEM_HEIGHT() {
		return TREE_ITEM_HEIGHT;
	}

	static get INDENT_OFFSET() {
		return INDENT_OFFSET;
	}

	static get COLOR_JSON_VALUE() {
		return COLOR_JSON_VALUE;
	}

	static get COLOR_JSON_NUMBER() {
		return COLOR_JSON_NUMBER;
	}

	static get COLOR_JSON_BOOLEAN() {
		return COLOR_JSON_BOOLEAN;
	}

	static get COLOR_JSON_STRING() {
		return COLOR_JSON_STRING;
	}

	static get COLOR_JSON_OBJECT() {
		return COLOR_JSON_OBJECT;
	}

	static get COLOR_JSON_ARRAY() {
		return COLOR_JSON_ARRAY;
	}

	static get COLOR_JSON_KEY_TEXT() {
		return COLOR_JSON_KEY_TEXT;
	}

	static get DEPTH_OFFSET() {
		return DEPTH_OFFSET;
	}

	static get ACTIVE_ELEMENT() {
		return ACTIVE_ELEMENT;
	}

	static get COLOR_SELECTED_OVERLAY() {
		return COLOR_SELECTED_OVERLAY;
	}

	static get TemplateID() {
		return TemplateID;
	}
};

TreeItemAttributes.template = TreeItemAttributes.createTemplate();

module.exports = TreeItemAttributes;
