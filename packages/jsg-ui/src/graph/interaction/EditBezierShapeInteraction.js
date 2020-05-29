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
	GraphUtils,
	BezierLineShape,
	BezierShape,
	EllipseShape,
	LineShape,
	PolygonShape,
	SetShapeCommand,
	SetLineShapePointsCommand,
	InsertShapeCoordinateAtCommand,
	RemoveShapeCoordinateAtCommand,
	SetBezierLineShapePointCommand,
	SetBezierShapePointsCommand,
	BezierCoordinate,
	DetachCommand,
	ShapeEvent,
	RectangleShape,
	Point
} from '@cedalo/jsg-core';
import EditShapeInteraction from './EditShapeInteraction';
import EditBezierShapeView from '../view/EditBezierShapeView';
import Cursor from '../../ui/Cursor';


// INNER CLASS
/**
 * Inner class used to listen for events with id of {{#crossLink
 * "Event/SHAPE:property"}}{{/crossLink}}.
 *
 * @class EditBezierShapeListener
 * @constructor
 * @param {EditBezierShapeInteraction} interaction The base interaction to be updated.
 */
class EditBezierShapeListener {
	constructor(interaction) {
		this._interaction = interaction;
	}

	handlePreEvent(event) {}

	handlePostEvent(event) {
		const shape = this._interaction._item._shape;
		switch (event.detailId) {
		case ShapeEvent.COORDS_SET_CPFROM:
			this._interaction.setCpFromPointList(shape.getCpFromPointList());
			break;
		case ShapeEvent.COORDS_SET_CPTO:
			this._interaction.setCpToPointList(shape.getCpToPointList());
			break;
		case ShapeEvent.COORDS_INSERT_AT:
		case ShapeEvent.COORDS_REMOVE_AT:
			this._interaction.setCpToPointList(shape.getCpToPointList());
			this._interaction.setCpFromPointList(shape.getCpFromPointList());
			this._interaction.setPointList(shape.getPointList());
			break;
		default:
			this._interaction.setPointList(shape.getPointList());
			break;
		}
	}
}

/**
 * A EditShapeInteraction subclass to edit the points of a {{#crossLink
 * "BezierShape"}}{{/crossLink}}.<br/>
 *
 * @class EditBezierShapeInteraction
 * @extends EditShapeInteraction
 * @constructor
 */
class EditBezierShapeInteraction extends EditShapeInteraction {
	createShapeListener() {
		return new EditBezierShapeListener(this);
	}

	createEditShapeView(coordinatesystem) {
		return new EditBezierShapeView(coordinatesystem);
	}

	initEditView(editview) {
		super.initEditView(editview);
		this.setCpFromPointList(this._item._shape.getCpFromPointList());
		this.setCpToPointList(this._item._shape.getCpToPointList());
	}

	/**
	 * Sets the control points &quot;before&quot; each line point
	 *
	 * @method setCpToPointList
	 * @param {PointList} cpToList The new control points to use.
	 */
	setCpToPointList(cpToList) {
		if (!cpToList || cpToList.isEmpty()) {
			return;
		}

		const origin = this._item.getOrigin();
		const angle = this.translateOriginAndAngle(origin, this._item.getAngle().getValue());
		this._editview.setCpToPointList(cpToList, origin, angle);
	}

	/**
	 * Sets the control points &quot;after&quot; each line point
	 *
	 * @method setCpFromPointList
	 * @param {PointList} cpFromList The new control points to use.
	 */
	setCpFromPointList(cpFromList) {
		if (!cpFromList || cpFromList.isEmpty()) {
			return;
		}

		const origin = this._item.getOrigin();
		const angle = this.translateOriginAndAngle(origin, this._item.getAngle().getValue());
		this._editview.setCpFromPointList(cpFromList, origin, angle);
	}

