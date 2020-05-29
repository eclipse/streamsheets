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
const Property = require('./Property');
const IndexProperty = require('./IndexProperty');
const Dictionary = require('../../commons/Dictionary');

/**
 * Base class for model properties. The Properties class acts as a container for a
 * set of properties. These property sets are returned by the PropertiesProvider exposing
 * named properties.
 *
 * Should not be used directly. Use the subclasses instead or derive from this.
 *
 * @class Properties
 * @constructor
 */
class Properties {
	constructor() {
		this._properties = new Dictionary();
	}

	/**
	 * Adds a new property to the property container.
	 *
	 * @method addProperty
	 * @param {String} id Unique Name or id of the property.
	 * @param {String} getter Name of the function that acts as a getter for the Property.
	 * @param {String} setter Name of the function that acts as a setter for the Property.
	 */
	addProperty(id, getter, setter) {
		const property = new Property(id, getter, setter);
		this._properties.put(property.id, property);

		return property;
	}

	/**
	 * Adds a new index property to the property container. The getter and setter are called
	 * providing the index.
	 *
	 * @method addIndexProperty
	 * @param {String} id Unique Name or id of the property.
	 * @param {String} getter Name of the function that acts as a getter for the Property.
	 * @param {String} setter Name of the function that acts as a setter for the Property.
	 * @param {Number} index Index that is passed to the getter and setter to retrieve or set values.
	 */
	addIndexProperty(id, getter, setter, index) {
		// TODO: check where IndexProperty is defined
		const property = new IndexProperty(id, getter, setter, index);
		this._properties.put(property.id, property);

		return property;
	}

	/**
	 * Get a property by its id.
	 *
	 * @method Property
	 * @param {String} id Id of property to get.
	 * @return {return_type} Property corresponding to id.
	 */
	getProperty(id) {
		return this._properties.get(id);
	}

	/**
	 * Gives access to the underlying container.
	 *
	 * @method getPropertiesMap
	 * @return {Dictionary} Map with the properties.
	 */
	getPropertiesMap() {
		return this._properties;
	}

	/**
	 * Get number of properties in the container.
	 *
	 * @method size
	 * @return {Number} Amount of properties.
	 */
	size() {
		return this._properties.size();
	}

	/**
	 * Remove all properties from the container.
	 *
	 * @method clear
	 */
	clear() {
		return this._properties.clear();
	}

	/**
	 * Retrieve an Array with all properties.
	 *
	 * @method getAllProperties
	 * @return {Array} Array with properties
	 */
	getAllProperties() {
		return this._properties.elements();
	}

	/**
	 * Copy property container.
	 *
	 * @method copy
	 * @return {Properties} A copy of this property container.
	 */
	copy() {
		const copy = new Properties();

		function addNextProperty(key, property) {
			copy._properties.put(key, property.copy());
		}

		this._properties.iterate(addNextProperty);

		return copy;
	}
}

module.exports = Properties;
