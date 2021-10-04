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
const SheetIndex = require('../machine/SheetIndex');
const SheetRange = require('../machine/SheetRange');
const { FunctionErrors, ErrorInfo } = require('@cedalo/error-codes');
const { ParserError, Reference } = require('@cedalo/parser');

const ERROR = FunctionErrors.code;

const isValidIndex = (index, scope) => !scope || !scope.isValidIndex || scope.isValidIndex(index);

class AbstractReference extends Reference {
	constructor(scope) {
		super();
		this.scope = scope;
		this._streamsheetId = undefined;
	}

	get sheet() {
		let sheet = this.scope;
		if (sheet && this._streamsheetId) {
			const machine = sheet.machine || sheet;
			if (machine && machine.getStreamSheet) {
				const streamsheet = machine.getStreamSheet(this._streamsheetId);
				sheet = streamsheet ? streamsheet.sheet : ErrorInfo.create(ERROR.REF);
			}
		}
		return sheet;
	}

	get streamsheetName() {
		const streamsheet = this.sheet && this.sheet.streamsheet;
		return streamsheet ? streamsheet.name : '';
	}
	dispose() {
		this.scope = undefined;
	}

	isEqualTo(operand) {
		const isEqual = super.isEqualTo(operand);
		return isEqual && this.scope === operand.scope && this._streamsheetId === operand._streamsheetId;
	}

	description(str) {
		const streamsheet = this._streamsheetId ? this.streamsheetName : null;
		return streamsheet ? `${streamsheet}!${str}` : str;
	}
}


class NamedCellReference extends AbstractReference {
	static fromString(str, scope) {
		let ref;
		if (scope) {
			const machine = scope.machine || scope;
			ref = scope.namedCells.has(str) || machine.namedCells.has(str) ? new NamedCellReference(str, scope) : null;
		}
		return ref;
	}

	constructor(name, scope) {
		super(scope);
		this.name = name;
	}

	get value() {
		const machine = this.scope.machine || this.scope;
		const cell = this.scope.namedCells.get(this.name) || machine.namedCells.get(this.name);
		if (cell) {
			// NOTE: currently namedCells are not evaluated!!!
			// => so we return always actual value => might be DANGEROUS!
			const value = cell.term ? cell.term.value : cell.value;
			cell.value = value;
			return value;
		}
		return ErrorInfo.create(ERROR.REF);
	}

	get target() {
		const machine = this.scope.machine || this.scope;
		return this.scope.namedCells.get(this.name) || machine.namedCells.get(this.name);
	}

	isTypeOf(type) {
		return type === 'NamedCellReference' || super.isTypeOf(type);
	}

	copy() {
		const cellref = new NamedCellReference(this.name, this.scope);
		cellref._streamsheetId = this._streamsheetId;
		return cellref;
	}

	isEqualTo(operand) {
		return super.isEqualTo(operand) && this.name === operand.name;
	}

	toString() {
		return this.name;
	}
}

class CellReference extends AbstractReference {
	static fromString(str, scope, ignoreValidation = false) {
		const parts = str.split('.');
		const indexstr = parts.length === 2 ? parts[1] : str;
		const index = indexstr && SheetIndex.create(indexstr);
		if (index) {
			if (ignoreValidation || (scope.isValidIndex && scope.isValidIndex(index))) {
				return new CellReference(index, scope);
			}
			// index is invalid, so throw an error...
			throw ParserError.create({ code: ERROR.NAME }); // excel returns #NAME? if specified ref is invalid...
		}
		return undefined;
	}

	constructor(index, scope) {
		super(scope);
		this.index = index;
	}

	get isCellReference() {
		return true;
	}

	get cell() {
		const index = this.index;
		const sheet = this.sheet;
		const error =
			FunctionErrors.isError(sheet) ||
			(sheet && !isValidIndex(index, sheet) ? ErrorInfo.create(ERROR.REF) : undefined);
		return error || sheet.cellAt(index);
	}

	get value() {
		const cell = this.cell;
		return FunctionErrors.isError(cell) || (cell ? cell.value : undefined);
	}

	get target() {
		return this.cell;
	}

	// since target property is used within parser, add additional one
	get targetedCell() {
		const cell = this.cell;
		const term = cell && cell.term;
		return term && term.operand.isCellReference ? term.operand.targetedCell : cell;
	}

	isTypeOf(type) {
		return type === 'CellReference' || super.isTypeOf(type);
	}

	copy() {
		const cellref = new CellReference(this.index.copy(), this.scope);
		cellref._streamsheetId = this._streamsheetId;
		return cellref;
	}

	isEqualTo(operand) {
		return super.isEqualTo(operand) && this.index.isEqualTo(operand.index);
	}

	toString() {
		return this.description(this.index.toString());
	}
}
class CellRangeReference extends AbstractReference {
	static fromString(str, scope, ignoreValidation = false) {
		const range = str && SheetRange.fromRangeStr(str);
		if (range) {
			if (
				!FunctionErrors.isError(range) &&
				(ignoreValidation || (isValidIndex(range.start, scope) && isValidIndex(range.end, scope)))
			) {
				return new CellRangeReference(range, scope);
			}
			// range is invalid, so throw an error...
			throw ParserError.create({ code: ERROR.NAME }); // excel returns #NAME? if specified ref is invalid...
		}
		return undefined;
	}

	constructor(range, scope) {
		super(scope);
		this._range = range;
	}

	get	isCellRangeReference() {
		return true;
	}

