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
import { default as JSG, Point } from '@cedalo/jsg-core';
import AbstractInteraction from './AbstractInteraction';
import MoveDelegate from './MoveDelegate';

/**
 * Interaction to handle movement of {{#crossLink "GraphItem"}}{{/crossLink}}s.</br>
 * Movement is done either by mouse/touch drag or cursor keys. Copy on move is supported too and is
 * triggered by the <code>ctrl</code> key.</br></br>
 * This interaction uses a {{#crossLink "MoveDelegate"}}{{/crossLink}} which can be subclassed
 * to customize the move behavior. To register a custom delegate use
 * {{#crossLink "MoveInteraction.Drop/setDelegate:method"}}{{/crossLink}}.
 *
 * @class MoveInteraction
 * @extends AbstractInteraction
 * @constructor
 */
// TODO review: still extend AbstractInteraction?
class MoveInteraction extends AbstractInteraction {
	constructor() {
		super();

		this._keyOffset = undefined;
		this._feedback = undefined;
		this._fbCenter = new Point();
		this._delegate = new MoveDelegate();
	}

	deactivate(viewer) {
		this._feedback = undefined;
		this._fbCenter = undefined;
		this._keyOffset = undefined;
		this._delegate.getSnapHelper().release(viewer);
		viewer.getSelectionView().setVisible(true);
		super.deactivate(viewer);
	}

	/**
	 * Sets the move delegate for this interaction.</br>
	 *
	 * @method setDelegate
	 * @param {MoveDelegate} delegate A delegate object to customize interaction.
	 */
	setDelegate(delegate) {
		if (delegate instanceof MoveDelegate) {
			this._delegate = delegate;
		}
	}

	/**
	 * Returns the used feedback view.
	 *
	 * @method getFeedback
	 * @return {FeedbackView} The feedback view used by this interaction or <code>undefined</code>.
	 */
	getFeedback() {
		return this._feedback;
	}

	setStartLocation(point) {
		// ignore new start location if we are in key movement...
		if (!this._keyOffset) {
			super.setStartLocation(point);
		}
	}

	/**
	 * Called to create a move feedback view.<br/>
	 * Note: this method calls {{#crossLink
	 * "MoveDelegate/createFeedback:method"}}{{/crossLink}}<br/>
	 *
	 * @method _createMoveFeedback
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The used ControllerViewer.
	 * @return {FeedbackView} The feedback view to visualize the move interaction.
	 * @private
	 */
	_createMoveFeedback(event, viewer) {
		// pass start location on creation:
		this._feedback = this._feedback || this._delegate.createFeedback(this, event, viewer);
		viewer.clearInteractionFeedback();
		viewer.addInteractionFeedback(this._feedback);
		// store feedback center to check on interaction finish...
		const fbbox = this._feedback.getBoundingBox(JSG.boxCache.get());
		fbbox.getCenter(this._fbCenter, true);
		JSG.boxCache.release(fbbox);
	}

	onKeyDown(event, viewer) {
		if (!this._keyOffset && !this._feedback) {
			switch (event.event.keyCode) {
				case 37:
				case 38:
				case 39:
				case 40:
					this._keyOffset = new Point(0, 0);
					this._createMoveFeedback(event, viewer);
					break;
			}
		}

		if (this._keyOffset) {
			switch (event.event.keyCode) {
				case 37: // left arrow:
					this._keyOffset.x -= event.event.shiftKey
						? 1000
						: event.event.ctrlKey
						? event.cs.deviceToLogX(1)
						: viewer.getGraphSettings().getSnapStep();
					break;
				case 38: // up arrow:
					this._keyOffset.y -= event.event.shiftKey
						? 1000
						: event.event.ctrlKey
						? event.cs.deviceToLogX(1)
						: viewer.getGraphSettings().getSnapStep();
					break;
				case 39: // right arrow
					this._keyOffset.x += event.event.shiftKey
						? 1000
						: event.event.ctrlKey
						? event.cs.deviceToLogX(1)
						: viewer.getGraphSettings().getSnapStep();
					break;
				case 40: // down arrow:
					this._keyOffset.y += event.event.shiftKey
						? 1000
						: event.event.ctrlKey
						? event.cs.deviceToLogX(1)
						: viewer.getGraphSettings().getSnapStep();
					break;
			}
			const position = JSG.ptCache.get().setTo(this.startLocation);
			this._moveFeedback(position.add(this._keyOffset), event, viewer);
			JSG.ptCache.release(position);
			event.doRepaint = true;
		}
	}

	onKeyUp(event, viewer) {
		if (this._keyOffset) {
			switch (event.event.keyCode) {
				case 37: // left arrow:
				case 38: // up arrow:
				case 39: // right arrow
				case 40: // down arrow:
					this.finishInteraction(event, viewer);
					event.doRepaint = true;
					break;
			}
		}

		// to disable showing of menu in ie
		event.doPreventDefault = true;
	}

