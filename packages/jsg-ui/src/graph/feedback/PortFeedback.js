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
import { default as JSG } from '@cedalo/jsg-core';
import Feedback from './Feedback';

/**
 * A Feedback instance for Port items.
 *
 * @class PortFeedback
 * @extends Feedback
 * @param {Port} fbItem The Port item this feedback is based on.
 * @param {View} fbView The View used to represent this feedback.
 * @param {Port} orgItem The original Port model associated to this feedback.
 * @constructor
 */
class PortFeedback extends Feedback {
	init() {
		super.init();
	}
}

export default PortFeedback;
