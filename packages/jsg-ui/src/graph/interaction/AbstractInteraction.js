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
import { Dictionary, CompoundCommand, Point, Rectangle, default as JSG } from '@cedalo/jsg-core';
import Interaction from './Interaction';
import ConnectionController from '../controller/ConnectionController';
import NodeController from '../controller/NodeController';
import Cursor from '../../ui/Cursor';

/**
 * This class can be used for all Interactions which want to provide {{#crossLink
 * "Feedback"}}{{/crossLink}}s during user interaction.</br> It provides public accessible variables
 * <code>feedback</code> and <code>actionFeedback</code>. These feedbacks can be updated by overwriting {{#crossLink
 * "AbstractInteraction/updateFeedback:method"}}{{/crossLink}},
 * {{#crossLink "AbstractInteraction/updateActionFeedback:method"}}{{/crossLink}} or
 * {{#crossLink "AbstractInteraction/updateSubFeedbacks:method"}}{{/crossLink}} respectively.
 * Finally the {{#crossLink "AbstractInteraction/createCommand:method"}}{{/crossLink}} gets
 * called to generate the corresponding interaction command.<br/> This class is frequently used for the JSG
 * interactions. So refer to their source code for an example of an AbstractInteraction usage.
 *
 * @class AbstractInteraction
 * @extends Interaction
 * @constructor
 */
class AbstractInteraction extends Interaction {
	constructor() {
		super();
		this.feedback = [];
		this.actionFeedback = undefined;
		this._subfeedbacks = new Dictionary();
		this._offset = new Point(0, 0);
		this._verticalSnapController = undefined;
		this._horizontalSnapController = undefined;
	}

	deactivate(viewer) {
		viewer.removeInteractionFeedback(this.actionFeedback);
		this.feedback = [];
		this._subfeedbacks.clear();
		this.actionFeedback = undefined;
		super.deactivate(viewer);
	}

	/**
	 * Called whenever corresponding {{#crossLink "Feedback"}}{{/crossLink}}s should
	 * be updated.</br>
	 * Subclasses should overwrite, default implementation does nothing.
	 *
	 * @method updateFeedback
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {Point} offset The offset between start and current event. Usually the difference between
	 * start and current location.
	 */
	updateFeedback(event, viewer, offset) {}

	/**
	 * Called whenever corresponding sub-{{#crossLink "Feedback"}}{{/crossLink}}s should
	 * be updated.</br>
	 * Subclasses should overwrite, default implementation does nothing.
	 *
	 * @method updateFeedback
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {Array} subfeedbacks A list of currently registered subfeedbacks.
	 */
	updateSubFeedbacks(event, viewer, subfeedbacks) {}

	/**
	 * Called during finishing this Interaction to create a Command for execution.
	 *
	 * @method createCommand
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {Point} [offset] The offset between start and current event. Usually the difference between
	 *     start and current location.
	 * @param {GraphItemController} [selectedController] The currently selected controller or
	 *     <code>undefined</code>.
	 * @return {Command} A command to be executed or <code>undefined</code>
	 */
	createCommand(event, viewer, offset, selectedController) {}

	/**
	 * Returns all currently registered sub-feedbacks.<br/>
	 * Sub-feedbacks are used to visualize changes of {{#crossLink "GraphItem"}}{{/crossLink}}s which
	 * are not explicitly updated by this interaction.
	 *
	 * @method getSubFeedbacks
	 * @return {Array} A list of currently registered sub-feedbacks.
	 * @since 1.6.0
	 */
	getSubFeedbacks() {
		return this._subfeedbacks.elements();
	}

	onRotate(event, viewer) {
		this.onMouseDrag(event, viewer);
	}

	onMouseDown(event, viewer) {
		if (JSG.touchDevice) {
			if (!this.actionFeedback) {
				this.actionFeedback = this.createActionFeedback(event, viewer);
			}
			if (this.actionFeedback) {
				this.updateActionFeedback(event, viewer);
				viewer.addInteractionFeedback(this.actionFeedback);
			}
		}
	}

	onMouseDrag(event, viewer) {
		// update feedback
		this._setFeedback(event, viewer);
		this._setActionFeedback(event, viewer);

		this._offset.setTo(this.currentLocation);
		this._offset.subtract(this.lastLocation);

		this.updateFeedback(event, viewer, this._offset);
		this.updateSubFeedbacks(event, viewer, this._subfeedbacks.elements());
		this.updateActionFeedback(event, viewer);

		this.lastLocation.setTo(this.currentLocation);
	}

