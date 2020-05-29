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
	CompoundCommand,
	OrthogonalLayout,
	SetLayoutSettingCommand,
	SetLineShapePointsCommand,
	MathUtils,
	GraphUtils,
	ItemAttributes,
	Point,
	Port
} from '@cedalo/jsg-core';
import ResizeEdgeInteraction from './ResizeEdgeInteraction';

//--------------------------------------------------------------------------------------------------
// RESIZE DELEGATES:
//
/**
 * The delegate object to use for a simple resize.<br/>
 * <b>Note:</b> this class is not intended to be used outside of {{#crossLink
 * "ResizeOrthoEdgeInteraction"}}{{/crossLink}}!
 *
 * @class ResizeDelegate
 * @param {ResizeOrthoEdgeInteraction} interaction The main interaction to which this delegate is
 *     registered.
 * @constructor
 */
class ResizeDelegate {
	constructor(interaction) {
		this.dragIndex = -1;
		this.snaplinepoints = [];
		this._interaction = interaction;
	}

	/**
	 * Initializes this delegate.
	 *
	 * @method initWith
	 * @param {Feedback} feedback The feedback of corresponding edge.
	 * @param {Number} index The index of dragged point.
	 * @param {Point} location The current event location.
	 */
	initWith(feedback, index, location) {
		const line = feedback.getFeedbackItem();
		const last = line.getPointsCount() - 1;

		const addLinePointAt = (lindex, points) => {
			if (lindex >= 0 && lindex <= last) {
				const linepoint = line.getPointAt(lindex);
				linepoint.index = lindex;
				points.push(linepoint);
			}
		};

		const disableAutoLayout = () => {
			const settings = line.getLayoutSettings();
			if (settings) {
				settings.set(OrthogonalLayout.BEHAVIOR, ItemAttributes.LineBehavior.MANUAL);
			}
		};

		this.dragIndex = index;
		this._draggedSource = index === 0;
		this._draggedTarget = index === last;
		if (index === 0) {
			// start point => only next ortho line possible
			addLinePointAt(index + 1, this.snaplinepoints);
			addLinePointAt(index + 2, this.snaplinepoints);
		} else if (index === last) {
			// end point => only prev. ortho line possible
			addLinePointAt(index - 1, this.snaplinepoints);
			addLinePointAt(index - 2, this.snaplinepoints);
		} else {
			// corner point => up to four ortho lines possible
			addLinePointAt(index, this.snaplinepoints);
			addLinePointAt(index - 1, this.snaplinepoints);
			addLinePointAt(index, this.snaplinepoints);
			addLinePointAt(index + 1, this.snaplinepoints);
			if (index - 2 >= 0) {
				addLinePointAt(index - 1, this.snaplinepoints);
				addLinePointAt(index - 2, this.snaplinepoints);
			}
			if (index + 2 <= last) {
				addLinePointAt(index + 1, this.snaplinepoints);
				addLinePointAt(index + 2, this.snaplinepoints);
			}
			disableAutoLayout();
		}
	}

