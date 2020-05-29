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
const { Reference } = require('@cedalo/parser');

const CellRange = require('../model/CellRange');
/**
 * An instance of this class is used to reference a certain property of a specified item.</br>
 * Note: item properties could be structured into different objects. That is why the third parameter
 * is required. The projectObject actually holds the referenced property.
 *
 * @class SheetReference
 * @constructor
 * @param {GraphItem} item The referenced GraphItem model and attribute owner.
 * @param {String} [reference] The reference name.
 */
module.exports = class SheetReference extends Reference {
	constructor(item, reference) {
		super();

		this._item = item;

		if (item !== undefined && reference !== undefined) {
			this._range = CellRange.parse(reference, item);
			if (this._range === undefined) {
				const data = item.getDataProvider();
				data.getNames().some((name) => {
					if (name.getName().toUpperCase() === reference) {
						this._name = name;
						return true;
					}
					return false;
				});
				const graph = item.getGraph();
				graph.getSheetNames().some((name) => {
					if (name.getName().toUpperCase() === reference) {
						this._name = name;
						return true;
					}
					return false;
				});
			}
		}
	}

	isValid() {
		return this._name || (this._range && this._range.isValid());
	}

	isResolved() {
		return true;
	}

	setItem(item) {
		this._item = item;
	}

	/**
	 * Creates a copy of this SheetReference instance.
	 *
	 * @method copy
	 * @return {SheetReference} A copy of this SheetReference instance.
	 */
	copy() {
		const copy = new SheetReference(this._item);

		if (this._range) {
			copy._range = this._range.copy();
		}
		if (this._name) {
			copy._name = this._name;
		}

		return copy;
	}

	getRange() {
		return this._range;
	}

	/**
	 * Returns the value of referenced attribute. </br>
	 *
	 * @method getValue
	 * @return {Object} The value of referenced attribute.
	 */
	getValue() {
		return '#CALC';
	}

	get value() {
		return this.getValue();
	}

	getPropertyString(params) {
		if (this._name) {
			return this._name.getName();
		}

		if (this._range) {
			return this._range.toString(params);
		}

		return '#REF!';
	}

	toString(params) {
		if (this.isResolved()) {
			return this.getPropertyString(params);
		}
		// not  resolved => simply return raw string...
		return this._str;
	}
};