	/**
	 * Creates an additional feedback view.<br/>
	 * This view will be registered as an interaction view to currently used controller viewer.
	 * This method is intended to be overwritten by subclasses. Default implementation does nothing.
	 *
	 * @method createActionFeedback
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {View} A view to use as additional feedback.
	 */
	createActionFeedback(event, viewer) {
		return undefined;
	}

	/**
	 * Updates action feedback view.<br/>
	 * This method is intended to be overwritten by subclasses. Default implementation does nothing.
	 *
	 * @method updateActionFeedback
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {View} A view to use as additional feedback.
	 */
	updateActionFeedback(event, viewer) {}

	/**
	 * Registers an action feedback for this interaction if none was set already. The creation is done by calling
	 * {{#crossLink "AbstractInteraction/createActionFeedback:method"}}{{/crossLink}}.
	 *
	 * @method _setActionFeedback
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @private
	 * @since 1.6.0
	 */
	_setActionFeedback(event, viewer) {
		if (Interaction.SHOW_ACTION_FEEDBACK && !this.actionFeedback) {
			this.actionFeedback = this.createActionFeedback(event, viewer);
			if (this.actionFeedback) {
				viewer.addInteractionFeedback(this.actionFeedback);
			}
		}
	}

	/**
	 * Registers a feedback for this interaction. If none is set
	 * {{#crossLink "AbstractInteraction/_createAndAddSelectionFeedback:method"}}{{/crossLink}}
	 * will be called.
	 *
	 * @method _setFeedback
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @private
	 */
	_setFeedback(event, viewer) {
		if (this.feedback.length === 0) {
			this._subfeedbacks.clear();
			const selectedControllers = viewer.getSelection();
			if (selectedControllers.length !== 0) {
				this.lastLocation.setTo(this.getStartLocation());
				this._createAndAddSelectionFeedback(selectedControllers, viewer);
			}
		}
	}

	/**
	 * Creates a new feedback for this interaction and add it to the given viewer.
	 *
	 * @method _createAndAddSelectionFeedback
	 * @param {GraphItemController} controller The controller to create the feedback for.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @private
	 */
	_createAndAddSelectionFeedback(controllers, viewer) {
		let edge;
		let port;
		let fbPort;
		let node;
		let portIndex;
		let source;
		let target;
		const edgeFeedbacks = [];

		function filterSubFeedbacks(subfeedbacks, allFeedbacks) {
			// simply remove any subfeedback which has same item as a master feedback
			allFeedbacks.forEach((feedback) => {
				subfeedbacks.remove(feedback.getOriginalItem().getId()); // _itemId));
			});
		}

		const getFeedbackForItem = (item, feedbacks) => {
			let i;
			const id = item.getId();
			for (i = 0; i < feedbacks.length; i += 1) {
				if (feedbacks[i].getOriginalItem().getId() === id) {
					return feedbacks[i];
				}
			}
			return undefined;
		};

		controllers.forEach((controller) => {
			const feedback = this._createSelectionFeedback(controller, viewer);
			if (feedback) {
				this.feedback.push(feedback);
				viewer.addInteractionFeedback(feedback);
				// subfeedbacks:
				if (!JSG.touchDevice) {
					this._createSubFeedbacks(controller, feedback);
					if (controller instanceof ConnectionController) {
						edgeFeedbacks.push(feedback);
					}
				}
			}
		});

		edgeFeedbacks.forEach((fbEdge) => {
			// add source/target port to attached feedback nodes...
			edge = fbEdge.getOriginalItem();
			port = edge.getSourcePort();
			if (port) {
				// get source node:
				node = port.getParent();
				portIndex = node.getPortIndex(port);
				source = getFeedbackForItem(node, this.feedback);
				if (source) {
					fbPort = source._fbItem.getPortAt(portIndex);
					fbEdge.setSourcePort(fbPort);
					fbEdge.getFeedbackItem().getSourcePort = edge.getSourcePort;
				}
			}

			port = edge.getTargetPort();
			if (port) {
				// get source node:
				node = port.getParent();
				target = getFeedbackForItem(node, this.feedback);
				if (target) {
					fbPort = target._fbItem.getPortAt(node.getPortIndex(port));
					fbEdge.setTargetPort(fbPort);
					fbEdge.getFeedbackItem().getTargetPort = edge.getTargetPort;
				}
			}
		});

		filterSubFeedbacks(this._subfeedbacks, this.feedback);

		this._subfeedbacks.iterate((key, subfb) => {
			viewer.addInteractionFeedback(subfb.getFeedbackView());
		});
	}

