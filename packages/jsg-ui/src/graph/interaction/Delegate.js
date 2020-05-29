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
 * This class is a general interface description for delegate objects which are used within feedback based
 * {{#crossLink "Interaction"}}{{/crossLink}}s.<br/>
 * Interactions use delegates to allow customization of behavior or look without the need to subclass complete
 * interaction. That means the base interaction behavior is defined by the interaction itself and only small sub tasks
 * of it can be influenced by delegates. Please refer to the documentation of an interaction to see if it supports a
 * delegate and how it should work.<br/>
 * <b>Note:</b> interactions which are based on feedback must provide a <code>getFeedback</code> method which returns
 * the used feedback.
 *
 * @class Delegate
 * @constructor
 */
class Delegate {
	/**
	 * Called when an interaction is activated.<br/>
	 *
	 * @method activate
	 * @param {Interaction} interaction The interaction which uses this delegate.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	activate(interaction, viewer) {}

	/**
	 * Called when an interaction is deactivated.<br/>
	 *
	 * @method deactivate
	 * @param {Interaction} interaction The interaction which uses this delegate.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	deactivate(interaction, viewer) {}

	/**
	 * Creates a view to use as feedback for calling interaction.<br/>
	 * <b>Note:</b> the calling interaction should store a reference to the returned feedback view and must provide a
	 * <code>getFeedback</code> method to access it again.
	 *
	 * @method createFeedback
	 * @param {Interaction} interaction The interaction which uses this delegate.
	 * @param {ClientEvent} event The current event which triggered the feedback update.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {View} A view to be used as feedback for calling interaction.
	 */
	createFeedback(interaction, event, viewer) {}

	/**
	 * Called to update the interaction feedback by applying passed data.<br/>
	 * Note: the content of the data object depends on the Interaction which calls this method. E.g. a
	 * {{#crossLink "MoveInteraction"}}{{/crossLink}} calls this method with the new feedback
	 * location.
	 *
	 * @method updateFeedback
	 * @param {Interaction} interaction The interaction which uses this delegate.
	 * @param {Object} data The data to use for updating the feedback, depends on calling Interaction.
	 * @param {ClientEvent} event The current event which triggered the feedback update.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	updateFeedback(interaction, data, event, viewer) {}

	/**
	 * Creates a command for the interaction to perform.<br/>
	 *
	 * @method createCommand
	 * @param {Interaction} interaction The interaction which uses this delegate.
	 * @param {ClientEvent} event The current event which triggered the feedback update.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	createCommand(interaction, event, viewer) {}
}

export default Delegate;