	onMouseDown(event, viewer) {
		if (!this._keyOffset) {
			this._createMoveFeedback(event, viewer);
			this._delegate.getSnapHelper().init(viewer);
		}
	}

	onMouseDrag(event, viewer) {
		if (this._feedback && !this._keyOffset) {

			// check if selected in content pane
			if (this._delegate._isFeedbackScrollable(this._feedback, event, viewer)) {
				return;
			}

			const position = JSG.ptCache.get().setTo(this.currentLocation);
			this._moveFeedback(position, event, viewer);
			JSG.ptCache.release(position);
		}
	}

	/**
	 * Called to update move feedback view.<br/>
	 * Note: this method calls following delegate methods:<br/>
	 * {{#crossLink "MoveDelegate/setDoSnap:method"}}{{/crossLink}}<br/>
	 * {{#crossLink "MoveDelegate/setDoHighlightTarget:method"}}{{/crossLink}}<br/>
	 * {{#crossLink "MoveDelegate/updateFeedback:method"}}{{/crossLink}}<br/>
	 *
	 * @method _moveFeedback
	 * @param {Point} position The location to move to.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The used ControllerViewer.
	 * @private
	 */
	_moveFeedback(position, event, viewer) {
		// we don't want to signal a copy of sub-feedbacks to user, so:
		if (this._feedback.doDrawSubFeedbacks) {
			this._feedback.doDrawSubFeedbacks = !this.isCopyOnMoveEvent(event);
		}
		this._delegate.setDoSnap(!this._keyOffset);
		this._delegate.setDoHighlightTarget(!this._keyOffset);
		this._delegate.updateFeedback(this, position, event, viewer);
	}

	onMouseExit(event, viewer) {
		if (!this._keyOffset) {
			this.cancelInteraction(event, viewer);
		}
	}

	onMouseUp(event, viewer) {
		const position = this.currentLocation.copy();
		// update feedback to last location...
		this._moveFeedback(position, event, viewer);
		if (!this._keyOffset) {
			super.onMouseUp(event, viewer);
			if (!event.isConsumed) {
				// pass this event to active interaction handler...
				this.getInteractionHandler().handleMouseEvent(event);
			}
		}
		this._delegate.deactivateTimer();
	}

	willFinish(event, viewer, offset) {
		// did we moved far enough?
		const fbbox = this._feedback.getBoundingBox(JSG.boxCache.get());
		const fbcenter = fbbox.getCenter(JSG.ptCache.get(), true);
		const threshold =
			event instanceof JSG.KeyEvent
				? 0
				: viewer.getCoordinateSystem().metricToLogXNoZoom(MoveInteraction.MOVE_THRESHOLD);
		const finished =
			(this._delegate.snapped || fbcenter.subtract(this._fbCenter).length() > threshold) &&
			this._finishMove(event, viewer);
		JSG.ptCache.release(fbcenter);
		JSG.boxCache.release(fbbox);
		event.isConsumed = finished || this._delegate._isConsumed;
		if (!finished) {
			this.cancelInteraction(event, viewer);
		}
	}

	/**
	 * Called on finish to perform the move.<br/>
	 * Note: this method calls {{#crossLink "MoveDelegate/createCommand:method"}}{{/crossLink}}.
	 *
	 * @method _finishMove
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The used ControllerViewer.
	 * @private
	 */
	_finishMove(event, viewer) {
		const interactionHandler = this.getInteractionHandler();
		const moveCmd = this._delegate.createCommand(this, event, viewer);
		if (moveCmd && interactionHandler) {
			interactionHandler.execute(moveCmd);
			return true;
		}
		return false;
	}

	/**
	 * Checks if given event defines a copy-on-move event.<br/>
	 * Note: this method calls {{#crossLink
	 * "MoveDelegate/isCopyOnMoveEvent:method"}}{{/crossLink}}.
	 *
	 * @method isCopyOnMoveEvent
	 * @param {ClientEvent} event The event to check.
	 * @return {Boolean} <code>true</code> if given event defines a copy-on-move event, <code>false</code> otherwise.
	 */
	isCopyOnMoveEvent(event) {
		return this._delegate.isCopyOnMoveEvent(this, event) && !this._keyOffset;
	}

	// overwritten to keep active handle -> we maybe want to move again!
	didFinish(event, viewer) {
		super.didFinish(event, viewer);
		const activeInteraction = this.getInteractionHandler().getActiveInteraction();
		if (activeInteraction && activeInteraction._setActiveHandle && viewer.hasSelection()) {
			const loc = this.currentLocation.copy();
			viewer.getSelectionView().refresh();
			activeInteraction._setActiveHandle(viewer.getHandleAt(loc, event));
		}
		this._delegate.deactivateTimer();
	}

	/**
	 * Threshold which defines when an interaction is recognized as a move.
	 *
	 * @property MOVE_THRESHOLD
	 * @type {Number}
	 * @static
	 */
	static get MOVE_THRESHOLD() {
		return 50;
	}
}

export default MoveInteraction;
