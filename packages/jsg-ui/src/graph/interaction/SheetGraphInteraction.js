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

import GraphInteraction from './GraphInteraction';

/**
 *
 * @class SheetGraphInteraction
 * @extends GraphInteraction
 * @constructor
 */
export default class SheetGraphInteraction extends GraphInteraction {
	/**
	 * Overwritten to register own Activators.
	 *
	 * @method registerActivators
	 */
	registerActivators() {
		super.registerActivators();
	}

	handleContextMenu(/* event, viewer */) {}

	_sheetCondition(/* controller */) {
	}

	onMouseDoubleClick(event, viewer) {
		// if ((JSG.application.getState() & JSG.MachineApplication.State.RUNNING)) {
		// 	return;
		// }
		//
		super.onMouseDoubleClick(event, viewer);
	}

	onMouseMove(event, viewer) {
		// if ((JSG.application.getState() & JSG.MachineApplication.State.RUNNING)) {
		// 	return;
		// }
		//
		super.onMouseMove(event, viewer);
	}

	onMouseDown(/* event, viewer */) {
	}

	onMouseUp(event, viewer) {
		// if ((JSG.application.getState() & JSG.MachineApplication.State.RUNNING)) {
		// 	return;
		// }
		super.onMouseUp(event, viewer);
	}
}