	/**
	 * Creates a new feedback for given controller.
	 *
	 * @method _createSelectionFeedback
	 * @param {ModelController} controller The controller to create the feedback for.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {Feedback} The new feedback to use.
	 */
	_createSelectionFeedback(controller, viewer) {
		return controller.createFeedback();
	}

	/**
	 * Creates and registers sub-feedbacks to given feedback.</br>
	 * This method can be overridden by subclasses to create custom sub-feedbacks!
	 *
	 * @method _createSubFeedbacks
	 * @param {ModelController} controller The corresponding model controller.
	 * @param {Feedback} feedback The feedback to create the sub-feedbacks for.
	 * @private
	 */
	_createSubFeedbacks(controller, feedback) {
		let edges;
		let fbPort;
		const subfbMap = this._subfeedbacks;
		const graphController = controller.getGraphController();

		const addEdgeFeedback = (edge) => {
			let fbEdge = subfbMap.get(edge.getId());
			if (fbEdge === undefined) {
				const edgeController = graphController.getControllerByModelId(edge.getId());
				if (edgeController) {
					fbEdge = edgeController.createFeedback(); // (false);
					fbEdge.getFeedbackItem().disableEvents();
					fbEdge
						.getFeedbackItem()
						.getShape()
						.disableNotification();
					subfbMap.put(fbEdge.getOriginalItem().getId(), fbEdge);
				}
			}
			return fbEdge;
		};

		const setTargetPort = (edge) => {
			const fbEdge = addEdgeFeedback(edge, graphController);
			if (fbEdge) {
				fbEdge.setTargetPort(fbPort);
				fbEdge.getFeedbackItem().getTargetPort = edge.getTargetPort;
			}
		};

		const setSourcePort = (edge) => {
			const fbEdge = addEdgeFeedback(edge, graphController);
			if (fbEdge) {
				fbEdge.setSourcePort(fbPort);
				fbEdge.getFeedbackItem().getSourcePort = edge.getSourcePort;
			}
		};

		if (controller instanceof NodeController) {
			// create feedbacks for connections too:
			const node = controller.getModel();
			const ports = node.getPorts();
			const fbItem = feedback.getFeedbackItem();
			ports.forEach((port, i) => {
				fbPort = fbItem.getPortAt(i);
				if (fbPort) {
					edges = port.getIncomingEdges();
					edges.forEach(setTargetPort);
					edges = port.getOutgoingEdges();
					edges.forEach(setSourcePort);
				}
			});
		}

		return undefined;
	}

	onMouseUp(event, viewer) {
		this._offset.setTo(this.currentLocation);
		this._offset.subtract(this.startLocation);
		this.finishInteraction(event, viewer);

		// HAVE TO FINISH INTERACTION EVEN IF NO FEEDBACKS ARE CURRENTLY SET!!!!!
		// if (!this.feedback.isEmpty()) {
		// this._offset.setTo(this.currentLocation);
		// this._offset.subtract(this.startLocation);
		// this.finishInteraction(event, viewer);
		// }
	}

	// overwritten to provide an offset parameter...
	finishInteraction(event, viewer) {
		this.willFinish(event, viewer, this._offset);
		this.didFinish(event, viewer);
	}

	cancelInteraction(event, viewer) {
		if (event) {
			event.doRepaint = true;
		}
		this.setCursor(Cursor.Style.AUTO);
		super.cancelInteraction(event, viewer);
	}

