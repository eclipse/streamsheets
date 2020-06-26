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
const Arrays = require('./Arrays');
const Dictionary = require('./Dictionary');

/**
 * Acts like a Dictionary, but preserves the order of the elements added to the Dictionary.
 *
 * @class StableDictionary
 * @constructor
 * @extends Dictionary
 */
class StableDictionary extends Dictionary {
	constructor() {
		super();
		this._orderedkeys = [];
	}

	clear() {
		super.clear();
		this._orderedkeys = [];
	}

	sort(comparefunc) {
		if (comparefunc !== undefined) {
			this._orderedkeys.sort(comparefunc);
		}
	}

	/**
	 * Returns the first object added to this dictionary or <code>undefined</code> if dictionary is empty.
	 *
	 * @method getFirst
	 * @return {Object} The first object which was added to this dictionary.
	 * @since 1.6.0
	 */
	getFirst() {
		return this._orderedkeys.length > 0
			? this.get(this._orderedkeys[0])
			: undefined;
	}

	/**
	 * Returns the last object added to this dictionary or <code>undefined</code> if dictionary is empty.
	 *
	 * @method getLast
	 * @return {Object} The last object which was added to this dictionary.
	 * @since 1.6.0
	 */
	getLast() {
		return this._orderedkeys.length > 0
			? this.get(this._orderedkeys[this._orderedkeys.length - 1])
			: undefined;
	}

	put(key, el) {
		if (!this.contains(key)) {
			this._orderedkeys.push(key);
		}
		super.put(key, el);
	}

	insertAt(index, key, el) {
		if (!this.contains(key)) {
			Arrays.insertAt(this._orderedkeys, index, key);
		}
		super.put(key, el);
	}

	indexOf(key) {
		return this._orderedkeys.indexOf(key);
	}

	remove(key) {
		const value = super.remove(key);
		if (value !== undefined) {
			Arrays.remove(this._orderedkeys, key);
		}
		return value;
	}

	size() {
		return this._orderedkeys.length;
	}

	keys() {
		const keys = [];
		this._orderedkeys.forEach((key) => {
			keys.push(key);
		});
		return keys;
	}

	elements() {
		const elements = [];

		this._orderedkeys.forEach((key) => {
			const value = this.get(key);
			if (value !== undefined) {
				elements.push(value);
			}
		});
		return elements;
	}

	/**
	 * Iterates this dictionary and calls given function with key and element as parameter. .
	 *
	 * @method iterate
	 * @param {Function} func Function to be called during iteration with key and element as parameter.
	 */
	iterate(func) {
		this._orderedkeys.forEach((key, index) => {
			this._callFunc(func, index);
		});
	}

	/**
	 * Iterates this dictionary in reverse order and calls given function with key and element as parameter.
	 *
	 * @method iterateReverse
	 * @param {Function} func Function to be called during iteration with key and element as parameter.
	 */
	iterateReverse(func) {
		let i;

		for (i = this._orderedkeys.length - 1; i >= 0; i -= 1) {
			this._callFunc(func, i);
		}
	}

	_callFunc(func, index) {
		// TODO review: we call func only if value is defined. but it might be wanted that value is undefined!
		//= > check was introduced, because SelectionProvider sometimes has a reference to removed controller
		// within this dictionary! => CHECK THIS!!
		const key = this._orderedkeys[index];
		const value = this.get(key);

		if (value !== undefined) {
			func(key, value);
		}
	}
}

module.exports = StableDictionary;