	/**
	 * Updates the given edge feedback.
	 *
	 * @method update
	 * @param {Feedback} feedback The feedback of corresponding edge.
	 * @param {Point} location The current event location.
	 */
	update(feedback, location) {
		const fbItem = feedback.getFeedbackItem();
		let last = fbItem.getPointsCount() - 1;
		// update point location
		const index = this._draggedSource ? 0 : this._draggedTarget ? last : this.dragIndex;
		let i;
		let n;
		let dirvector;

		const snapToLine = (linepoint1, linepoint2, lindex) => {
			let snap = false;
			let point = JSG.ptCache.get();
			point.setTo(location);
			dirvector.setTo(location);
			point = MathUtils.getOrthogonalProjectionOfPoint(point, linepoint1, linepoint2);
			dirvector.subtract(point);
			if (
				(lindex === 0 || lindex === last) &&
				dirvector.length() < ResizeDelegate.SNAP_THRESHOLD
			) {
				snap = true;
				dirvector.setTo(point);
				feedback.setPointAt(lindex, dirvector);
			} else {
				point.subtract(linepoint2);
				if (point.length() < ResizeDelegate.SNAP_THRESHOLD) {
					snap = true;
					dirvector.add(linepoint2);
					feedback.setPointAt(lindex, dirvector);
				}
			}
			JSG.ptCache.release(point);
			return snap;
		};

		// if we have only 2 points, we cannot move correctly...
		if (last === 1) {
			const idx = last === 1 ? 1 : 0;
			const oldstate = fbItem.getShape().disableRefresh();
			fbItem.insertPointsAt(idx, fbItem.getPointAt(index));
			last = fbItem.getPointsCount() - 1;
			if (oldstate === true) {
				fbItem.getShape().enableRefresh();
			}
		}
		if (index === 0 && fbItem.hasSourceAttached()) {
			fbItem.refresh();
		} else if (index === last && fbItem.hasTargetAttached()) {
			fbItem.refresh();
		} else {
			// set point at drag index...
			feedback.setPointAt(index, location.copy());
			// ... and snap to line:
			dirvector = JSG.ptCache.get();
			for (i = 0, n = this.snaplinepoints.length - 1; i < n; i += 2) {
				if (snapToLine(this.snaplinepoints[i], this.snaplinepoints[i + 1], index)) {
					// we snapped, so adjust current location for subsequent tests...
					location.setTo(dirvector);
				}
			}
			JSG.ptCache.release(dirvector);
		}
	}

	/**
	 * Called if a port feedback is currently visible. This causes the feedback to visually attach to this port
	 * feedback.
	 *
	 * @method showedPortFeedback
	 * @param {PositionFeedbackView} portFeedback The feedback view of the port to which this edge might
	 *     connect.
	 * @param {Feedback} feedback The feedback of corresponding edge.
	 */
	showedPortFeedback(portFeedback, feedback) {
		const edge = feedback.getFeedbackItem();

		const createPortFromFeedback = (lportFeedback) => {
			const port = new Port();
			const node = lportFeedback._model;
			const portloc = JSG.ptCache.get().setTo(lportFeedback._location);
			// init port:
			port._parent = node;
			// only because it exists, but actually not required, because a feedback has noID!!!
			port._isFeedback = true;
			port._original = node.getPortAtLocation(portloc);
			port.setPinPointTo(portloc);
			JSG.ptCache.release(portloc);
			return port;
		};

		// attach to source or target port
		const isSource = this._interaction.draggedSource();
		const attached = isSource ? edge.hasSourceAttached() : edge.hasTargetAttached();
		if (!attached) {
			const port = createPortFromFeedback(portFeedback);
			const lineshape = edge.getShape();
			const oldstate = lineshape.disableRefresh();
			edge.pointsCount = edge.getPointsCount();
			if (isSource) {
				edge.setSourcePort(port);
			} else {
				edge.setTargetPort(port);
			}
			// TODO check if we have a layout set and if it is of type orthogonal!!
			edge.getLayout().layoutFrom(edge, port);
			if (oldstate) {
				lineshape.enableRefresh();
			}
		}
	}

	/**
	 * Called if a port feedback was removed. This causes the feedback to visually detach from port feedback.
	 *
	 * @method hidePortFeedback
	 * @param {Feedback} feedback The feedback of corresponding edge.
	 */
	hidePortFeedback(feedback) {
		const edge = feedback.getFeedbackItem();

		function detachFromPort(port) {
			const index = edge.getSourcePort() === port ? 1 : edge.pointsCount;
			edge.detachPort(port);
			// remove coordinates added by attach...
			if (edge.pointsCount > 0) {
				const diff = edge.getPointsCount() - edge.pointsCount;
				if (diff > 0) {
					const lineshape = edge.getShape();
					lineshape.removeCoordinatesAt(index, diff);
				}
				edge.pointsCount = 0;
			}
		}

		edge.pointsCount = edge.pointsCount !== undefined ? edge.pointsCount : edge.getPointsCount();
		const port = this._interaction.draggedSource() ? edge.getSourcePort() : edge.getTargetPort();
		detachFromPort(port);
	}