	/**
	 * Overwritten from base Interaction class. Added additional offset parameter which might is useful for
	 * subclasses.</br> This implementation simply triggers creation of corresponding {{#crossLink
	 * "Command"}}{{/crossLink}}s and executes them via registered InteractionHandler. </br> See
	 * {{#crossLink "AbstractInteraction/createCommand:method"}}{{/crossLink}}
	 *
	 *
	 * @method willFinish
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {Point} offset The offset between start and end event. Usually the difference between
	 * start and end location.
	 */
	willFinish(event, viewer, offset) {
		let cmd;
		const interactionHandler = this.getInteractionHandler();

		if (interactionHandler) {
			const cmds = [];
			const selection = viewer.getSelection();
			selection.forEach((sel) => {
				cmd = this.createCommand(offset, sel, event, viewer);
				if (cmd) {
					cmds.push(cmd);
				}
			});
			if (cmds.length) {
				interactionHandler.execute(this._createCommand(cmds), this.executed);
			}
		}
	}

	/**
	 * This function is called after all {{#crossLink "Command"}}{{/crossLink}}s are
	 * executed. See {{#crossLink "AbstractInteraction/willFinish:method"}}{{/crossLink}}.</br>
	 * Subclass can overwrite, default implementation does nothing.
	 *
	 * @method executed
	 * @param {Command} command The executed command. Note: this could be a {{#crossLink
	 *     "Command"}}{{/crossLink}}.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	executed(command, viewer) {}

	/**
	 * Creates a single Command from the list of passed Commands. If the list contains more than one
	 * command a {{#crossLink "Command"}}{{/crossLink}} is returned.
	 *
	 * @method _createCommand
	 * @param {Array} cmds A list of Commands.
	 * @param {Boolean} [reverseUndo] Optional flag to specify if a possible created CompoundCommand should
	 * execute undo in reverse order.
	 * @return {Command | CompoundCommand} The command that should be executed.
	 * @private
	 */
	_createCommand(cmds, reverseUndo) {
		if (cmds.length === 1) {
			return cmds[0];
		}
		const cpmd = new CompoundCommand(reverseUndo);
		cmds.forEach((cmd) => {
			cpmd.add(cmd);
		});

		return cpmd;
	}

	/**
	 * Returns the bounding rectangle of current selection. Used for snap feature.
	 *
	 * @method getSnapRect
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {Rectangle} [reuserect] A rectangle instance to reuse.
	 * @return {Rectangle} The bounding rectangle of current selection.
	 * @deprecated Subject to be removed!! Please use {{#crossLink "SnapHelper"}}{{/crossLink}}
	 *     instead.
	 */
	getSnapRect(viewer, reuserect) {
		const rect = reuserect || new Rectangle(0, 0, 0, 0);
		const bbox = viewer.getSelectionView().getBoundingBox(JSG.boxCache.get());

		bbox.getBoundingRectangle(rect);
		JSG.boxCache.release(bbox);
		return rect;
	}

	/**
	 * Determines the offset from <code>currentLocation</code> to nearest grid cell or to another controller (snap).
	 * The offset can be used to move a feedback along the grid or to align (snap) it to a controller.
	 *
	 * @method getSnapAndGridOffset
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {ClientEvent} event The current event.
	 * @param {Rectangle} box The current selection bounds. See {{#crossLink
	 *     "AbstractInteraction/getSnapRect:method"}}{{/crossLink}}.
	 * @param {Point} [reusepoint] A point instance to reuse.
	 * @return {Point} The offset to snap and grid.
	 * @deprecated Subject to be removed!! Please use {{#crossLink "SnapHelper"}}{{/crossLink}}
	 *     instead.
	 */
	getSnapAndGridOffset(viewer, event, box, reusepoint) {
		const newOffset = reusepoint || new Point(0, 0);
		const currentOffset = JSG.ptCache
			.get()
			.setTo(this.currentLocation)
			.subtract(this.startLocation);
		const tlNew = JSG.ptCache.get(box.x + currentOffset.x, box.y + currentOffset.y);
		const brNew = JSG.ptCache.get(box.getRight() + currentOffset.x, box.getBottom() + currentOffset.y);
		const tlNewGrid = this.alignToGrid(tlNew, viewer, event.event.altKey, JSG.ptCache.get());
		const brNewGrid = this.alignToGrid(brNew, viewer, event.event.altKey, JSG.ptCache.get());

		this.alignToSnapController(tlNew, brNew, tlNewGrid, brNewGrid, viewer);

		if (tlNew.x - tlNewGrid.x < brNew.x - brNewGrid.x) {
			newOffset.x = currentOffset.x + tlNewGrid.x - tlNew.x;
		} else {
			newOffset.x = currentOffset.x + brNewGrid.x - brNew.x;
		}

		if (tlNew.y - tlNewGrid.y < brNew.y - brNewGrid.y) {
			newOffset.y = currentOffset.y + tlNewGrid.y - tlNew.y;
		} else {
			newOffset.y = currentOffset.y + brNewGrid.y - brNew.y;
		}
		JSG.ptCache.release(tlNew, tlNewGrid, brNew, brNewGrid, currentOffset);
		return newOffset;
	}

