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
const { NullTerm, FuncTerm } = require('@cedalo/parser');

const JSG = require('../../JSG');
const Node = require('./Node');
const Attribute = require('../attr/Attribute');
const StringAttribute = require('../attr/StringAttribute');
const Expression = require('../expr/Expression');
const StringExpression = require('../expr/StringExpression');
const NumberExpression = require('../expr/NumberExpression');
const CellRange = require('./CellRange');

module.exports = class SheetKnobNode extends Node {
	constructor() {
		super();

		this.getTextFormat().setFontSize(9);

		this.getItemAttributes().setContainer(false);
		this.addAttribute(new StringAttribute('title', 'Knob'));
		this.addAttribute(new Attribute('value', new Expression(50)));
		this.addAttribute(new Attribute('min', new Expression(0)));
		this.addAttribute(new Attribute('max', new Expression(100)));
		this.addAttribute(new Attribute('step', new Expression(5)));
		this.addAttribute(new Attribute('start', new Expression(Math.PI / 6)));
		this.addAttribute(new Attribute('end', new Expression(Math.PI * 11 / 6)));
		this.addAttribute(new StringAttribute('marker', ''));
		this.addAttribute(new Attribute('formatrange', new Expression(0)));
	}

	newInstance() {
		return new SheetKnobNode();
	}

	getItemType() {
		return 'sheetknobnode';
	}

	_assignName(id) {
		const name = this.getGraph().getUniqueName('Knob');
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
			const range = CellRange.parse(expr._cellref, sheet);
			if (range) {
				range.shiftFromSheet();
				const cell = range.getSheet().getDataProvider().getRC(range.getX1(), range.getY1());
				if (cell) {
					return cell.getValue();
				}
			}
		}

		const value = attr.getValue();
		return value;
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
				case 16: // min
					if (!param.isStatic) {
						expr = new Expression(0, param.toString(params));
						this.setAttributeAtPath('min', expr);
					}
					break;
				case 17: // max
					if (!param.isStatic) {
						expr = new Expression(0, param.toString(params));
						this.setAttributeAtPath('max', expr);
					}
					break;
				case 18: // step
					if (!param.isStatic) {
						expr = new Expression(0, param.toString(params));
						this.setAttributeAtPath('step', expr);
					}
					break;
				case 19: // scalefont -> not supported
					break;
				case 20: // marker
					if (!param.isStatic) {
						expr = new StringExpression(0, param.toString(params));
						this.setAttributeAtPath('marker', expr);
					}
					break;
				case 21: // formatrange
					if (!param.isStatic) {
						expr = new Expression(0, param.toString(params));
						this.setAttributeAtPath('formatrange', expr);
					}
					break;
				case 22: // start
					if (!param.isStatic) {
						expr = new Expression(0, param.toString(params));
						this.setAttributeAtPath('start', expr);
					}
					break;
				case 23: // end
					if (!param.isStatic) {
						expr = new Expression(0, param.toString(params));
						this.setAttributeAtPath('end', expr);
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

		let expr;
		const params = { useName: true, item: sheet };

		term.iterateParams((param, index) => {
			switch (index) {
				case 7: // label
					if (param instanceof NullTerm) {
						expr = new JSG.StringExpression('');
					} else {
						expr = new JSG.StringExpression(String(param.value), param.isStatic ? undefined : param.toString(params));
					}
					expr.evaluate(this);
					cmp.add(new JSG.SetAttributeAtPathCommand(this, 'title', expr));
					break;
				case 8: // value
					if (param instanceof NullTerm) {
						expr = new JSG.Expression(50);
					} else {
						expr = new JSG.Expression(param.value, param.isStatic ? undefined : param.toString(params));
					}
					expr.evaluate(this);
					cmp.add(new JSG.SetAttributeAtPathCommand(this, 'value', expr));
					break;
				case 9: // min
					if (param instanceof NullTerm) {
						expr = new JSG.Expression(0);
					} else {
						expr = new JSG.Expression(param.value, param.isStatic ? undefined : param.toString(params));
					}
					expr.evaluate(this);
					cmp.add(new JSG.SetAttributeAtPathCommand(this, 'min', expr));
					break;
				case 10: // max
					if (param instanceof NullTerm) {
						expr = new JSG.Expression(100);
					} else {
						expr = new JSG.Expression(param.value, param.isStatic ? undefined : param.toString(params));
					}
					expr.evaluate(this);
					cmp.add(new JSG.SetAttributeAtPathCommand(this, 'max', expr));
					break;
				case 11: // step
					if (param instanceof NullTerm) {
						expr = new JSG.Expression(5);
					} else {
						expr = new JSG.Expression(param.value, param.isStatic ? undefined : param.toString(params));
					}
					expr.evaluate(this);
					cmp.add(new JSG.SetAttributeAtPathCommand(this, 'step', expr));
					break;
				case 12: // marker
					if (param instanceof NullTerm) {
						expr = new JSG.StringExpression('');
					} else {
						expr = new JSG.StringExpression(param.value, param.isStatic ? undefined : param.toString(params));
					}
					expr.evaluate(this);
					cmp.add(new JSG.SetAttributeAtPathCommand(this, 'marker', expr));
					break;
				case 13: // format range
					if (param instanceof NullTerm) {
						expr = new JSG.Expression('');
					} else {
						expr = new JSG.Expression(param.value, param.isStatic ? undefined : param.toString(params));
					}
					expr.evaluate(this);
					cmp.add(new JSG.SetAttributeAtPathCommand(this, 'formatrange', expr));
					break;
				case 14: // start angle
					if (param instanceof NullTerm) {
						expr = new JSG.Expression(Math.PI / 6);
					} else {
						expr = new JSG.Expression(param.value, param.isStatic ? undefined : param.toString(params));
					}
					expr.evaluate(this);
					cmp.add(new JSG.SetAttributeAtPathCommand(this, 'start', expr));
					break;
				case 15: // end angle
					if (param instanceof NullTerm) {
						expr = new JSG.Expression(Math.PI * 11 / 6);
					} else {
						expr = new JSG.Expression(param.value, param.isStatic ? undefined : param.toString(params));
					}
					expr.evaluate(this);
					cmp.add(new JSG.SetAttributeAtPathCommand(this, 'end', expr));
					break;
				default:
					break;
			}
		});

		return cmp;
	}
};
