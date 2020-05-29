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
import { default as JSG, Shape, StreamSheetContainer } from '@cedalo/jsg-core';
import InteractionActivator from './InteractionActivator';
import ResizeInteraction from './ResizeInteraction';
import SelectionHandle from '../view/selection/SelectionHandle';
import Cursor from '../../ui/Cursor';

const THRESHOLD = 50;
const KEY = 'processsheetresize.activator';

export default class StreamSheetContainerResizeActivator extends InteractionActivator {
	constructor() {
		super();
		this._threshold = undefined;
		this._handle = this._createArrowHandle(0);
	}

	getKey() {
		return StreamSheetContainerResizeActivator.KEY;
	}

	_getControllerAt(location, viewer, dispatcher) {
		return viewer.filterFoundControllers(Shape.FindFlags.BOXWITHFRAME, (cont, loc) => {
			if (cont.getModel() instanceof StreamSheetContainer) {
				const rect = cont
					.getModel()
					.getTranslatedBoundingBox(cont.getModel().getGraph())
					.getBoundingRectangle();
				const scrollOffset = cont
					.getParent()
					.getParent()
					.getView()
					.getScrollOffset();
				rect.translate(-scrollOffset.x, -scrollOffset.y);
				rect.expandBy(200);
				if (rect.containsPoint(loc)) {
					rect.reduceBy(200);
					if (rect.containsPoint(loc)) {
						return false;
					}
					let cursor;
					let pointIndex = -1;
					if (loc.x < rect.x) {
						if (loc.y < rect.y) {
							cursor = Cursor.Style.RESIZE_NW;
							pointIndex = 0;
						} else if (loc.y > rect.y + rect.height) {
							cursor = Cursor.Style.RESIZE_SW;
							pointIndex = 6;
						} else {
							cursor = Cursor.Style.RESIZE_W;
							pointIndex = 7;
						}
					} else if (loc.x > +rect.x + rect.width) {
						if (loc.y < rect.y) {
							cursor = Cursor.Style.RESIZE_NE;
							pointIndex = 2;
						} else if (loc.y > rect.y + rect.height) {
							cursor = Cursor.Style.RESIZE_SE;
							pointIndex = 4;
						} else {
							cursor = Cursor.Style.RESIZE_E;
							pointIndex = 3;
						}
					} else if (loc.y < rect.y) {
						cursor = Cursor.Style.RESIZE_N;
						pointIndex = 1;
					} else if (loc.y > rect.y + rect.height) {
						cursor = Cursor.Style.RESIZE_S;
						pointIndex = 5;
					}
					this._handle.setCursor(cursor);
					this._handle.setPointIndex(pointIndex);
					return true;
				}
			}
			return false;
		});
	}

	onMouseMove(event, viewer, dispatcher) {
		if (!event.isConsumed) {
			const controller = this._getControllerAt(event.location, viewer, dispatcher);
			if (controller !== undefined) {
				dispatcher.setCursor(this._handle.getCursor());
				this._controller = controller;
				event.isConsumed = true;
				return;
			}
		}

		this._controller = undefined;
	}

	onMouseDown(event, viewer, dispatcher) {
		if (this._controller && this._handle.getPointIndex() !== -1) {
			this._threshold = viewer
				.getCoordinateSystem()
				.metricToLogXNoZoom(StreamSheetContainerResizeActivator.THRESHOLD);
			event.hasActivated = true;
			event.isConsumed = true;
		}
	}

	onMouseDrag(event, viewer, dispatcher) {
		if (
			this._controller &&
			this._handle.getPointIndex() !== -1 &&
			this._activateOnDrag(event, viewer, dispatcher)
		) {
			viewer.getSelectionProvider().setSelection([this._controller]);
			viewer.getSelectionView().refresh();
			let interaction = new ResizeInteraction(this._handle);
			if (interaction) {
				interaction = this.activateInteraction(interaction, dispatcher);
				interaction.onMouseDown(event, viewer);
				event.hasActivated = true;
				event.isConsumed = true;
			}
		}
	}

	_activateOnDrag(event, viewer, dispatcher) {
		// check threshold:
		const location = JSG.ptCache
			.get()
			.setTo(dispatcher.currentLocation)
			.subtract(dispatcher.startLocation);
		const resize = location.length() > this._threshold;
		JSG.ptCache.release(location);
		return resize;
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
		const handle = new JSG.SelectionHandle();
		handle.setType(SelectionHandle.TYPE.RESIZE);
		handle.setCursor(Cursor.Style.RESIZE_W);
		handle.setPointIndex(pointIndex);
		return handle;
	}

	static get KEY() {
		return KEY;
	}

	static get THRESHOLD() {
		return THRESHOLD;
	}
}