	/**
	 * Returns the control point &quot;after&quot; the {{#crossLink
	 * "ShapeMarker"}}{{/crossLink}} at given location.
	 *
	 * @method getCpFromMarkerAt
	 * @param {Point} location The marker location.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {Point} The control point or <code>undefined</code> if none could be found.
	 */
	getCpFromMarkerAt(location, viewer) {
		if (this._editview) {
			const tolerance = viewer.getGraph().getFindRadius();
			this._editview.translatePoint(location);
			return this._editview.getCpFromMarkerAt(location, tolerance);
		}
		return undefined;
	}

	/**
	 * Returns the control point &quot;before&quot; the {{#crossLink
	 * "ShapeMarker"}}{{/crossLink}} at given location.
	 *
	 * @method getCpToMarkerAt
	 * @param {Point} location The marker location.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {Point} The control point or <code>undefined</code> if none could be found.
	 */
	getCpToMarkerAt(location, viewer) {
		if (this._editview) {
			const tolerance = viewer.getGraph().getFindRadius();
			this._editview.translatePoint(location);
			return this._editview.getCpToMarkerAt(location, tolerance);
		}
		return undefined;
	}

	onMouseDown(event, viewer) {
		this.setCurrentMarker(event, viewer);

		if (!this._marker && !this._cpFromMarker && !this._cpToMarker) {
			this.didFinish(event, viewer);
		} else if (!this.actionFeedback) {
			this.actionFeedback = this.createActionFeedback(event, viewer);
			this.updateActionFeedback(event, viewer);
			viewer.addInteractionFeedback(this.actionFeedback);
		}
	}

	setCurrentMarker(event, viewer) {
		let cursor = Cursor.Style.AUTO;
		const tmppoint = new Point(0, 0);
		const location = new Point(0, 0);

		tmppoint.setTo(event.location);
		viewer.translateFromParent(tmppoint);

		this._marker = undefined;
		this._cpFromMarker = undefined;
		this._cpToMarker = undefined;

		this._cpFromMarker = this.getCpFromMarkerAt(location.setTo(tmppoint), viewer);
		if (this._cpFromMarker) {
			cursor = Cursor.Style.MOVE;
		} else {
			this._cpToMarker = this.getCpToMarkerAt(location.setTo(tmppoint), viewer);
			if (this._cpToMarker) {
				cursor = Cursor.Style.MOVE;
			} else {
				this._marker = this.getMarkerAt(location.setTo(tmppoint), viewer);
				if (this._marker) {
					cursor = this._marker.index === -1 ? Cursor.Style.CROSS : Cursor.Style.MOVE;
				}
			}
		}

		this.getInteractionHandler().setCursor(cursor);
	}

	onMouseDrag(event, viewer) {
		const tmppoint = this.alignToGrid(this.currentLocation.copy(), viewer, event.event.altKey);

		this._editview.translatePoint(tmppoint);

		if (this._cpFromMarker) {
			this._cpFromMarker.setCenterTo(tmppoint);
		} else if (this._cpToMarker) {
			this._cpToMarker.setCenterTo(tmppoint);
		} else if (this._marker) {
			let newMarker = false;

			if (this._marker.index === -1) {
				this._marker = this._editview.insertMarker(this._marker);
				this._marker.isTemporary = false;
				newMarker = true;
			}
			// drag da marker....
			const old = this._marker.center.copy();
			this._marker.setCenterTo(tmppoint);

			// drag also control points with marker
			const offset = this._marker.center.copy();
			offset.subtract(old);

			const index = this._marker.index;
			const cpToMarker = this._editview.getCpToMarker(index);
			const cpFromMarker = this._editview.getCpFromMarker(index);

			if (newMarker) {
				// new point -> set initial control points coordinates
				const markerPre = this._editview.getMarker(index - 1);
				let markerPost;

				if (index === this._editview.getMarkerCount() - 1) {
					markerPost = this._editview.getMarker(0);
				} else {
					markerPost = this._editview.getMarker(index + 1);
				}

				const locPre = markerPre.getLocation(new Point(0, 0));
				const locPost = markerPost.getLocation(new Point(0, 0));
				const xDiff = (locPost.x - locPre.x) * 0.2;
				const yDiff = (locPost.y - locPre.y) * 0.2;

				cpFromMarker.setLocation(tmppoint.x - xDiff, tmppoint.y - yDiff);
				cpToMarker.setLocation(tmppoint.x + xDiff, tmppoint.y + yDiff);
			} else {
				let loc = cpToMarker.getLocation(new Point(0, 0));
				loc.add(offset);
				cpToMarker.setLocationTo(loc);

				loc = cpFromMarker.getLocation(loc);
				loc.add(offset);
				cpFromMarker.setLocationTo(loc);
			}
		}

		this.updateActionFeedback(event, viewer);
	}

