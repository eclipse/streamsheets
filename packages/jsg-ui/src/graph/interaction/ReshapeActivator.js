import { default as JSG } from '@cedalo/jsg-core';
import InteractionActivator from './InteractionActivator';
import ReshapeInteraction from './ReshapeInteraction';
import SelectionHandle from '../view/selection/SelectionHandle';

/**
 * An InteractionActivator used to activate a {{#crossLink "ReshapeInteraction"}}{{/crossLink}}.
 *
 * @class ReshapeActivator
 * @extends InteractionActivator
 * @constructor
 */
class ReshapeActivator extends InteractionActivator {
	getKey() {
		return ReshapeActivator.KEY;
	}

	/**
	 * Implemented to be notified about mouse down events.</br>
	 * This will activate the corresponding {{#crossLink "ReshapeInteraction"}}{{/crossLink}}.
	 *
	 * @method onMouseDown
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 */
	onMouseDown(event, viewer, dispatcher) {
		if (this.isDisposed === false) {
			const activeHandle = dispatcher.getActiveHandle();
			if (activeHandle && activeHandle.getType() === SelectionHandle.TYPE.RESHAPE) {
				const interaction = this.activateInteraction(
					new ReshapeInteraction(activeHandle),
					dispatcher
				);
				interaction.onMouseDown(event, viewer);
				event.hasActivated = true;
			}
		}
	}

	/**
	 * The unique key under which this activator is registered to {{#crossLink
	 * "GraphInteraction"}}{{/crossLink}}.
	 *
	 * @property KEY
	 * @type {String}
	 * @static
	 */
	static get KEY() {
		return 'reshape.activator';
	}
}


export default ReshapeActivator;
