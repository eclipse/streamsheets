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
