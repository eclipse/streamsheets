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
const NumberAttribute = require('./NumberAttribute');
const StringAttribute = require('./StringAttribute');
const BooleanAttribute = require('./BooleanAttribute');

const MachineState = {
	RUN: 0,
	EDIT: 1
};

// PREDEFINED ATTRIBUTES:
const MACHINESTATE = 'machinestate';
const OUTBOXVISIBLE = 'outboxvisible';
const MAXIMIZESHEET = 'maximizesheet';
const HIDETOOLBARTHRESHOLD = 'hidetoolbarthreshold';
const HIDETOOLBARS = 'hidetoolbars';
const PROTECTED = 'protected';

// UNIQUE NAME:
const NAME = 'MachineContainer';
const TemplateID = 'MachineContainerAttributes.Template';

/**
 * @class MachineContainerAttributes
 * @extends AttributeList
 * @constructor
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined attributes.
 */
const MachineContainerAttributes = class MachineContainerAttributes extends AttributeList {
	constructor(mapExpr) {
		super(MachineContainerAttributes.NAME, mapExpr);

		this.setParent(MachineContainerAttributes.template);
	}

	newInstance(mapExpr) {
		return new MachineContainerAttributes(mapExpr);
	}

	getClassString() {
		return 'MachineContainerAttributes';
	}

	static createTemplate() {
		const ATTR = MachineContainerAttributes;
		const attributes = new MachineContainerAttributes();

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
		addAttribute(
			new NumberAttribute(ATTR.MACHINESTATE),
			MachineContainerAttributes.MachineState.EDIT
		);
		addAttribute(new StringAttribute(ATTR.MAXIMIZESHEET), 'none');
		addAttribute(new BooleanAttribute(ATTR.OUTBOXVISIBLE), false);
		addAttribute(new NumberAttribute(ATTR.HIDETOOLBARTHRESHOLD), 550);
		addAttribute(new BooleanAttribute(ATTR.HIDETOOLBARS), false);
		addAttribute(new BooleanAttribute(ATTR.PROTECTED), false);

		return attributes.toTemplate(MachineContainerAttributes.TemplateID);
	}

	setMachineState(state) {
		this.setAttribute(MachineContainerAttributes.MACHINESTATE, state);
	}

	getMachineState() {
		return this.getAttribute(MachineContainerAttributes.MACHINESTATE);
	}

	setMaximizeSheet(state) {
		this.setAttribute(MachineContainerAttributes.MAXIMIZESHEET, state);
	}

	getMaximizeSheet() {
		return this.getAttribute(MachineContainerAttributes.MAXIMIZESHEET);
	}

	setHideToolbarThreshold(threshold) {
		this.setAttribute(
			MachineContainerAttributes.HIDETOOLBARTHRESHOLD,
			threshold
		);
	}

	getHideToolbarThreshold() {
		return this.getAttribute(
			MachineContainerAttributes.HIDETOOLBARTHRESHOLD
		);
	}

	setHideToolbars(state) {
		this.setAttribute(MachineContainerAttributes.HIDETOOLBARS, state);
	}

	getHideToolbars() {
		return this.getAttribute(MachineContainerAttributes.HIDETOOLBARS);
	}

	setOutboxVisible(state) {
		this.setAttribute(MachineContainerAttributes.OUTBOXVISIBLE, state);
	}

	getOutboxVisible() {
		return this.getAttribute(MachineContainerAttributes.OUTBOXVISIBLE);
	}

	/**
	 * Set the protected flag.
	 *
	 * @method setProtected
	 * @param {Expression} protected You can pass either an expression or a value. The value
	 * will automatically converted into
	 * a static expression.
	 */
	setProtected(protect) {
		this.setAttribute(MachineContainerAttributes.PROTECTED, protect);
	}

	/**
	 * Returns the attribute for the protected flag setting.
	 *
	 * @method getProtected
	 * @return {Attribute} Attribute with current setting for the protected flag.
	 */
	getProtected() {
		return this.getAttribute(MachineContainerAttributes.PROTECTED);
	}

	static get MachineState() {
		return MachineState;
	}

	static get NAME() {
		return NAME;
	}

	static get MACHINESTATE() {
		return MACHINESTATE;
	}

	static get OUTBOXVISIBLE() {
		return OUTBOXVISIBLE;
	}

	static get MAXIMIZESHEET() {
		return MAXIMIZESHEET;
	}

	static get HIDETOOLBARTHRESHOLD() {
		return HIDETOOLBARTHRESHOLD;
	}

	static get HIDETOOLBARS() {
		return HIDETOOLBARS;
	}

	static get PROTECTED() {
		return PROTECTED;
	}

	static get TemplateID() {
		return TemplateID;
	}
};

MachineContainerAttributes.template = MachineContainerAttributes.createTemplate();

module.exports = MachineContainerAttributes;
