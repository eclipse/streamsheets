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
const AttributeList = require('./AttributeList');
const NumberAttribute = require('./NumberAttribute');
const StringAttribute = require('./StringAttribute');
const BooleanAttribute = require('./BooleanAttribute');
const FormatAttributes = require('./FormatAttributes');

// UNIQUE NAME:
const NAME = 'cell';

// PREDEFINED ATTRIBUTES:
const PROTECTED = 'protected';
const VISIBLE = 'visible';
const LEVEL = 'level';
const KEY = 'key';
const LEFTBORDERCOLOR = 'leftbordercolor';
const LEFTBORDERSTYLE = 'leftborderstyle';
const LEFTBORDERWIDTH = 'leftborderwidth';
const TOPBORDERCOLOR = 'topbordercolor';
const TOPBORDERSTYLE = 'topborderstyle';
const TOPBORDERWIDTH = 'topborderwidth';
const RIGHTBORDERCOLOR = 'rightbordercolor';
const RIGHTBORDERSTYLE = 'rightborderstyle';
const RIGHTBORDERWIDTH = 'rightborderwidth';
const BOTTOMBORDERCOLOR = 'bottombordercolor';
const BOTTOMBORDERSTYLE = 'bottomborderstyle';
const BOTTOMBORDERWIDTH = 'bottomborderwidth';

const TemplateID = 'CellAttributes.Template';


/**
 * @class CellAttributes
 * @extends AttributeList
 * @constructor
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined attributes.
 */
class CellAttributes extends AttributeList {
	constructor(mapExpr) {
		super(CellAttributes.NAME, mapExpr);

		this.setParent(CellAttributes.template);
	}

	newInstance(mapExpr) {
		return new CellAttributes(mapExpr);
	}

	getClassString() {
		return 'CellAttributes';
	}

	static createTemplate() {
		const ATTR = CellAttributes;
		const attributes = new CellAttributes();

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
		addAttribute(new BooleanAttribute(ATTR.PROTECTED), true);
		addAttribute(new BooleanAttribute(ATTR.VISIBLE), true);
		addAttribute(new NumberAttribute(ATTR.LEVEL), 0);
		addAttribute(new BooleanAttribute(ATTR.KEY), false);
		addAttribute(
			new NumberAttribute(ATTR.LEFTBORDERSTYLE),
			FormatAttributes.LineStyle.NONE
		);
		addAttribute(new NumberAttribute(ATTR.LEFTBORDERWIDTH), 1);
		addAttribute(new StringAttribute(ATTR.LEFTBORDERCOLOR), JSG.theme.border);
		addAttribute(
			new NumberAttribute(ATTR.RIGHTBORDERSTYLE),
			FormatAttributes.LineStyle.NONE
		);
		addAttribute(new NumberAttribute(ATTR.RIGHTBORDERWIDTH), 1);
		addAttribute(new StringAttribute(ATTR.RIGHTBORDERCOLOR), JSG.theme.border);
		addAttribute(
			new NumberAttribute(ATTR.TOPBORDERSTYLE),
			FormatAttributes.LineStyle.NONE
		);
		addAttribute(new NumberAttribute(ATTR.TOPBORDERWIDTH), 1);
		addAttribute(new StringAttribute(ATTR.TOPBORDERCOLOR), JSG.theme.border);
		addAttribute(
			new NumberAttribute(ATTR.BOTTOMBORDERSTYLE),
			FormatAttributes.LineStyle.NONE
		);
		addAttribute(new NumberAttribute(ATTR.BOTTOMBORDERWIDTH), 1);
		addAttribute(new StringAttribute(ATTR.BOTTOMBORDERCOLOR), JSG.theme.border);

		return attributes.toTemplate(CellAttributes.TemplateID);
	}

	setVisible(flag) {
		this.setAttribute(CellAttributes.VISIBLE, flag);
	}

	getVisible() {
		return this.getAttribute(CellAttributes.VISIBLE);
	}

	setKey(flag) {
		this.setAttribute(CellAttributes.KEY, flag);
	}

	getKey() {
		return this.getAttribute(CellAttributes.KEY);
	}

	setLevel(level) {
		this.setAttribute(CellAttributes.LEVEL, level);
	}

	getLevel() {
		return this.getAttribute(CellAttributes.LEVEL);
	}

	setLeftBorderStyle(style) {
		this.setAttribute(CellAttributes.LEFTBORDERSTYLE, style);
	}

	getLeftBorderStyle() {
		return this.getAttribute(CellAttributes.LEFTBORDERSTYLE);
	}

	setLeftBorderWidth(width) {
		this.setAttribute(CellAttributes.LEFTBORDERWIDTH, width);
	}

	getLeftBorderWidth() {
		return this.getAttribute(CellAttributes.LEFTBORDERWIDTH);
	}

