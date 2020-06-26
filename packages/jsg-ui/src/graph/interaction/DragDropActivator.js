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
import { default as JSG, Shape } from '@cedalo/jsg-core';
import InteractionActivator from './InteractionActivator';
import GraphController from '../controller/GraphController';
import DragDropInteraction from './DragDropInteraction';

/**
 * An InteractionActivator used to activate a {{#crossLink "DragDropInteraction"}}{{/crossLink}}.
 *
 * @class DragDropActivator
 * @extends InteractionActivator
 * @constructor
 */
class DragDropActivator extends InteractionActivator {
	constructor() {
		super();
		this._controller = undefined;
	}

	/**
	 * Provides the target editor, i.e. the GraphEditor to perform the drop to.<br/>
	 * Subclasses should overwrite! Default implementation simply returns <code>undefined</code>.
	 *
	 * @method getTargetEditor
	 * @return {GraphEditor} The GraphEditor to use as drop target.
	 */
	getTargetEditor() {
		return undefined;
	}

	dispose(viewer) {
		super.dispose(viewer);
		JSG.keepFocus = false;
		this._controller = undefined;
	}

	/**
	 * Implemented to be notified about mouse down.
	 *
	 * @method onMouseDown
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator belongs.
	 */
	onMouseDown(event, viewer, dispatcher) {
		if (this.isDisposed === false) {
			JSG.keepFocus = true;
			const controller = viewer.filterFoundControllers(Shape.FindFlags.AREA);
			// const controller = dispatcher.getControllerAt(event.location);
			if (controller && !(controller instanceof GraphController)) {
				const targetEditor = this.getTargetEditor();
				if (targetEditor) {
					const trgtViewer = targetEditor.getGraphViewer();
					if (trgtViewer) {
						trgtViewer.clearSelection();
					}
				}
				viewer.clearSelection();
				this._controller = controller;
			}
		}
	}

	/**
	 * Implemented to be notified about mouse up.
	 *
	 * @method onMouseUp
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator belongs.
	 */
	onMouseUp(event, viewer, dispatcher) {
		if (this.isDisposed === false) {
			JSG.keepFocus = false;
		}
	}

	/**
	 * Implemented to be notified about mouse drag.
	 *
	 * @method onMouseDrag
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator belongs.
	 */
	onMouseDrag(event, viewer, dispatcher) {
		if (this.isDisposed === false) {
			const item = this._controller ? this._controller.getModel() : undefined;
			const targetEditor = this.getTargetEditor();
			if (item && item.getType().getValue() !== '' && targetEditor) {
				const trgtViewer = targetEditor.getGraphViewer();
				const interaction = this.activateInteraction(this.createInteraction(viewer, trgtViewer), dispatcher);
				interaction.setDraggedItem(item);
				interaction.registerTargetEditor(targetEditor);
				interaction.onMouseDown(event, viewer);
			}
		}
	}

	/**
	 * Creates the DragDropInteraction to activate.<br/>
	 * Subclasses can overwrite to return a custom DragDropInteraction.
	 *
	 * @method createInteraction
	 * @param {ControllerViewer} sourceViewer The ControllerViewer where the drag started.
	 * @param {ControllerViewer} targetViewer The ControllerViewer where the drop should be performed.
	 * @return {DragDropInteraction} The DragDropInteraction to activate.
	 */
	createInteraction(sourceViewer, targetViewer) {
		return new DragDropInteraction(sourceViewer, targetViewer);
	}

	/**
	 * The unique key under which this activator is registered to an instance of {{#crossLink
	 * "Interaction"}}{{/crossLink}}.
	 *
	 * @property KEY
	 * @type {String}
	 * @static
	 */
	static get KEY() {
		return 'dnd.activator';
	}
}


export default DragDropActivator;
