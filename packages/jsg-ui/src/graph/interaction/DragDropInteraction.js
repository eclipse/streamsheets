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
/* global document MouseEvent */

import { default as JSG, Point, DropItemCommand } from '@cedalo/jsg-core';
import AbstractInteraction from './AbstractInteraction';
import DropDelegate from './DropDelegate';
import LayerId from '../view/LayerId';
import ClientEvent from '../../ui/events/ClientEvent';

//= ================================================================================================
// sub interactions:
//
/**
 * Base class for internally used sub interactions.
 *
 * @class DragDropInteraction.DnD
 * @extends AbstractInteraction
 * @constructor
 * @param {ControllerViewer} viewer The ControllerViewer to use.
 */
class DnD extends AbstractInteraction {
	constructor(viewer) {
		super();
		this._viewer = viewer;
		this._feedback = undefined;
	}

	/**
	 * Returns the feedback view to use.
	 *
	 * @method getFeedback
	 * @return {View} The feedback view to use or <code>undefined</code>
	 */
	getFeedback() {
		return this._feedback;
	}

	/**
	 * Creates a feedback view. The kind of feedback is defined by the type of given GraphItem. Note that this can
	 * result in several feedbacks if the type requires several GraphItems. See {{#crossLink
	 * "DragDropInteraction.DnD/createFeedbackViewFor:method"}}{{/crossLink}} to create a
	 * feedback for a single GraphItem.
	 *
	 * @method createFeedback
	 * @param {GraphItem} draggedItem The GraphItem to create a feedback for.
	 * @return {View} The feedback view to use or <code>undefined</code>
	 */
	createFeedback(draggedItem) {
		this.clearFeedbacksAndHighlights();
		let nodes;
		let feedback; // currently only single DnD interaction...
		const type = draggedItem.getType().getValue();
		const item = JSG.graphItemFactory.createItemFromString(type);

		if (item) {
			nodes = [];
			nodes.push(item);
		} else {
			nodes = JSG.graphItemFactory.createShape(type);
		}

		if (nodes && nodes.length > 0) {
			feedback = this.createFeedbackViewFor(nodes[0], this._viewer);
		}
		this._feedback = feedback;
		return feedback;
	}

	/**
	 * Creates a feedback view for a single given GraphItem.
	 *
	 * @method createFeedback
	 * @param {GraphItem} item The GraphItem to create a feedback for.
	 * @param {ControllerViewer} viewer The ControllerViewer to use for feedback creation.
	 * @return {View} The feedback view to use or <code>undefined</code>
	 */
	createFeedbackViewFor(item, viewer) {
		const tmpController = viewer.getControllerFactory().createController(item);
		tmpController.getViewer = () => viewer;
		tmpController.refresh();
		// item may consist of sub-items...
		const feedback = tmpController.getView();
		tmpController.deactivate();
		// tmpController no longer needed...
		return feedback;
	}

	/**
	 * Clears all feedback and highlight layers.
	 *
	 * @method clearFeedbacksAndHighlights
	 */
	clearFeedbacksAndHighlights() {
		const graphView = this._viewer.getGraphView();

		this._viewer.clearLayer(LayerId.LAYOUTMARKER);
		this._viewer.clearLayer(LayerId.TARGETCONTAINER);
		this._viewer.clearLayer(LayerId.SNAPLINES);

		graphView.clearFeedback();
	}

	onMouseDown(event, viewer) {
		if (this._feedback) {
			const position = this.startLocation.copy();
			this._viewer.translateFromParent(position);
			this._feedback.getItem().setPinPointTo(position);
			this._viewer.getGraphView().addFeedback(this._feedback);
		}
	}

