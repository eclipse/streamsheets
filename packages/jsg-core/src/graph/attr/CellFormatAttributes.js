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
const FormatAttributes = require('./FormatAttributes');
const RangeConstraint = require('../expr/RangeConstraint');
const NumberRangeConstraint = require('../expr/NumberRangeConstraint');

const NAME = 'CellFormat';
const TemplateID = 'CellFormatAttributes.Template';

class CellFormatAttributes extends FormatAttributes {
	constructor(mapExpr) {
		super(mapExpr);
		this._setName(CellFormatAttributes.NAME);
		this.setParent(CellFormatAttributes.template);
	}

	newInstance(mapExpr) {
		return new CellFormatAttributes(mapExpr);
	}

	getClassString() {
		return 'CellFormatAttributes';
	}

	static get NAME() {
		return NAME;
	}

	static createTemplate() {
		const attributes = new CellFormatAttributes();

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
		addAttribute(new NumberAttribute(CellFormatAttributes.BRIGHTNESS), 0);

		addAttribute(
			new StringAttribute(CellFormatAttributes.FILLCOLOR), JSG.theme.fill
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.FILLSTYLE),
			undefined,
			RangeConstraint.fromPropertiesOf(
				CellFormatAttributes.FillStyle,
				CellFormatAttributes.FillStyle.NONE
			)
		);

		addAttribute(
			new StringAttribute(CellFormatAttributes.GRADIENTCOLOR),
			'#CCCCCC'
		);
		addAttribute(
			new StringAttribute(CellFormatAttributes.GRADIENTCOLORSTOPS),
			''
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.GRADIENTANGLE),
			0
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.GRADIENTTYPE),
			undefined,
			RangeConstraint.fromPropertiesOf(
				CellFormatAttributes.GradientStyle,
				CellFormatAttributes.GradientStyle.LINEAR
			)
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.GRADIENTOFFSET_X),
			0
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.GRADIENTOFFSET_Y),
			0
		);

		addAttribute(
			new StringAttribute(CellFormatAttributes.LINECAP),
			CellFormatAttributes.LineCap.BUTT
		);
		addAttribute(
			new StringAttribute(CellFormatAttributes.LINEJOIN),
			CellFormatAttributes.LineJoin.MITER
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.MITERLIMIT),
			CellFormatAttributes.LineJoin.MiterLimitDefault
		);
		addAttribute(
			new StringAttribute(CellFormatAttributes.LINECOLOR),
			'#000000'
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.LINEWIDTH),
			CellFormatAttributes.LineStyle.HAIRLINE
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.LINESTYLE),
			undefined,
			RangeConstraint.fromPropertiesOf(
				CellFormatAttributes.LineStyle,
				CellFormatAttributes.LineStyle.SOLID
			)
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.LINESHAPE),
			undefined,
			RangeConstraint.fromPropertiesOf(
				CellFormatAttributes.LineShape,
				CellFormatAttributes.LineShape.SINGLE
			)
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.LINEARROWSTART),
			undefined,
			RangeConstraint.fromPropertiesOf(
				CellFormatAttributes.ArrowStyle,
				CellFormatAttributes.ArrowStyle.NONE
			)
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.LINEARROWSTARTWIDTH),
			200
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.LINEARROWSTARTLENGTH),
			200
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.LINEARROWEND),
			undefined,
			RangeConstraint.fromPropertiesOf(
				CellFormatAttributes.ArrowStyle,
				CellFormatAttributes.ArrowStyle.NONE
			)
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.LINEARROWENDWIDTH),
			200
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.LINEARROWENDLENGTH),
			200
		);
		addAttribute(new NumberAttribute(CellFormatAttributes.LINECORNER), 0);

		addAttribute(new StringAttribute(CellFormatAttributes.PATTERN), '');
		addAttribute(
			new NumberAttribute(CellFormatAttributes.PATTERNSTYLE),
			undefined,
			RangeConstraint.fromPropertiesOf(
				CellFormatAttributes.PatternStyle,
				CellFormatAttributes.PatternStyle.STRETCH
			)
		);

		addAttribute(
			new StringAttribute(CellFormatAttributes.SHADOWCOLOR),
			'#DDDDDD'
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.SHADOWOFFSET_X),
			0
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.SHADOWOFFSET_Y),
			0
		);
		addAttribute(new NumberAttribute(CellFormatAttributes.SHADOWBLUR), 0);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.SHADOWDIRECTION),
			undefined,
			RangeConstraint.fromPropertiesOf(
				CellFormatAttributes.ShadowDirection,
				CellFormatAttributes.ShadowDirection.RIGHTBOTTOM
			)
		);

		addAttribute(
			new NumberAttribute(CellFormatAttributes.TRANSPARENCY),
			undefined,
			new NumberRangeConstraint(0, 100, 100)
		);
		addAttribute(
			new NumberAttribute(CellFormatAttributes.LINETRANSPARENCY),
			undefined,
			new NumberRangeConstraint(0, 100, 100)
		);

		return attributes.toTemplate(CellFormatAttributes.TemplateID);
	}

	static get TemplateID() {
		return TemplateID;
	}
}

CellFormatAttributes.template = CellFormatAttributes.createTemplate();

module.exports = CellFormatAttributes;