	// /**
	//  * Detach the feedback edge from its source port.
	//  *
	//  * @method detachFromSourcePort
	//  * @param {Edge} edge The feedback edge.
	//  */
	// detachFromSourcePort(edge) {
	// 	if (edge.hasSourceAttached()) {
	// 		edge.hasSourceAttached = function() { return false; };
	// 		edge.getSourcePort = function() { return undefined; };
	// 		//NOTE: we remove segment 01 (and maybe others) so we have to first move start coordinate to
	// 		//next coordinate in order to have correct initial position for subsequent layout...
	// 		var coord = this._getCoordinate(edge.getStartCoordinate());
	// 		// coord.setTo(edge.getCoordinateAt(1));
	// 		edge.setStartCoordinateTo(coord);
	// 		this._removeAddedPointsAt(1, edge);
	// 	}
	// };
	// /**
	//  * Detach the feedback edge from its target port.
	//  *
	//  * @method detachFromTargetPort
	//  * @param {Edge} edge The feedback edge.
	//  */
	// detachFromTargetPort(edge) {
	// 	if (edge.hasTargetAttached()) {
	// 		edge.hasTargetAttached = function() { return false; };
	// 		edge.getTargetPort = function() { return undefined; };
	// 		edge.setEndCoordinateTo(this._getCoordinate(edge.getEndCoordinate()));
	// 		this._removeAddedPointsAt(edge._ptsCount - 1, edge);
	// 	}
	// };
	// /**
	//  * Convenience method to return a wrapped coordinate if given one is a CoordinateProxy.
	//  *
	//  * @method _getCoordinate
	//  * @param {Coordinate | CoordinateProxy} coord The CoordinateProxy to get the coordinate of or
	// the coordinate itself. * @return {Coordinate} Either the given coordinate or the wrapped coordinate if
	// given one is a CoordinateProxy. * @private */ _getCoordinate(coord) { return coord.getCoordinate ?
	// coord.getCoordinate() : coord; }; /** * Removes a formerly added point at specified index of given edge. These
	// points might be added by the underlying * {{#crossLink "OrthogonalLayout"}}{{/crossLink}} during
	// the resize interaction, e.g. * after an attach. * * @method _removeAddedPointsAt * @param {Number} idx The index of
	// the point to remove. * @param {Edge} edge The feedback edge. * @private */ _removeAddedPointsAt(idx,
	// edge) { var shape = edge.getShape(), ptsCount = edge._ptsCount, currCount; if (ptsCount > 0) { currCount =
	// edge.getPointsCount(); if (ptsCount !== currCount) { shape.removeCoordinatesAt(idx, currCount - ptsCount); }
	// edge._ptsCount = 0; } };

	/**
	 * Checks if a resize command can be created for given feedback.<br/>
	 * Default implementation simply returns <code>true</code> to signal that the delegate can create a resize command.
	 *
	 * @method createCommand
	 * @param {Feedback} feedback The feedback of corresponding edge.
	 * @return {Boolean} <code>true</code> if this delegate creates a resize command, <code>false</code> otherwise.
	 */
	createCommand(feedback) {
		return true;
	}

