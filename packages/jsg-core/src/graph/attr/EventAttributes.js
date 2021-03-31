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
const AttributeList = require('./AttributeList');
const StringAttribute = require('./StringAttribute');

const TemplateID = 'EventAttributes.Template';

/**
 * An AttributeList which can be used by {{#crossLink "Event"}}{{/crossLink}} instances to store
 * Event specific settings as {{#crossLink "Attribute"}}{{/crossLink}}s.
 *
 * @class EventAttributes
 * @extends AttributeList
 * @constructor
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined attributes.
 */
class EventAttributes extends AttributeList {
	constructor(mapExpr) {
		super(EventAttributes.NAME, mapExpr);
		this.setParent(EventAttributes.template);
	}

	newInstance(mapExpr) {
		return new EventAttributes(mapExpr);
	}

	getClassString() {
		return 'EventAttributes';
	}

	copy() {
		return this.newInstance(this._value.copy());
	}

	getOnValueChange() {
		return this.getAttribute(EventAttributes.ONVALUECHANGE);
	}

	setOnValueChange(doIt) {
		this.setAttribute(EventAttributes.ONVALUECHANGE, doIt);
	}

	getOnDoubleClick() {
		return this.getAttribute(EventAttributes.ONDOUBLECLICK);
	}

	setOnDoubleClick(doIt) {
		this.setAttribute(EventAttributes.ONDOUBLECLICK, doIt);
	}

	getOnClick() {
		return this.getAttribute(EventAttributes.ONCLICK);
	}

	setOnClick(doIt) {
		this.setAttribute(EventAttributes.ONCLICK, doIt);
	}

	getOnMouseDown() {
		return this.getAttribute(EventAttributes.ONMOUSEDOWN);
	}

	setOnMouseDown(doIt) {
		this.setAttribute(EventAttributes.ONMOUSEDOWN, doIt);
	}

	getOnMouseUp() {
		return this.getAttribute(EventAttributes.ONMOUSEUP);
	}

	setOnMouseUp(doIt) {
		this.setAttribute(EventAttributes.ONMOUSEUP, doIt);
	}

	hasMouseEvent() {
		return (this.getOnMouseUp().getValue() !== '' ||
			this.getOnMouseDown().getValue() !== '' ||
			this.getOnClick().getValue() !== '' ||
			this.getOnDoubleClick().getValue() !== ''
		);
	}

	doSaveParentRef() {
		return (
			this._parent &&
			this._parent.getName() !== EventAttributes.TemplateID
		);
	}
	/**
	 * Our unique name constant.
	 *
	 * @property NAME
	 * @type {String}
	 * @static
	 */
	static get NAME() {
		return 'eventattributes';
	}

	static get ONVALUECHANGE() {
		return 'onvaluechange';
	}

	static get ONMOUSEDOWN() {
		return 'onmousedown';
	}

	static get ONMOUSEUP() {
		return 'onmouseup';
	}

	static get ONCLICK() {
		return 'onclick';
	}

	static get ONDOUBLECLICK() {
		return 'ondoubleclick';
	}

	static get TemplateID() {
		return TemplateID;
	}

	static createTemplate() {
		const attributes = new EventAttributes();

		function addAttribute(attribute, value, constraint) {
			if (constraint) {
				attribute.getExpression().setConstraint(constraint);
			}
			value =
				value === undefined && constraint ? constraint.defValue : value;
			attribute.setExpressionOrValue(value);
			attributes.addAttribute(attribute);
		}

		addAttribute(new StringAttribute(EventAttributes.ONVALUECHANGE), '');
		addAttribute(new StringAttribute(EventAttributes.ONCLICK), '');
		addAttribute(new StringAttribute(EventAttributes.ONDOUBLECLICK), '');
		addAttribute(new StringAttribute(EventAttributes.ONMOUSEDOWN), '');
		addAttribute(new StringAttribute(EventAttributes.ONMOUSEUP), '');

		return attributes.toTemplate(EventAttributes.Template_ID);
	}
}

EventAttributes.template = EventAttributes.createTemplate();

module.exports = EventAttributes;
