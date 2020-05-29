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
import { GraphUtils, SetShapePointsCommand, default as JSG } from '@cedalo/jsg-core';
import AbstractInteraction from './AbstractInteraction';

/**
 * A special interaction to handle resize of {{#crossLink "LineNode"}}{{/crossLink}}s.</br>
 * For a more general resize interaction see {{#crossLink "ResizeItemInteraction"}}{{/crossLink}}.
 *
 *
 * @class ResizeLineNodeInteraction
 * @extends AbstractInteraction
 * @constructor
 * @param {SelectionHandle} handle The SelectionHandle to use for resize.
 */
class ResizeLineNodeInteraction extends AbstractInteraction {
	constructor(activeHandle) {
		super();
		this._dragIndex = activeHandle._pointIndex;
	}

	updateFeedback(event, viewer, offset) {
		// we expect only one feedback, so...
		const current = this.alignToGrid(this.currentLocation, viewer, event.event.altKey, JSG.ptCache.get());
		const fbItem = this.feedback[0].getFeedbackItem();
		fbItem.translateFromParent(current);
		fbItem.getShape().setCoordinateAtToPoint(this._dragIndex, current);
		JSG.ptCache.release(current);
	}

	/**
	 * Creates a new command which sets the points of selected {{#crossLink
	 * "LineNode"}}{{/crossLink}}.</br>
	 *
	 * @method createCommand
	 * @param {Point} offset The offset between start and current event. Usually the difference between
	 *     start and current location.
	 * @param {GraphItemController} selectedController The currently selected controller.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {SetShapePointsCommand} The SetShapePointsCommand to set the LineNode points.
	 */
	createCommand(offset, selectedController, event, viewer) {
		const points = [];
		const fbItem = this.feedback[0].getFeedbackItem();
		const coordinates = fbItem.getShape().getCoordinates();
		const item = selectedController.getModel();

		this.updateFeedback(event, viewer, offset);

		coordinates.forEach((coor) => {
			const pt = coor.toPoint();
			fbItem.translateToParent(pt);
			GraphUtils.translatePointDown(pt, item.getGraph(), item);
			points.push(pt);
		});

		return new SetShapePointsCommand(item, points);
	}
}

export default ResizeLineNodeInteraction;
