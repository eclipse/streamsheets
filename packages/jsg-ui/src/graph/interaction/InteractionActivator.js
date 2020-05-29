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

/**
 * InteractionActivators are used by {{#crossLink "InteractionDispatcher"}}{{/crossLink}}s
 * to trigger different {{#crossLink "Interaction"}}{{/crossLink}}s. The activator is responsible
 * for activating its corresponding interaction. That means that all the logic to decide if an interaction should
 * become active or not is encapsulated inside the activator. Furthermore the activator is a good place to add
 * additional views when its InteractionDispatcher is still the active interaction.</br>
 * In order to be notified by an InteractionDispatcher the InteractionActivator has to implement
 * the corresponding Interaction methods. The dispatcher calls this methods with an additional
 * parameter, namely the InteractionDispatcher itself.</br>
 *
 * @example
 *    var myActivator.onMouseDown = function(event, viewer, dispatcher) {
 *		//... do some stuff
 *	};
 *
 * @class InteractionActivator
 * @constructor
 */
class InteractionActivator {
	constructor() {
		this.isDisposed = false;
	}

	/**
	 * Activates given Interaction.<br/>
	 * To give subclasses the opportunity to easily activate a custom interaction it is recommended to create the
	 * interaction to be activated by calling {{#crossLink
	 * "InteractionActivator/createInteraction:method"}}{{/crossLink}}.
	 *
	 * @method activateInteraction
	 * @param {Interaction} interaction The interaction to activate.
	 * @param {Interaction} oldInteraction The current interaction, e.g. the
	 *     InteractionDispatcher.
	 * @return {Interaction} The activated interaction as convenience.
	 */
	activateInteraction(interaction, oldInteraction) {
		const interactionHandler = oldInteraction.getInteractionHandler();
		if (interactionHandler) {
			interaction.setStartLocation(oldInteraction.startLocation);
			interaction.setCurrentLocation(oldInteraction.currentLocation);
			interactionHandler.setActiveInteraction(interaction);
		}
		return interaction;
	}

	/**
	 * Creates the interaction object to activate.<br/>
	 * This method is intended to be overwritten by subclasses. Default implementation simply returns
	 * <code>undefined</code>. See {{#crossLink
	 * "InteractionActivator/activateInteraction:method"}}{{/crossLink}} too. <br/> Note: the
	 * default method takes no parameter but subclasses are allowed to do so in order to create an interaction
	 * depending on passed data.
	 *
	 * @method createInteraction
	 * @return {Interaction} The interaction to activate.
	 * @since 1.6.0
	 */
	createInteraction() {}

	/**
	 * Called by InteractionDispatcher on activation.</br>
	 * <b>Note:</b> subclasses can overwrite this method to perform special initialization tasks, but
	 * should call this superclass method.
	 *
	 * @method init
	 * @param {ControllerViewer} viewer The controller viewer on which the interaction happens.
	 */
	init(viewer) {
		this.isDisposed = false;
	}

	/**
	 * Called by InteractionDispatcher on deactivation.</br>
	 * <b>Note:</b> subclasses can overwrite this method to perform special tasks, but
	 * should call this superclass method.
	 *
	 * @method dispose
	 * @param {ControllerViewer} viewer The controller viewer on which the interaction happens.
	 */
	dispose(viewer) {
		this.isDisposed = true;
	}

	/**
	 * Returns the unique key of this InteractionActivator.</br>
	 * This method is intended to be overwritten by subclasses. Default implementation simply returns
	 * an empty String.
	 *
	 * @method getKey
	 * @return {String} A unique key string for this InteractionActivator.
	 */
	getKey() {
		return '';
	}

	isResizeHandle(viewer, event) {
		if (viewer.hasSelection()) {
			const loc = JSG.ptCache.get().setTo(event.location);
			viewer.translateFromParent(loc);
			const handle = viewer.getHandleAt(loc, event);
			JSG.ptCache.release(loc);
			return handle !== undefined && handle.getType() === 'resize';
		}

		return false;
	}
}

export default InteractionActivator;