	/**
	 * Returns the position of given event relative to given canvas.
	 *
	 * @method getPosition
	 * @param {ClientEvent} event The current event which provides location.
	 * @param {CoordinateSystem} cs The CoordinateSystem to use for translating event location.
	 * @param {Canvas} canvas The HTML5 canvas element.
	 * @param {boolean} drag Flag to indicate, whether the function is called from the drag or drop operation
	 * @return {Point} The event position relative to given canvas.
	 */
	getPosition(event, cs, canvas, drag) {
		let pos;

		function getRelativeCoords(levent) {
			if (levent.offsetX !== undefined && levent.offsetY !== undefined) {
				return {
					x: levent.offsetX,
					y: levent.offsetY
				};
			}
			if (levent.offsetX !== undefined && levent.offsetY !== undefined) {
				return {
					x: levent.layerX,
					y: levent.layerY
				};
			}
			return {
				x: 0,
				y: 0
			};
		}

		let canvasRectTrg;
		let canvasRectSrc;

		if (!(event.event instanceof MouseEvent) && event.gesture && event.gesture.pointers.length) {
			const touch = event.gesture.pointers[0];
			const target = document.elementFromPoint(touch.clientX, touch.clientY);

			canvasRectSrc = canvas.getBoundingClientRect();

			pos = getRelativeCoords(event.event);
			pos.x = touch.clientX - canvasRectSrc.left;
			pos.y = touch.clientY - canvasRectSrc.top;

			if (event.gesture.target.id !== canvas.id) {
				canvasRectTrg = target.getBoundingClientRect();

				pos.x += canvasRectSrc.left - canvasRectTrg.left;
				pos.y += canvasRectSrc.top - canvasRectTrg.top;
			}
		} else if (event.event.clientX && event.event.clientY) {
			pos = getRelativeCoords(event.event);

			if (event.event.target.id !== canvas.id) {
				if (drag) {
					canvasRectSrc = event.event.target.getBoundingClientRect();
					canvasRectTrg = event.canvasRect;
				} else {
					canvasRectTrg = canvas.getBoundingClientRect();
					canvasRectSrc = event.canvasRect;
				}

				pos.x += canvasRectSrc.left - canvasRectTrg.left;
				pos.y += canvasRectSrc.top - canvasRectTrg.top;
			}

			ClientEvent.currentLocation.set(pos.x, pos.y);
		} else if (ClientEvent.currentLocation.x && ClientEvent.currentLocation.y) {
			pos = new Point(ClientEvent.currentLocation.x, ClientEvent.currentLocation.y);
		}

		return cs.deviceToLogPoint(pos);
	}

	/**
	 * Called to finish this interaction.
	 *
	 * @method finished
	 * @param {ControllerViewer} viewer The ControllerViewer for this interaction.
	 */
	finished(viewer) {}

	deactivate(viewer) {
		this.clearFeedbacksAndHighlights();
	}
}

/**
 * The drag interaction.
 *
 * @class Drag
 * @extends DragDropInteraction.DnD
 * @constructor
 * @param {ControllerViewer} srcViewer The ControllerViewer to use for this interaction.
 */
class Drag extends DnD {
	constructor(srcViewer, mainInteraction) {
		super(srcViewer);
		// TODO: check if placing these lines after super() does not have any sideeffects
		this._srcCanvas = srcViewer.getGraphicSystem().getCanvas();
		this._mainInteraction = mainInteraction;
	}

	createFeedback(draggedItem) {
		this.clearFeedbacksAndHighlights();
		this._feedback = this.createFeedbackViewFor(draggedItem.copy(), this._viewer);
		const size = draggedItem.getSizeAsPoint();
		this._feedback.getItem().setSize(size.x, size.y);
	}

	updateFeedback(event, viewer, offset) {
		// var position = this.currentLocation.copy();
		const position = this.getPosition(event, this._viewer.getCoordinateSystem(), this._srcCanvas, true);
		this._viewer.translateFromParent(position);
		// move feedback:
		this._feedback.getItem().setPinPointTo(position);
	}
}

/**
 * The actual drop interaction.<br/>
 * This interaction uses a {{#crossLink "DropDelegate"}}{{/crossLink}} which can be subclassed
 * to customize the drop behavior. A delegate can be registered either by using
 * {{#crossLink "DragDropInteraction.Drop/setDelegate:method"}}{{/crossLink}} on this interaction
 * or by calling {{#crossLink "DragDropInteraction/setDropDelegate:method"}}{{/crossLink}} on the
 * main interaction.
 *
 * @class DragDropInteraction.Drop
 * @extends DragDropInteraction.DnD
 * @constructor
 * @param {ControllerViewer} trgtViewer The ControllerViewer to use for this interaction.
 * @param {DragDropInteraction} mainInteraction The main DragDropInteraction.
 */
class Drop extends DnD {
	constructor(trgtViewer, mainInteraction) {
		super(trgtViewer);
		this._dropItem = undefined;
		this._targetEditor = undefined;
		this._targetController = undefined;
		this._mainInteraction = mainInteraction;
		this._delegate = new DropDelegate();
	}

	/**
	 * Returns the registered target editor or <code>undefined</code>.
	 *
	 * @method getTarget
	 * @return {GraphEditor} The GraphEditor to use as drop target or <code>undefined</code>.
	 */
	getTarget() {
		return this._targetEditor;
	}