	get range() {
		const sheet = this.sheet;
		const range = this._range;
		range.sheet = sheet;
		const error =
			FunctionErrors.isError(sheet) ||
			(sheet && (!isValidIndex(range.start, sheet) || !isValidIndex(range.end, sheet))
				? ErrorInfo.create(ERROR.REF)
				: null);
		return error || range;
	}

	get value() {
		return this.range;
	}

	get target() {
		return undefined;
	}

	dispose() {
		this._range.sheet = undefined;
		super.dispose();
	}

	isTypeOf(type) {
		return type === 'CellRangeReference' || super.isTypeOf(type);
	}

	copy() {
		const cellref = CellRangeReference.fromString(this._range.toString(), this.scope);
		cellref._streamsheetId = this._streamsheetId;
		return cellref;
	}

	isEqualTo(operand) {
		return super.isEqualTo(operand) && this._range.isEqualTo(operand._range);
	}

	toString() {
		return this.description(this._range.toString());
	}
}

const MSGBOX_REFERENCES = ['INBOX', 'INBOXMETADATA', 'INBOXDATA', 'OUTBOX', 'OUTBOXMETADATA', 'OUTBOXDATA'];
const getInbox = (sheet) => sheet.streamsheet.inbox;
const getOutbox = (sheet) => sheet.machine.outbox;
const getMessage = (message) => message;
const getMessageData = (message) => message ? message.data : undefined;
const getMessageMetaData = (message) => message ? message.metadata : undefined;
class MessageBoxReference extends AbstractReference {
	static fromString(str, scope) {
		const refstr = str.toUpperCase();
		if (MSGBOX_REFERENCES.includes(refstr)) {
			const getBox = refstr.startsWith('INBOX') ? getInbox : getOutbox;
			// eslint-disable-next-line no-nested-ternary
			const getMessagePart = refstr.endsWith('METADATA')
				? getMessageMetaData
				: refstr.endsWith('DATA')
				? getMessageData
				: getMessage;
			return new MessageBoxReference(scope, refstr, getBox, getMessagePart);
		}
		return undefined;
	}

	constructor(scope, refstr, getBox, getMessagePart) {
		super();
		this.scope = scope;
		this._refstr = refstr;
		this._getMessageBox = getBox;
		this._getMessagePart = getMessagePart;
		this._streamsheetId = undefined;
	}

	get isMessageBoxReference() {
		return true;
	}

	get value() {
		const sheet = this.sheet;
		const messagebox = sheet && this._getMessageBox(this.sheet);
		return messagebox ? this._getMessagePart(messagebox.peek()) : ErrorInfo.create(ERROR.REF);
	}

	copy() {
		const ref = MessageBoxReference.fromString(this._refstr, this.scope);
		ref._streamsheetId = this._streamsheetId;
		return ref;
	}

	isTypeOf(type) {
		return type === 'MessageBoxReference' || super.isTypeOf(type);
	}

	isEqualTo(operand) {
		return operand.isMessageBoxReference && operand._refstr === this._refstr;
	}

	toString() {
		return this.description(this._refstr);
	}
}

class ShapeReference extends AbstractReference {
	static fromString(str, scope, streamSheetId) {
		let sheet = scope;
		if (streamSheetId) {
			const machine = scope.machine || scope;
			if (machine && machine.getStreamSheet) {
				const streamsheet = machine.getStreamSheet(streamSheetId);
				sheet = streamsheet ? streamsheet.sheet : undefined;
			}
		}
		const shape = sheet && sheet.shapes && sheet.shapes.getShapeByName(str);
		return shape ? new ShapeReference(scope, str) : undefined;
	}

	constructor(scope, refstr /*, shape */) {
		super();
		this.scope = scope;
		this._refstr = refstr;
		this._streamsheetId = undefined;
	}

	get isShapeReference() {
		return true;
	}

	get value() {
		const shape = this.sheet.shapes.getShapeByName(this._refstr);
		return shape || ERROR.REF;
	}

	copy() {
		const ref = ShapeReference.fromString(this._refstr, this.scope);
		ref._streamsheetId = this._streamsheetId;
		return ref;
	}

	isTypeOf(type) {
		return type === 'ShapeReference' || super.isTypeOf(type);
	}

	isEqualTo(operand) {
		return operand.isShapeReference && operand._refstr === this._refstr;
	}

	toString() {
		return this.description(this._refstr);
	}
}

const referenceFromString = (str, scope) => {
	// sheet reference
	let streamsheetId;
	const parts = str.split('!');
	const externalRef = parts.length === 2 && !!parts[0] && !!parts[1];
	if (externalRef) {
		// we have a sheet reference...
		const machine = scope.machine || scope;
		const streamsheet = machine ? machine.getStreamSheetByName(parts[0]) : undefined;
		if (!streamsheet) throw ParserError.create({ code: ERROR.REF });
		streamsheetId = streamsheet.id;
		str = parts[1];
	}
	const reference =
		NamedCellReference.fromString(str, scope) ||
		MessageBoxReference.fromString(str, scope) ||
		ShapeReference.fromString(str, scope, streamsheetId) ||
		CellReference.fromString(str, scope, externalRef) ||
		CellRangeReference.fromString(str, scope, externalRef);
	if (reference) reference._streamsheetId = streamsheetId;
	return reference;
};

const referenceFromNode = (node, context) =>
	node.type === 'identifier' ? referenceFromString(node.value, context.scope) : undefined;


module.exports = {
	CellReference,
	CellRangeReference,
	NamedCellReference,
	MessageBoxReference,
	ShapeReference,
	referenceFromNode,
	referenceFromString
};
