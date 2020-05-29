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
const MapExpression = require('../expr/MapExpression');

//= =================================================================================================
// OVERWRITE MapExpression because we store attributes under name.upperCase()...
module.exports = class MapExpressionUpperCase extends MapExpression {
	constructor(list) {
		super();
		this._list = list;
	}

	newInstance() {
		return new MapExpressionUpperCase(this._list);
	}

	// overwritten: we check content of both maps!! => we know they must be attributes...
	isValueEqualTo(value) {
		const map = this._value;
		const other = value;
		let equal = map.size() === other.size();
		if (equal) {
			// check each attribute...
			map.iterate((id, attr) => {
				const otherAttr = other.get(id);
				equal = attr.isEqualTo(otherAttr);
				// stop iteration if given attribute is not equal to other attribute
				return !equal;
			});
		}
		return equal;
	}

	hasElement(key) {
		return super.hasElement(key.toUpperCase());
	}

	putElement(key, element) {
		return super.putElement(key.toUpperCase(), element);
	}

	getElement(key) {
		const el = super.getElement(key.toUpperCase());
		if (el) {
			el._list = this._list;
		}
		return el;
	}

	removeElement(key) {
		const el = super.removeElement(key.toUpperCase());
		if (el) {
			el._list = this._list;
		}
		return el;
	}

	evaluate(item) {
		// evaluate attributes:
		function evalElement(id, el) {
			el.evaluate(item);
		}

		this._value.iterate(evalElement);
	}

	invalidateTerm() {
		// invalidate attributes:
		function invalidateTerm(id, el) {
			el.invalidateTerm();
		}

		this._value.iterate(invalidateTerm);
	}

	resolveParentReference(item, doRemove) {
		function resolveParent(id, el) {
			el.resolveParentReference(item, doRemove);
		}

		this._value.iterate(resolveParent);
	}
};
