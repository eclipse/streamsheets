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
import {
	default as JSG,
	Point,
	Graph,
	Port,
	Edge,
	TextNode,
	LineConnection,
	ItemAttributes,
	MoveItemCommand,
	PasteItemsCommand,
	RotateItemCommand,
	CompoundCommand,
	ChangeItemOrderCommand,
	ChangeParentCommand,
	DetachCommand,
	MatrixLayout,
	GraphUtils,
	Shape
} from '@cedalo/jsg-core';
import Delegate from './Delegate';
import ContentNodeController from '../controller/ContentNodeController';
import GraphController from '../controller/GraphController';
import MoveFeedbackView from '../feedback/MoveFeedbackView';
import Highlighter from './Highlighter';
import MoveAlignHelper from './MoveAlignHelper';
import SnapHelper from './SnapHelper';
import LayerId from '../view/LayerId';
import ContentNodeView from '../view/ContentNodeView';
import Cursor from '../../ui/Cursor';

/**
 * The default delegate object for a {{#crossLink "MoveInteraction"}}{{/crossLink}}.<br/>
 *
 * @class MoveDelegate
 * @extends Delegate
 * @constructor
 */
class MoveDelegate extends Delegate {
	constructor() {
		super();
		// offset should go to feedback view!!
		this._offset = new Point(0, 0);
		this._startpos = new Point(0, 0);
		this._snaphelper = undefined;
		this._alignhelper = undefined;
		this._highlighter = undefined;
		this._trgtController = undefined;
		this._doSnap = true;
		this._doHighlightTarget = true;
		this.snapped = false;
	}

	/**
	 * Returns the currently registered SnapHelper object to use for aligning move feedback to visible snap-lines.
	 *
	 * @method getSnapHelper
	 * @return {SnapHelper} The currently used SnapHelper object.
	 */
	getSnapHelper() {
		this._snaphelper = this._snaphelper || SnapHelper.getDefault();
		return this._snaphelper;
	}

	/**
	 * Sets a new SnapHelper object to use for aligning move feedback to visible snap-lines.
	 *
	 * @method setSnapHelper
	 * @param {SnapHelper} snaphelper The new SnapHelper to use.
	 */
	setSnapHelper(snaphelper) {
		this._snaphelper = snaphelper;
	}

	/**
	 * Returns the currently registered Highlighter object used to highlight suitable move targets.
	 *
	 * @method getHighlighter
	 * @return {Highlighter} Returns the currently used Highlighter helper object.
	 * @deprecated Don't use. Subject to change!!
	 */
	getHighlighter() {
		this._highlighter = this._highlighter || Highlighter.getDefault();
		return this._highlighter;
	}

	/**
	 * Sets a new Highlighter object to use for highlighting suitable move targets.
	 *
	 * @method setHighlighter
	 * @param {Highlighter} highlighter The new Highlighter object to use.
	 * @deprecated Don't use. Subject to change!!
	 */
	setHighlighter(highlighter) {
		this._highlighter = highlighter;
	}

	/**
	 * Returns the currently registered MoveAlignHelper object used to align move feedback.
	 *
	 * @method getAlignHelper
	 * @return {MoveAlignHelper} The registered MoveAlignHelper object used to align move
	 *     feedback.
	 */
	getAlignHelper() {
		this._alignhelper = this._alignhelper || MoveAlignHelper.getDefault();
		return this._alignhelper;
	}

	/**
	 * Sets a new MoveAlignHelper object to use for aligning move feedback.
	 *
	 * @method setAlignHelper
	 * @param {MoveAlignHelper} alignhelper The new MoveAlignHelper object to use.
	 */
	setAlignHelper(alignhelper) {
		this._alignhelper = alignhelper;
	}

	/**
	 * Sets the snap flag to turn on or to turn off snap alignment.
	 *
	 * @method setDoSnap
	 * @param {Boolean} doIt Set to <code>true</code> to turn on snap alignment.
	 */
	setDoSnap(doIt) {
		this._doSnap = !!doIt;
	}

	/**
	 * Sets the highlight flag to turn on or to turn off highlighting of target controllers.
	 *
	 * @method setDoHighlightTarget
	 * @param {Boolean} doIt Set to <code>true</code> to turn on highlighting of target controllers.
	 */
	setDoHighlightTarget(doIt) {
		this._doHighlightTarget = !!doIt;
	}

