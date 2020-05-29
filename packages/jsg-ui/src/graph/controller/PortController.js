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
import { Port } from '@cedalo/jsg-core';
import GraphItemController from './GraphItemController';
import PortFeedback from '../feedback/PortFeedback';
import PortView from '../view/PortView';

/**
 * A controller to determine the behavior of {{#crossLink "Port"}}{{/crossLink}}s.
 *
 * @class PortController
 * @extends GraphItemController
 * @param {Port} port The port model associated with this controller.
 * @constructor
 */
class PortController extends GraphItemController {
	/**
	 * Returns, if the port is selectable.
	 * @method isSelectable
	 * @return {boolean} Always false, as a port is not selectable.
	 */
	isSelectable() {
		// later we maybe want to select port and move it...
		return false;
	}

	/**
	 * Creates the corresponding view for a Port model.
	 *
	 * @method createView
	 * @param {Port} model Port model to create a view for.
	 * @return {PortView} View, which is created for the port model.
	 */
	createView(model) {
		// here we create a view depending on given model...
		if (model instanceof Port) {
			return new PortView(model);
		}

		return undefined;
	}

	_newFeedback(fbItem, fbView, model) {
		return new PortFeedback(fbItem, fbView, model);
	}
};

export default PortController;
