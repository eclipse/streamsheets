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
	CompoundCommand,
	SetShapeCommand,
	SetShapePointsCommand,
	GraphUtils,
	Event,
	Point,
	RectangleShape,
	BezierShape,
	EllipseShape,
	PolygonShape
} from '@cedalo/jsg-core';
import Interaction from './Interaction';
import PositionFeedbackView from '../view/PositionFeedbackView';
import EditShapeView from '../view/EditShapeView';
import MouseEvent from '../../ui/events/MouseEvent';
import Cursor from '../../ui/Cursor';

// INNER CLASS
/**
 * Inner class used to listen for events with id of {{#crossLink
 * "Event/SHAPE:property"}}{{/crossLink}}.
 *
 * @class ShapeListener
 * @constructor
 * @param {EditShapeInteraction} interaction The base interaction to be updated.
 */
class EditShapeListener {
	constructor(interaction) {
		this._interaction = interaction;
	}

	handlePreEvent(event) {}

	handlePostEvent(event) {
		this._interaction.setPointList(this._interaction._item._shape.getPointList());
	}
}


/**
 * Interaction that handles the editing of points of a {{#crossLink "GraphItem"}}{{/crossLink}}s
 * {{#crossLink "Shape"}}{{/crossLink}}.<br/>
 * See {{#crossLink "EditLineShapeInteraction"}}{{/crossLink}} and
 * {{#crossLink "EditBezierShapeInteraction"}}{{/crossLink}} for specialized subclasses.
 *
 * @class EditShapeInteraction
 * @extends Interaction
 * @constructor
 */
class EditShapeInteraction extends Interaction {
	constructor() {
		super();
		this._view = undefined;
		this._item = undefined;
		this._marker = undefined;
		this._editview = undefined;
		this._selection = undefined;
		this._shapeListener = this.createShapeListener();
	}

	activate(viewer) {
		function getSelection() {
			const selectionProvider = viewer.getSelectionProvider();
			return selectionProvider.hasSingleSelection() ? selectionProvider.getFirstSelection() : undefined;
		}

		// get selection
		this._selection = getSelection();
		if (this._selection) {
			this._view = this._selection.getView();
			this._graphView = viewer.getGraphView();
			this._item = this._view._item;
			// this._item.addPropertyListener(this);
			this._item.addEventListener(Event.SHAPE, this._shapeListener);
			this._editview = this.createEditShapeView(viewer.getCoordinateSystem());
			this.initEditView(this._editview);

			viewer.clearSelection();
			viewer.setOverlayView(this._editview);
			this.getInteractionHandler().repaint();
		} else {
			this.didFinish(undefined, viewer);
		}
	}

	/**
	 * Creates a listener to use for getting notified about any shape changes.<br/>
	 * Subclasses may overwrite to create a custom listener.
	 *
	 * @method createShapeListener
	 * @return {Object} A listener object.
	 */
	createShapeListener() {
		return new EditShapeListener(this);
	}

	/**
	 * Creates a new {{#crossLink "EditShapeView"}}{{/crossLink}} to use.<br/>
	 * Subclasses can overwrite to create a custom view.
	 *
	 * @method createEditShapeView
	 * @param {CoordinateSystem} coordinatesystem The CoordinateSystem use for measurement calculations.
	 * @return {EditShapeView} The new edit view.
	 */
	createEditShapeView(coordinatesystem) {
		return new EditShapeView(coordinatesystem);
	}

	/**
	 * Initialize the {{#crossLink "EditShapeView"}}{{/crossLink}} to use.<br/>
	 * Subclasses can overwrite to perform custom initialization.
	 *
	 * @method initEditView
	 * @param {EditShapeView} editview The view to initialize.
	 */
	initEditView(editview) {
		editview.setIsClosed(this._item.isClosed());
		this.setPointList(this._item._shape.getPointList());
	}

	deactivate(viewer) {
		viewer.removeOverlayView();
		if (this._item) {
			// this._item.removePropertyListener(this);
			this._item.removeEventListener(Event.SHAPE, this._shapeListener);
			this._item = undefined;
		}
		this._view = undefined;
		this._marker = undefined;
		this._editview = undefined;
		this._selection = undefined;
		super.deactivate(viewer);
	}

	createActionFeedback(event, viewer) {
		const feedback = new PositionFeedbackView();
		const loc = event.location.copy();
		viewer.translateFromParent(loc);
		feedback.setPosition(loc);

		return feedback;
	}

	updateActionFeedback(event, viewer) {
		if (this.actionFeedback) {
			const loc = event.location.copy();
			viewer.translateFromParent(loc);
			this.actionFeedback.setPosition(loc);
		}
	}

