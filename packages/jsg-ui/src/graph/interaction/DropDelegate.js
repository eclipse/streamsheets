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
import { default as JSG, DropItemCommand, Shape, Point } from '@cedalo/jsg-core';
import Delegate from './Delegate';
import SnapHelper from './SnapHelper';
import ConnectionController from '../controller/ConnectionController';
import GraphController from '../controller/GraphController';
import PortController from '../controller/PortController';
import Highlighter from './Highlighter';
import LayerId from '../view/LayerId';
import Cursor from '../../ui/Cursor';

/**
 * The default delegate object for <code>Drop</code> of
 * {{#crossLink "DragDropInteraction"}}{{/crossLink}}.
 *
 * @class DropDelegate
 * @extends Delegate
 * @constructor
 */
class DropDelegate extends Delegate {
	constructor() {
		super();
		this._snaphelper = undefined;
		this._targetController = undefined;
	}

	/**
	 * Gets the registered <code>SnapHelper</code> object which is used to support snap alignment.
	 *
	 * @method getSnapHelper
	 * @return {SnapHelper} The currently used <code>SnapHelper</code>.
	 */
	getSnapHelper() {
		this._snaphelper = this._snaphelper || SnapHelper.getDefault();
		return this._snaphelper;
	}

	/**
	 * Registers a new <code>SnapHelper</code> object to support snap alignment.
	 *
	 * @method setSnapHelper
	 * @param {SnapHelper} snaphelper The <code>SnapHelper</code> to use.
	 */
	setSnapHelper(snaphelper) {
		this._snaphelper = snaphelper;
	}

	createFeedback(interaction, event, viewer) {
		const item = interaction.getDropItem();
		const tmpController = viewer.getControllerFactory().createController(item);

		tmpController.getViewer = () => viewer;
		tmpController.refresh();
		// item may consist of sub-items...
		const feedback = tmpController.getView();
		tmpController.deactivate();
		// tmpController no longer needed...
		return feedback;
	}

	updateFeedback(interaction, data, event, viewer) {
		// update feedback
		const offset = JSG.ptCache.get();
		const feedback = interaction.getFeedback();
		feedback.getItem().setPinPointTo(data);
		// first check for snap:
		this.alignToSnapLines(interaction, event, viewer, offset);
		if (offset.lengthSquared() > 1) {
			// we snapped in at least x or y direction -> align to grid in other...
			if (Math.abs(offset.x) < 1) {
				this._alignToGridHV(interaction, event, viewer, false);
			} else if (Math.abs(offset.y) < 1) {
				this._alignToGridHV(interaction, event, viewer, true);
			}
		} else {
			// align to grid
			this.alignToGrid(interaction, event, viewer);
		}
		// highlight target...
		this.highlightDropTarget(interaction, event, viewer);
		JSG.ptCache.release(offset);
	}

	/**
	 * Called by {{#crossLink "Delegate/updateFeedback:method"}}{{/crossLink}} to align the
	 * feedback according to the current grid settings
	 *
	 * @method alignToGrid
	 * @param {Interaction} interaction The interaction which uses this delegate.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by interaction.
	 */
	alignToGrid(interaction, event, viewer) {
		const feedback = interaction.getFeedback();
		const position = feedback.getItem().getPinPoint(JSG.ptCache.get());
		const offset = this._alignToGrid(interaction, event, viewer, JSG.ptCache.get());
		feedback.getItem().setPinPointTo(position.add(offset));
		JSG.ptCache.release(offset, position);
	}

	_alignToGridHV(interaction, event, viewer, alignVertical) {
		const feedback = interaction.getFeedback();
		const position = feedback.getItem().getPinPoint(JSG.ptCache.get());
		const offset = this._alignToGrid(interaction, event, viewer, JSG.ptCache.get());
		offset.x = alignVertical ? 0 : offset.x;
		offset.y = alignVertical ? offset.y : 0;
		feedback.getItem().setPinPointTo(position.add(offset));
		JSG.ptCache.release(offset, position);
	}

	_alignToGrid(interaction, event, viewer, reusepoint) {
		const feedback = interaction.getFeedback();
		const bbox = feedback.getBoundingBox(JSG.boxCache.get());
		const offset = interaction.alignBBoxToGrid(bbox, event, viewer, reusepoint);
		JSG.boxCache.release(bbox);
		return offset;
	}