	/**
	 * Creates the resize command.
	 *
	 * @method createCommandFrom
	 * @param {Feedback} feedback The feedback of corresponding edge.
	 * @param {ConnectionController} selectedController The currently selected connection
	 *     controller.
	 * @param {Point} location The current event location.
	 * @param {PositionFeedbackView} portFeedback The feedback view of the port to which this edge
	 *     connect.
	 * @return {Command} The resize command or <code>undefined</code>.
	 */
	createCommandFrom(feedback, controller, location, portFeedback) {
		const cmd = new CompoundCommand();

		const reducePoints = (points) => {
			let i;
			const last = points.length - 1;

			const areLinesParallel = (l1Index1, l1Index2, l2Index1, l2Index2) => {
				if (l1Index1 >= 0 && l2Index2 <= last) {
					const l1p1 = points[l1Index1];
					const l1p2 = points[l1Index2];
					const l2p1 = points[l2Index1];
					const l2p2 = points[l2Index2];
					return MathUtils.areLinesParallel(l1p1, l1p2, l2p1, l2p2);
				}
				return false;
			};

			for (i = last; i > 0; i -= 1) {
				if (areLinesParallel(i - 1, i, i, i + 1)) {
					points.splice(i, 1);
				}
			}
		};

		const translatePointsToLine = (points, line) => {
			const translateTo = (item) => {
				points.forEach((point) => {
					item.translateFromParent(point);
				});
			};

			// feedback is in Graph coordinate system, so:
			GraphUtils.traverseItemDown(line.getGraph(), line.getParent(), translateTo);
		};

		if (this._draggedSource === false && this._draggedTarget === false) {
			this._addDisableAutoLayoutCommand(cmd, controller.getModel());
		}

		// we simply take points from feedback...
		const line = controller.getModel();
		const fbItem = feedback.getFeedbackItem();
		const newpoints = fbItem.getPoints();

		reducePoints(newpoints);
		translatePointsToLine(newpoints, line);
		cmd.add(new SetLineShapePointsCommand(line, newpoints));

		return cmd;
	}

	/**
	 * Creates a new {{#crossLink "SetLayoutSettingCommand"}}{{/crossLink}} to disable automatic
	 * layout behavior for given line.
	 *
	 * @method _addDisableAutoLayoutCommand
	 * @param {Command} cmd The CompoundCommand to add created command to.
	 * @param {LineConnection} line The line to disable auto-layout for.
	 */
	_addDisableAutoLayoutCommand(cmd, line) {
		const BEHAVIOR = ItemAttributes.LineBehavior;
		const oldBehavior = line
			.getLayout()
			.getSettings(line)
			.get(OrthogonalLayout.BEHAVIOR);

		if (oldBehavior === BEHAVIOR.AUTO) {
			cmd.add(new SetLayoutSettingCommand(line, OrthogonalLayout.BEHAVIOR, BEHAVIOR.MANUAL));
		}
	}

	/**
	 * Called by main interaction to deactivate this delegate before it is removed. Good place to perform any clean up
	 * tasks.
	 *
	 * @method deactivate
	 */
	deactivate() {
		this.snaplinepoints = undefined;
		this._interaction = undefined;
	}

	/**
	 * The snap threshold to specify when a dragged point <q>snaps</q> to its neighbor points. This means that afterwards
	 * thie points are on one line.
	 *
	 * @property SNAP_THRESHOLD
	 * @type {Number}
	 * @static
	 */
	static get SNAP_THRESHOLD() {
		return 250;
	}
}


/**
 * The delegate object to use for adding new points on a resize.<br/>
 * <b>Note:</b> this class is not intended to be used outside of {{#crossLink
 * "ResizeOrthoEdgeInteraction"}}{{/crossLink}}!
 *
 * @class AddPointsDelegate
 * @extends ResizeDelegate
 * @param {ResizeOrthoEdgeInteraction} interaction The main interaction to which this delegate is
 *     registered.
 * @constructor
 */
// eslint-disable-next-line max-len
class AddPointsDelegate extends ResizeDelegate {
	constructor(interaction) {
		super(interaction);

		this.lineSegmentEnd = new Point(0, 0);
		this.lineSegmentStart = new Point(0, 0);
	}