	/**
	 * Updates the points managed by corresponding {{#crossLink "EditShapeView"}}{{/crossLink}}.
	 *
	 * @method setPointList
	 * @param {PointList} pointlist The new points to use.
	 */
	setPointList(pointlist) {
		if (!pointlist || pointlist.isEmpty()) {
			return;
		}
		const origin = this._item.getOrigin();
		const angle = this.translateOriginAndAngle(origin, this._item.getAngle().getValue());
		this._editview.setPointList(pointlist, origin, angle);
	}

	/**
	 * Translates given origin and angle to the top {{#crossLink "GraphView"}}{{/crossLink}}.
	 *
	 * @method translateOriginAndAngle
	 * @param {Point} origin The origin to translate.
	 * @param {Number} angle The angle to translate in radiant.
	 * @return {Number} The translated angle in radiant.
	 */
	translateOriginAndAngle(origin, angle) {
		const toView = this._graphView;
		const fromView = this._view.getParent();

		GraphUtils.traverseUp(fromView, toView, (view) => {
			view.translateToParent(origin);
			angle += view.getAngle();
			return true;
		});
		return angle;
	}

	/**
	 * Returns the Marker for specified location or <code>undefined</code> if no marker could be found.
	 *
	 * @method getMarkerAt
	 * @param {Point} location The marker location.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {ShapeMarker} The Marker or <code>undefined</code>.
	 */
	getMarkerAt(location, viewer) {
		if (this._editview) {
			const tolerance = viewer.getGraph().getFindRadius();
			this._editview.translatePoint(location);
			return this._editview.getMarkerAt(location, tolerance);
		}
		return undefined;
	}

	onKeyDown(event, viewer) {
		if (event.event.ctrlKey) {
			switch (event.event.keyCode) {
				case 90 /* ctrl+z */:
					this.getInteractionHandler().undo();
					break;
				case 89 /* ctrl+y */:
					this.getInteractionHandler().redo();
					break;
			}
		}
	}

	onMouseDown(event, viewer) {
		this.setCurrentMarker(event, viewer);

		if (this._marker) {
			if (!this.actionFeedback) {
				this.actionFeedback = this.createActionFeedback(event, viewer);
				this.updateActionFeedback(event, viewer);
				viewer.addInteractionFeedback(this.actionFeedback);
			}
		} else {
			this.didFinish(event, viewer);
		}
	}

	onMouseMove(event, viewer) {
		this.setCurrentMarker(event, viewer);
	}

	/**
	 * Sets the currently active marker.
	 *
	 * @method setCurrentMarker
	 * @param {ClientEvent} event The current event which specifies the marker location.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	setCurrentMarker(event, viewer) {
		const tmppoint = new Point(0, 0);

		tmppoint.setTo(event.location);

		viewer.translateFromParent(tmppoint);
		this._marker = this.getMarkerAt(tmppoint, viewer);

		if (this._marker) {
			const cursor = this._marker.index === -1 ? Cursor.Style.CROSS : Cursor.Style.MOVE;
			this.getInteractionHandler().setCursor(cursor);
		} else {
			this.getInteractionHandler().setCursor(Cursor.Style.AUTO);
		}
	}

	onMouseDrag(event, viewer) {
		if (this._marker) {
			if (this._marker.index === -1) {
				this._marker = this._editview.insertMarker(this._marker);
			}
			// drag da marker....
			const tmppoint = this.alignToGrid(this.currentLocation.copy(), viewer, event.event.altKey);

			this._editview.translatePoint(tmppoint);
			this._marker.setCenterTo(tmppoint);

			this.updateActionFeedback(event, viewer);
		}
	}

	onMouseUp(event, viewer) {
		if (this._marker) {
			this._performChange();
		}
	}

	/**
	 * Deletes given marker from used {{#crossLink "EditShapeView"}}{{/crossLink}}.
	 *
	 * @method deleteMarker
	 * @param {ShapeMarker} marker The marker to delete.
	 * @return {Boolean} <code>true</code> if marker was deleted, <code>false</code> otherwise.
	 */
	deleteMarker(marker) {
		// we keep at least 2 markers!!!
		if (marker && this._editview.getMarkerCount() > 2) {
			this._editview.deleteMarker(marker);
			this._performChange();
			return true;
		}
		return false;
	}

	/**
	 * Called to mark the {{#crossLink "Shape"}}{{/crossLink}} as closed or open.
	 *
	 * @method close
	 * @param {Boolean} doIt Specify <code>true</code> to mark the Shape as closed.
	 */
	close(doIt) {
		const interactionHandler = this.getInteractionHandler();
		if (interactionHandler) {
			this._editview.setIsClosed(doIt);
		}
	}

