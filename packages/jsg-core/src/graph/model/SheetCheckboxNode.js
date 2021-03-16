
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
const { FuncTerm, NullTerm } = require('@cedalo/parser');

const JSG = require('../../JSG');
const Attribute = require('../attr/Attribute');
const StringAttribute = require('../attr/StringAttribute');
const FormatAttributes = require('../attr/FormatAttributes');
const Node = require('./Node');
const Expression = require('../expr/Expression');
const StringExpression = require('../expr/StringExpression');
const NumberExpression = require('../expr/NumberExpression');
const CellRange = require('./CellRange');

module.exports = class SheetCheckboxNode extends Node {
	constructor() {
		super();

		this.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
		this.getTextFormat().setFontSize(9);

		this.getItemAttributes().setContainer(false);
		this.addAttribute(new StringAttribute('title', 'Checkbox'));
		this.addAttribute(new Attribute('value', new Expression(false)));
	}

	newInstance() {
		return new SheetCheckboxNode();
	}

	getItemType() {
		return 'sheetcheckboxnode';
	}

	_assignName(id) {
		const name = this.getGraph().getUniqueName('Checkbox');
		this.setName(name);
	}

	getSheet() {
		let sheet = this;

		while (sheet && !sheet.getCellDescriptors) {
			sheet = sheet.getParent();
		}

		return sheet;
	}

	getValue() {
		const attr = this.getAttributeAtPath('value');
		const sheet = this.getSheet();
		const expr = attr.getExpression();
		if (sheet && expr._cellref) {
			const term = expr.getTerm();
			if (term) {
				const { operand } = term;
				if (operand instanceof JSG.SheetReference && operand._range) {
					const range = operand._range.copy();
					range.shiftFromSheet();
					const cell = range.getSheet().getDataProvider().getRC(range.getX1(), range.getY1());
					if (cell) {
						const value = cell.getValue();
						return !(value === 0 || value === '0' || value === false);
					}
				}
			}
		}

		const value = attr.getValue();
		return value === 1 || value === '1' || value === true;
	}

	isMoveable() {
		if (
			this.getGraph()
				.getMachineContainer()
				.getMachineState()
				.getValue() === 0
		) {
			return false;
		}

		return super.isMoveable();
	}

	isAddLabelAllowed() {
		return false;
	}

	oldTermToProperties(sheet, term) {
		super.oldTermToProperties(sheet, term);

		if (!term || !(term instanceof FuncTerm)) {
			return;
		}

		let expr;
		const params = {useName: true, item: sheet};

		// UniqueID,Container,Name,X,Y,Width,Height,Line,Fill,Attributes,Events,Angle,RotCenter,Label,LabelFont,Value

		term.iterateParams((param, index) => {
			switch (index) {
				case 13: // label
					if (!param.isStatic) {
						expr = new StringExpression(0, param.toString(params));
						this.setAttributeAtPath('title', expr);
					}
					break;
				case 14: // label font
					if ((param instanceof FuncTerm) && param.name === 'FONTFORMAT') {
						if (param.params.length > 0 && !param.params[0].isStatic) {
							expr = new StringExpression('', param.params[0].toString(params));
							this.getTextFormat().setFontName(expr);
						}
						if (param.params.length > 1 && !param.params[1].isStatic) {
							expr = new NumberExpression(0, param.params[1].toString(params));
							this.getTextFormat().setFontSize(expr);
						}
						if (param.params.length > 2 && !param.params[2].isStatic) {
							expr = new NumberExpression(0, param.params[2].toString(params));
							this.getTextFormat().setFontStyle(expr);
						}
						if (param.params.length > 3 && !param.params[3].isStatic) {
							expr = new StringExpression(0, param.params[3].toString(params));
							this.getTextFormat().setFontColor(expr);
						}
					}
					break;
				case 15: // value
					if (!param.isStatic) {
						expr = new Expression(0, param.toString(params));
						this.setAttributeAtPath('value', expr);
					}
					break;
			}
		});
	}

	termToPropertiesCommands(sheet, term) {
		const cmp = super.termToPropertiesCommands(sheet, term);
		if (!cmp) {
			return undefined;
		}

		let value;
		let label;
		const params = { useName: true, item: sheet };

		term.iterateParams((param, index) => {
			switch (index) {
				case 7: // label
					if (!(param instanceof NullTerm)) {
						label = new JSG.StringExpression(String(param.value), param.isStatic ? undefined : param.toString(params));
						label.evaluate(this);
					}
					break;
				case 8: // value
					if (!(param instanceof NullTerm)) {
						value = new JSG.Expression(param.value, param.isStatic ? undefined : param.toString(params));
						value.evaluate(this);
					}
					break;
				default:
					break;
			}
		});

		if (label !== undefined) {
			cmp.add(new JSG.SetAttributeAtPathCommand(this, 'title', label));
		} else {
			cmp.add(new JSG.SetAttributeAtPathCommand(this, 'title', new JSG.StringExpression('')));
		}
		if (value !== undefined) {
			cmp.add(new JSG.SetAttributeAtPathCommand(this, 'value', value));
		} else {
			cmp.add(new JSG.SetAttributeAtPathCommand(this, 'value', new JSG.Expression(false)));
		}

		return cmp;
	}
};
