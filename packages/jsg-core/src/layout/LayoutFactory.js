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
const GraphLayout = require('./GraphLayout');
const EdgeLayout = require('./EdgeLayout');
const OrthogonalLayout = require('./OrthogonalLayout');
const GridLayout = require('./GridLayout');
const MatrixLayout = require('./MatrixLayout');
const Arrays = require('../commons/Arrays');
const Strings = require('../commons/Strings');
const Dictionary = require('../commons/Dictionary');

/**
 * This module defines fundamental classes related to layout {{#crossLink "Node"}}{{/crossLink}}s and
 * {{#crossLink "Edge"}}{{/crossLink}}s of a {{#crossLink "Graph"}}{{/crossLink}}
 * model.<br/> The main classes within this package are the {{#crossLink "Layout"}}{{/crossLink}}
 * class which defines a general interface each custom layout must fulfill and the {{#crossLink
 * "LayoutFactory"}}{{/crossLink}} class which can be used to manage different kinds of
 * <code>Layout</code>s.<br/> A <code>Layout</code> is specified and referenced by its unique type string. Subclasses
 * can define their own layout types and may extend the general <code>Layout</code> interface with additional methods
 * and settings. It is even allowed to replace a predefined layout by providing a custom implementation for the same
 * type. The only requirement is that the custom implementation has to provide at least the same methods and same
 * behavior as defined by the replaced
 * <code>Layout</code>.<br/>
 * The <code>Layout</code>s defined in this package are required by the JS Graph Library to perform some layout
 * dependent tasks, like the arrangement of nodes within their container. Those <code>Layout</code>s can also be
 * accessed through the <code>LayoutFactory</code> and it is even allowed to replace them as long as the custom
 * implementation fulfills the interface of the replaced layout.<br/> The single <code>LayoutFactory</code> instance is
 * accessible via the global {{#crossLink "JSG/layoutFactory:property"}}{{/crossLink}} property.
 */

/**
 * A factory class to register and manage {{#crossLink "Layout"}}{{/crossLink}} instances. Each
 * <code>Layout</code> is stored under its unique type string which is returned by
 * {{#crossLink "Layout/getType:method"}}{{/crossLink}}. It is allowed to define a different layout
 * implementation for the same type. If this is done it must be ensured that the custom implementation provides at
 * least
 * the same methods and same behavior as defined by the replaced <code>Layout</code>.<br/>
 * An instance of this factory is accessible through the {{#crossLink "JSG/layoutFactory:property"}}{{/crossLink}}
 * property.
 *
 *
 * @class LayoutFactory
 * @since 1.6.18
 */
const LayoutFactory = (() => {
	const allLayouts = new Dictionary();

	// Layouts currently required by Framework:
	allLayouts.put(GraphLayout.TYPE, new GraphLayout());
	allLayouts.put(EdgeLayout.TYPE, new EdgeLayout());
	allLayouts.put(OrthogonalLayout.TYPE, new OrthogonalLayout());
	// general layout
	allLayouts.put(GridLayout.TYPE, new GridLayout());
	allLayouts.put(MatrixLayout.TYPE, new MatrixLayout());

	function getOld(type) {
		if (type) {
			type = type.toLowerCase();
			if (!Strings.endsWith(type, '.layout')) {
				type += '.layout';
			}
		}
		return allLayouts.get(type);
	}

	// PUBLIC API:
	return {
		_views: [],
		/**
		 * Initializes the <code>LayoutFactory</code>. The properties of the given signature are varying for different
		 * <code>LayoutFactory</code> implementations.
		 *
		 * @method init
		 * @param {Object} signature An object whose properties are used to initialize the <code>LayoutFactory</code>.
		 */
		init(signature) {},
		/**
		 * Registers given <code>Layout</code> instance. This will replace a previously registered <code>Layout</code>
		 * for the same type.<br/>
		 * <b>Note:</b> if a <code>Layout</code> is replaced the new implementation should fulfill the interface of
		 * replaced
		 * <code>Layout</code>.
		 *
		 * @method addLayout
		 * @param {String} type    The layout type to register given layout for.
		 * @param {Layout} layout The layout instance to register.
		 */
		addLayout(type, layout) {
			allLayouts.put(type, layout);
		},
		/**
		 * Returns a list of type strings of all currently registered {{#crossLink
		 * "Layout"}}{{/crossLink}}s.
		 *
		 * @method getAvailableLayouts
		 * @return {Array} A list of types of all currently registered <code>Layout</code>s.
		 */
		getAvailableLayouts() {
			return allLayouts.keys();
		},
		/**
		 * Returns a <code>Layout</code> instance for specified type or <code>undefined</code> if none is available.
		 *
		 * @method  getLayout
		 * @param  {String} type A unique string which reference a <code>Layout</code>.
		 * @return {Layout} A <code>Layout</code> instance which was stored for given type string
		 * or <code>undefined</code>
		 */
		getLayout(type, graphitem) {
			return allLayouts.get(type) || getOld(type);
		},

		registerEditor(editor) {
			this._views.push(editor);
		},

		unregisterEditor(editor) {
			Arrays.remove(this._views, editor);
		}
	};
})();

module.exports = LayoutFactory;
