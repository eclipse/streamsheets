/* global document */

import { default as JSG, Shape, TreeItemsNode, GraphUtils, Point } from '@cedalo/jsg-core';
import TreeInteraction from './TreeInteraction';
import StreamSheetContainerView from '../view/StreamSheetContainerView';
import TreeItemsView from '../view/TreeItemsView';
import InteractionActivator from './InteractionActivator';
import ContentNodeView from '../view/ContentNodeView';
import Cursor from '../../ui/Cursor';

const KEY = 'tree.activator';

/**
 * An InteractionActivator used to activate a {{#crossLink "TreeInteraction"}}{{/crossLink}}.
 *
 * @class TreeActivator
 * @extends InteractionActivator
 * @constructor
 */
export default class TreeActivator extends InteractionActivator {
	constructor() {
		super();

		this._controller = undefined;
	}

	getKey() {
		return TreeActivator.KEY;
	}

	dispose(viewer) {
		super.dispose(viewer);
	}

	onKeyDown(event, viewer, dispatcher) {
		const focus = viewer.getGraphView().getFocus();
		if (focus && focus.getView() instanceof TreeItemsView) {
			viewer.clearSelection();
			const interaction = this.activateInteraction(new TreeInteraction(), dispatcher);
			interaction._controller = focus;
			interaction.onKeyDown(event, viewer);
			event.isConsumed = true;
			event.hasActivated = true;
		}
	}

	onRightMouseDown(event, viewer, dispatcher) {
		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			viewer.clearSelection();
			const interaction = this.activateInteraction(new TreeInteraction(), dispatcher);
			interaction._controller = controller;
			interaction.onMouseDown(event, viewer);
			event.isConsumed = true;
			event.hasActivated = true;
		}
	}

	onMouseDown(event, viewer, dispatcher) {
		if (viewer.isResizeHandle(event)) {
			return;
		}

		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			viewer.clearSelection();
			let parent = controller.getParent();
			while (parent && !(parent.getView() instanceof StreamSheetContainerView)) {
				parent = parent.getParent();
			}
			if (parent) {
				parent.getView().moveSheetToTop(viewer);
			}
			const interaction = this.activateInteraction(new TreeInteraction(), dispatcher);
			interaction._controller = controller;
			interaction.onMouseDown(event, viewer);
			event.isConsumed = true;
			event.hasActivated = true;
		}
	}

	onMouseMove(event, viewer, dispatcher) {
		if (event.isConsumed || this.isResizeHandle(viewer, event)) {
			return;
		}

		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			const item = controller.getModel();
			const view = controller.getView();
			const treeItemAttr = item.getTreeItemAttributes();
			const depthOffset = treeItemAttr.getDepthOffset().getValue();
			const tmppoint = event.location.copy();
			const relativePoint = view.translateToTreeView(tmppoint, viewer);
			const drawlevel = parseInt(relativePoint.y / depthOffset, 10);

			dispatcher.setCursor(Cursor.Style.AUTO);
			const selectedItem = view._findSelectedItemByLevel(drawlevel);
			if (selectedItem === undefined) {
				return;
			}

			event.isConsumed = true;

			const key = view.isKeyEditing(drawlevel, relativePoint.x);
			let text = key ? selectedItem.key : selectedItem.value;

			if (text !== undefined) {
				text = text ? text.toString() : '';
				const graphics = viewer.getGraphicSystem().getGraphics();
				const textFormat = item.getTextFormat();
				textFormat.applyToGraphics(graphics);
				graphics.setFont();
				const textWidth = graphics.getCoordinateSystem().deviceToLogXNoZoom(graphics.measureText(text).width);
				textFormat.removeFromGraphics(graphics);
				if (textWidth > view._treeItemWidth - 300) {
					const tipRect = view.getItemRect(selectedItem, key);
					const cs = viewer.getCoordinateSystem();
					const canvas = viewer.getCanvas();
					const pos = new Point(tipRect.x, tipRect.y);

					GraphUtils.traverseUp(controller.getView(), viewer.getRootView(), (v) => {
						v.translateToParent(pos);
						return true;
					});

					JSG.toolTip.startTooltip(event, text, JSG.toolTip.getDelay() * 1.5, this._controller, () => {
						const zoom = cs.getZoom();
						const rect = canvas.getBoundingClientRect();
						const div = document.createElement('div');
						div.innerHTML = text;
						div.tabIndex = -1;
						div.style.resize = 'none';
						div.style.position = 'absolute';
						// on top of everything and content div
						div.style.zIndex = 101;
						div.style.border = 'none';
						div.style.background = key ? selectedItem.color : view._colorScheme.JSON_VALUE;
						div.style.color = key ? '#FFFFFF' : '#000000';
						div.style.fontSize = `${8 * zoom}pt`;
						div.style.fontName = 'Verdana';
						div.style.left = `${(cs.logToDeviceX(pos.x, false) + rect.x + 2).toFixed()}px`;
						div.style.top = `${(cs.logToDeviceX(pos.y, false) + rect.y - 1).toFixed()}px`;
						div.style.padding = '4px';
						div.style.minHeight = '10px';
						div.style.minWidth = '10px';
						div.style.overflow = '';
						div.style.boxShadow = '2px 2px 2px #BFBFBF';
						return div;
					});
				}
			}
		}
	}

	onMouseDoubleClick(event, viewer, dispatcher) {
		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			viewer.clearSelection();
			const interaction = this.activateInteraction(new TreeInteraction(), dispatcher);
			interaction._controller = controller;
			interaction.onMouseDoubleClick(event, viewer);
			event.isConsumed = true;
			event.hasActivated = true;
		}
	}

	/**
	 * Called to handle mouse wheel in interaction specifically.</br>
	 *
	 * @method onMouseWheel
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onMouseWheel(event, viewer, dispatcher) {
		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			const zDelta = event.getWheelDelta() < 0 ? 1 : -1;
			let view = controller.getView();

			while (view && !(view instanceof ContentNodeView)) {
				view = view.getParent();
			}

			if (view === undefined) {
				return;
			}

			const scrollView = view.getScrollView();
			const pt = scrollView.getScrollPosition();

			pt.y += zDelta * 1400;
			scrollView.setScrollPositionTo(pt);

			dispatcher.getInteractionHandler().repaint();
		}
	}

	/**
	 * Gets the controller at specified location or <code>undefined</code> if none could be found.
	 *
	 * @method _getControllerAt
	 * @param {Point} location The location, relative to Graph coordinate system, to start look up at.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher which
	 * notified this activator.
	 * @return {GraphItemController} The controller at specified location or
	 * <code>undefined</code>.
	 */
	_getControllerAt(location, viewer, dispatcher) {
		const cont = viewer.filterFoundControllers(Shape.FindFlags.AREA, (controller) => true);

		return (cont && cont.getModel()) instanceof TreeItemsNode ? cont : undefined;
	}

	/**
	 * Handels mouse up events.</br>
	 *
	 * @method onMouseUp
	 * @param {MouseEvent} event The mouse up event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by
	 * {{#crossLink "InteractionHandler"}}{{/crossLink}}.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher which
	 * notified this activator.
	 */
	onMouseUp(event /* , viewer, dispatcher */) {
		if (this._controller) {
			this._controller = undefined;
			event.isConsumed = true;
			event.hasActivated = true;
		}
	}

	static get KEY() {
		return KEY;
	}
}