	setLeftBorderColor(color) {
		this.setAttribute(CellAttributes.LEFTBORDERCOLOR, color);
	}

	getLeftBorderColor() {
		return this.getAttribute(CellAttributes.LEFTBORDERCOLOR);
	}

	setTopBorderStyle(style) {
		this.setAttribute(CellAttributes.TOPBORDERSTYLE, style);
	}

	getTopBorderStyle() {
		return this.getAttribute(CellAttributes.TOPBORDERSTYLE);
	}

	setTopBorderWidth(width) {
		this.setAttribute(CellAttributes.TOPBORDERWIDTH, width);
	}

	getTopBorderWidth() {
		return this.getAttribute(CellAttributes.TOPBORDERWIDTH);
	}

	setTopBorderColor(color) {
		this.setAttribute(CellAttributes.TOPBORDERCOLOR, color);
	}

	getTopBorderColor() {
		return this.getAttribute(CellAttributes.TOPBORDERCOLOR);
	}

	setRightBorderStyle(style) {
		this.setAttribute(CellAttributes.RIGHTBORDERSTYLE, style);
	}

	getRightBorderStyle() {
		return this.getAttribute(CellAttributes.RIGHTBORDERSTYLE);
	}

	setRightBorderWidth(width) {
		this.setAttribute(CellAttributes.RIGHTBORDERWIDTH, width);
	}

	getRightBorderWidth() {
		return this.getAttribute(CellAttributes.RIGHTBORDERWIDTH);
	}

	setRightBorderColor(color) {
		this.setAttribute(CellAttributes.RIGHTBORDERCOLOR, color);
	}

	getRightBorderColor() {
		return this.getAttribute(CellAttributes.RIGHTBORDERCOLOR);
	}

	setBottomBorderStyle(style) {
		this.setAttribute(CellAttributes.BOTTOMBORDERSTYLE, style);
	}

	getBottomBorderStyle() {
		return this.getAttribute(CellAttributes.BOTTOMBORDERSTYLE);
	}

	setBottomBorderWidth(width) {
		this.setAttribute(CellAttributes.BOTTOMBORDERWIDTH, width);
	}

	getBottomBorderWidth() {
		return this.getAttribute(CellAttributes.BOTTOMBORDERWIDTH);
	}

	setBottomBorderColor(color) {
		this.setAttribute(CellAttributes.BOTTOMBORDERCOLOR, color);
	}

	getBottomBorderColor() {
		return this.getAttribute(CellAttributes.BOTTOMBORDERCOLOR);
	}

	/**
	 * Set the protected flag.
	 *
	 * @method setProtected
	 * @param {BooleanExpression} protected You can pass either an expression or a value. The value
	 * will automatically converted into
	 * a static expression.
	 */
	setProtected(protect) {
		this.setAttribute(CellAttributes.PROTECTED, protect);
	}

	/**
	 * Returns the attribute for the protected flag setting.
	 *
	 * @method getProtected
	 * @return {Attribute} Attribute with current setting for the protected flag.
	 */
	getProtected() {
		return this.getAttribute(CellAttributes.PROTECTED);
	}

	doSaveParentRef() {
		return (
			this._parent && this._parent.getName() !== CellAttributes.TemplateID
		);
	}

	static get NAME() {
		return NAME;
	}

	static get PROTECTED() {
		return PROTECTED;
	}

	static get VISIBLE() {
		return VISIBLE;
	}

	static get LEVEL() {
		return LEVEL;
	}

	static get KEY() {
		return KEY;
	}

	static get LEFTBORDERCOLOR() {
		return LEFTBORDERCOLOR;
	}

	static get LEFTBORDERSTYLE() {
		return LEFTBORDERSTYLE;
	}

	static get LEFTBORDERWIDTH() {
		return LEFTBORDERWIDTH;
	}

	static get TOPBORDERCOLOR() {
		return TOPBORDERCOLOR;
	}

	static get TOPBORDERSTYLE() {
		return TOPBORDERSTYLE;
	}

	static get TOPBORDERWIDTH() {
		return TOPBORDERWIDTH;
	}

	static get RIGHTBORDERCOLOR() {
		return RIGHTBORDERCOLOR;
	}

	static get RIGHTBORDERSTYLE() {
		return RIGHTBORDERSTYLE;
	}

	static get RIGHTBORDERWIDTH() {
		return RIGHTBORDERWIDTH;
	}

	static get BOTTOMBORDERCOLOR() {
		return BOTTOMBORDERCOLOR;
	}

	static get BOTTOMBORDERSTYLE() {
		return BOTTOMBORDERSTYLE;
	}

	static get BOTTOMBORDERWIDTH() {
		return BOTTOMBORDERWIDTH;
	}

	static get TemplateID() {
		return TemplateID;
	}
}
CellAttributes.template = CellAttributes.createTemplate();

module.exports = CellAttributes;
