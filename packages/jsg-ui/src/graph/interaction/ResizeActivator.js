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
	FormatAttributes,
	BezierLineShape,
	OrthoLineShape,
	LineNode,
	default as JSG
} from '@cedalo/jsg-core';
import InteractionActivator from './InteractionActivator';
import ResizeBezierEdgeInteraction from './ResizeBezierEdgeInteraction';
import ResizeEdgeInteraction from './ResizeEdgeInteraction';
import ResizeLineNodeInteraction from './ResizeLineNodeInteraction';
import ResizeOrthoEdgeInteraction from './ResizeOrthoEdgeInteraction';
import ResizeInteraction from './ResizeInteraction';
import ConnectionController from '../controller/ConnectionController';
import SelectionHandle from '../view/selection/SelectionHandle';
import Cursor from '../../ui/Cursor';

/**
 * An InteractionActivator used to activate a {{#crossLink "ResizeInteraction"}}{{/crossLink}}.
 *
 * @class ResizeActivator
 * @extends InteractionActivator
 * @constructor
 */
class ResizeActivator extends InteractionActivator {
	constructor() {
		super();
		this._threshold = undefined;
	}

	getKey() {
		return ResizeActivator.KEY;
	}

	/**
	 * Implemented to be notified about mouse down events.</br>
	 *
	 * @method onMouseDown
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 */
	onMouseDown(event, viewer, dispatcher) {
		this._threshold = viewer
			.getCoordinateSystem()
			.metricToLogXNoZoom(ResizeActivator.THRESHOLD);
	}

	onMouseDrag(event, viewer, dispatcher) {
		if (this._activateOnDrag(event, viewer, dispatcher)) {
			let interaction = this.createResizeInteraction(dispatcher.getActiveHandle(), viewer, dispatcher);
			if (interaction) {
				interaction = this.activateInteraction(interaction, dispatcher);
				interaction.onMouseDown(event, viewer);
				event.hasActivated = true;
			}
		}
	}

	_activateOnDrag(event, viewer, dispatcher) {
		let resize = !this.isDisposed && this._isResizeHandle(dispatcher.getActiveHandle());
		if (resize) {
			// check threshold:
			const location = JSG.ptCache
				.get()
				.setTo(dispatcher.currentLocation)
				.subtract(dispatcher.startLocation);
			resize = location.length() > this._threshold;
			JSG.ptCache.release(location);
		}
		return resize;
	}

	_isResizeHandle(handle) {
		return handle && handle.getType() === SelectionHandle.TYPE.RESIZE;
	}

	/**
	 * Should create the resize interaction to activate or simply return <code>undefined</code> if resize is not
	 * possible. For single selection this method calls the accompanying methods
	 * {{#crossLink "ResizeActivator/createNodeResizeInteraction:method"}}{{/crossLink}} or
	 * {{#crossLink "ResizeActivator/createEdgeResizeInteraction:method"}}{{/crossLink}}
	 * respectively.<br/> Subclasses might overwrite to implement custom behavior.
	 *
	 * @method createResizeInteraction
	 * @param {ActionHandle} handle The active handle of type <code>RESIZE</code>.
	 * @param {ControllerViewer} viewer The controller viewer on which the interaction happens.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator belongs.
	 * @return {Interaction} The resize interaction to activate or <code>undefined</code>.
	 */
	createResizeInteraction(handle, viewer, dispatcher) {
		const selProvider = viewer.getSelectionProvider();
		if (selProvider.hasSingleSelection()) {
			const selection = selProvider.getFirstSelection();
			if (selection instanceof ConnectionController) {
				return this.createEdgeResizeInteraction(selection, handle, dispatcher);
			}
			return this.createNodeResizeInteraction(selection, handle, dispatcher);
		}
		return handle && selProvider.hasSelection() ? new ResizeInteraction(handle) : undefined;
	}

	/**
	 * Creates a resize interaction for a single {{#crossLink "Node"}}{{/crossLink}} or returns
	 * <code>undefined</code> if resize is not possible.<br/>
	 * Subclasses might overwrite to implement custom behavior.
	 *
	 * @method createNodeResizeInteraction
	 * @param {NodeController} selection The currently selected node controller.
	 * @param {ActionHandle} handle The active handle of type <code>RESIZE</code>.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator belongs.
	 * @return {Interaction} The resize interaction to activate or <code>undefined</code>.
	 */
	createNodeResizeInteraction(selection, handle, dispatcher) {
		if (handle) {
			const node = selection.getModel();
			if (node instanceof LineNode) {
				// do we have a LineNode:
				return new ResizeLineNodeInteraction(handle);
			}
			return new ResizeInteraction(handle);
		}
		return undefined;
	}