	/**
	 * Creates and performs necessary commands to change the {{#crossLink
	 * "Shape"}}{{/crossLink}} points.
	 *
	 * @method _performChange
	 * @private
	 */
	_performChange() {
		const interactionHandler = this.getInteractionHandler();
		if (interactionHandler) {
			const cmd = this._createCustomCompoundCommand();
			const shapeType = this._item._shape.getType();
			// check shape: change it if necessary
			const changeShapeTypeCmd = this._createSwitchShapeCommandIfNecessary(this._item, shapeType);
			if (changeShapeTypeCmd) {
				cmd.add(changeShapeTypeCmd);
			}
			cmd.add(this._createEditShapeCommand(this._item, this._editview.getMarkerPoints()));
			interactionHandler.execute(cmd);
			this.actionFeedback = undefined;
		}
	}

	/**
	 * Creates a custom CompoundCommand for this interaction.<br/>
	 * The returned command will prevent the new selection setting after command is executed because shape editing
	 * should not stop.
	 *
	 * @method _createCustomCompoundCommand
	 * @return {Command} An adjusted CompoundCommand
	 * @private
	 */
	_createCustomCompoundCommand() {
		const cmd = new CompoundCommand();
		// overwritten, because we don't want to set selection if we are still editing points...
		cmd.doAfterUndo = (selection, viewer) => {
			if (viewer.getGraphicSystem) {
				const interactionHandler = viewer.getGraphicSystem().interactionHandler;
				if (interactionHandler && cmd._interaction !== interactionHandler.getActiveInteraction()) {
					Object.getPrototypeOf(cmd).doAfterUndo.call(cmd, selection, viewer);
				}
			}
		};

		// overwritten, because we don't want to set selection if we are still editing points...
		cmd.doAfterRedo = (selection, viewer) => {
			if (viewer.getGraphicSystem) {
				const interactionHandler = viewer.getGraphicSystem().interactionHandler;
				if (interactionHandler && cmd._interaction !== interactionHandler.getActiveInteraction()) {
					Object.getPrototypeOf(cmd).doAfterRedo.call(cmd, selection, viewer);
				}
			}
		};

		return cmd;
	}

	/**
	 * Checks if the {{#crossLink "Shape"}}{{/crossLink}} of given GraphItem must be changed.
	 * In case it should the corresponding command will be returned or otherwise <code>undefined</code>
	 *
	 * @method _createSwitchShapeCommandIfNecessary
	 * @param {GraphItem} item The GraphItem to check the shape of.
	 * @param {String} shapeType The shape type as returned by {{#crossLink
	 *     "Shape/getType:method"}}{{/crossLink}}.
	 * @return {Command} The command to change item shape or <code>undefined</code>
	 * @private
	 */
	_createSwitchShapeCommandIfNecessary(item, shapeType) {
		let cmd;
		let newShape;

		if (RectangleShape.TYPE === shapeType) {
			// switch shape to polygon:
			newShape = new PolygonShape(true);
			newShape.setCoordinates(item._shape.getCoordinates());
			cmd = new SetShapeCommand(item, newShape);
		} else if (EllipseShape.TYPE === shapeType) {
			// switch shape to bezier:
			newShape = new BezierShape(true);
			newShape.setCoordinates(item._shape.getCoordinates());
			cmd = new SetShapeCommand(item, newShape);
		}
		return cmd;
	}

	/**
	 * Creates the command for setting specified {{#crossLink "Point"}}{{/crossLink}}s to given item.<br/>
	 * Subclasses can overwrite to return a custom command.
	 *
	 * @method _createEditShapeCommand
	 * @param {GraphItem} item The GraphItem to set the points of.
	 * @param {Array} points An array of points to set.
	 * @return {Command} The command to set item points.
	 * @private
	 */
	_createEditShapeCommand(item, points) {
		return new SetShapePointsCommand(this._item, points);
	}

	cancelInteraction(event, viewer) {
		if (event) {
			event.doRepaint = true;
		}
		this.setCursor(Cursor.Style.AUTO);
		super.cancelInteraction(event, viewer);
	}

	didFinish(event, viewer) {
		const selection = this._selection;
		// store locally because we are deactivated in super.didFinish
		super.didFinish(event, viewer);
		if (event instanceof MouseEvent && !event.isConsumed) {
			// pass event directly to interaction, so (e.g.) a selection is directly processed...
			const interactionHandler = this.getInteractionHandler();
			interactionHandler.handleMouseEvent(event);
		} else if (selection) {
			// simply select current item:
			viewer.select(selection);
		}
	}
}

export default EditShapeInteraction;
