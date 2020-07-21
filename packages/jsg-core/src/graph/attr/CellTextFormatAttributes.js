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
const NumberAttribute = require('./NumberAttribute');
const StringAttribute = require('./StringAttribute');
const TextFormatAttributes = require('./TextFormatAttributes');
const RangeConstraint = require('../expr/RangeConstraint');
const BooleanAttribute = require('./BooleanAttribute');


const NAME = 'CellTextFormat';
const TemplateID = 'CellTextFormatAttributes.Template';

class CellTextFormatAttributes extends TextFormatAttributes {
	constructor(mapExpr) {
		super(mapExpr);
		this._setName(CellTextFormatAttributes.NAME);
		this.setParent(CellTextFormatAttributes.template);
	}

	newInstance(mapExpr) {
		return new CellTextFormatAttributes(mapExpr);
	}

	getClassString() {
		return 'JSG.CellTextFormatAttributes';
	}

	static get NAME() {
		return NAME;
	}

	static createTemplate() {
		const attributes = new CellTextFormatAttributes();

		const addAttribute = (attribute, value, constraint) => {
			if (constraint) {
				attribute.getExpression().setConstraint(constraint);
			}
			value =
				value === undefined && constraint ? constraint.defValue : value;
			attribute.setExpressionOrValue(value);
			attributes.addAttribute(attribute);
		};

		addAttribute(new NumberAttribute(CellTextFormatAttributes.FONTSIZE), 9);
		addAttribute(
			new StringAttribute(CellTextFormatAttributes.FONTNAME),
			'Verdana'
		);
		addAttribute(
			new StringAttribute(CellTextFormatAttributes.FONTCOLOR),
			JSG.theme.text
		);
		addAttribute(
			new NumberAttribute(CellTextFormatAttributes.FONTSTYLE),
			CellTextFormatAttributes.FontStyle.NORMAL
		);

		addAttribute(
			new NumberAttribute(CellTextFormatAttributes.VERTICALPOSITION),
			undefined,
			RangeConstraint.fromPropertiesOf(
				CellTextFormatAttributes.VerticalTextPosition,
				CellTextFormatAttributes.VerticalTextPosition.CENTER
			)
		);
		addAttribute(
			new NumberAttribute(CellTextFormatAttributes.VERTICALALIGN),
			undefined,
			RangeConstraint.fromPropertiesOf(
				CellTextFormatAttributes.VerticalTextAlignment,
				CellTextFormatAttributes.VerticalTextAlignment.BOTTOM
			)
		);
		addAttribute(
			new StringAttribute(CellTextFormatAttributes.BASELINE),
			undefined,
			RangeConstraint.fromPropertiesOf(
				CellTextFormatAttributes.TextBaseline,
				CellTextFormatAttributes.TextBaseline.ALPHABETIC
			)
		);
		addAttribute(
			new NumberAttribute(CellTextFormatAttributes.HORIZONTALPOSITION),
			undefined,
			RangeConstraint.fromPropertiesOf(
				CellTextFormatAttributes.HorizontalTextPosition,
				CellTextFormatAttributes.HorizontalTextPosition.CENTER
			)
		);
		addAttribute(
			new NumberAttribute(CellTextFormatAttributes.HORIZONTALALIGN),
			undefined,
			RangeConstraint.fromPropertiesOf(
				CellTextFormatAttributes.TextAlignment,
				CellTextFormatAttributes.TextAlignment.DEFAULT
			)
		);

		addAttribute(
			new BooleanAttribute(CellTextFormatAttributes.RICHTEXT),
			true
		);
		addAttribute(new NumberAttribute(CellTextFormatAttributes.ICON), 0);
		addAttribute(
			new NumberAttribute(CellTextFormatAttributes.LINEHEIGHT),
			1.2
		);
		addAttribute(
			new StringAttribute(CellTextFormatAttributes.NUMBERFORMAT),
			'General'
		);
		addAttribute(
			new StringAttribute(CellTextFormatAttributes.LOCALCULTURE),
			'general'
		);

		return attributes.toTemplate(CellTextFormatAttributes.TemplateID);
	}

	static get TemplateID() {
		return TemplateID;
	}
}

CellTextFormatAttributes.template = CellTextFormatAttributes.createTemplate();

module.exports = CellTextFormatAttributes;