	/**
	 * Creates a resize interaction for a single {{#crossLink "Edge"}}{{/crossLink}} or returns
	 * <code>undefined</code> if resize is not possible.<br/>
	 * Subclasses might overwrite to implement custom behavior.
	 *
	 * @method createNodeResizeInteraction
	 * @param {ConnectionController} selection The currently selected edge controller.
	 * @param {ActionHandle} handle The active handle of type <code>RESIZE</code>.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator belongs.
	 * @return {Interaction} The resize interaction to activate or <code>undefined</code>.
	 */
	createEdgeResizeInteraction(selection, handle, dispatcher) {
		const view = selection.getView();
		const item = view.getItem();
		const format = item.getFormat();
		const location = JSG.ptCache.get().setTo(dispatcher.currentLocation);

		GraphUtils.translatePointDown(location, view.getGraphView(), view);
		if (
			format.getLineArrowEnd().getValue() !== FormatAttributes.ArrowStyle.NONE &&
			view.hitsLineArrowEnd(location)
		) {
			handle = this._createArrowHandle(item.getPointsCount() - 1);
		} else if (
			format.getLineArrowStart().getValue() !== FormatAttributes.ArrowStyle.NONE &&
			view.hitsLineArrowStart(location)
		) {
			handle = this._createArrowHandle(0);
		}
		JSG.ptCache.release(location);

		return handle ? this._newEdgeResizeInteraction(item, handle) : undefined;
	}

	/**
	 * Creates a special resize handle which additionally stores a given point index.<br/>
	 * This handle is used for resizing an {{#crossLink "Edge"}}{{/crossLink}} to distinguish which
	 * side is dragged.
	 *
	 * @method _createArrowHandle
	 * @param {Number} pointIndex The edge point which was dragged. Usually the index of edge source or target point.
	 * @return {SelectionHandle} A new SelectionHandle instance.
	 * @private
	 */
	_createArrowHandle(pointIndex) {
		const handle = new SelectionHandle();
		handle.setType(SelectionHandle.TYPE.RESIZE);
		handle.setCursor(Cursor.Style.AUTO);
		handle.setPointIndex(pointIndex);
		return handle;
	}

	/**
	 * Creates a new resize interaction for given edge. The kind of resize interaction depends on the shape of given
	 * edge. I.e. for an orthogonal edge shape a ResizeOrthoEdgeInteraction is created and a ResizeEdgeInteraction for
	 * all other shape kinds.
	 *
	 * @method _newEdgeResizeInteraction
	 * @param {Edge} edge The Edge to resize.
	 * @param {SelectionHandle} handle The SelectionHandle to use for resize.
	 * @return {ResizeOrthoEdgeInteraction|ResizeEdgeInteraction} The
	 *     ResizeInteraction to use for resizing given edge.
	 * @private
	 */

	_newEdgeResizeInteraction(edge, handle) {
		let Constr;
		const edgetype = edge.getShape().getType();

		switch (edgetype) {
			case OrthoLineShape.TYPE:
				Constr = ResizeOrthoEdgeInteraction;
				break;
			case BezierLineShape.TYPE:
				Constr =
					ResizeBezierEdgeInteraction || ResizeEdgeInteraction;
				break;
			default:
				Constr = ResizeEdgeInteraction;
		}
		return new Constr(handle);
	}
	/**
	 * Threshold which is used to activate one of the defined {{#crossLink
	 * "ResizeInteraction"}}{{/crossLink}} when handling {{#crossLink
	 * "ResizeActivator/onMouseDrag:method"}}{{/crossLink}}.
	 *
	 * @property THRESHOLD
	 * @type {Number}
	 * @static
	 */
	static get THRESHOLD() {
		return 50;
	}

	/**
	 * The unique key under which this activator is registered to {{#crossLink
	 * "GraphInteraction"}}{{/crossLink}}.
	 *
	 * @property KEY
	 * @type {String}
	 * @static
	 */
	static get KEY() {
		return 'resize.activator';
	}
}

export default ResizeActivator;