	/**
	 * Returns a list of {{#crossLink "GraphItemController"}}{{/crossLink}}s which are inside a
	 * certain {{#crossLink "JSG/findRadius:property"}}{{/crossLink}} to given bounds. These controllers can then be
	 * used to support snap feature.<br/> If a controller will be selected can be influenced by an optional condition
	 * function. If passed the function gets the current visited controller and the bounds as parameter. If look up
	 * should stop, i.e. the current controller is suitable, the function should return <code>true</code>. Otherwise
	 * the search goes on. Additionally the
	 * {{#crossLink "Interaction.SnapType"}}{{/crossLink}} of a controller influences its selection.
	 *
	 * @method getControllerForSnap
	 * @param {Rectangle} box The current selection bounds. See {{#crossLink
	 *     "AbstractInteraction/getSnapRect:method"}}{{/crossLink}}.
	 * @param {Function} [conditionFunc] A function to influence controller selection.
	 * @return {GraphItemController} The controller to use for snap or <code>undefined</code>.
	 * @deprecated Subject to be removed!! Please use {{#crossLink "SnapHelper"}}{{/crossLink}}
	 *     instead.
	 */
	getControllerForSnap(selBox, conditionFunc) {
		const { viewer } = this.interactionHandler;
		const graph = viewer.getGraph();
		const snapControllers = [];
		const allwaysTrueCondition = () => true;
		const condition = conditionFunc || allwaysTrueCondition;

		const locationConditionFunc = (controller, box) => {
			const bbox = controller.getModel().getTranslatedBoundingBox(graph, JSG.boxCache.get());
			const bbrect = bbox.getBoundingRectangle(JSG.rectCache.get());
			const bbrectCenter = bbrect.getCenter(JSG.ptCache.get());
			const boxCenter = JSG.ptCache.get(box.x + box.width / 2, box.y + box.height / 2);
			const snapItem = condition(controller, box);

			if (snapItem) {
				controller._snapType = Interaction.SnapType.NONE;

				const diffCenter = Math.abs(boxCenter.x - bbrectCenter.x);
				const diffLeft = Math.abs(box.x - bbrect.x);
				const diffRight = Math.abs(box.getRight() - bbrect.getRight());
				const radius = viewer.getGraph().getFindRadius();

				if (diffCenter < radius && diffCenter <= diffLeft && diffCenter <= diffRight) {
					controller._snapType |= Interaction.SnapType.CENTERX;
				} else if (diffLeft < radius && diffLeft <= diffCenter && diffLeft <= diffRight) {
					controller._snapType |= Interaction.SnapType.LEFT;
				} else if (diffRight < radius && diffRight <= diffCenter && diffRight <= diffLeft) {
					controller._snapType |= Interaction.SnapType.RIGHT;
				}

				const diffCenterY = Math.abs(boxCenter.y - bbrectCenter.y);
				const diffTop = Math.abs(box.y - bbrect.y);
				const diffBottom = Math.abs(box.getBottom() - bbrect.getBottom());

				if (diffCenterY < radius && diffCenterY <= diffTop && diffCenterY <= diffBottom) {
					controller._snapType |= Interaction.SnapType.CENTERY;
				} else if (diffTop < radius && diffTop <= diffCenterY && diffTop <= diffBottom) {
					controller._snapType |= Interaction.SnapType.TOP;
				} else if (diffBottom < radius && diffBottom <= diffCenterY && diffBottom <= diffTop) {
					controller._snapType |= Interaction.SnapType.BOTTOM;
				}

				if (controller._snapType !== Interaction.SnapType.NONE) {
					snapControllers.push(controller);
				}
			}
			JSG.boxCache.release(bbox);
			JSG.rectCache.release(bbrect);
			JSG.ptCache.release(bbrectCenter, boxCenter);
			// always return false to continue search
			return false;
		};

		viewer.findControllerByConditionAndBox(selBox, locationConditionFunc);

		return snapControllers;
	}

