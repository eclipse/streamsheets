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
const { NullTerm } = require('@cedalo/parser');

const JSG = require('../../JSG');
const Node = require('./Node');
const StringAttribute = require('../attr/StringAttribute');
const Attribute = require('../attr/Attribute');
const Expression = require('../expr/Expression');

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
		this.addAttribute(new StringAttribute('scalefont', ''));
		this.addAttribute(new StringAttribute('formatrange', ''));
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
		const value = this.getAttributeValueAtPath('value');
		if (value === undefined) {
			return 0;
		}

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
						expr = new JSG.NumberExpression(50);
					} else {
						expr = new JSG.Expression(param.value, param.isStatic ? undefined : param.toString(params));
					}
					expr.evaluate(this);
					cmp.add(new JSG.SetAttributeAtPathCommand(this, 'value', expr));
					break;
				case 9: // min
					if (param instanceof NullTerm) {
						expr = new JSG.NumberExpression(0);
					} else {
						expr = new JSG.Expression(param.value, param.isStatic ? undefined : param.toString(params));
					}
					expr.evaluate(this);
					cmp.add(new JSG.SetAttributeAtPathCommand(this, 'min', expr));
					break;
				case 10: // max
					if (param instanceof NullTerm) {
						expr = new JSG.NumberExpression(100);
					} else {
						expr = new JSG.Expression(param.value, param.isStatic ? undefined : param.toString(params));
					}
					expr.evaluate(this);
					cmp.add(new JSG.SetAttributeAtPathCommand(this, 'max', expr));
					break;
				case 11: // step
					if (param instanceof NullTerm) {
						expr = new JSG.NumberExpression(5);
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
						expr = new JSG.Expression(param.value, param.isStatic ? undefined : param.toString(params));
					}
					expr.evaluate(this);
					cmp.add(new JSG.SetAttributeAtPathCommand(this, 'marker', expr));
					break;
				case 13: // format range
					if (param instanceof NullTerm) {
						expr = new JSG.StringExpression('');
					} else {
						expr = new JSG.Expression(param.value, param.isStatic ? undefined : param.toString(params));
					}
					expr.evaluate(this);
					cmp.add(new JSG.SetAttributeAtPathCommand(this, 'formatrange', expr));
					break;
				case 14: // start angle
					if (param instanceof NullTerm) {
						expr = new JSG.NumberExpression(Math.PI / 6);
					} else {
						expr = new JSG.Expression(param.value, param.isStatic ? undefined : param.toString(params));
					}
					expr.evaluate(this);
					cmp.add(new JSG.SetAttributeAtPathCommand(this, 'start', expr));
					break;
				case 15: // end angle
					if (param instanceof NullTerm) {
						expr = new JSG.NumberExpression(Math.PI * 11 / 6);
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