	/**
	 * Registers the editor to use as drop target.
	 *
	 * @method setTarget
	 * @param {GraphEditor} editor The GraphEditor to use as drop target.
	 */
	setTarget(editor) {
		this._targetEditor = editor;
		this._trgtCanvas = document.getElementById(editor.getCanvasId());
		this.setInteractionHandler(editor.getInteractionHandler());
	}

	/**
	 * Returns the target viewer registered to this interaction.
	 *
	 * @method getViewer
	 * @return {ControllerViewer} The ControllerViewer to use for this interaction.
	 */
	getViewer() {
		return this._viewer;
	}

	getDropItem() {
		return this._dropItem;
	}

	/**
	 * Sets the drop delegate for this interaction.</br>
	 *
	 * @method setDelegate
	 * @param {DropDelegate} delegate A delegate object to customize interaction.
	 */
	setDelegate(delegate) {
		if (delegate instanceof DropDelegate) {
			this._delegate = delegate;
		}
	}

	// overwritten to pass feedback creation to delegate...
	createFeedbackViewFor(item, viewer) {
		this._dropItem = item;
		this._delegate.getSnapHelper().init(viewer);
		return this._delegate.createFeedback(this, undefined, viewer);
	}

	// overwritten to pass feedback update to delegate...
	updateFeedback(event, viewer, offset) {
		const position = this.getPosition(event, this._viewer.getCoordinateSystem(), this._trgtCanvas, false);
		this._viewer.translateFromParent(position);
		this._delegate.updateFeedback(this, position, event, this._viewer);
		this._feedback.setVisible(this.isDropOk(event, viewer));
		// DON'T: must be done by client app...this.setCursor(isDropOk ? Cursor.Style.AUTO :
		// Cursor.Style.DENY);
		this._targetEditor.repaint();
	}

	/**
	 * Checks if it is allowed to drop dragged <code>GraphItem</code> for current event.</br>
	 *
	 * @method isDropOk
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} The target <code>ControllerViewer</code>.
	 * @return {Boolean} Returns <code>true</code> if drop is ok, <code>false</code> otherwise.
	 */
	isDropOk(event, viewer) {
		const element = document.elementFromPoint(ClientEvent.windowLocation.x, ClientEvent.windowLocation.y);
		// if (element && element.nodeName.toLowerCase() === 'canvas' && element._jsgEditor) {
		const targetId = element ? element.id : undefined;
		return this._trgtCanvas.id === targetId;
	}

	/**
	 * Performs the drop.
	 *
	 * @method drop
	 * @param {ClientEvent} event The current event.
	 * @return {Boolean} <code>true</code> if drop was done, <code>false</code> otherwise.
	 */
	drop(event) {
		const isDropOk = this.isDropOk(event, this._viewer);

		function execute(cmd, interactionHandler) {
			if (cmd && interactionHandler) {
				interactionHandler.execute(cmd);
			}
		}

		if (isDropOk) {
			const cmd = this._delegate.createCommand(this, event, this._viewer);
			execute(cmd, this.getInteractionHandler());
		}
		return isDropOk;
	}

	deactivate(viewer) {
		this._dropItem = undefined;
		this._targetEditor = undefined;
		this._targetController = undefined;
		this._delegate.getSnapHelper().release(viewer);
		this._delegate.deactivate(this, this._viewer);
		super.deactivate(viewer);
	}
}


/**
 * Interaction to handle drag & drop from a {{#crossLink "ShapeLibrary"}}{{/crossLink}}
 * to a {{#crossLink "GraphEditor"}}{{/crossLink}}. This interaction is separated into
 * two different interactions, namely <code>DragInteraction</code> and <code>DropInteraction</code>.
 * In most cases it is never required to use or overwrite on of these sub-interactions.</br></br>
 * <b>Delegate support</b></br> The <code>DropInteraction</code> supports a delegate object which
 * can be set via {{#crossLink "DragDropInteraction/setDropDelegate:method"}}{{/crossLink}}. The
 * passed delegate must be an instance of {{#crossLink "DropDelegate"}}{{/crossLink}}.
 *
 * @class DragDropInteraction
 * @extends AbstractInteraction
 * @constructor
 * @param {ControllerViewer} srcViewer The ControllerViewer where the drag started.
 * @param {ControllerViewer} trgtViewer The ControllerViewer where the drop should be performed.
 */
