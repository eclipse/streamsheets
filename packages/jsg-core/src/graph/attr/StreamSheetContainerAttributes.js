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


// PREDEFINED ATTRIBUTES:
const LOOPELEMENT = 'loopelement';
const REPLACEKEY = 'replacekey';
const HIDEMESSAGES = 'hidemessages';
const STREAM = 'stream';
const STATUS = 'status';
const LOOPINDEX = 'loopindex';
const STEP = 'step';
const SHEETID = 'sheetid';
const INBOXID = 'inboxid';
const INBOXVISIBLE = 'inboxvisible';

// UNIQUE NAME:
const NAME = 'StreamSheetContainer';
const TemplateID = 'StreamSheetContainerAttributes.Template';

/**
 * @class StreamSheetContainerAttributes
 * @extends AttributeList
 * @constructor
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined attributes.
 */
const StreamSheetContainerAttributes = class StreamSheetContainerAttributes extends AttributeList {
	constructor(mapExpr) {
		super(StreamSheetContainerAttributes.NAME, mapExpr);

		this.setParent(StreamSheetContainerAttributes.template);
	}

	newInstance(mapExpr) {
		return new StreamSheetContainerAttributes(mapExpr);
	}

	getClassString() {
		return 'StreamSheetContainerAttributes';
	}

	static createTemplate() {
		const ATTR = StreamSheetContainerAttributes;
		const attributes = new StreamSheetContainerAttributes();

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
		addAttribute(new StringAttribute(ATTR.LOOPELEMENT), '');
		addAttribute(new StringAttribute(ATTR.REPLACEKEY), '');
		addAttribute(new NumberAttribute(ATTR.LOOPINDEX), 0);
		addAttribute(new NumberAttribute(ATTR.STREAM), 'None');
		addAttribute(new StringAttribute(ATTR.INBOXID), '');
		addAttribute(new StringAttribute(ATTR.SHEETID), '');
		addAttribute(new StringAttribute(ATTR.STEP), '1');
		addAttribute(new StringAttribute(ATTR.STATUS), '');
		addAttribute(new BooleanAttribute(ATTR.HIDEMESSAGES), false);
		addAttribute(new BooleanAttribute(ATTR.INBOXVISIBLE), true);

		return attributes.toTemplate(StreamSheetContainerAttributes.TemplateID);
	}

	setHideMessages(element) {
		this.setAttribute(
			StreamSheetContainerAttributes.HIDEMESSAGES,
			element
		);
	}

	getHideMessages() {
		return this.getAttribute(StreamSheetContainerAttributes.HIDEMESSAGES);
	}

	setLoopElement(element) {
		this.setAttribute(StreamSheetContainerAttributes.LOOPELEMENT, element);
	}

	getLoopElement() {
		return this.getAttribute(StreamSheetContainerAttributes.LOOPELEMENT);
	}

	setReplaceKey(key) {
		this.setAttribute(StreamSheetContainerAttributes.REPLACEKEY, key);
	}

	getReplaceKey() {
		return this.getAttribute(StreamSheetContainerAttributes.REPLACEKEY);
	}

	getLoopIndex() {
		return this.getAttribute(StreamSheetContainerAttributes.LOOPINDEX);
	}

	setLoopIndex(index) {
		this.setAttribute(StreamSheetContainerAttributes.LOOPINDEX, index);
	}

	getStream() {
		return this.getAttribute(StreamSheetContainerAttributes.STREAM);
	}

	setStream(source) {
		this.setAttribute(StreamSheetContainerAttributes.STREAM, source);
	}

	getStatus() {
		return this.getAttribute(StreamSheetContainerAttributes.STATUS);
	}

	setStatus(source) {
		this.setAttribute(StreamSheetContainerAttributes.STATUS, source);
	}

	getSheetId() {
		return this.getAttribute(StreamSheetContainerAttributes.SHEETID);
	}

	setSheetId(source) {
		this.setAttribute(StreamSheetContainerAttributes.SHEETID, source);
	}

	getInboxId() {
		return this.getAttribute(StreamSheetContainerAttributes.INBOXID);
	}

	setInboxId(source) {
		this.setAttribute(StreamSheetContainerAttributes.INBOXID, source);
	}

	getInboxVisible() {
		return this.getAttribute(StreamSheetContainerAttributes.INBOXVISIBLE);
	}

	setInboxVisible(flag) {
		this.setAttribute(StreamSheetContainerAttributes.INBOXVISIBLE, flag);
	}

	getStep() {
		return this.getAttribute(StreamSheetContainerAttributes.STEP);
	}

	setStep(source) {
		this.setAttribute(StreamSheetContainerAttributes.STEP, source);
	}

	doSaveParentRef() {
		return (
			this._parent &&
			this._parent.getName() !==
				StreamSheetContainerAttributes.TemplateID
		);
	}

	static get NAME() {
		return NAME;
	}

	static get HIDEMESSAGES() {
		return HIDEMESSAGES;
	}

	static get LOOPELEMENT() {
		return LOOPELEMENT;
	}

	static get REPLACEKEY() {
		return REPLACEKEY;
	}

	static get LOOPINDEX() {
		return LOOPINDEX;
	}

	static get STREAM() {
		return STREAM;
	}

	static get SHEETID() {
		return SHEETID;
	}

	static get INBOXID() {
		return INBOXID;
	}

	static get INBOXVISIBLE() {
		return INBOXVISIBLE;
	}

	static get STEP() {
		return STEP;
	}

	static get STATUS() {
		return STATUS;
	}

	static get TemplateID() {
		return TemplateID;
	}
};
StreamSheetContainerAttributes.template = StreamSheetContainerAttributes.createTemplate();

module.exports = StreamSheetContainerAttributes;