	onMouseUp(event, viewer) {
		if (this._marker || this._cpFromMarker || this._cpToMarker) {
			this._performChange();
		}
	}

	deleteMarker(marker) {
		// we keep at least 2 markers!!!
		if (marker && this._editview.getMarkerCount() > 2) {
			const index = marker.index;
			const cpToMarker = this._editview.getCpToMarker(index);
			const cpFromMarker = this._editview.getCpFromMarker(index);

			this._editview.deleteMarker(marker);
			this._editview.deleteCpFromMarker(cpFromMarker);
			this._editview.deleteCpToMarker(cpToMarker);

			this._performChange(index);
			return true;
		}
		return false;
	}

	/**
	 * Changes the control points before and after given marker to be more angular to current line.
	 *
	 * @method changeMarkerToEdge
	 * @param {ShapeMarker} marker The marker which specifies the control points to use.
	 * @return {Boolean} <code>true</code> if control points where changed, <code>false</code> otherwise.
	 */
	changeMarkerToEdge(marker) {
		if (!marker) {
			return false;
		}
		const index = marker.index;
		const cpToMarker = this._editview.getCpToMarker(index);
		const cpFromMarker = this._editview.getCpFromMarker(index);
		let markerPre;
		let markerPost;

		if (index) {
			markerPre = this._editview.getMarker(index - 1);
		} else {
			markerPre = this._editview.getMarker(this._editview.getMarkerCount() - 1);
		}

		if (index === this._editview.getMarkerCount() - 1) {
			markerPost = this._editview.getMarker(0);
		} else {
			markerPost = this._editview.getMarker(index + 1);
		}

		const loc = marker.getCenter(new Point(0, 0));
		const locPre = markerPre.getCenter(new Point(0, 0));
		const locPost = markerPost.getCenter(new Point(0, 0));

		locPre.x = loc.x - (loc.x - locPre.x) * 0.3;
		locPre.y = loc.y - (loc.y - locPre.y) * 0.3;

		locPost.x = loc.x + (locPost.x - loc.x) * 0.3;
		locPost.y = loc.y + (locPost.y - loc.y) * 0.3;

		cpFromMarker.setCenter(locPre.x, locPre.y);
		cpToMarker.setCenter(locPost.x, locPost.y);

		this._performChange();
		return true;
	}

	/**
	 * Changes the control points before and after given marker to be more round to current line.
	 *
	 * @method changeMarkerToCurve
	 * @param {ShapeMarker} marker The marker which specifies the control points to use.
	 * @return {Boolean} <code>true</code> if control points where changed, <code>false</code> otherwise.
	 */
	changeMarkerToCurve(marker) {
		if (!marker) {
			return false;
		}

		const index = marker.index;
		const cpToMarker = this._editview.getCpToMarker(index);
		const cpFromMarker = this._editview.getCpFromMarker(index);
		let markerPre;
		let markerPost;

		if (index) {
			markerPre = this._editview.getMarker(index - 1);
		} else {
			markerPre = this._editview.getMarker(this._editview.getMarkerCount() - 1);
		}

		if (index === this._editview.getMarkerCount() - 1) {
			markerPost = this._editview.getMarker(0);
		} else {
			markerPost = this._editview.getMarker(index + 1);
		}

		const loc = marker.getCenter(new Point(0, 0));
		const locPre = markerPre.getCenter(new Point(0, 0));
		const locPost = markerPost.getCenter(new Point(0, 0));

		cpFromMarker.setCenter(loc.x - (locPost.x - locPre.x) * 0.3, loc.y - (locPost.y - locPre.y) * 0.3);
		cpToMarker.setCenter(loc.x + (locPost.x - locPre.x) * 0.3, loc.y + (locPost.y - locPre.y) * 0.3);

		this._performChange();

		return true;
	}