	/**
	 * Called by {{#crossLink "Delegate/updateFeedback:method"}}{{/crossLink}} to add snap-lines
	 * to the graph view and aligns given feedback to visible snap-lines.<br/> Note: this uses the registered
	 * {{#crossLink "SnapHelper"}}{{/crossLink}}.
	 *
	 * @method alignToSnapLines
	 * @param {Interaction} interaction The interaction which uses this delegate.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by interaction.
	 * @param {Point} [reusepoint] An optional point to reuse for returned offset. If not provided a new
	 *     one will be created.
	 * @return {Point} Returns an offset to used to align feedback location.
	 */
	alignToSnapLines(interaction, event, viewer, reusepoint) {
		const offset = reusepoint || new Point(0, 0);
		const snaphelper = this.getSnapHelper();
		viewer.clearLayer(LayerId.SNAPLINES);
		if (this.doSnap(interaction, event, viewer)) {
			const feedback = interaction.getFeedback();
			const fbpin = feedback.getItem().getPinPoint(JSG.ptCache.get());
			const fbbox = feedback.getBoundingBox(JSG.boxCache.get());
			snaphelper.snapToBBox(fbbox, undefined, viewer, offset);
			feedback.getItem().setPinPointTo(fbpin.add(offset));
			JSG.ptCache.release(fbpin);
			JSG.boxCache.release(fbbox);
		}
		return offset;
	}

	/**
	 * Called by {{#crossLink "DropDelegate/alignToSnapLines:method"}}{{/crossLink}} to check if
	 * snap alignment should be done. Snap align is only performed if {{#crossLink
	 * "SnapHelper/doSnap:method"}}{{/crossLink}} returns <code>true</code> and if the dragged
	 * feedback is visible within current displayed graph region.<br/>
	 *
	 * @method doSnap
	 * @param {Interaction} interaction The interaction which uses this delegate.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by interaction.
	 * @return {Boolean} <code>true</code> if snap alignment should be done, <code>false</code> otherwise.
	 */
	doSnap(interaction, event, viewer) {
		const snaphelper = this.getSnapHelper();
		let snap = snaphelper.doSnap(event, viewer);
		if (snap) {
			// check if feedback is visible:
			const vrect = viewer.getVisibleGraphRect(JSG.rectCache.get());
			const feedback = interaction.getFeedback();
			const fbbox = feedback.getBoundingBox(JSG.boxCache.get());
			snap = vrect.intersectedByBBox(fbbox);
			JSG.boxCache.release(fbbox);
			JSG.rectCache.release(vrect);
		}
		return snap;
	}

	/**
	 * Highlights a possible drop target controller or possible insert position. This may adds visual feedbacks to the
	 * {{#crossLink "LayerId/LAYOUTMARKER:property"}}{{/crossLink}} or {{#crossLink
	 * "LayerId/TARGETCONTAINER:property"}}{{/crossLink}} layers of current {{#crossLink
	 * "GraphView"}}{{/crossLink}}.<br/>
	 *
	 * @method highlightDropTarget
	 * @param {Interaction} interaction The interaction which uses this delegate.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by interaction.
	 */
	highlightDropTarget(interaction, event, viewer) {
		const feedback = interaction.getFeedback();
		viewer.clearLayer(LayerId.LAYOUTMARKER);
		viewer.clearLayer(LayerId.TARGETCONTAINER);

		this._targetController = this.findTargetController(feedback, event, viewer);
		if (this._targetController) {
			this.highlightTargetController(this._targetController, feedback, event, viewer);
		} else {
			const controller = viewer.getGraphController();
			if (!controller.getModel().isContainer()) {
				interaction.setCursor(Cursor.Style.DENY);
			}
		}
	}

	/**
	 * Tries to find a suited drop target controller.<br/>
	 * To find a valid controller a condition function is used which should be returned by
	 * {{#crossLink "DropDelegate/getFindCondition:method"}}{{/crossLink}}. Note: the given
	 * feedback is added as a <code>feedback</code> property to the condition function object so it is available within
	 * the condition too.
	 *
	 * @method findTargetController
	 * @param {View} feedback The currently used feedback view.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by interaction.
	 * @return {ModelController} A valid controller or <code>undefined</code>
	 */
	findTargetController(feedback, event, viewer) {
		const fbItem = feedback.getItem();
		const position = fbItem.getPinPoint(JSG.ptCache.get());
		const condition = this.getFindCondition();

		condition.feedback = feedback;
		viewer.translateToParent(position);

		const controller = viewer.filterFoundControllers(Shape.FindFlags.AREA, condition.bind(this));

		JSG.ptCache.release(position);
		condition.feedback = undefined;
		return controller;
	}

