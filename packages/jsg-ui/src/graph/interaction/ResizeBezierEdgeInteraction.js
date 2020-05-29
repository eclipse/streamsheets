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
import { Arrays, SetBezierLineShapePointCommand, BezierLineShape, GraphUtils, default as JSG } from '@cedalo/jsg-core';
import ResizeEdgeInteraction from './ResizeEdgeInteraction';
import BezierEdgeHelper from './BezierEdgeHelper';

/**
 * A custom interaction to handle resize of {{#crossLink "Edge"}}{{/crossLink}}s with a shape of type
 * {{#crossLink "BezierLineShape"}}{{/crossLink}}.</br>
 * For a more general resize interaction see {{#crossLink
 * "ResizeItemInteraction"}}{{/crossLink}}.<br/>
 *
 * @class ResizeBezierEdgeInteraction
 * @extends ResizeEdgeInteraction
 * @constructor
 * @param {SelectionHandle} activeHandle The SelectionHandle to use for resize.
 * @since 1.6.17
 */
class ResizeBezierEdgeInteraction extends ResizeEdgeInteraction {
	constructor(activeHandle) {
		super(activeHandle);

		this.bezierhelper = new BezierEdgeHelper();
	}

	// overwritten to adjust control points to make curve more orthogonal in case of attach to port...
	showPossiblePortAt(event, viewer) {
		const portFeedback = super.showPossiblePortAt(event, viewer);
		const line = this.feedback[0].getFeedbackItem();
		const draggedStart = this.draggedSource();
		const coord = draggedStart ? line.getStartCoordinate() : line.getEndCoordinate();
		const cpcoord = draggedStart ? coord.cpTo : coord.cpFrom;
		const coordpt = coord.toPoint(JSG.ptCache.get());

		if (portFeedback) {
			this.bezierhelper.edge = line;
			const cppt = this.bezierhelper.getControlPointAtPort(
				portFeedback._point,
				portFeedback._model,
				!draggedStart,
				JSG.ptCache.get()
			);
			// only set it first time!
			cpcoord.prev = cpcoord.prev || cpcoord.toPoint().subtract(coordpt);
			cpcoord.setToPoint(cppt);
			JSG.ptCache.release(cppt);
		} else if (cpcoord.prev) {
			cpcoord.setToPoint(cpcoord.prev.add(coordpt));
			cpcoord.prev = undefined;
		}
		JSG.ptCache.release(coordpt);
		return portFeedback;
	}

	// overwritten to set control point on attach...
	createAttachCommand(controller, port, event) {
		const line = controller.getModel();
		const graph = line.getGraph();

		function getControlPoint(fbItem, isSource) {
			const fbcoord = isSource ? fbItem.getStartCoordinate() : fbItem.getEndCoordinate();
			const fbcoordpt = fbcoord.toPoint(JSG.ptCache.get());
			const linecoord = isSource ? line.getStartCoordinate() : line.getEndCoordinate();
			const linecoordpt = linecoord.toPoint(JSG.ptCache.get());
			const controlcoord = isSource ? fbcoord.cpTo : fbcoord.cpFrom;
			const controlcoordpt = controlcoord.toPoint(JSG.ptCache.get());
			// translate coordinate one up to be in coordinate system of fbItem parent
			fbItem.translateToParent(controlcoordpt);
			// fbItem is in Graph's coordinate system, so translate down to line coordinate system...
			GraphUtils.translatePointDown(controlcoordpt, graph, line);
			controlcoordpt.subtract(fbcoordpt).add(linecoordpt);
			JSG.ptCache.release(fbcoordpt, linecoordpt, controlcoordpt);
			return controlcoordpt;
		}

		// call super implementation to get CompoundCommand to add to...
		const cmd = super.createAttachCommand(controller, port, event);
		// set control point for dragged source or target coordinate...
		if (cmd && this.draggedSourceOrTarget() && line.getShape().getType() === BezierLineShape.TYPE) {
			// set control point:
			const fbItem = this.feedback[0].getFeedbackItem();
			const index = this.draggedSource() ? 0 : fbItem.getPointsCount() - 1;
			const newcpto = this.draggedSource() ? getControlPoint(fbItem, true) : undefined;
			const newcpfrom = this.draggedSource() ? undefined : getControlPoint(fbItem, false);
			// insert new set control point command:
			Arrays.insertAt(
				cmd.commands,
				0,
				new SetBezierLineShapePointCommand(line, index, undefined, newcpto, newcpfrom)
			);
		}
		return cmd;
	}
}

export default ResizeBezierEdgeInteraction;
