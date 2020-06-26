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
	TextNode,
	Shape,
	GraphSettings,
} from '@cedalo/jsg-core';
import ControllerViewer from './ControllerViewer';
import SelectionProvider from '../../graph/view/SelectionProvider';
import SelectionHandle from '../../graph/view/selection/SelectionHandle';
import SelectionView from '../../graph/view/selection/SelectionView';
import GraphInteraction from '../../graph/interaction/GraphInteraction';
import GraphView from '../../graph/view/GraphView';
import LayerId from '../../graph/view/LayerId';

/**
 * A <code>ControllerViewer</code> subclass to display a {{#crossLink "Graph"}}{{/crossLink}} model.
 * This class provides base functionality to manage graph models and should therefore be used as the base viewer.</br>
 * To handle selection the viewer holds an instance of a {{#crossLink
 * "SelectionProvider"}}{{/crossLink}}
 * and registers itself to it. Therefore the viewer will be notified about selection updates which it directly passes
 * to
 * a {{#crossLink "SelectionView"}}{{/crossLink}}. An instance of this <code>View</code> can
 * be set via {{#crossLink "GraphViewer/setSelectionView:method"}}{{/crossLink}}. In order to make this
 * work all selection changes should be done via the <code>SelectionProvider</code> to which an reference can be
 * retrieved by calling {{#crossLink "GraphViewer/getSelectionProvider:method"}}{{/crossLink}} or simply
 * use one of the selection handling methods this viewer defines.
 *
 * @class GraphViewer
 * @extends ControllerViewer
 * @constructor
 * @param {GraphicSystem} graphicSystem The graphic system to use for drawing, interaction and
 *     transformation.
 */
class GraphViewer extends ControllerViewer {
	constructor(graphicSystem) {
		super();

		this._rootView = undefined;
		this._selectionView = undefined;
		this._graphicSystem = graphicSystem;  // may be required by subclasses...
		this.setSelectionProvider(new SelectionProvider());
		this.setDefaultInteraction(new GraphInteraction());
	}

	// overwritten
	destroy() {
		super.destroy();
		if (this._rootView) {
			this._rootView.clearLayer(LayerId.SELECTION);
		}
		this._rootView = undefined;
		this._selectionView = undefined;
		this._graphicSystem = undefined;
		this._selectionProvider = undefined;
	}

	// overwritten
	setContent(controller) {
		super.setContent(controller);
		this._rootView = controller ? controller.getView() : undefined;
		this.setSelectionView(this.getSelectionView());
	}

	/**
	 * Returns the currently registered and used <code>GraphicSystem</code>.
	 *
	 * @method getGraphicSystem
	 * @return {GraphicSystem} The GraphicSystem used by this viewer.
	 */
	getGraphicSystem() {
		return this._graphicSystem;
	}

	/**
	 * Returns the <code>InteractionHandler</code> registered to the internally used <code>GraphicSystem</code>.
	 * See {{#crossLink "GraphViewer/getGraphicSystem:method"}}{{/crossLink}}.
	 *
	 * @method getInteractionHandler
	 * @return {InteractionHandler} The currently used <code>InteractionHandler</code>.
	 */
	getInteractionHandler() {
		return this._graphicSystem.interactionHandler;
	}

	/**
	 * Returns the <code>canvas</code> element registered to internal used {{#crossLink
	 * "GraphicSystem"}}{{/crossLink}}.
	 *
	 * @method getCanvas
	 * @return {canvas} The internal registered <code>canvas</code> element.
	 */
	getCanvas() {
		return this.getGraphicSystem().getCanvas();
	}

	/**
	 * Returns the coordinate system registered to internal used {{#crossLink
	 * "GraphicSystem"}}{{/crossLink}}.
	 *
	 * @method getCoordinateSystem
	 * @return {CoordinateSystem} The used coordinate system.
	 */
	getCoordinateSystem() {
		return this._graphicSystem.getGraphics().getCoordinateSystem();
	}

	/**
	 * The currently displayed graph view, which is the view of root controller content.
	 *
	 * @method getGraphView
	 * @return {GraphView} The displayed graph view.
	 */
	getGraphView() {
		return this.rootController.getView();
	}

	/**
	 * Returns the root controller content. For a <code>GraphViewer</code> this must be a <code>GraphController</code>.
	 *
	 * @method getGraphController
	 * @return {GraphController} The <code>GraphController</code> of displayed graph.
	 */
	getGraphController() {
		return this.rootController.getContent();
	}

