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
const ItemAttributes = require('./ItemAttributes');
const BooleanAttribute = require('./BooleanAttribute');

const TemplateID = 'EdgeAttributes.Template';
const NAME = 'graphitem';
let globalTemplate = null;


/**
 * An AttributeList which defines Attributes and default values for
 * {{#crossLink "Edge"}}{{/crossLink}}s.
 * This list is based on {{#crossLink "ItemAttributes"}}{{/crossLink}}.
 *
 * @class EdgeAttributes
 * @extends ItemAttributes
 * @constructor
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined attributes.
 */
class EdgeAttributes extends ItemAttributes {
	constructor(mapExpr, skipParentSet) {
		super(mapExpr);
		if (!skipParentSet) {
			this.setParent(EdgeAttributes.template);
		}
	}

	newInstance(mapExpr) {
		return new EdgeAttributes(mapExpr);
	}

	getClassString() {
		return 'EdgeAttributes';
	}

	doSaveParentRef() {
		return (
			this._parent && this._parent.getName() !== EdgeAttributes.TemplateID
		);
	}

	static get template() {
		globalTemplate = globalTemplate || EdgeAttributes.createTemplate();
		return globalTemplate;
	}

	static set template(template) {
		globalTemplate = template;
	}

	static get TemplateID() {
		return TemplateID;
	}

	static get NAME() {
		return NAME;
	}

	static createTemplate() {
		const attributes = new EdgeAttributes(undefined, true);
		// we base our def. template on ItemAttributes.Template, so:
		attributes.setParent(ItemAttributes.template);
		attributes.addAttribute(new BooleanAttribute(ItemAttributes.CLOSED)).setExpressionOrValue(false);
		attributes.addAttribute(new BooleanAttribute(ItemAttributes.SNAPTO)).setExpressionOrValue(false);
		attributes.addAttribute(new BooleanAttribute(ItemAttributes.CONTAINER)).setExpressionOrValue(false);
		attributes.setPortMode(ItemAttributes.PortMode.NONE);
		return attributes.toTemplate(EdgeAttributes.TemplateID);
	}
}

// EdgeAttributes.template = EdgeAttributes.createTemplate();

module.exports = EdgeAttributes;