	/**
	 * Aligns given points to current snap controller.
	 *
	 * @method alignToSnapController
	 * @param {Point} tlNew The top-left snap point to align.
	 * @param {Point} brNew The bottom-right snap point to align.
	 * @param {Point} tlNewGrid The top-left grid point to align.
	 * @param {Point} brNewGrid The bottom-right grid point to align.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @deprecated Subject to be removed!! Please use {{#crossLink "SnapHelper"}}{{/crossLink}}
	 *     instead.
	 */
	alignToSnapController(tlNew, brNew, tlNewGrid, brNewGrid, viewer) {
		const bbox = JSG.boxCache.get();
		const boxrect = JSG.rectCache.get();
		let bboxrect = JSG.rectCache.get();
		let boxrectCenter = JSG.ptCache.get();
		let bboxrectCenter = JSG.ptCache.get();
		const radius = viewer.getGraph().getFindRadius();

		if (this._horizontalSnapController) {
			boxrect.set(tlNew.x, tlNew.y, brNew.x - tlNew.x, brNew.y - tlNew.y);
			boxrectCenter = boxrect.getCenter(boxrectCenter);
			bboxrect = this._horizontalSnapController
				.getModel()
				.getTranslatedBoundingBox(viewer.getGraph(), bbox)
				.getBoundingRectangle(bboxrect);
			bboxrectCenter = bboxrect.getCenter(bboxrectCenter);

			switch (this._horizontalSnapController._snapType) {
				case Interaction.SnapType.CENTERY:
					if (Math.abs(boxrectCenter.y - bboxrectCenter.y) < radius) {
						tlNewGrid.y = tlNew.y - (boxrectCenter.y - bboxrectCenter.y);
						brNewGrid.y = brNew.y - (boxrectCenter.y - bboxrectCenter.y);
					}
					break;
				case Interaction.SnapType.TOP:
					if (Math.abs(boxrect.y - bboxrect.y) < radius) {
						tlNewGrid.y = tlNew.y - (boxrect.y - bboxrect.y);
						brNewGrid.y = brNew.y - (boxrect.y - bboxrect.y);
					}
					break;
				case Interaction.SnapType.BOTTOM:
					if (Math.abs(boxrect.getBottom() - bboxrect.getBottom()) < radius) {
						tlNewGrid.y = tlNew.y - (boxrect.getBottom() - bboxrect.getBottom());
						brNewGrid.y = brNew.y - (boxrect.getBottom() - bboxrect.getBottom());
					}
					break;
			}
		}

		if (this._verticalSnapController) {
			boxrect.set(tlNew.x, tlNew.y, brNew.x - tlNew.x, brNew.y - tlNew.y);
			boxrectCenter = boxrect.getCenter(boxrectCenter);
			bboxrect = this._verticalSnapController
				.getModel()
				.getTranslatedBoundingBox(viewer.getGraph(), bbox)
				.getBoundingRectangle(bboxrect);
			bboxrectCenter = bboxrect.getCenter(bboxrectCenter);

			switch (this._verticalSnapController._snapType) {
				case Interaction.SnapType.CENTERX:
					if (Math.abs(boxrectCenter.x - bboxrectCenter.x) < radius) {
						tlNewGrid.x = tlNew.x - (boxrectCenter.x - bboxrectCenter.x);
						brNewGrid.x = brNew.x - (boxrectCenter.x - bboxrectCenter.x);
					}
					break;
				case Interaction.SnapType.LEFT:
					if (Math.abs(boxrect.x - bboxrect.x) < radius) {
						tlNewGrid.x = tlNew.x - (boxrect.x - bboxrect.x);
						brNewGrid.x = brNew.x - (boxrect.x - bboxrect.x);
					}
					break;
				case Interaction.SnapType.RIGHT:
					if (Math.abs(boxrect.getRight() - bboxrect.getRight()) < radius) {
						tlNewGrid.x = tlNew.x - (boxrect.getRight() - bboxrect.getRight());
						brNewGrid.x = brNew.x - (boxrect.getRight() - bboxrect.getRight());
					}

					break;
			}
		}
		JSG.boxCache.release(bbox);
		JSG.rectCache.release(boxrect, bboxrect);
		JSG.ptCache.release(boxrectCenter, bboxrectCenter);
	}
}

export default AbstractInteraction;