	/**
	 * Convenience method to easily get the settings of the displayed Graph. If no Graph
	 * is registered to this viewer <code>undefined</code> is returned
	 *
	 * @method getGraphSettings
	 * @return {GraphSettings} The GraphSettings used by displayed Graph or
	 *     <code>undefined</code>.
	 */
	getGraphSettings() {
		const graph = this.getGraph();
		return (graph !== undefined) ? graph.getSettings() : undefined;
	}

	/**
	 * Convenience method to return a handle of active {{#crossLink
	 * "SelectionView"}}{{/crossLink}} at specified location. The location must be relative to
	 * the origin of the root controller content, namely the
	 * the origin of the root controller content, namely the
	 * {{#crossLink "GraphView"}}{{/crossLink}}.
	 *
	 * @method getHandleAt
	 * @param {Point} point The location to look for a handle.
	 * @param {ClientEvent} event The current event.
	 * @return {SelectionHandle} The SelectionHandle at given location or
	 *     <code>undefined</code>
	 */
	getHandleAt(point, event) {
		return this.getSelectionView().getHandleAt(point, event);
	}

	setCursor(name) {
		this._graphicSystem.setCursor(name);
	}

	getCursor() {
		return this._graphicSystem.getCursor();
	}

	/**
	 * Returns the currently used <code>SelectionView</code> which is registered to this viewer.<br/>
	 * <b>Note:</b> if no selection view was registered before calling this method will create and register the
	 * {{#crossLink "SelectionView"}}{{/crossLink}} as default selection view.
	 *
	 * @method getSelectionView
	 * @return {View} view The current selection view.
	 */
	getSelectionView() {
		if (!this._selectionView) {
			this.setSelectionView(new SelectionView());
		}
		return this._selectionView;
	}

	/**
	 * Registers given selection view to this viewer. If a {{#crossLink "GraphView"}}{{/crossLink}} is
	 * already set, the view will be registered to the GraphView {{#crossLink
	 * "LayerId/SELECTION:property"}}{{/crossLink}} layer too.
	 *
	 * @method setSelectionView
	 * @param {View} view The new selection view.
	 */
	setSelectionView(view) {
		if (view) {
			this._selectionView = view;
			this._registerSelectionView(view);
		}
	}

	/**
	 * Returns the <code>SelectionProvider</code> used by this viewer.
	 *
	 * @method getSelectionProvider
	 * @return {SelectionProvider} The <code>SelectionProvider</code> used by this viewer.
	 */
	getSelectionProvider() {
		return this._selectionProvider;
	}

	/**
	 * Sets the <code>SelectionProvider</code> for this viewer.</br>
	 * The viewer will itself register as a selection listener to given <code>SelectionProvider</code> to update
	 * internal used {{#crossLink "SelectionView"}}{{/crossLink}}.
	 *
	 * @method setSelectionProvider
	 * @param {SelectionProvider} selectionProvider The new <code>SelectionProvider</code> for this
	 *     viewer.
	 */
	setSelectionProvider(selectionProvider) {
		if (this._selectionProvider) {
			this._selectionProvider.removeSelectionChangedListener(this);
		}
		this._selectionProvider = selectionProvider;
		if (this._selectionProvider) {
			this._selectionProvider.addSelectionChangedListener(this);
		}
	}

	/**
	 * Fulfills the listener interface of {{#crossLink "SelectionProvider"}}{{/crossLink}}.
	 *
	 * @method onSelectionChanged
	 */
	onSelectionChanged() {
		const selectionView = this.getSelectionView();
		const selection = this._selectionProvider.getSelection();
		selectionView.setSelection(selection);
		this._registerSelectionView(selectionView);
	}

	/**
	 * Internal method to register given View instance as selection view to inner {{#crossLink
	 * "GraphView"}}{{/crossLink}}. I.e. the view is set as {{#crossLink
	 * "LayerId/SELECTION:property"}}{{/crossLink}} layer.
	 *
	 * @method _registerSelectionView
	 * @param {View} view The selection view to register.
	 * @private
	 */
	_registerSelectionView(view) {
		if (this._rootView) {
			// register view:
			const layer = this._rootView.getLayer(LayerId.SELECTION);
			layer[0] = view;
		}
	}