class DragDropInteraction extends AbstractInteraction {
	constructor(srcViewer, trgtViewer) {
		super();
		this._dragInteraction = new Drag(srcViewer, this);
		this._dropInteraction = new Drop(trgtViewer, this);
	}

	/**
	 * Called by corresponding {{#crossLink "DragDropActivator"}}{{/crossLink}} to register the
	 * dragged GraphItem
	 *
	 * @method setDraggedItem
	 * @param {GraphItem} draggedItem The GraphItem to drag.
	 */
	setDraggedItem(draggedItem) {
		this._dragInteraction.createFeedback(draggedItem);
		this._dropInteraction.createFeedback(draggedItem);
	}

	/**
	 * Sets a new drop delegate to inner <code>DropInteraction</code>
	 *
	 * @method setDropDelegate
	 * @param {DropDelegate} delegate The new drop delegate to use.
	 */
	setDropDelegate(delegate) {
		this._dropInteraction.setDelegate(delegate);
	}

	/**
	 * Registers the GraphEditor to perform the drop to.
	 *
	 * @method registerTargetEditor
	 * @param {GraphEditor} The GraphEditor to use as drop target.
	 */
	registerTargetEditor(trgtEditor) {
		this._dropInteraction.setTarget(trgtEditor);
	}

	/**
	 * Updates the start and current locations to inner {{#crossLink
	 * "Drag"}}{{/crossLink}} and {{#crossLink
	 * "DragDropInteraction.Drop"}}{{/crossLink}} interactions.
	 *
	 * @method _updatePositions
	 * @private
	 */
	_updatePositions() {
		this._dragInteraction.startLocation = this.startLocation;
		this._dragInteraction.currentLocation = this.currentLocation;
		this._dropInteraction.startLocation = this.startLocation;
		this._dropInteraction.currentLocation = this.currentLocation;
	}

	onMouseDown(event, viewer) {
		JSG.keepFocus = true;
		this._updatePositions();
		this._dragInteraction.onMouseDown(event, viewer);
		this._dropInteraction.onMouseDown(event, viewer);
	}

	updateFeedback(event, viewer, offset) {
		this._updatePositions();
		this._dragInteraction.updateFeedback(event, viewer, offset);
		this._dropInteraction.updateFeedback(event, viewer, offset);
	}

	onMouseUp(event, viewer) {
		this.updateFeedback(event, viewer, new Point(0, 0));
		const dropOk = this._dropInteraction.drop(event);
		this.finished(viewer);
		if (dropOk) {
			this.activateTextEditor();
			event.consume();
		}
	}

	/**
	 * Activates an optional text editor on a mouse up event.<br/>
	 * Subclasses may overwrite. Default implementation does nothing.
	 *
	 * @method activateTextEditor
	 */
	activateTextEditor() {}

	/**
	 * Called to finish this interaction.
	 *
	 * @method finished
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	finished(viewer) {
		JSG.keepFocus = false;
		const target = this._dropInteraction.getTarget();

		function setDefaultInteractionOf(interactionHandler) {
			interactionHandler.setActiveInteraction(interactionHandler.getDefaultInteraction());
		}

		this._dragInteraction.finished(viewer);
		this._dropInteraction.finished(viewer);
		setDefaultInteractionOf(this.getInteractionHandler());
		setDefaultInteractionOf(target.getInteractionHandler());
		target.repaint();
	}

	cancelInteraction(event, viewer) {
		this.finished(viewer);
		if (event) {
			event.doRepaint = true;
		}
	}

	deactivate(viewer) {
		JSG.keepFocus = false;
		this._dragInteraction.deactivate(viewer);
		this._dropInteraction.deactivate(viewer);
		this._dragInteraction = undefined;
		this._dropInteraction = undefined;
	}

	/**
	 * Creates the DropItemCommand.
	 *
	 * @method createDropCommand
	 * @param {GraphItem} item The GraphItem to drop.
	 * @param {ModelController} targetController A possible container controller to drop into.
	 * @param {GraphEditor} targetEditor The GraphEditor to use as drop target.
	 * @return {DropItemCommand} The DropItemCommand to use for perfoming the drop or
	 *     <code>undefined</code>.
	 */
	createDropCommand(item, targetController, targetEditor) {
		const type = item.getType().getValue();
		const options = {
			libId: type,
			libName: type,
			newPinPoint: item.getPinPoint(),
			target: targetController,
			editor: targetEditor
		};
		return type ? new DropItemCommand(options) : undefined;
	}
}

export default DragDropInteraction;
