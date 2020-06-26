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
import { default as JSG, LineConnection, Node, Port, Graph, ContentNode } from '@cedalo/jsg-core';

import GraphController from './GraphController';
import ContentNodeController from './ContentNodeController';
import GroupController from './GroupController';
import NodeController from './NodeController';
import ConnectionController from './ConnectionController';
import PortController from './PortController';

/**
 * A factory class to create {{#crossLink "ModelController"}}{{/crossLink}}s
 * based on provided {{#crossLink "Model"}}{{/crossLink}}s.</br>
 * This instance only creates controllers for the models defined within the framework. Custom
 * application should create their own factory class and register it to the used
 * {{#crossLink "ControllerViewer"}}{{/crossLink}}.
 *
 * @class GraphControllerFactory
 * @constructor
 */
const GraphControllerFactory = (() => {
	// private members and methods:
	let instance;

	function constructor(viewer) {
		return {
			_viewer: viewer,

			/**
			 * Returns the controller constructor function for given model or <code>undefined</code> if
			 * model is not known to this factory.
			 *
			 * @method getController
			 * @param {Model} model The model to get the controller constructor function for.
			 * @return {Function} The controller constructor function or <code>undefined</code>.
			 */
			getController(model) {
				let controller;
				if (model instanceof Graph) {
					controller = GraphController;
				} else if (model instanceof ContentNode) {
					controller = ContentNodeController;
				} else if (JSG.isGroup(model)) {
					controller = GroupController;
				} else if (model instanceof Node) {
					controller = NodeController;
				} else if (model instanceof LineConnection) {
					controller = ConnectionController;
				} else if (model instanceof Port) {
					controller = PortController;
				}
				return controller;
			},
			/**
			 * Creates a new controller instance for given model.</br>
			 * Returns <code>undefined</code> if model is not known to this factory.
			 *
			 * @method createController
			 * @param {Model} model The model to create a controller for.
			 * @return {ModelController} The controller or <code>undefined</code>.
			 */
			createController(model) {
				const Controller = this.getController(model);
				return Controller ? new Controller(model, this._viewer) : undefined;
			},

			registerViewer(lviewer) {
				this._viewer = lviewer;
			}
		};
	}

	return {
		/**
		 * Returns the static factory instance
		 *
		 * @method getInstance
		 * @return {GraphControllerFactory} The sole controller factory
		 * @static
		 */
		getInstance() {
			if (!instance) {
				instance = constructor();
			}
			return instance;
		}
	};
})();

export default GraphControllerFactory;