	initWith(feedback, lineIndex, location) {
		const line = feedback.getFeedbackItem();
		const additionalPoints = [];
		const MIN_PORT_SEG_LENGTH = line.getLayoutSettings().get(OrthogonalLayout.MINPORTSEG, 500);

		const add = (point, index) => {
			point.index = index;
			additionalPoints.push(point);
		};

		const handleStartPoint = (lline, orthopoint) => {
			let distance;
			let orthostartpoint;

			if (lline.hasSourceAttached() === true) {
				// add two additional points
				distance = orthopoint.copy().subtract(this.lineSegmentStart);
				distance.setLength(Math.max(distance.length() / 2, MIN_PORT_SEG_LENGTH));
				distance.add(this.lineSegmentStart);
				this.lineSegmentStart.setTo(distance);
				add(distance, this.dragIndex);
				distance = MathUtils.getOrthoPointToLine(this.lineSegmentStart, distance).add(distance);
				add(distance, this.dragIndex + 1);
				this.dragIndex += 2;
			} else {
				// add one additional point
				orthostartpoint = MathUtils.getOrthoPointToLine(this.lineSegmentStart, orthopoint);
				orthostartpoint.add(this.lineSegmentStart);
				add(orthostartpoint, this.dragIndex);
				this.dragIndex += 1;
			}
		};

		const handleEndPoint = (lline, orthopoint) => {
			if (lline.hasTargetAttached() === true) {
				// ortho point distance:
				const distance = orthopoint.copy().subtract(this.lineSegmentEnd);
				distance.setLength(Math.max(distance.length() / 2, MIN_PORT_SEG_LENGTH));
				distance.add(this.lineSegmentEnd);
				// ensure minimal distance to target port:
				const mindistance = distance.copy().subtract(this.lineSegmentEnd);
				mindistance.setLength(MIN_PORT_SEG_LENGTH).add(this.lineSegmentEnd);
				this.lineSegmentEnd.setTo(mindistance);
			}
		};

		const insertPointsAt = (llineIndex, llocation) => {
			let orthopoint;
			this.dragIndex = llineIndex + 1;
			this._draggedSource = false;
			this._draggedTarget = false;
			this.lineSegmentStart = line.getPointAt(llineIndex, this.lineSegmentStart);
			this.lineSegmentEnd = line.getPointAt(llineIndex + 1, this.lineSegmentEnd);
			if (this.lineSegmentStart && this.lineSegmentEnd) {
				orthopoint = MathUtils.getOrthogonalProjectionOfPoint(
					llocation.copy(),
					this.lineSegmentStart,
					this.lineSegmentEnd
				);
				if (llineIndex === 0) {
					handleStartPoint(line, orthopoint);
				} else if (llineIndex === line.getPointsCount() - 2) {
					handleEndPoint(line, orthopoint);
				}

				add(orthopoint.copy(), this.dragIndex);
				add(orthopoint.copy(), this.dragIndex + 1);
				line.insertPointsAt(llineIndex + 1, additionalPoints);
			}
		};

		const disableAutoLayout = () => {
			const settings = line.getLayoutSettings();
			if (settings) {
				settings.set(OrthogonalLayout.BEHAVIOR, ItemAttributes.LineBehavior.MANUAL);
			}
		};

		super.initWith(feedback, lineIndex, location);
		// line.getLayoutAttributes().setLineBehavior(ItemAttributes.LineBehavior.MANUAL);
		disableAutoLayout();
		// check if feedback still has same points...
		if (line.getPointsCount() !== feedback.getOriginalItem().getPointsCount()) {
			JSG.debug.log(
				`wrong points count! feedback(${line.getPointsCount()})/original(${feedback
					.getOriginalItem()
					.getPointsCount()}) => cancel add...`
			);

			// var coords = feedback.getOriginalItem().getShape().getCoordinates();
			// var last = coords.length - 1;
			// var lineShape = line.getShape();
			// var lineCoords = lineShape.getCoordinates();
			// var tmppt = JSG.ptCache.get();
			// lineShape.keepCoordinates(coords.length);
			// for(var i=1;i<last;i++) {
			// coords[i].toPoint(tmppt);
			// lineCoords[i].set(tmppt.x, tmppt.y);
			// }
			// JSG.ptCache.release(tmppt);
			feedback._cancelAdd = true;
			return;
		}
		insertPointsAt(lineIndex, location);
	}

