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
	OrthogonalLayout,
	CompoundCommand,
	SetShapeCommand,
	LineShape,
	OrthoLineShape,
	SetLayoutAttributeCommand,
	SetLineShapePointsCommand,
	GraphUtils
} from '@cedalo/jsg-core';
import EditShapeInteraction from './EditShapeInteraction';
import EditLineShapeView from '../view/EditLineShapeView';

/**
 * A EditShapeInteraction subclass to edit the points of a {{#crossLink
 * "LineShape"}}{{/crossLink}}.<br/>
 *
 * @class EditLineShapeInteraction
 * @extends EditShapeInteraction
 * @constructor
 */
class EditLineShapeInteraction extends EditShapeInteraction {
	/**
	 * Overwritten to return a special edit view for lines.
	 *
	 * @method createEditShapeView
	 * @param {CoordinateSystem} coordinatesystem The CoordinateSystem use for measurement calculations.
	 * @return {EditLineShapeView} The new edit view.
	 */
	createEditShapeView(coordinatesystem) {
		return new EditLineShapeView(coordinatesystem);
	}

	/**
	 * Overwritten to take {{#crossLink "OrthoLineShape"}}{{/crossLink}} into account.
	 *
	 * @method _createSwitchShapeCommandIfNecessary
	 * @param {GraphItem} item The GraphItem to check the shape of.
	 * @param {String} shapeType The shape type as returned by {{#crossLink
	 *     "Shape/getType:method"}}{{/crossLink}}.
	 * @return {Command} The command to change item shape or <code>undefined</code>
	 * @private
	 */
	_createSwitchShapeCommandIfNecessary(item, shapeType) {
		let switchShapeCmd;
		if (OrthoLineShape.TYPE === shapeType) {
			// switch shape to line:
			const newShape = new LineShape();
			newShape.setCoordinates(item._shape.getCoordinates());
			switchShapeCmd = new SetShapeCommand(item, newShape);
			// do we have an orthogonal layout -> remove it:
			const layout = item.getLayout();
			if (layout && layout.isTypeOf(OrthogonalLayout.TYPE)) {
				const cmd = new CompoundCommand();
				cmd.add(
					new SetLayoutAttributeCommand(
						item,
						(value) => {
							// function is called in scope of changed item, so:
							item.setLayout(value);
						},
						layout,
						undefined
					)
				);
				cmd.add(switchShapeCmd);
				switchShapeCmd = cmd;
			}
		}
		return switchShapeCmd;
	}

	/**
	 * Overwritten to return a special command to set the points of {{#crossLink
	 * "LineShape"}}{{/crossLink}}.
	 *
	 * @method _createEditShapeCommand
	 * @param {GraphItem} item The GraphItem to set the points of.
	 * @param {Array} points An array of points to set.
	 * @return {Command} The command to set item points.
	 * @private
	 */
	_createEditShapeCommand(item, points) {
		const graph = this._graphView;
		const parent = this._view.getParent();
		points = this._editview.getMarkerPoints(true);
		// translate down to item parent...
		points.forEach((point) => {
			GraphUtils.traverseDown(graph, parent, (view) => {
				view.translateFromParent(point);
				return true;
			});
		});
		return new SetLineShapePointsCommand(this._item, points);
	}
}

export default EditLineShapeInteraction;