	/**
	 * Convenience method to clear selection of internal {{#crossLink
	 * "SelectionProvider"}}{{/crossLink}}.</br>
	 *
	 * @method clearSelection
	 * @param {boolean} [notify=true] Send notification message. This might not be necessary, if another item is
	 *     selected directly after the selection is cleared.
	 */
	clearSelection(notify) {
		this._selectionProvider.clearSelection(notify);
		this.getSelectionView().setRotationAngle(0);
	}

	/**
	 * Convenience method to mark given controller as selected.</br>
	 * The optional <code>selcontext</code> parameter can be used to store additional API or application
	 * dependent information for this selection. Note: in each case calling this method overwrites an earlier
	 * <code>selcontext</code> object! Either with a new object or with <code>undefined</code> if no new
	 * <code>selcontext</code> object is provided.
	 *
	 * @method select
	 * @param {ModelController} controller The controller to select.
	 * @param {Object} [selcontext] An optional arbitrary selection context object. This overwrites current
	 * selection context object.
	 */
	select(controller, selcontext) {
		this._selectionProvider.select(controller, selcontext);
	}

	/**
	 * Convenience method to deselect given controller.
	 *
	 * @method deselect
	 * @param {ModelController} controller The controller to deselect.
	 */
	deselect(controller) {
		this._selectionProvider.deselect(controller);
	}

	/**
	 * Convenience method to check if internal {{#crossLink "SelectionProvider"}}{{/crossLink}} has any
	 * selected controllers.</br>
	 *
	 * @method hasSelection
	 * @return {Boolean} <code>true</code> if selected controllers exists, <code>false</code> otherwise.
	 */
	hasSelection() {
		return this._selectionProvider.hasSelection();
	}

	/**
	 * Convenience method to check if given item is selected, i.e. its corresponding controller is selected.
	 *
	 * @method isSelected
	 * @param {GraphItem} item The item to check selection for.
	 * @return {Boolean} <code>true</code> item's controller is selected, <code>false</code> otherwise.
	 */
	isSelected(item) {
		return this._selectionProvider.isSelected(item);
	}

	/**
	 * Convenience method to return all currently selected controllers of internal {{#crossLink
	 * "SelectionProvider"}}{{/crossLink}}.
	 *
	 * @method getSelection
	 * @return {Array} A list of all selected controllers.
	 */
	getSelection() {
		return this._selectionProvider.getSelection();
	}

	/**
	 * Convenience method to set current selection to the list of given controllers.</br>
	 * The optional <code>selcontext</code> parameter can be used to store additional API or application
	 * dependent information for this selection. Note: in each case calling this method overwrites an earlier
	 * <code>selcontext</code> object! Either with a new object or with <code>undefined</code> if no new
	 * <code>selcontext</code> object is provided.
	 *
	 * @method setSelection
	 * @param {Array} selectedControllers An array of controllers to select.
	 * @param {Object} [selcontext] An optional arbitrary selection context object. This overwrites current
	 * selection context object.
	 */
	setSelection(selectedControllers, selcontext) {
		this._selectionProvider.selectAll(selectedControllers, selcontext);
	}


	/**
	 * Convenience method to specify the overlay view of displayed {{#crossLink
	 * "GraphView"}}{{/crossLink}}.
	 *
	 * @method setOverlayView
	 * @param {View} view The new overlay view.
	 */
	setOverlayView(view) {
		if (this._rootView instanceof GraphView) {
			this._rootView.setOverlayView(view);
		}
	}

	/**
	 * Convenience method to remove current overlay view from displayed {{#crossLink
	 * "GraphView"}}{{/crossLink}}.
	 *
	 * @method removeOverlayView
	 */
	removeOverlayView() {
		if (this._rootView instanceof GraphView) {
			this._rootView.removeOverlayView();
		}
	}


	/**
	 * Convenience method to look up the controller for given item. If no controller could be found
	 * <code>undefined</code> is returned.
	 *
	 * @method findControllerForItem
	 * @param {GraphItem} item The graph item to find the controller for.
	 * @return {ModelController} The controller of specified graph item or <code>undefined</code>.
	 */
	findControllerForItem(item) {
		return this.rootController.content.findModelController(item);
	}

	collectControllers(event) {
		if (this._controllers === undefined) {
			this._controllers = {
				data: [],
				length: 0
			};
		} else {
			this._controllers.length = 0;
		}
		JSG.scaledFindRadius = this.getGraph().getFindRadius();
		this.collectVisibleControllersAt(event.location, this._controllers);
	}