	update(feedback, location) {
		const isPointBeforeLineSegment = (point, linepoint1, linepoint2) => {
			const line = JSG.ptCache
				.get()
				.setTo(linepoint1)
				.subtract(linepoint2);
			const refpoint = JSG.ptCache
				.get()
				.setTo(linepoint1)
				.subtract(point);
			const isBefore = -line.x * refpoint.x - line.y * refpoint.y > 0;
			JSG.ptCache.release(line, refpoint);
			return isBefore;
			// var isLeft = (line.x * refpoint.y - line.y * refpoint.y) < 0;
			// var isBefore = (-line.x * refpoint.x - line.y * refpoint.y) > 0;
			// return isBefore;
		};

		const limitLocationToLineSegment = () => {
			// we must ensure that we stay inside line segment bounds...
			let point = location.copy();
			const lengthvector = JSG.ptCache.get();
			let l1;
			let l2;

			// line segment:
			point = MathUtils.getOrthogonalProjectionOfPoint(point, this.lineSegmentStart, this.lineSegmentEnd);
			const isBeforeSegment = isPointBeforeLineSegment(point, this.lineSegmentStart, this.lineSegmentEnd);
			// check right/next side:
			l1 = lengthvector
				.setTo(point)
				.subtract(this.lineSegmentStart)
				.length();
			l2 = lengthvector
				.setTo(this.lineSegmentEnd)
				.subtract(this.lineSegmentStart)
				.length();
			if (l1 > l2 && !isBeforeSegment) {
				// restrict location to this.lineSegmentEnd:
				point.subtract(this.lineSegmentEnd);
				location.subtract(point);
			} else {
				// check left/prev side:
				l1 = lengthvector
					.setTo(point)
					.subtract(this.lineSegmentEnd)
					.length();
				l2 =
					lengthvector
						.setTo(this.lineSegmentStart)
						.subtract(this.lineSegmentEnd)
						.length() -
					ResizeDelegate.SNAP_THRESHOLD +
					10;
				if (l1 > l2) {
					// restrict current location to prev bound:
					lengthvector
						.setTo(this.lineSegmentEnd)
						.subtract(this.lineSegmentStart)
						.setLength(ResizeDelegate.SNAP_THRESHOLD + 10);
					lengthvector.add(this.lineSegmentStart);
					location.subtract(point).add(lengthvector);
				}
			}
			JSG.ptCache.release(lengthvector);
		};

		if (feedback._cancelAdd) {
			return;
		}
		limitLocationToLineSegment(this);

		super.update(feedback, location);
	}

	createCommand(feedback) {
		if (feedback._cancelAdd) {
			return false;
		}
		const line = feedback.getFeedbackItem();
		let segment = line.getPointAt(this.dragIndex + 1);
		segment = segment ? segment.subtract(line.getPointAt(this.dragIndex)) : undefined;
		// no check required since we always add at least 2 points:
		// segment = line.getPointAt(this.dragIndex + 1).subtract(line.getPointAt(this.dragIndex));
		JSG.debug.log(`dragIndex ${this.dragIndex}+1 is out of range ${line.getPointsCount()}`, !segment);
		return (
			segment &&
			segment.length() >= ResizeDelegate.SNAP_THRESHOLD
		);
	}

	createCommandFrom(feedback, controller, location) {
		if (feedback._cancelAdd) {
			return undefined;
		}
		const cmd = new CompoundCommand();
		this._addDisableAutoLayoutCommand(cmd, controller.getModel());
		this._addTo(cmd, super.createCommandFrom(feedback, controller, location));
		return cmd;
	}

	_addTo(cmd, fromCmd) {
		const commands = fromCmd.commands;
		for (let i = 0; i < commands.length; i += 1) {
			// we skip additional SetLayoutSettingCommand...
			if (commands[i] instanceof SetLayoutSettingCommand && commands[i].key === OrthogonalLayout.BEHAVIOR) {
				// eslint-disable-next-line no-continue
				continue;
			}
			cmd.add(commands[i]);
		}
	}

	deactivate() {
		super.deactivate();
		this.lineSegmentEnd = undefined;
		this.lineSegmentStart = undefined;
	}
}

