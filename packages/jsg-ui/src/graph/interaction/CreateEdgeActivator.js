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
import { Arrays, OrthoLineShape, NotificationCenter, default as JSG } from '@cedalo/jsg-core';

import InteractionActivator from './InteractionActivator';
import CreateEdgeInteraction from './CreateEdgeInteraction';
import CreateOrthoEdgeInteraction from './CreateOrthoEdgeInteraction';
import InteractionUtils from './InteractionUtils';
import LayerId from '../view/LayerId';
import SelectionProvider from '../view/SelectionProvider';
import Cursor from '../../ui/Cursor';

/**
 * An InteractionActivator used to activate a {{#crossLink
 * "CreateEdgeInteraction"}}{{/crossLink}}.
 *
 * @class CreateEdgeActivator
 * @extends InteractionActivator
 * @constructor
 */
class CreateEdgeActivator extends InteractionActivator {
	constructor() {
		super();
		this._viewer = undefined; // store viewer because we show/remove friends depending on current selection...
	}

	getKey() {
		return CreateEdgeActivator.KEY;
	}

	init(viewer) {
		super.init(viewer);
		this._viewer = viewer;
		NotificationCenter.getInstance().register(
			this,
			SelectionProvider.SELECTION_CHANGED_NOTIFICATION
		);
	}

	dispose(viewer) {
		super.dispose(viewer);
		this._viewer = undefined;
		if (viewer) {
			this._removePortsHighlights(viewer);
		}
		NotificationCenter.getInstance().unregister(
			this,
			SelectionProvider.SELECTION_CHANGED_NOTIFICATION
		);
	}

	/**
	 * Called on selection notification.
	 *
	 * @method onNotification
	 * @param {Notification} notification The selection notification.
	 * @private
	 */
	onNotification(notification) {
		if (this._viewer && this._viewer.getSelectionProvider().hasSingleSelection()) {
			this._removePortsHighlights(this._viewer);
		}
	}

	/**
	 * Clears port layer, i.e. the layer with id {{#crossLink "LayerId/PORTS:property"}}{{/crossLink}}
	 *
	 * @method _removePortsHighlights
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {Boolean} <code>true</code> if any ports were removed, <code>false</code> otherwise.
	 * @private
	 */
	_removePortsHighlights(viewer) {
		const layer = viewer.clearLayer(LayerId.PORTS);
		return layer && layer.length > 0; // any removed layer views?
	}

	// overwritten to clear any port highlights on key down, e.g. on delete...
	onKeyDown(event, viewer, dispatcher) {
		event.doRepaint = this._removePortsHighlights(viewer) || event.doRepaint;
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
		if (this.isDisposed === false) {
			// first check active handle: no resize, reshape or move!
			const activeHandle = dispatcher.getActiveHandle();
			if (!activeHandle) {
				// || activeHandle.getType() === SelectionHandle.TYPE.MOVE) {
				const highlight = this._getActiveHighlight(viewer);
				if (highlight) {
					viewer.clearLayer(LayerId.PORTS);
					const createEdgeInteraction = this.activateInteraction(this._createEdgeInteraction(), dispatcher);
					createEdgeInteraction._portFeedback = highlight;
					createEdgeInteraction.onMouseDown(event, viewer);
					// viewer.clearSelection();
					event.hasActivated = true;
				}
			}
			if (this._timerId !== undefined) {
				clearTimeout(this._timerId);
			}
			this._removePortsHighlights(viewer);
		}
	}

	/**
	 * Returns the single active port highlight or <code>undefined</code> if more than one port is highlighted or none
	 * is active. The highlights are created by calling {{#crossLink
	 * "InteractionUtils/getPortsFor:method"}}{{/crossLink}}.
	 *
	 * @method _getActiveHighlight
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {PositionFeedbackView} The active port highlight or <code>undefined</code>
	 * @private
	 */
	_getActiveHighlight(viewer) {
		if (viewer.hasLayer(LayerId.PORTS)) {
			const views = viewer.getLayer(LayerId.PORTS);
			if (views.length === 1 && views[0]._active === true) {
				return views[0];
			}
		}
		return undefined;
	}

	_hasActiveHighlight(ports) {
		return ports.length === 1 && ports[0]._active === true;
	}