	filterFoundControllers(flag, callback) {
		if (this._controllers === undefined || this._controllers.length === 0) {
			return undefined;
		}

		callback = callback || this.condition;

		for (let i = 0; i < this._controllers.length; i += 1) {
			const info = this._controllers.data[i];
			if (info.controller.containsPoint(info.location, flag)) {
				const ret = callback(info.controller, info.location);
				if (ret === true) {
					return info.controller;
				}
			}
		}

		return undefined;
	}

	condition(controller, location) {
		let child;
		let i;
		let j;
		let model = controller.getModel();

		if (((model instanceof TextNode) && model.isAssociated())) {
			const parent = controller.getParent();
			if (parent) {
				for (i = 0, j = parent.children.length; i < j; i += 1) {
					child = parent.children[i];
					model = child.getModel();
					if (((model instanceof TextNode) && model.isAssociated())) {
						if (child.isSelected()) {
							return true;
						}
					}
				}
				if (!parent.isSelected()) {
					const loc = location.copy();
					parent.getModel().translateToParent(loc);
					if (parent.containsPoint(loc, Shape.FindFlags.AREA)) {
						return false;
					}
				}
			}
		}
		return controller.isSelectable();
	}

	/**
	 * Calculates the currently visible graph rectangle based on currently visible view region.<br/>
	 * Note: the returned rectangle corresponds to the visible graph region as it would be if it was drawn in
	 * {{#crossLink "GraphSettings.DisplayMode/ENDLESS:property"}}{{/crossLink}} mode.
	 *
	 * @method getVisibleGraphRect
	 * @param {Rectangle} [reuserect] Optional rectangle to reuse. If not given a new one will be created.
	 * @return {Rectangle} The currently visible graph region.
	 */
	getVisibleGraphRect(reuserect) {
		return this.getGraphView().getVisibleViewRect(reuserect);
	}

	isResizeHandle(event) {
		if (this.hasSelection()) {
			const loc = JSG.ptCache.get().setTo(event.location);
			this.translateFromParent(loc);
			const handle = this.getHandleAt(loc, event);
			JSG.ptCache.release(loc);
			return handle !== undefined &&
				(handle instanceof SelectionHandle) &&
				(handle.getType() === 'resize' || handle.getType() === 'rotate' || handle.getType() === 'reshape');
		}

		return false;
	}

	setWheelZoom(event) {
		const currentZoom = this.getZoom();
		const up = event.getWheelDelta() > 0;
		let factor = 1;
		if (up) {
			if (currentZoom < 0.25) {
				factor = 0.25;
			} else if (currentZoom < 0.33) {
				factor = 0.33;
			} else if (currentZoom < 0.5) {
				factor = 0.5;
			} else if (currentZoom < 0.66) {
				factor = 0.66;
			} else if (currentZoom < 0.75) {
				factor = 0.75;
			} else if (currentZoom < 1) {
				factor = 1;
			} else if (currentZoom < 1.25) {
				factor = 1.25;
			} else if (currentZoom < 1.5) {
				factor = 1.5;
			} else if (currentZoom < 2) {
				factor = 2;
			} else if (currentZoom < 3) {
				factor = 3;
			} else if (currentZoom < 4) {
				factor = 4;
			} else if (currentZoom < 5) {
				factor = 5;
			} else if (currentZoom < 6) {
				factor = 6;
			} else if (currentZoom < 7) {
				factor = 7;
			} else {
				factor = 8;
			}
		} else if (currentZoom > 7) {
			factor = 7;
		} else if (currentZoom > 6) {
			factor = 6;
		} else if (currentZoom > 5) {
			factor = 5;
		} else if (currentZoom > 4) {
			factor = 4;
		} else if (currentZoom > 3) {
			factor = 3;
		} else if (currentZoom > 2) {
			factor = 2;
		} else if (currentZoom > 1.5) {
			factor = 1.5;
		} else if (currentZoom > 1.25) {
			factor = 1.25;
		} else if (currentZoom > 1) {
			factor = 1;
		} else if (currentZoom > 0.75) {
			factor = 0.75;
		} else if (currentZoom > 0.66) {
			factor = 0.66;
		} else if (currentZoom > 0.5) {
			factor = 0.5;
		} else if (currentZoom > 0.33) {
			factor = 0.33;
		} else if (currentZoom > 0.25) {
			factor = 0.25;
		} else {
			factor = 0.1;
		}

		this.setZoom(factor);
	}
}

export default GraphViewer;
