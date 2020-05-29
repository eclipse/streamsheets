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
const { SheetParser } = require('../parser/SheetParser');

const getDescriptor = (cell) => {
	let descr;
	if (cell && cell.isDefined) {
		// DL-1385: evaluate each cell
		cell.evaluate();
		// DL-1076: cell.value might contains object -> may causes JSON.stringify to fail (circular structure)
		descr = { ...cell.description() };
		if (cell.value && !!cell.value.type) {
			descr.value = cell.value;
			descr.type = 'object';
		} // , internalValue: cell.value }; // <-- e.g. SheetRange
	}
	return descr;
};

class NamedCells {
	constructor() {
		this._cells = new Map();
		this.evaluating = false;
	}

	get size() {
		return this._cells.size;
	}

	forEach(cb) {
		this._cells.forEach((cell, name) => {
			cb(cell, name);
		});
	}

	clear() {
		const doIt = this._cells.size > 0;
		if (doIt) {
			this._cells.forEach((cell) => cell.dispose());
			this._cells.clear();
		}
		return doIt;
	}

	get(name) {
		return this._cells.get(name);
	}

	getDescriptors() {
		const descriptors = {};
		this.evaluating = true;
		this._cells.forEach((cell, name) => {
			const descr = getDescriptor(cell);
			if (descr) descriptors[name] = descr;
		});
		this.evaluating = false;
		return descriptors;
	}

	getDescriptorsAsList() {
		const list = [];
		this.evaluating = true;
		this._cells.forEach((cell, name) => {
			const descr = getDescriptor(cell);
			if (descr) {
				descr.name = name;
				list.push(descr);
			}
		});
		this.evaluating = false;
		return list;
	}

	has(name) {
		return this._cells.has(name);
	}

	isEmpty() {
		return this.size < 1;
	}

	update(oldName, newName, newCell) {
		const cell = newCell || this._cells.get(oldName);
		this._cells.delete(oldName);
		this._cells.set(newName, cell);
		if (cell) cell.init();
	}

	load(scope, names = {}) {
		this.clear();
		Object.entries(names).forEach(([name, def]) => {
			const cell = SheetParser.createCell(def, scope);
			if (cell && cell.isDefined) {
				this.set(name, cell);
			}
		});
		return this;
	}

	set(name, cell) {
		const doIt = !!name;
		if (doIt) {
			const oldcell = this._cells.get(name);
			if (oldcell) oldcell.dispose();
			if (cell != null) {
				cell.init();
				this._cells.set(name, cell);
			} else {
				this._cells.delete(name);
			}
		}
		return doIt;
	}
}

module.exports = NamedCells;