/**
 * A special interaction to handle resize of {{#crossLink "Edge"}}{{/crossLink}}s with an orthogonal
 * shape, like {{#crossLink "OrthoLineShape"}}{{/crossLink}}.</br>
 * For a more general resize interaction see {{#crossLink
 * "ResizeItemInteraction"}}{{/crossLink}}.<br/> This interaction uses a private delegate object
 * to perform its tasks. That is because a resize of an orthogonal edge not necessarily works like a normal edge
 * resize, but instead might adds or removes points. So the delegate is either an instance of of {{#crossLink
 * "ResizeDelegate"}}{{/crossLink}} or {{#crossLink
 * "AddPointsDelegate"}}{{/crossLink}}. Which one is used depends on
 * the line point which is dragged and is settled in
 * {{#crossLink "ResizeOrthoEdgeInteraction/_createSelectionFeedback:method"}}{{/crossLink}}.
 *
 * @class ResizeOrthoEdgeInteraction
 * @extends ResizeEdgeInteraction
 * @constructor
 * @param {SelectionHandle} activeHandle The SelectionHandle to use for resize.
 */
class ResizeOrthoEdgeInteraction extends ResizeEdgeInteraction {
	constructor(activeHandle) {
		super(activeHandle);
		this._delegate = undefined;
	}

	_createSelectionFeedback(controller, viewer) {
		const location = JSG.ptCache.get().setTo(this.currentLocation);
		const pointIndex = this._activeHandle.getPointIndex();
		const feedback = super._createSelectionFeedback(controller, viewer);

		if (pointIndex > -1) {
			this._delegate = this.createResizeDelegate();
			this._delegate.initWith(feedback, pointIndex, location);
		} else {
			this._delegate = this.createAddPointsDelegate();
			this._delegate.initWith(feedback, this._activeHandle._segmentIndex, location);
		}
		JSG.ptCache.release(location);
		return feedback;
	}

	updateFeedback(event, viewer, offset) {
		// update delegate:
		const point = this.alignToGrid(this.currentLocation.copy(), viewer, event.event.altKey);
		this.showPossiblePortAt(event, viewer);
		this._delegate.update(this.feedback[0], point);
	}

	showPossiblePortAt(event, viewer) {
		const portFeedback = super.showPossiblePortAt(event, viewer);
		if (portFeedback !== undefined) {
			this._delegate.hidePortFeedback(this.feedback[0]);
			this._delegate.showedPortFeedback(portFeedback, this.feedback[0], this.currentLocation);
		} else {
			this._delegate.hidePortFeedback(this.feedback[0]);
		}
		return portFeedback;
	}

	/**
	 * Creates the internal delegate to perform a simple resize task without adding new points.<br/>
	 * Note: although no points are added a resize can remove points! This is the case e.g. if three or more points are
	 * on the same line. In this case the <q>inner</q> points are removed.
	 *
	 * @method createResizeDelegate
	 * @return {ResizeOrthoEdgeInteraction.ResizeDelegate} The delegate to use to perform resize.
	 */
	createResizeDelegate() {
		return new ResizeOrthoEdgeInteraction.ResizeDelegate(this);
	}

	/**
	 * Creates the internal delegate to perform a resize task which adds new points to the edge.<br/>
	 * Note: these points are never added before the start-point or after the end-point.
	 *
	 * @method createAddPointsDelegate
	 * @return {AddPointsDelegate} The delegate to use to perform
	 *     resize.
	 */
	createAddPointsDelegate() {
		return new AddPointsDelegate(this);
	}

	createResizeCommand(controller, location, event) {
		const point = this.alignToGrid(location.copy(), controller.getViewer(), event.event.altKey);
		this._delegate.update(this.feedback[0], point);
		return this._delegate.createCommandFrom(this.feedback[0], controller, location, this._portFeedback);
	}

	willFinish(event, viewer, offset) {
		if (this._delegate && this._delegate.createCommand(this.feedback[0])) {
			this._dragIndex = this._delegate.dragIndex;
			super.willFinish(event, viewer, offset);
		}
	}

	didFinish(event, viewer) {
		super.didFinish(event, viewer);
		if (this._delegate) {
			this._delegate.deactivate();
			this._delegate = undefined;
		}
	}
}

export default ResizeOrthoEdgeInteraction;
