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
import { default as JSG, MathUtils, RotateItemCommand, GraphUtils } from '@cedalo/jsg-core';
import AbstractInteraction from './AbstractInteraction';
import ConnectionController from '../controller/ConnectionController';
import SelectionFeedbackView from '../view/SelectionFeedbackView';
import GestureEvent from '../../ui/events/GestureEvent';

/**
 * Interaction to handle rotation of {{#crossLink "GraphItem"}}{{/crossLink}}s.</br>
 *
 * @class RotateInteraction
 * @extends AbstractInteraction
 * @constructor
 */
class RotateInteraction extends AbstractInteraction {
	constructor() {
		super();
		this._selectionpin = undefined;
		this._lastRotationAngle = 0;
		this._rotation = 0;
	}

	deactivate(viewer) {
		this._selectionpin = undefined;
		this._lastRotationAngle = 0;
		viewer.getSelectionView().setVisible(true);
		super.deactivate(viewer);
	}

	onRotateStart(event, viewer) {
		this.onMouseDown(event, viewer);
	}

	onRotateEnd(event, viewer) {
		this.onMouseUp(event, viewer);
	}

	onMouseDown(event, viewer) {
		const selectionView = viewer.getSelectionView();

		this._selectionpin = selectionView.getPinPoint();
		selectionView.setVisible(false);

		super.onMouseDown(event, viewer);
	}

	createActionFeedback(event, viewer) {
		const feedback = new SelectionFeedbackView(8);
		const selectionView = viewer.getSelectionView();
		feedback.setBoundingBox(selectionView.getBoundingBox());

		return feedback;
	}

	updateActionFeedback(event, viewer) {
		if (this.actionFeedback && this._rotation && this.feedback.length) {
			this.actionFeedback._box.rotateAroundPoint(this._selectionpin, this._rotation);
		}
	}

	updateFeedback(event, viewer, offset) {
		let angle = 0;

		if (event.type === GestureEvent.GestureEventType.ROTATE) {
			angle = MathUtils.toRadians(event.gesture.rotation);
		} else {
			angle = MathUtils.getAngleBetweenLines(this.startLocation, this.currentLocation, this._selectionpin);
		}

		let rotation = angle - this._lastRotationAngle;
		if (viewer.getGraphSettings().getSnapRotation() && !event.event.altKey) {
			let degrees = Math.floor(MathUtils.toDegrees(angle));
			degrees = Math.floor(degrees / RotateInteraction._ROTATION_STEP) * RotateInteraction._ROTATION_STEP;
			angle = MathUtils.toRadians(degrees);
			rotation = angle - this._lastRotationAngle;
		}

		// rotate feedback positions around selection pin:

		this.feedback.forEach((feedback) => {
			if (feedback.isRotatable() && rotation) {
				feedback.rotate(rotation, this._selectionpin);
				// JSG.debug.log(`item rotate: ${rotation}`);
			}
		});

		this._rotation = rotation;
		this._lastRotationAngle = angle;

		// var i, n, pin = JSG.ptCache.get();
		// for ( i = 0, n = this.feedback.length; i < n; i++) {
		//	if (this.feedback[i].isRotatable() && rotation) {
		//		var rotpin = viewer.getSelectionView().getPinPoint(pin, this.feedback[i]);
		//		this.feedback[i].rotate(rotation, rotpin); //, this._selectionpin);
		//		JSG.debug.log("item rotate: " + rotation);
		//	}
		// }
		// this._rotation = rotation;
		// this._lastRotationAngle = angle;
		// JSG.ptCache.release(pin);
	}

	getRotationPin(viewer) {
		const selectionProvider = viewer.getSelectionProvider();
		if (selectionProvider.hasSingleSelection()) {
			return JSG.isGroup(selectionProvider.getFirstSelection().getModel()) ? this._selectionpin : undefined;
		}
		return this._selectionpin;
	}

	willFinish(event, viewer, offset) {
		const angle = this._lastRotationAngle;
		const interactionHandler = this.getInteractionHandler();
		if (interactionHandler) {
			const selection = viewer.getSelection();
			const selectionView = viewer.getSelectionView();
			// var pin = selectionView.isSingleSelection() ? undefined : this._selectionpin;
			const pin = this.getRotationPin(viewer);
			const cmds = [];
			const items = []; // rotate connections first:

			selection.forEach((sel) => {
				if (sel.getModel().isRotatable()) {
					if (sel instanceof ConnectionController) {
						cmds.push(this._rotateConnectionCmd(sel, angle, pin, viewer));
					} else {
						items.push(sel);
					}
				}
			});
			items.forEach((item) => {
				cmds.push(this._rotateItemCmd(item, angle, pin, viewer));
			});

			const cmd = this._createCommand(cmds);
			cmd._rotangle = selectionView.getRotationAngle() + angle;
			interactionHandler.execute(cmd, this.executed);
		}
	}

	/**
	 * Creates a general rotate command for the GraphItem which is specified by given selected controller.<br/>
	 * See {{#crossLink "RotateInteraction/_rotateConnectionCmd"}}{{/crossLink}} too.
	 *
	 * @method _rotateItemCmd
	 * @param {ModelController} selectedController The controller of the item to rotate.
	 * @param {Number} angle The rotation angle in radiant.
	 * @param {Point} pin The pin location to rotate around.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {RotateItemCommand} The rotation command to use.
	 * @private
	 */
	_rotateItemCmd(controller, angle, pin, viewer) {
		const item = controller.getModel();
		pin = this._translatePin(pin, item);
		return new RotateItemCommand(item, angle, pin);
	}

	/**
	 * Creates a rotate command for the connection which is specified by given selected controller.<br/>
	 * See {{#crossLink "RotateInteraction/_rotateConnectionCmd"}}{{/crossLink}} too.
	 *
	 * @method _rotateConnectionCmd
	 * @param {ModelController} selectedController The controller of the item to rotate.
	 * @param {Number} angle The rotation angle in radiant.
	 * @param {Point} pin The pin location to rotate around.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {RotateItemCommand} The rotation command to use.
	 * @private
	 */
	_rotateConnectionCmd(controller, angle, pin, viewer) {
		const edge = controller.getModel();
		// we may have to detach before move...
		// if (controller.isAttached()) {
		// }
		pin = this._translatePin(pin, edge);
		return new RotateItemCommand(edge, angle, pin);
	}

	/**
	 * Translates the given pin location from Graph coordinate system to the coordinate system of given items parent.
	 *
	 * @method _translatePin
	 * @param {Point} pin The pin location to translate.
	 * @param {GraphItem} item The item to translate the pin to.
	 * @return {Point} The translated pin.
	 * @private
	 */
	_translatePin(pin, item) {
		if (pin) {
			// adjust pin, so that it is in same parent as selected controller!!
			pin = pin.copy(); // have to copy because pin depends on selected controller view...
			// viewer.translateFromRoot(pin, controller.getView().getParent())
			GraphUtils.traverseItemDown(item.getGraph(), item.getParent(), (model) => {
				model.translateFromParent(pin);
			});
		}
		return pin;
	}

	executed(command, viewer) {
		// restore current selection:
		const selectionView = viewer.getSelectionView();
		selectionView.setRotationAngle(command._rotangle);
		selectionView.setSelection(viewer.getSelection());
	}
	/**
	 * The rotation step value in degrees.
	 *
	 * @property _ROTATION_STEP
	 * @type {Number}
	 * @static
	 * @private
	 */
	static get _ROTATION_STEP() {
		return 5; // degrees...
	}
}

export default RotateInteraction;
