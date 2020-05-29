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
const BooleanAttribute = require('./BooleanAttribute');

const SizeModes = {
	NONE: 0,
	ROWS: 1,
	COLUMNS: 2,
	VISIBLEROWS: 4,
	VISBILECOLUMNS: 8
};

const SelectionModes = {
	CELL: 0,
	ROW: 1,
	COLUMN: 2
};

// PREDEFINED ATTRIBUTES:
const PROTECTED = 'protected';
const CALCONDEMAND = 'calcondemand';
const CLIPCELLS = 'clipcells';
const GREYIFROWS = 'greyifrows';
const SHOWHEADER = 'showheader';
const SHOWFORMULAS = 'showformulas';
const SHOWGRID = 'showgrid';
const SIZEMODE = 'sizemode';
const SELECTIONMODE = 'selectionmode';
const INVERTROWS = 'invertrows';
const VISIBLEROWS = 'visiblerows';
const VISIBLECOLUMNS = 'visiblecolumns';
const ROWS = 'rows';
const COLUMNS = 'columns';

// UNIQUE NAME:
const NAME = 'Worksheet';
const TemplateID = 'WorksheetAttributes.Template';

/**
 * @class WorksheetAttributes
 * @extends AttributeList
 * @constructor
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined attributes.
 */