	/**
	 * Creates an returns the edge interaction to activate.
	 *
	 * @method _createEdgeInteraction
	 * @return {CreateEdgeInteraction} An new instance of CreateEdgeInteraction.
	 * @private
	 */
	_createEdgeInteraction() {
		let edgeCreation;
		const edge = JSG.graphItemFactory.createItemFromString(JSG.defaultEdgeType);
		if (edge.getShape().getType() === OrthoLineShape.TYPE) {
			edgeCreation = new CreateOrthoEdgeInteraction(edge);
			edgeCreation.useCreationMode(CreateOrthoEdgeInteraction.CREATION_MODE.CLICK);
		} else {
			edgeCreation = new CreateEdgeInteraction(edge);
		}
		return edgeCreation;
	}

	/**
	 * Implemented to be notified about mouse move events.</br>
	 *
	 * @method onMouseMove
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 */
	onMouseMove(event, viewer, dispatcher) {
		if (this._timerId) {
			if (
				Math.abs(this._timerLocation.x - dispatcher.currentLocation.x) > 200 ||
				Math.abs(this._timerLocation.y - dispatcher.currentLocation.y) > 200
			) {
				clearTimeout(this._timerId);
				this._timerId = undefined;
				this._removePortsHighlights(viewer);
				event.doRepaint = true;
			} else {
				return;
			}
		}

		let highlight;

		if (this.isDisposed === false) {
			const portsRemoved = this._removePortsHighlights(viewer);
			if (!event.isConsumed) {
				highlight = this._showPortHighlights(viewer);
				let highlightDelay = 0;
				if (highlight === false) {
					highlightDelay = this._getPortHighlightDelay(viewer);
				}
				if (highlight || highlightDelay) {
					const ports = this._getPortsToHighlight(dispatcher, event, viewer, false);
					let portLayer;
					if (ports.length) {
						if (highlightDelay && this._portsController === undefined) {
							const handle = dispatcher.getCursor();
							if (handle !== Cursor.Style.RESIZE_SE) {
								this._timerLocation = dispatcher.currentLocation.copy();
								this._timerId = setTimeout(() => {
									if (this._hasActiveHighlight(ports)) {
										viewer.clearLayer('resize.edit.line.layer');
										dispatcher.setCursor(Cursor.Style.CROSS);
									}
									portLayer = viewer.getLayer(LayerId.PORTS);
									Arrays.addAll(portLayer, ports);
									dispatcher.getInteractionHandler().repaint();
									this._portsController = this._controller;
									this._controller = undefined;
								}, highlightDelay);
							}
						} else {
							if (this._hasActiveHighlight(ports)) {
								viewer.clearLayer('resize.edit.line.layer');
							}
							portLayer = viewer.getLayer(LayerId.PORTS);
							Arrays.addAll(portLayer, ports);
							event.doRepaint = true;
						}
					} else {
						event.doRepaint = portsRemoved || event.doRepaint;
					}
				}
			} else {
				event.doRepaint = portsRemoved || event.doRepaint;
			}
		}
		highlight = this._getActiveHighlight(viewer);
		if (highlight) {
			event.isConsumed = true;
			dispatcher.setCursor(Cursor.Style.CROSS);
		} else if (dispatcher.getCursor().indexOf('crosshair') > -1) {
			dispatcher.setCursor(Cursor.Style.AUTO);
		}
	}

	_showPortHighlights(viewer) {
		const graph = viewer.getGraph();
		return graph.getSettings().getPortHighlightsVisible();
	}

	_getPortHighlightDelay(viewer) {
		const graph = viewer.getGraph();
		return graph.getSettings().getPortHighlightDelay();
	}

	/**
	 * Returns the views which represents highlighted ports.
	 *
	 * @method _getPortsToHighlight
	 * @param {InteractionDispatcher} interaction The InteractionDispatcher of this activator.
	 * @param {ClientEvent} event The current event which triggered this method call.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {Array} A list of port Views.
	 * @private
	 */
	_getPortsToHighlight(interaction, event, viewer, active) {
		const controller = InteractionUtils.getPortsController(event, viewer);
		if (controller && !controller.isSelected()) {
			this._controller = controller;
			if (this._portsController && controller.getModel().getId() !== this._portsController.getModel().getId()) {
				this._portsController = undefined;
			}
			return InteractionUtils.getPortsFor(
				controller,
				interaction,
				event.event.altKey,
				active
			);
		}

		this._portsController = undefined;
		return [];
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
		return 'edge.activator';
	}
}

export default CreateEdgeActivator;
