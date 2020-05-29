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
/**
 * This class organizes a container of object mapped to keys. The keys have to be {Strings}.
 *
 * @example
 *
 *     var map = new Dictionary();
 *
 *     // add item to map
 *     map.put("Test", new Point(2, 2));
 *
 *     // retrieve item from map
 *     var pt = map.get("Test");
 *
 * @class Map
 * @constructor
 */
class Dictionary {
	constructor() {
		this._values = {};
	}

	setMap(values) {
		this._values = values;
		return this;
	}

	getMap() {
		return this._values;
	}

	/**
	 * Remove all values from dictionary.
	 *
	 * @method clear
	 */
	clear() {
		this._values = {};
	}

	/**
	 * Create a copy of the map.<br/>
	 * <b>Note:</b> this will not produce a deep copy, i.e. the map values are not copied.
	 *
	 * @method copy
	 * @return {Dictionary} Copy of the map.
	 */
	copy() {
		const copy = new Dictionary();
		copy.putAll(this);

		return copy;
	}

	/**
	 * Checks, if an object is part of the map identified by the given key.
	 *
	 * @method contains
	 * @param {String} key Key to check for.
	 * @return {Boolean} True, if an object object using the given key is part of the Map.
	 */
	contains(key) {
		return (
			Object.prototype.hasOwnProperty.call(this._values, key) &&
			Object.prototype.propertyIsEnumerable.call(this._values, key)
		);
	}

	/**
	 * Checks, if the map contains objects.
	 *
	 * @method isEmpty
	 * @return {Boolean} True, if map does contain an object else false.
	 */
	isEmpty() {
		return this.keys().length === 0;
	}

	/**
	 * Retrieves an object from the map identified by the given key.
	 *
	 * @method get
	 * @param {String} key Key used for identifying the object.
	 * @return {Object} Object identified by key.
	 */
	get(key) {
		return this._values[key];
	}

	/**
	 * Adds the specified element under given key. The key must be a string.
	 *
	 * @method put
	 * @param {String} key Identifier key .
	 * @param {Object} object Object to be stored.
	 * @return {Object} The previously stored Object.
	 */
	put(key, el) {
		const old = this._values[key];
		this._values[key] = el;
		return old;
	}

	/**
	 * Adds all elements of the specified map to this map
	 *
	 * @method putAll
	 * @param {Dictionary} map Another Map.
	 */
	putAll(map) {
		const self = this;
		map.iterate((key, el) => {
			self.put(key, el);
		});
	}

	/**
	 * Removes and returns the element under given key from this map
	 *
	 * @method remove
	 * @param {String} key Key to identify object.
	 * @return {Object} Object, that was removed.
	 */
	remove(key) {
		const value = this._values[key];
		if (value !== undefined) {
			delete this._values[key];
		}
		return value;
	}

	/**
	 * Return the amount of object in the map.
	 *
	 * @method size
	 * @return {Number}Object count.
	 */
	size() {
		return this.keys().length;
	}

	/**
	 * Returns an array with all keys this map contains.
	 *
	 * @method keys
	 * @return {Array}Array with all keys.
	 */
	keys() {
		const keys = [];
		this._forAllPropertiesOf(this._values, (key) => {
			keys.push(key);
		});
		return keys;
	}

	/**
	 * Returns an array with all objects this map contains.
	 *
	 * @method elements
	 * @return {Array}Array with all objects
	 */
	elements() {
		const elements = [];
		this._forAllPropertiesOf(this._values, (key, value) => {
			elements.push(value);
		});
		return elements;
	}

	/**
	 * Iterates over all map entries and calls specified function with key & element as parameters. If provided function
	 * returns <code>true</code> iteration is stopped.
	 *
	 * @example
	 *     map.iterate(
	 *         function(key, element) {
	 *             doSomethingWith(key, element);
	 *             if(key === lookFor) {
	 *                 return true; //stop iteration
	 *             }
	 *         }
	 *     );
	 *
	 * @method iterate
	 * @param {Function} func Function to be executed for each object in the map. Should return <code>true</code>
	 * to stop iteration.
	 */
	iterate(func) {
		if (Object.keys) {
			this._forAllKeysOf(this._values, func);
		} else {
			this._forAllPropertiesOf(this._values, func);
		}
	}

	map(func) {
		const copy = new Dictionary();
		const entries = Object.entries(this._values);
		entries.forEach(([key, value]) => copy.put(key, func(value, key)));
		return copy;
	}

	/**
	 * Calls the specified function on all properties of given object. Call parameters are property
	 * name and value.
	 *
	 * @private
	 * @method _forAllPropertiesOf
	 * @param {Number} from Desc
	 */
	_forAllPropertiesOf(object, func) {
		let property;

		/* eslint-disable no-restricted-syntax */
		for (property in object) {
			if (Object.prototype.hasOwnProperty.call(object, property)) {
				if (func(property, object[property])) {
					break;
				}
			}
		}
		/* eslint-enable no-restricted-syntax */
	}

	// seems to be faster then _forAllPropertiesOf
	//= > can we make it faster? using key/value arrays instead of value object...
	//= > key/value arrays will make iteration fast, but inserting slow...
	_forAllKeysOf(object, func) {
		const keys = Object.keys(object);

		keys.some((key) => func(key, object[key]));
	}
}

module.exports = Dictionary;