const WorksheetAttributes = class WorksheetAttributes extends AttributeList {
	constructor(mapExpr) {
		super(WorksheetAttributes.NAME, mapExpr);

		this.setParent(WorksheetAttributes.template);
	}

	newInstance(mapExpr) {
		return new WorksheetAttributes(mapExpr);
	}

	getClassString() {
		return 'JSG.WorksheetAttributes';
	}

	static createTemplate() {
		const ATTR = WorksheetAttributes;
		const attributes = new WorksheetAttributes();

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
		addAttribute(new BooleanAttribute(ATTR.PROTECTED), false);
		addAttribute(new BooleanAttribute(ATTR.CALCONDEMAND), false);
		addAttribute(new BooleanAttribute(ATTR.CLIPCELLS), false);
		addAttribute(new BooleanAttribute(ATTR.SHOWFORMULAS), false);
		addAttribute(new BooleanAttribute(ATTR.SHOWGRID), true);
		addAttribute(new BooleanAttribute(ATTR.SHOWHEADER), true);
		addAttribute(new BooleanAttribute(ATTR.GREYIFROWS), true);
		addAttribute(new BooleanAttribute(ATTR.INVERTROWS), false);
		addAttribute(
			new NumberAttribute(ATTR.SIZEMODE),
			WorksheetAttributes.SizeModes.NONE
		);
		addAttribute(
			new NumberAttribute(ATTR.SELECTIONMODE),
			WorksheetAttributes.SelectionModes.CELL
		);
		addAttribute(new NumberAttribute(ATTR.VISIBLEROWS), -1);
		addAttribute(new NumberAttribute(ATTR.VISIBLECOLUMNS), -1);
		addAttribute(new NumberAttribute(ATTR.ROWS), 100);
		addAttribute(new NumberAttribute(ATTR.COLUMNS), 52);

		return attributes.toTemplate(WorksheetAttributes.TemplateID);
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
		this.setAttribute(WorksheetAttributes.PROTECTED, protect);
	}

	/**
	 * Returns the attribute for the protected flag setting.
	 *
	 * @method getProtected
	 * @return {Attribute} Attribute with current setting for the protected flag.
	 */
	getProtected() {
		return this.getAttribute(WorksheetAttributes.PROTECTED);
	}

	getCalcOnDemand() {
		return this.getAttribute(WorksheetAttributes.CALCONDEMAND);
	}

	setCalcOnDemand(calc) {
		this.setAttribute(WorksheetAttributes.CALCONDEMAND, calc);
	}

	getClipCells() {
		return this.getAttribute(WorksheetAttributes.CLIPCELLS);
	}

	setClipCells(flag) {
		this.setAttribute(WorksheetAttributes.CLIPCELLS, flag);
	}

	getShowFormulas() {
		return this.getAttribute(WorksheetAttributes.SHOWFORMULAS);
	}

	setShowFormulas(show) {
		this.setAttribute(WorksheetAttributes.SHOWFORMULAS, show);
	}

	getShowGrid() {
		return this.getAttribute(WorksheetAttributes.SHOWGRID);
	}

	setShowGrid(show) {
		this.setAttribute(WorksheetAttributes.SHOWGRID, show);
	}

	getShowHeader() {
		return this.getAttribute(WorksheetAttributes.SHOWHEADER);
	}

	setShowHeader(show) {
		this.setAttribute(WorksheetAttributes.SHOWHEADER, show);
	}

	getSizeMode() {
		return this.getAttribute(WorksheetAttributes.SIZEMODE);
	}

	setSizeMode(mode) {
		this.setAttribute(WorksheetAttributes.SIZEMODE, mode);
	}

	getGreyIfRows() {
		return this.getAttribute(WorksheetAttributes.GREYIFROWS);
	}

	setGreyIfRows(mode) {
		this.setAttribute(WorksheetAttributes.GREYIFROWS, mode);
	}

	getSelectionMode() {
		return this.getAttribute(WorksheetAttributes.SELECTIONMODE);
	}

	setSelectionMode(mode) {
		this.setAttribute(WorksheetAttributes.SELECTIONMODE, mode);
	}

	getVisibleRows() {
		return this.getAttribute(WorksheetAttributes.VISIBLEROWS);
	}

	setVisibleRows(rows) {
		this.setAttribute(WorksheetAttributes.VISIBLEROWS, rows);
	}

	getVisibleColumns() {
		return this.getAttribute(WorksheetAttributes.VISIBLECOLUMNS);
	}

	setVisibleColumns(columns) {
		this.setAttribute(WorksheetAttributes.VISIBLECOLUMNS, columns);
	}

	getRows() {
		return this.getAttribute(WorksheetAttributes.ROWS);
	}

	setRows(rows) {
		this.setAttribute(WorksheetAttributes.ROWS, rows);
	}

	getColumns() {
		return this.getAttribute(WorksheetAttributes.COLUMNS);
	}

	setColumns(columns) {
		this.setAttribute(WorksheetAttributes.COLUMNS, columns);
	}

	doSaveParentRef() {
		return (
			this._parent &&
			this._parent.getName() !== WorksheetAttributes.TemplateID
		);
	}

	static get SizeModes() {
		return SizeModes;
	}

	static get SelectionModes() {
		return SelectionModes;
	}

	static get NAME() {
		return NAME;
	}

	static get PROTECTED() {
		return PROTECTED;
	}

	static get CALCONDEMAND() {
		return CALCONDEMAND;
	}

	static get CLIPCELLS() {
		return CLIPCELLS;
	}

	static get GREYIFROWS() {
		return GREYIFROWS;
	}

	static get SHOWFORMULAS() {
		return SHOWFORMULAS;
	}

	static get SHOWGRID() {
		return SHOWGRID;
	}

	static get SHOWHEADER() {
		return SHOWHEADER;
	}

	static get SIZEMODE() {
		return SIZEMODE;
	}

	static get SELECTIONMODE() {
		return SELECTIONMODE;
	}

	static get INVERTROWS() {
		return INVERTROWS;
	}

	static get VISIBLEROWS() {
		return VISIBLEROWS;
	}

	static get VISIBLECOLUMNS() {
		return VISIBLECOLUMNS;
	}

	static get ROWS() {
		return ROWS;
	}

	static get COLUMNS() {
		return COLUMNS;
	}

	static get TemplateID() {
		return TemplateID;
	}
};

WorksheetAttributes.template = WorksheetAttributes.createTemplate();

module.exports = WorksheetAttributes;
