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
const { FunctionErrors } = require('@cedalo/error-codes');
const { ParserError, Reference } = require('@cedalo/parser');

const isValidIndex = (index, scope) => !scope || !scope.isValidIndex || scope.isValidIndex(index);

class AbstractCellReference extends Reference {
	constructor(scope) {
		super();
		this.scope = scope;
		this._streamsheetId = undefined;
	}

	get sheet() {
		let sheet = this.scope;
		if (sheet) {
			const machine = sheet.machine || sheet;
			if (machine && this._streamsheetId && machine.getStreamSheet) {
				const streamsheet = machine.getStreamSheet(this._streamsheetId);
				sheet = streamsheet ? streamsheet.sheet : FunctionErrors.code.REF;
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


class NamedCellReference extends AbstractCellReference {
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
		return FunctionErrors.code.REF;
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

class CellReference extends AbstractCellReference {
	static fromString(str, scope, ignoreValidation = false) {
		const parts = str.split('.');
		const indexstr = parts.length === 2 ? parts[1] : str;
		const index = indexstr && SheetIndex.create(indexstr);
		if (index) {
			if (ignoreValidation || (scope.isValidIndex && scope.isValidIndex(index))) {
				return new CellReference(index, scope);
			}
			// index is invalid, so throw an error...
			throw ParserError.create({ code: FunctionErrors.code.NAME }); // excel returns #NAME? if specified ref is invalid...
		}
		return undefined;
	}

	constructor(index, scope) {
		super(scope);
		this.index = index;
	}

	get cell() {
		const index = this.index;
		const sheet = this.sheet;
		const error =
			FunctionErrors.isError(sheet) || (sheet && !isValidIndex(index, sheet) ? FunctionErrors.code.REF : undefined);
		return error || sheet.cellAt(index);
	}

	get value() {
		const cell = this.cell;
		return FunctionErrors.isError(cell) || (cell ? cell.value : undefined);
	}

	get target() {
		return this.cell;
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
class CellRangeReference extends AbstractCellReference {
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
			throw ParserError.create({ code: FunctionErrors.code.NAME }); // excel returns #NAME? if specified ref is invalid...
		}
		return undefined;
	}

	constructor(range, scope) {
		super(scope);
		this._range = range;
	}

	get range() {
		const sheet = this.sheet;
		const range = this._range;
		range.sheet = sheet;
		const error =
			FunctionErrors.isError(sheet) ||
			(sheet && (!isValidIndex(range.start, sheet) || !isValidIndex(range.end, sheet))
				? FunctionErrors.code.REF
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

const referenceFromString = (str, scope) => {
	// sheet reference
	let streamsheetId;
	const parts = str.split('!');
	const externalRef = parts.length === 2;
	if (externalRef) {
		// we have a sheet reference...
		const machine = scope.machine || scope;
		const streamsheet = machine ? machine.getStreamSheetByName(parts[0]) : undefined;
		if (!streamsheet) throw ParserError.create({ code: FunctionErrors.code.REF });
		streamsheetId = streamsheet.id;
		str = parts[1];
	}
	const reference =
		NamedCellReference.fromString(str, scope) ||
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
	referenceFromNode,
	referenceFromString
};
