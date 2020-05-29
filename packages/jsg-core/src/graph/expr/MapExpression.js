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
const Expression = require('./Expression');
const Dictionary = require('../../commons/Dictionary');

/**
 * A MapExpression simply uses a {{#crossLink "Dictionary"}}{{/crossLink}} as its value and
 * provides methods to store and retrieve elements to and from inner Map.</br>
 * Note: the Expression value returned by {{#crossLink "MapExpression/getValue:method"}}{{/crossLink}}
 * is an Array of elements the inner Map currently contains. Furthermore a default MapExpression does
 * not support any formula or terms. Subclasses might change this behavior by overwriting corresponding methods.</br>
 * <b>Important:</b> to support a deep copy of this Expression all stored elements should implement
 * a <code>copy</code>-method.
 *
 *
 * @class MapExpression
 * @constructor
 * @extends BooleanExpression
 */
class MapExpression extends Expression {
	constructor() {
		super();
		this._value = new Dictionary();
	}

	/**
	 * Checks if internal used map contains any objects.
	 *
	 * @method isEmpty
	 * @return {Boolean} <code>true</code> if map does contain at least one object, <code>false</code> otherwise.
	 */
	isEmpty() {
		return this._value.isEmpty();
	}

	/**
	 * Returns the current size of internally used map.
	 * @method getSize
	 * @return {Number} Current size of internal map.
	 * @since 1.6.43
	 */
	getSize() {
		return this._value.size();
	}

	/**
	 * Checks if internal map contains an element for specified key.
	 *
	 * @method hasElement
	 * @param {String} key The key to check.
	 * @return {Boolean} <code>true</code> if map contains an element for specified key, <code>false</code> otherwise.
	 */
	hasElement(key) {
		return this._value.contains(key);
	}

	/**
	 * Adds given element under specified key to the inner map of this MapExpression.
	 * Any previously added element for same key is replaced.
	 *
	 * @method putElement
	 * @param {String} key The key to add the element for.
	 * @return {Object} The previously stored element or <code>undefined</code>.
	 */
	putElement(key, element) {
		return this._value.put(key, element);
	}

	/**
	 * Returns the element for given key or <code>undefined</code> if none could be found.
	 *
	 * @method getElement
	 * @param {String} key The key to get the corresponding element for.
	 * @return {Object} The element for given key or <code>undefined</code>.
	 */
	getElement(key) {
		return this._value.get(key);
	}

	/**
	 * Removes the element for given key.
	 *
	 * @method removeElement
	 * @param {String} key The key which references the element to remove.
	 * @return {Object} The removed element or <code>undefined</code>.
	 */
	removeElement(key) {
		return this._value.remove(key);
	}

	newInstance() {
		return new MapExpression();
	}

	copy() {
		const copy = this.newInstance();

		function copyElement(id, el) {
			const elcopy = el.copy !== undefined ? el.copy() : el;
			copy.putElement(id, elcopy);
		}

		this._value.iterate(copyElement);

		return copy;
	}

	isValueEqualTo(value) {
		return this._value === value;
		// TODO Map content??
	}

	getValue() {
		return this._value.elements();
	}

	/**
	 * Iterates over all values stored in inner {{#crossLink "Dictionary"}}{{/crossLink}}. If provided function
	 * returns <code>true</code> iteration is stopped.<br/>
	 *
	 * @method iterate
	 * @param {Function} func Function to be executed for each object in the map. Should return <code>true</code> to
	 *     stop iteration.
	 */
	iterate(func) {
		this._value.iterate(func);
	}

	// DON'T ALLOW CHANGE FROM OUTSIDE, SO:
	setConstraint() {
		return false;
	}

	setValue() {
		return false;
	}

	setFormula() {
		return false;
	}

	setTerm() {
		return false;
	}

	setTo() {
		return false;
	}

	set() {
		return false;
	}
}

module.exports = MapExpression;