	/**
	 * Returns a condition function used to find a suited drop target controller.<br/>
	 * The returned function is called with currently visited {{#crossLink
	 * "ModelController"}}{{/crossLink}} and the function object itself gets an additional
	 * <code>feedback</code> property added. The condition function should return <code>true</code> if passed
	 * controller is valid or otherwise <code>false</code>.
	 *
	 * @method findTargetController
	 * @return {Function} A condition function which is used to find a valid controller.
	 */
	getFindCondition() {
		return this._findCondition;
	}

	/**
	 * Default find condition function as returned by {{#crossLink
	 * "DropDelegate/getFindCondition:method"}}{{/crossLink}}.
	 *
	 * @method _findCondition
	 * @param {ModelController} controller The current controller to check.
	 * @return {Boolean} <code>true</code> if given controller is suited as a drop target, <code>false</code>
	 *     otherwise.
	 * @private
	 */
	_findCondition(controller) {
		const model = controller.getModel();
		const fbItem = this._findCondition.feedback.getItem();
		if (!JSG.graphItemFactory.isValidSubItem(fbItem, model.getType().getValue(), model)) {
			return false;
		}
		const found =
			model.isContainer() &&
			model.isVisible() &&
			!(controller instanceof ConnectionController) &&
			!(controller instanceof PortController) &&
			!(controller instanceof GraphController);
		return found;
	}

	/**
	 * Highlights the bounds of given controller.<br/>
	 *
	 * @method highlightTargetController
	 * @param {ModelController} controller The controller to highlight.
	 * @param {View} feedback The currently used feedback view.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by interaction.
	 * @return {Boolean} <code>true</code> if given controller was highlighted, <code>false</code> otherwise.
	 */
	highlightTargetController(controller, feedback, event, viewer) {
		// is it a valid controller? i.e. is position inside it...
		let highlighted = false;
		const fbItem = feedback.getItem();
		const position = fbItem.getPinPoint(JSG.ptCache.get());
		const validController = this._validateTarget(controller, position, viewer);
		if (validController) {
			highlighted = true;
			const highlighter = Highlighter.getDefault();
			const type = fbItem.getType().getValue();
			highlighter.highlightController(validController, viewer);
		}
		JSG.ptCache.release(position);
		return highlighted;
	}

	/**
	 * Checks if given controller is a possible drop target controller.
	 *
	 * @method _validateTarget
	 * @param {ModelController} controller The controller to validate.
	 * @param {Point} position The event location.
	 * @param {ControllerViewer} viewer The ControllerViewer used by this interaction.
	 * @return {ModelController} A possible drop target controller or <code>undefined</code>
	 * @private
	 */
	_validateTarget(controller, position, viewer) {
		let target;
		const bbox = JSG.boxCache.get();
		const graph = viewer.getGraph();

		function containsPosition(ctrlr) {
			ctrlr.getModel().getTranslatedBoundingBox(graph, bbox);
			return bbox.containsPoint(position);
		}

		if (controller) {
			target = containsPosition(controller)
				? controller
				: containsPosition(controller.getParent())
				? controller.getParent()
				: undefined;
		}
		JSG.boxCache.release(bbox);
		return target instanceof GraphController ? undefined : target;
	}

	createCommand(interaction, event, viewer) {
		const item = interaction.getFeedback().getItem();
		const type = item.getType().getValue();
		const controller = viewer.getGraphController();
		const targetController = this._targetController || controller;

		if (!this._targetController) {
			// check is graph a container
			if (!controller.getModel().isContainer()) {
				return undefined;
			}
		}

		const options = {
			libId: type,
			libName: type,
			newPinPoint: item.getPinPoint(),
			target: targetController,
			editor: interaction.getTarget()
		};
		return type ? new DropItemCommand(options) : undefined;
	}
};

export default DropDelegate;