	// index parameter is optional: e.g. indicates index of removed marker...
	_performChange(index) {
		const interactionHandler = this.getInteractionHandler();

		function switchShapeIfNecessary(item, shapeType, cmd) {
			let newShape;
			// TODO rewrite
			switch (shapeType) {
				case RectangleShape.TYPE:
					// switch shape to polygon:
					newShape = new PolygonShape();
					newShape.setCoordinates(item._shape.getCoordinates());
					cmd.add(new SetShapeCommand(item, newShape));
					break;
				case EllipseShape.TYPE:
					// switch shape to bezier:
					newShape = new BezierShape();
					newShape.setCoordinates(item._shape.getCoordinates());
					newShape.setCpFromCoordinates(item._shape.getCpFromCoordinates());
					newShape.setCpToCoordinates(item._shape.getCpToCoordinates());
					cmd.add(new SetShapeCommand(item, newShape));
					break;
			}
		}

		if (interactionHandler) {
			// check shape: necessary
			const shapeType = this._item._shape.getType();
			const cmd = this._createCustomCompoundCommand();
			index = arguments.length > 0 ? index : -1;
			switchShapeIfNecessary(this._item, shapeType, cmd);
			if (shapeType === LineShape.TYPE) {
				const graph = this._graphView;
				const parent = this._view.getParent();
				const points = this._editview.getMarkerPoints(true);
				// translate down to item parent...
				points.forEach((point) => {
					GraphUtils.traverseDown(graph, parent, (view) => {
						view.translateFromParent(point);
						return true;
					});
				});
				cmd.add(new SetLineShapePointsCommand(this._item, points));
			} else if (shapeType === BezierLineShape.TYPE) {
				// did we add a new point to bezier curve...
				if (this._editview.getMarkerCount() > this._item.getPointsCount()) {
					index = this._marker.index;
					const newcoord = new BezierCoordinate();
					newcoord.setToPoint(this._marker.center);
					newcoord.cpTo.setToPoint(this._editview.getCpToMarker(index).center);
					newcoord.cpFrom.setToPoint(this._editview.getCpFromMarker(index).center);
					if (index > -1) {
						cmd.add(new InsertShapeCoordinateAtCommand(this._item, index, newcoord));
					}
				} else if (this._editview.getMarkerCount() < this._item.getPointsCount()) {
					if (index > -1) {
						// we we removed first or last coordinate we might must detach from port...
						if (index === 0 && this._item.getSourcePort()) {
							cmd.add(new DetachCommand(this._item, this._item.getSourcePort()));
						} else if (index === this._item.getPointsCount() - 1 && this._item.getTargetPort()) {
							cmd.add(new DetachCommand(this._item, this._item.getTargetPort()));
						}
						cmd.add(new RemoveShapeCoordinateAtCommand(this._item, index));
					}
				} else {
					const newpt = this._marker ? this._marker.center.copy() : undefined;
					const newfirstpt = this._cpToMarker ? this._cpToMarker.center.copy() : undefined;
					const newsecondpt = this._cpFromMarker ? this._cpFromMarker.center.copy() : undefined;
					index = newpt
						? this._marker.index
						: newfirstpt
						? this._cpToMarker.index
						: newsecondpt
						? this._cpFromMarker.index
						: -1;
					if (index > -1) {
						cmd.add(new SetBezierLineShapePointCommand(this._item, index, newpt, newfirstpt, newsecondpt));
					}
				}
			} else {
				cmd.add(
					new SetBezierShapePointsCommand(
						this._item,
						this._editview.getMarkerPoints(false),
						this._editview.getCpFromMarkerPoints(false),
						this._editview.getCpToMarkerPoints(false)
					)
				);
			}
			interactionHandler.execute(cmd);
			this.actionFeedback = undefined;
		}
	}
}

export default EditBezierShapeInteraction;