	/**
	 * Checks if given event defines a copy-on-move event.<br/>
	 * Currently a copy-on-move event occurred if the <code>CTRL</code> key, but not the <code>ALT</code>, is pressed
	 * simultaneously with the event.
	 *
	 * @method isCopyOnMoveEvent
	 * @param {Interaction} interaction The interaction which uses this delegate.
	 * @param {ClientEvent} event The event to check.
	 * @return {Boolean} <code>true</code> if given event defines a copy-on-move event, <code>false</code> otherwise.
	 */
	isCopyOnMoveEvent(interaction, event) {
		// Note AltGr results in (altKey && ctrlKey)==true!!
		return event && event.event.ctrlKey && !event.event.altKey;
	}

	createFeedback(interaction, event, viewer) {
		const position = interaction.startLocation;
		const fbview = new MoveFeedbackView(10);
		fbview.addSelection(viewer.getSelection(), viewer);
		viewer.getSelectionView().setVisible(false);
		fbview.getLocation(this._offset).subtract(position);
		this._startpos.setTo(position).add(this._offset);
		return fbview;
	}

	updateFeedback(interaction, data, event, viewer) {
		// NOT GOOD!!?? assumes that we use feedback location!!! (seeoffset calculation in createMoveFeedbackAt...)
		const position = data.add(this._offset);
		const feedback = interaction.getFeedback();
		const offset = JSG.ptCache.get();

		this.snapped = false;
		// align position to HV
		this.getAlignHelper().alignToHV(position, this._startpos, event, viewer);
		// update feedback:
		feedback.setLocationTo(position);
		// first check for snap:
		this.alignToSnapLines(interaction, event, viewer, offset);
		if (offset.lengthSquared() > 1) {
			this.snapped = true;
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
		// align
		this.alignFeedback(interaction, event, viewer);

		if (this._doHighlightTarget) {
			this.highlightTargetController(interaction, event, viewer);
		}

		if (this._trgtController && !this._trgtController.getModel().isContainer() && !this._isOrderTarget(this._trgtController.getModel())) {
			interaction.setCursor(Cursor.Style.DENY);
		} else {
			interaction.setCursor(Cursor.Style.MOVE);
		}
		JSG.ptCache.release(offset);
	}

	/**
	 * Called by {{#crossLink "Delegate/updateFeedback:method"}}{{/crossLink}} to align the
	 * feedback according to the current grid settings
	 *
	 * @method alignToGrid
	 * @param {Interaction} interaction The interaction which uses this delegate.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The used ControllerViewer.
	 */
	alignToGrid(interaction, event, viewer) {
		const feedback = interaction.getFeedback();
		const position = feedback.getLocation(JSG.ptCache.get());
		const offset = this._alignToGrid(interaction, event, viewer, JSG.ptCache.get());
		feedback.setLocationTo(position.add(offset));
		JSG.ptCache.release(offset, position);
	}

	_alignToGridHV(interaction, event, viewer, alignVertical) {
		const feedback = interaction.getFeedback();
		const position = feedback.getLocation(JSG.ptCache.get());
		const offset = this._alignToGrid(interaction, event, viewer, JSG.ptCache.get());
		offset.x = alignVertical ? 0 : offset.x;
		offset.y = alignVertical ? offset.y : 0;
		feedback.setLocationTo(position.add(offset));
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
		viewer.clearLayer(LayerId.SNAPLINES);
		if (this.doSnap(interaction, event, viewer)) {
			const feedback = interaction.getFeedback();
			const topleft = JSG.ptCache.get();
			const fbbox = feedback.getBoundingBox(JSG.boxCache.get());
			this._snapFeedback(feedback, viewer, offset);
			fbbox.getTopLeft(topleft).add(offset);
			fbbox.setTopLeftTo(topleft);
			feedback.setBoundingBoxTo(fbbox);
			JSG.ptCache.release(topleft);
			JSG.boxCache.release(fbbox);
		}
		return offset;
	}

	/**
	 * Called by {{#crossLink "MoveDelegate/alignToSnapLines:method"}}{{/crossLink}} to check if
	 * snap alignment should be done. Snap align is only performed if internal snap property is set to
	 * <code>true</code> via
	 * {{#crossLink "MoveDelegate/setDoSnap:method"}}{{/crossLink}} and if
	 * {{#crossLink "SnapHelper/doSnap:method"}}{{/crossLink}} returns <code>true</code> as well.
	 * Additionally this method checks if the moved feedback is visible within current displayed graph region.<br/>
	 *
	 * @method doSnap
	 * @param {Interaction} interaction The interaction which uses this delegate.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by interaction.
	 * @return {Boolean} <code>true</code> if snap alignment should be done, <code>false</code> otherwise.
	 */
	doSnap(interaction, event, viewer) {
		const snaphelper = this.getSnapHelper();
		let snap = this._doSnap && snaphelper.doSnap(event, viewer);
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

	// TODO this might be an improvement for SnapHelper
	// => pass feedback to filter out snap-alignments against original item...
	_snapFeedback(feedback, viewer, reusepoint) {
		const offset = reusepoint || new Point(0, 0);
		const snaphelper = this.getSnapHelper();
		const fbbox = feedback.getBoundingBox(JSG.boxCache.get());
		let subfb;
		const subfeedbacks = feedback.getSubFeedbacks();
		const lines = [];

		for (let i = 0, n = subfeedbacks.length; i < n; i += 1) {
			subfb = subfeedbacks[i].getFeedbackItem();
			if (subfb.isVisible() && subfb instanceof LineConnection) {
				lines.push(subfeedbacks[i]);
			}
		}
		// this._feedback = feedback;
		snaphelper.snapToBBox(fbbox, lines, viewer, offset);
		JSG.boxCache.release(fbbox);
		// this._feedback = undefined;
		return offset;
	}

	/**
	 * Called by {{#crossLink "Delegate/updateFeedback:method"}}{{/crossLink}} to align feedback
	 * on move.<br/> Note: this uses the registered {{#crossLink
	 * "MoveAlignHelper"}}{{/crossLink}}.
	 *
	 * @method alignFeedback
	 * @param {Interaction} interaction The interaction which uses this delegate.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by interaction.
	 */
	alignFeedback(interaction, event, viewer) {
		const feedback = interaction.getFeedback();
		this.getAlignHelper().alignFeedback(feedback, this._startpos, event, viewer);
	}

	/**
	 * Highlights a possible move target controller or a possible insert position. This may adds visual feedbacks to
	 * the
	 * {{#crossLink "LayerId/LAYOUTMARKER:property"}}{{/crossLink}} or {{#crossLink
	 * "LayerId/TARGETCONTAINER:property"}}{{/crossLink}} layers of current {{#crossLink
	 * "GraphView"}}{{/crossLink}}.<br/>
	 *
	 * @method highlightTargetController
	 * @param {Interaction} interaction The interaction which uses this delegate.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by interaction.
	 */
	highlightTargetController(interaction, event, viewer) {
		viewer.clearLayer(LayerId.LAYOUTMARKER);
		viewer.clearLayer(LayerId.TARGETCONTAINER);
		if (this._dragTimer === undefined) {
			this._trgtController = this.findTargetController(interaction, event, viewer);
		}
		// move inside target/container
		if (this._trgtController && !(this._trgtController instanceof GraphController)) {
			const feedback = interaction.getFeedback();
			const position = feedback.getLocation(JSG.ptCache.get());
			const highlighter = this.getHighlighter();
			const index = this._getInsertIndex(this._trgtController, position, viewer);
			if (index || index === 0) {
				highlighter.highlightPosition(this._trgtController, index, viewer);
			} else {
				highlighter.highlightController(this._trgtController, viewer);
			}
			JSG.ptCache.release(position);
		}
	}

	_getInsertIndex(trgtCtlr, position, viewer) {}

	/**
	 * Tries to find a suited move target controller.<br/>
	 * To find a valid controller a condition function is used which should be returned by
	 * {{#crossLink "MoveDelegate/getFindCondition:method"}}{{/crossLink}}.<br/>
	 * <b>Note:</b> the condition function object gets following additional properties set before it is called:<br/>
	 * <code>copy</code> a flag to indicate if current move is a copy-on-move<br/>
	 * <code>fbbox</code> the current {{#crossLink "BoundingBox"}}{{/crossLink}} of corresponding
	 * feedback<br/>
	 * <code>feedback</code> the corresponding {{#crossLink "FeedbackView"}}{{/crossLink}}<br/>
	 * <code>fallback</code> can be set by condition function to specify a fallback target controller. By default it is
	 * set to {{#crossLink "GraphController"}}{{/crossLink}}.<br/><br/>
	 *
	 * @method findTargetController
	 * @param {Interaction} interaction The interaction which uses this delegate.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by interaction.
	 * @return {ModelController} A valid controller or <code>undefined</code>.
	 */
	findTargetController(interaction, event, viewer) {
		// simply take default controller if any...
		let target = viewer.getDefaultController();
		const feedback = interaction.getFeedback();
		const fbbox = feedback.getBoundingBox(JSG.boxCache.get());
		const condition = this.getFindCondition();
		condition.fallback = undefined;
		if (!target && this._isFeedbackMoveable(feedback, event, viewer)) {
			const loc = JSG.ptCache.get().setTo(event.location);
			// we append some useful info:
			condition.copy = this.isCopyOnMoveEvent(interaction, event);
			condition.fbbox = fbbox;
			condition.feedback = feedback;
			condition.fallback = viewer.getGraphController();
			target = viewer.filterFoundControllers(Shape.FindFlags.AREA, condition.bind(this));

			JSG.ptCache.release(loc);
		}
		if (!target) {
			target = condition.fallback;
		}
		if (target instanceof ContentNodeController) {
			// TODO (ah) this is not nice...
			target = target.getContentPaneController();
		}

		JSG.boxCache.release(fbbox);
		return target;
	}

	activateTimer(viewer, view, offset, vertical) {
		if (this._dragTimer !== undefined) {
			return;
		}

		this._dragTimer = setInterval(() => {
			const viewport = view.getViewPort();
			let model;
			if (vertical) {
				model = viewport.getVerticalRangeModel();
			} else {
				model = viewport.getHorizontalRangeModel();
			}
			model.setValue(model._value + offset);
			viewer.getGraph().markDirty();
			viewer.getGraphicSystem().paint();
		}, 300);
	}

	deactivateTimer() {
		if (this._dragTimer) {
			clearInterval(this._dragTimer);
			this._dragTimer = undefined;
		}
	}

	_isFeedbackScrollable(feedback, event, viewer) {
		const selection = viewer.getSelection()[0];
		const view = selection.getView();
		let parent = view.getParent();

		while (parent) {
			if (parent instanceof ContentNodeView) {
				const item = parent.getItem();
				const contentRect = item.getTotalBoundingRect();
				if (contentRect.containsPoint(event.location)) {
					this.deactivateTimer();
				} else if (event.location.x < contentRect.x && event.location.x > contentRect.x - 1000) {
					this.activateTimer(viewer, parent, -1000, false);
					return true;
				} else if (event.location.x > contentRect.getRight() && event.location.x < contentRect.getRight() + 1000) {
					this.activateTimer(viewer, parent, 1000, false);
					return true;
				} else if (event.location.y < contentRect.y && event.location.y > contentRect.y - 1000) {
					this.activateTimer(viewer, parent, -1000, true);
					return true;
				} else if (event.location.y > contentRect.getBottom() && event.location.y < contentRect.getBottom() + 1000) {
					this.activateTimer(viewer, parent, 1000, true);
					return true;
				} else {
					this.deactivateTimer();
				}
				return false;
			}
			parent = parent.getParent();
		}

		return false;
	}

	/**
	 * Checks if inner feedbacks of given feedback view can be moved.
	 *
	 * @method _isFeedbackMoveable
	 * @param {FeedbackView} feedback The feedback view to check.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The currently used ControllerViewer.
	 * @return {Boolean} <code>true</code> if all inner feedbacks of given feedback view can be moved,
	 *     <code>false</code> otherwise.
	 * @private
	 */
	_isFeedbackMoveable(feedback, event, viewer) {
		const feedbacks = feedback.getFeedbacks();
		let isMoveable = feedbacks.length > 0;

		if (isMoveable) {
			let i;
			let n;
			let item = feedbacks[0].getOriginalItem();
			const parent = item.getParent();
			let itmparent;

			for (i = 0, n = feedbacks.length; i < n; i += 1) {
				item = feedbacks[0].getOriginalItem();
				itmparent = item.getParent();
				if (JSG.isGroup(itmparent) || itmparent !== parent || !this._isItemMoveable(item, event, viewer)) {
					isMoveable = false;
					break;
				}
			}
		}
		return isMoveable;
	}

	/**
	 * Checks if given item can be moved.
	 *
	 * @method _isItemMoveable
	 * @param {GraphItem} item The item to check.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The currently used ControllerViewer.
	 * @return {Boolean} <code>true</code> if given item is suited move target, <code>false</code> otherwise.
	 * @private
	 */
	_isItemMoveable(item, event, viewer) {
		let isMoveable = this._isMoveable(item, viewer) && !(item instanceof TextNode && item.isAssociated());
		isMoveable =
			isMoveable &&
			!(
				item
					.getItemAttributes()
					.getMoveable()
					.getValue() & ItemAttributes.Moveable.LIMITTOCONTAINER
			);

		return isMoveable;
	}

	/**
	 * Returns a condition function used to find a suited move target controller. The returned function is called with
	 * currently visited {{#crossLink "ModelController"}}{{/crossLink}} as only parameter. It
	 * should return
	 * <code>true</code> if passed controller is a possible move target and <code>false</code> otherwise.<br/>
	 * <b>Note:</b> the returned function object itself gets following additional properties set before it is
	 * called:<br/>
	 * <code>copy</code> a flag to indicate if current move is a copy-on-move<br/>
	 * <code>feedback</code> the corresponding {{#crossLink "FeedbackView"}}{{/crossLink}}<br/>
	 * <code>fallback</code> can be set by condition function to specify a fallback target controller. By default it is
	 * set to {{#crossLink "GraphController"}}{{/crossLink}}.<br/><br/> See {{#crossLink
	 * "MoveDelegate/findTargetController:method"}}{{/crossLink}} too.
	 *
	 * @method findTargetController
	 * @return {Function} A condition function which is used to find a valid move target controller.
	 */
	getFindCondition() {
		return this._targetCondition;
	}

	/**
	 * Default find condition function as returned by {{#crossLink
	 * "MoveDelegate/getFindCondition:method"}}{{/crossLink}}.
	 *
	 * @method _targetCondition
	 * @param {ModelController} controller The current controller to check.
	 * @return {Boolean} <code>true</code> if given controller is suited as a move target, <code>false</code>
	 *     otherwise.
	 * @private
	 */
	_targetCondition(controller) {
		const item = controller.getModel();
		let isSuited = this._isSuitedTarget(item);
		if (isSuited) {
			let i;
			let n;
			let fbItem;
			const itemtype = item.getType().getValue();
			const copy = this._targetCondition.copy;
			const feedbacks = this._targetCondition.feedback.getFeedbacks();
			const controllerbox = item.getTranslatedBoundingBox(item.getGraph(), JSG.boxCache.get());

			isSuited = controllerbox.doesIntersectWith(this._targetCondition.fbbox);
			if (isSuited) {
				for (i = 0, n = feedbacks.length; isSuited && i < n; i += 1) {
					fbItem = feedbacks[i].getOriginalItem();
					if (!JSG.graphItemFactory.isValidSubItem(fbItem, itemtype, item)) {
						isSuited = false;
						break;
					}
					// check if controller itself is in selection
					if (fbItem === item) {
						this._targetCondition.fallback = controller.getParent();
						isSuited = false;
						break;
					}
					// check if any parent controller is in selection (allow only for copy...)
					if (!copy) {
						let parent = controller.getParent();
						while (parent && !(parent instanceof GraphController)) {
							if (parent.getModel() === fbItem) {
								this._targetCondition.fallback = parent.getParent();
								isSuited = false;
								break;
							}
							parent = parent.getParent();
						}
					}
				}
			}
			JSG.boxCache.release(controllerbox);
		} else if (this._isOrderTarget(item)) {
			isSuited = true;
		}
		return isSuited;
	}

	_isOrderTarget(item) {
		return (item.getParent() &&
			item.getParent().getLayout() &&
			item.getParent().getLayout().getType() === MatrixLayout.TYPE);
	}

	/**
	 * Checks if given item is suited move target.
	 *
	 * @method _isSuitedTarget
	 * @param {GraphItem} item The item to check.
	 * @return {Boolean} <code>true</code> if given item is suited move target, <code>false</code> otherwise.
	 * @private
	 */
	_isSuitedTarget(item) {
		return (
			item.isVisible() &&
			item.isContainer() &&
			!item.isProtected() &&
			!(item instanceof Graph) &&
			!(item instanceof LineConnection) &&
			!(item instanceof Port) &&
			!JSG.isGroup(item)
		);
	}

	// overwritten...
	createCommand(interaction, event, viewer) {
		let item;
		const items = [];
		const feedbackNodes = [];
		let cmd;
		const cmds = [];
		const fbview = interaction.getFeedback();
		const feedbacks = fbview.getFeedbacks();
		const targetController = this._trgtController;
		const target = targetController ? targetController.getModel() : undefined;

		if (target && !target.isContainer()) {
			if (this._isOrderTarget(target)) {
				feedbacks.forEach((feedback) => {
					item = feedback.getOriginalItem();
					cmds.push(new ChangeItemOrderCommand(item, target.getIndex()));
					if (item.isProtected && item.isProtected()) {
						viewer.getSelectionProvider().clearSelection();
					}
				});
				return this._createCommand(cmds, false);
			}
			viewer.getGraphView().clearFeedback();
			viewer.getSelectionProvider().clearSelection();
			this._isConsumed = true;
			return undefined;
		}

		const isCopyOnMove = this.isCopyOnMoveEvent(interaction, event);
		if (isCopyOnMove) {
			cmd = this.createCopyOnMoveCmd(fbview, target, event, viewer);
		} else {
			// move edges first!!
			let reverseUndo = false;

			feedbacks.forEach((feedback) => {
				item = feedback.getOriginalItem();
				if (this._isMoveable(item, viewer)) {
					if (item instanceof LineConnection) {
						reverseUndo = true;
						cmd = this.createMoveEdgeCmd(interaction, feedback, target, event, viewer);
						if (cmd) {
							cmds.push(cmd);
						}
					} else {
						// nodes.push(item);
						feedbackNodes.push(feedback);
					}
				}
				items.push(item);
			});

			// TODO review: check connections in subfeedbacks...
			// const subfeedbacks = fbview.getSubFeedbacks();
			// if (subfeedbacks.length > 0 && !isCopyOnMove) {
			// moveEdgesInSubfeedback(this._subfeedbacks.elements());
			// }
			// move nodes...
			feedbackNodes.forEach((fbNode) => {
				cmd = this.createMoveItemCmd(interaction, fbNode, target, event, viewer);
				if (cmd) {
					cmds.push(cmd);
				}
			});

			if (targetController) {
				const position = fbview.getLocation(JSG.ptCache.get());
				const index = this._getInsertIndex(targetController, position, viewer);
				if (index || index === 0) {
					const selection = viewer.getSelection()[0];
					if (index.before) {
						cmds.push(new ChangeItemOrderCommand(selection.getModel(), index.index));
					} else {
						cmds.push(new ChangeItemOrderCommand(selection.getModel(), index.index + 1));
					}
				}
				JSG.ptCache.release(position);
			}

			cmd = this._createCommand(cmds, reverseUndo);
			if (cmd instanceof CompoundCommand) {
				cmd.disableRefresh(true);
			}
		}
		return cmd;
	}

	/**
	 * Checks if given item can be moved.
	 *
	 * @method _isMoveable
	 * @param {GraphItem} item The item to check.
	 * @param {ControllerViewer} viewer The currently used ControllerViewer.
	 * @return {Boolean} <code>true</code> if given item can be moved, <code>false</code> otherwise.
	 * @private
	 */
	_isMoveable(item, viewer) {
		let moveable =
			item
				.getItemAttributes()
				.getMoveable()
				.getValue() !== ItemAttributes.Moveable.NONE;
		if (!moveable) {
			// not moveable => check if item is an edge, because we move edges whose source & target nodes are moved
			// too!!
			if (item instanceof Edge) {
				moveable = this._isMoved(item.sourceNode, viewer) && this._isMoved(item.targetNode, viewer);
			}
		}
		return moveable;
	}

	/**
	 * Checks if given item itself or one of its parent is in current selection and therefore moved by this interaction.
	 *
	 * @method _isMoved
	 * @param {GraphItem} item The item to check.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {Boolean} <code>true</code> if given item is moved by this interaction, <code>false</code> otherwise.
	 * @private
	 */
	_isMoved(item, viewer) {
		// an item is moved if either itself or its parent is selected:
		let selected = false;
		while (item) {
			selected = viewer.isSelected(item);
			item = !selected ? item.getParent() : undefined;
		}
		return selected;
	}

	/**
	 * Creates a new copy-on-move command for given feedback view.
	 *
	 * @method createCopyOnMoveCmd
	 * @param {FeedbackView} feedback The feedback to create the copy-on-move command for.
	 * @param {GraphItem} [target] The parent to copy to. Specify <code>undefined</code> if parent
	 *     should not change.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by interaction.
	 * @return {Command} Command to perform the copy-on-move.
	 */
	createCopyOnMoveCmd(feedback, target, event, viewer) {
		const xml = JSG.copyItems(viewer.getSelection());
		const offset = new Point();
		feedback.getLocation(offset).subtract(this._startpos);
		return new PasteItemsCommand(xml, viewer, target, offset);
	}

	/**
	 * Creates a new move command for given feedback which represents a moved {{#crossLink
	 * "LineConnection"}}{{/crossLink}}.
	 *
	 * @method createMoveEdgeCmd
	 * @param {Interaction} interaction The interaction which uses this delegate.
	 * @param {Feedback} feedback The edge feedback to create the move command for.
	 * @param {GraphItem} [target] The parent to move to. Specify <code>undefined</code> if parent
	 *     should not change.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by interaction.
	 * @return {CompoundCommand} Command to perform the move.
	 */
	createMoveEdgeCmd(interaction, feedback, target, event, viewer) {
		let cmd;
		const edge = feedback.getOriginalItem();

		// we may have to detach before move...
		if (edge.sourceNode) {
			if (!this._isMoved(edge.sourceNode, viewer)) {
				// detach from source node...
				cmd = cmd || new CompoundCommand();
				cmd.add(new DetachCommand(edge, edge.getSourcePort()));
			}
		}
		if (edge.targetNode) {
			if (!this._isMoved(edge.targetNode, viewer)) {
				// detach from target node...
				cmd = cmd || new CompoundCommand();
				cmd.add(new DetachCommand(edge, edge.getTargetPort()));
			}
		}
		const movecmd = this.createMoveItemCmd(interaction, feedback, target, event, viewer);
		return cmd ? cmd.add(movecmd) : movecmd;
	}

	/**
	 * Creates a new move command for given feedback.
	 *
	 * @method createMoveItemCmd
	 * @param {Interaction} interaction The interaction which uses this delegate.
	 * @param {Feedback} feedback The feedback to create the move command for.
	 * @param {GraphItem} [target] The parent to move to. Specify <code>undefined</code> if parent
	 *     should not change.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by interaction.
	 * @return {CompoundCommand} Command to perform the move.
	 */
	createMoveItemCmd(interaction, feedback, target, event, viewer) {
		let cmd;
		let fbAngle;
		let pinPoint;

		const translateDown = (item) => {
			item.translateFromParent(pinPoint);
			fbAngle -= item.getAngle();
		};

		// workaround: sometimes inner text labels are within selection, but they don't have a corresponding
		// feedback => ignore this here since its parent is handled sooner or later...
		if (feedback) {
			const item = feedback.getOriginalItem();
			const parent = item.getParent();
			const fbItem = feedback.getFeedbackItem();
			fbAngle = feedback.getAngle();
			pinPoint = fbItem.getPinPoint();
			target = JSG.isGroup(parent) ? parent : target;
			GraphUtils.traverseItemDown(viewer.getGraph(), target || parent, translateDown);
			// target can be undefined, signals no parent change...
			const parentChange = target && target !== parent;
			cmd = new CompoundCommand();
			if (parentChange) {
				// perform parent change:
				cmd.add(new ChangeParentCommand(item, target));
				// and rotate to preserve our orientation...
				const rotAngle = fbAngle - item.getAngle().getValue();
				if (rotAngle) {
					cmd.add(new RotateItemCommand(item, rotAngle));
				}
			}
			// simply set new pin...
			const movecmd = new MoveItemCommand(item, pinPoint);
			cmd.add(movecmd);
		}
		return cmd;
	}

	/**
	 * Creates a new <code>Command</code> or <code>CompoundCommand</code> from the list of given commands.
	 *
	 * @method _createCommand
	 * @param {Array} cmds A list of commands.
	 * @param {Boolean} [reverseUndo] Set to <code>true</code> to traverse Commands in reverse order during undo.
	 * @return {Command|CompoundCommand}
	 * @private
	 */
	_createCommand(cmds, reverseUndo) {
		if (cmds.length === 1) {
			return cmds[0];
		}
		const cmp = new CompoundCommand(reverseUndo);

		cmds.forEach((cmd) => {
			cmp.add(cmd);
		});
		return cmp;
	}
}

export default MoveDelegate;
