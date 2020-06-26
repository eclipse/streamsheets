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
const JSG = require('../../JSG');
const GraphItemProperties = require('./GraphItemProperties');
const GraphItem = require('../model/GraphItem');
/**
 * Properties can be used to enumerate and change attributes of an object and change their values.
 * They are used by expression formulas to get or set values or attributes of model objects.
 * Any property that is exposed is also available as a reference in a formula. Look at the
 * property implementation to find out which references can be used in formulas.
 */

/**
 * Static class to provide the corresponding Properties based on the model instance or to provide
 * attached properties of a model instance like e.g. FormatProperties. Properties can be used to
 * enumerate attributes of an object and change their values. This way they are used by
 * expressions formulas to get or set values or attributes of model objects. Any property that
 * is exposed is also available as a reference in a formula.
 *
 * @class PropertiesProvider
 * @static
 * @constructor
 */
const PropertiesProvider = (() => {
	const graphItemProperties = new GraphItemProperties();

	function _getProperties(forItem) {
		if (forItem instanceof GraphItem) {
			return graphItemProperties;
		}

		return undefined;
	}

	return {
		/**
		 * Get Properties for model instance based on the model instance type.
		 *
		 * @method getProperties
		 * @param {GraphItem} forItem Item to retrieve properties for.
		 * @return {GraphItemProperties} Instance of properties. The return type depends on the
		 *     given item.
		 * @static
		 */
		getProperties(forItem) {
			return _getProperties(forItem);
		},

		getReshapeProperties(forItem) {
			return forItem.getReshapeProperties();
		},

		/**
		 * Wrapper method to add a property to the properties of the given model .
		 *
		 * @method addProperty
		 * @param {GraphItem} forItem Item to add property for.
		 * @param {Property} property Property to add.
		 * @static
		 */
		addProperty(forItem, property) {
			const properties = _getProperties(forItem);
			if (properties !== undefined) {
				properties._addProperty(property);
			}
		}
	};
})();

module.exports = PropertiesProvider;
