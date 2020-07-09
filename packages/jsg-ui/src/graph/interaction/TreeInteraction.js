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
/* global document */

import {
	TreeItemsNode,
	Notification,
	NotificationCenter,
	TreeItem,
	Shape,
	Point,
	default as JSG
} from '@cedalo/jsg-core';
import EditTreeInteraction from './EditTreeInteraction';
import TreeFeedbackView from '../feedback/TreeFeedbackView';
import Interaction from './Interaction';
import ContentNodeView from '../view/ContentNodeView';
import Cursor from '../../ui/Cursor';

/**
 * Interaction that handles TreeView item selection and edit.
 *
 * @class TreeInteraction
 *
 * @constructor
 */

const TREE_SHOW_CONTEXT_MENU_NOTIFICATION = 'tree_show_context_menu_notification';

export default class TreeInteraction extends Interaction {
	constructor() {
		super();
		this._controller = undefined;
		this._offset = new Point(0, 0);
	}

	deactivate(viewer) {
		viewer.clearInteractionFeedback();
		this._feedback = undefined;
	}

	onKeyDown(event, viewer) {
		if (!this._controller) {
			return undefined;
		}
		const view = this._controller.getView();

		if (!view) {
			return undefined;
		}

		const defaultAction = () => {
			if (event.event.keyCode > 47) {
				this._startEditTreeInteraction(event, viewer, false);
				event.consume();
			}
		};

		switch (event.event.key) {
			case 'Tab': {
				// tab key:
				const currentSelectedItem = view.getSelectedItem();
				if (currentSelectedItem !== undefined) {
					this._changeTreeItemDepth(currentSelectedItem, event.event.shiftKey);
				}
				event.consume();
				break;
			}
			case 'Enter': {
				// Enter key
				const currentSelectedItem = view.getSelectedItem();
				if (currentSelectedItem !== undefined) {
					this._addTreeItem(true);
				}
				event.consume();
				break;
			}
			case 'PageUp': {
				// PageUp key
				view.setPreviousRootItemAsSelected(viewer);
				event.consume();
				break;
			}
			case 'PageDowm': {
				// PageDown key
				view.setNextSubItemAsSelected(viewer);
				event.consume();
				break;
			}
			case 'End': {
				// End key:
				view.setLastItemAsSelected(viewer);
				event.consume();
				break;
			}
			case 'Home': {
				// Home key:
				view.setFirstItemAsSelected(viewer);
				event.consume();
				break;
			}
			case 'ArrowUp': {
				// up arrow:
				const currentSelectedItem = view.getSelectedItem();
				if (currentSelectedItem !== undefined && currentSelectedItem.drawlevel) {
					view.setSelectedItem(currentSelectedItem.drawlevel - 1, viewer);
				}
				event.consume();
				break;
			}
			case 'ArrowDown': {
				// down arrow:
				const currentSelectedItem = view.getSelectedItem();
				if (currentSelectedItem !== undefined) {
					const max = view.getItem().getVisibleTreeItemCount();
					if (currentSelectedItem.drawlevel + 1 < max) {
						view.setSelectedItem(currentSelectedItem.drawlevel + 1, viewer);
					}
				}
				event.consume();
				break;
			}
			case 'Insert': {
				// insert key:
				const currentSelectedItem = view.getSelectedItem();
				if (currentSelectedItem !== undefined) {
					this._addTreeItem(false);
				}
				event.consume();
				break;
			}
			case 'Delete': {
				// delete key:
				const currentSelectedItem = view.getSelectedItem();
				if (currentSelectedItem !== undefined && !view.getItem().getDisableElementChanges()) {
					view.deleteTreeItem(currentSelectedItem, viewer);
				}
				event.consume();
				break;
			}
			case 'i':
				// CTRL + i for dummy data
				if (event.event.ctrlKey) {
					const json = {
						Type: 'Stammdaten',
						Artikelart: 'Wein',
						Sorte: 'Weiß',
						Erfassung: {
							Datum: '3.1.2017',
							Name: 'Michael Heinz'
						},
						Artikel: []
					};

					for (let i = 0; i < 2; i += 1) {
						json.Artikel.push({
							Nr: i,
							'Na.me': `Burg.und.er ${i}`,
							'Be stand': i * 10,
							Drinkable: true,
							Sizes: ['0,75', 1.5, '3']
						});
					}

					for (let i = 0; i < 2; i += 1) {
						json.Artikel.push([0.75, 1.5, 3]);
					}

					for (let i = 0; i < 2; i += 1) {
						json.Artikel.push([{ Type: 'Bottle', Size: 1.5 }]);
					}

					const jsonString = JSON.stringify(json);
					const model = this._controller.getModel();

					if (event.event.shiftKey) {
						const tree = model.getJsonTree();
						for (let i = 0; i < 5; i += 1) {
							const newItem = new TreeItem(i.toString(), 'Message', 'Name', 0, null);
							newItem.type = TreeItemsNode.DataType.STRING;
							newItem.visible = true;
							newItem.parent = -1;
							newItem._json = jsonString;

							tree.push(newItem);
						}
						model.updateLevels();
					} else {
						model.setJson(jsonString);
					}
					viewer.getGraph().markDirty();
				} else {
					defaultAction();
				}
				event.consume();
				break;
			case 'c': {
				if (event.event.ctrlKey) {
					const currentSelectedItem = view.getSelectedItem();
					if (currentSelectedItem !== undefined) {
						view.getItem().saveCopyDataForLevel(currentSelectedItem);
						this.copyToClipboard(currentSelectedItem);
						event.consume();
					}
				} else {
					defaultAction();
				}
				break;
			}
			case 'v': {
				// CTRL + v keys for paste:
				if (event.event.ctrlKey && !view.getItem().getDisableElementChanges()) {
					if (!view.pasteTree(view.getSelectedItem(), viewer)) {
						return false;
					}
					event.consume();
				} else {
					defaultAction();
				}
				break;
			}
			case 'z':
				if (event.event.ctrlKey) {
					viewer.getInteractionHandler().undo();
				} else {
					defaultAction();
				}
				break;
			case '-':
			case '+': {
				const currentSelectedItem = view.getSelectedItem();
				if (currentSelectedItem) {
					this.expandItem(currentSelectedItem);
				}
				break;
			}
			default:
				defaultAction();
				break;
		}

		// viewer.getGraph().markDirty();

		return false;
	}

	_doExceedThreshold(event, viewer) {
		const threshold = viewer.getCoordinateSystem().metricToLogXNoZoom(50);
		const location = JSG.ptCache
			.get()
			.setTo(this.currentLocation)
			.subtract(this.startLocation);
		const ext = location.length();
		JSG.ptCache.release(location);
		return ext > threshold;
	}

	_createFeedback(selectedItem, event, viewer) {
		if (this._feedback) {
			this._feedback.setLocationTo(this.currentLocation);
			return;
		}

		this._feedback = new TreeFeedbackView(selectedItem.key);
		this._feedback.setLocationTo(this.currentLocation);

		viewer.addInteractionFeedback(this._feedback);
	}

	_condition(controller) {
		return controller.getModel().isVisible();
	}

	_updateFeedback(event, viewer) {
		const view = this._controller.getView();
		const item = this._controller.getModel();
		const selectedItem = view.getSelectedItem();

		if (selectedItem === undefined) {
			return;
		}

		const defInteraction = this.getInteractionHandler().getDefaultInteraction();
		const controller = defInteraction.getControllerAt(event.location, undefined, this._condition);

		if (controller === undefined) {
			return;
		}

		// remove last feedback
		viewer.clearInteractionFeedback();
		this._feedback = undefined;

		const targetView = controller.getView();
		if (!targetView.getDragTarget) {
			this._createFeedback(selectedItem, event, viewer);
			return;
		}

		const target = targetView.getDragTarget();
		if (target && target.getFeedback) {
			const selection = item.getSelection(String(item.getSelectionId()));
			const tmppoint = this.startLocation.copy();
			const relativePoint = view.translateToTreeView(tmppoint, viewer);
			const key = view.isKeyEditing(selectedItem.drawlevel, relativePoint.x);

			const feedback = target.getFeedback(
				this.currentLocation,
				this.startLocation,
				selectedItem.key,
				view,
				key,
				event,
				viewer
			);
			if (feedback) {
				this._feedback = feedback;
				viewer.addInteractionFeedback(this._feedback);
			} else {
				this._createFeedback(selectedItem, event, viewer);
			}
		}
	}

	onMouseMove(event, viewer) {
		if (this.isInside(viewer, event.location)) {
			if (this._controller) {
				this.setCursor(Cursor.Style.AUTO);
				this._controller.getView().showTooltip(viewer, event);
			}
		} else {
			this.cancelInteraction(event, viewer);
			this.setCursor(Cursor.Style.AUTO);
		}
	}

	onMouseDrag(event, viewer) {
		if (!this._doExceedThreshold(event, viewer)) {
			return;
		}

		this._updateFeedback(event, viewer);
	}

	onPaste(event, viewer) {
		const controller = viewer.getGraphView().getFocus();

		if (controller === undefined) {
			return;
		}

		const item = controller.getModel();

		if (!(item instanceof TreeItemsNode) || item.getDisableElementChanges()) {
			return;
		}

		// use event.originalEvent.clipboard for newer chrome versions

		const { items } = event.event.clipboardData || event.event.originalEvent.clipboardData;
		// console.log(JSON.stringify(items)); // will give you the mime types
		// find pasted image among pasted items
		let i;
		for (i = 0; i < items.length; i += 1) {
			if (items[i].type.indexOf('plain') !== -1) {
				items[i].getAsString((json) => {
					const newItem = new TreeItem(undefined, 'Clipboard', item.getTreeItemCount(), 0, null);
					newItem.type = TreeItemsNode.DataType.STRING;
					newItem.visible = true;
					newItem.parent = -1;
					newItem._json = json;

					const cmd = new JSG.AddTreeItemCommand(item, -1, newItem);
					const interactionHandler = this.getInteractionHandler();
					interactionHandler.execute(cmd);
				});
			}
		}
	}

	onMouseDown(event, viewer) {
		const item = this._controller.getModel();
		const view = this._controller.getView();
		const treeItemAttr = item.getTreeItemAttributes();
		const depthOffset = treeItemAttr.getDepthOffset().getValue();
		const tmppoint = event.location.copy();
		const relativePoint = view.translateToTreeView(tmppoint, viewer);
		const drawlevel = parseInt(relativePoint.y / depthOffset, 10);
		const selecteditem = view._findSelectedItemByLevel(drawlevel);

		viewer.getGraphView().setFocus(this._controller);

		if (selecteditem === undefined) {
			// view.setSelectedItem(undefined, viewer);
		} else if (
			selecteditem.expanded !== null &&
			relativePoint.x < view._expanderOffset + view._treeItemLeftMargin + view._indentOffset * selecteditem.depth
		) {
			this.expandItem(selecteditem);
		} else if (
			item.getCheckboxes() &&
			selecteditem.checked !== undefined &&
			relativePoint.x <
				view._expanderOffset + view._treeItemLeftMargin + view._indentOffset * selecteditem.depth + 550
		) {
			this.checkItem(selecteditem);
		} else {
			viewer.getGraph().markDirty();
			view.setSelectedItem(drawlevel, viewer);
		}
	}

	onMouseUp(event, viewer) {
		const view = this._controller.getView();

		viewer.clearInteractionFeedback();

		if (this._feedback /* && !(this._feedback instanceof TreeFeedbackView) */) {
			const defInteraction = this.getInteractionHandler().getDefaultInteraction();
			const controller = defInteraction.getControllerAt(event.location, undefined, this._condition);

			if (controller === undefined) {
				return;
			}

			const targetView = controller.getView();
			if (!targetView.getDragTarget) {
				return;
			}

			const target = targetView.getDragTarget();
			if (target && target.onDrop) {
				const item = this._controller.getModel();
				const selection = item.getSelection(String(item.getSelectionId()));
				if (selection !== undefined) {
					target.onDrop(this._feedback, selection.getValue(), view, event, viewer);
				}
			}
		}

		this._feedback = undefined;

		if (this.isInside(viewer, event.location)) {
			event.isConsumed = true;
			event.hasActivated = true;
		} else {
			this.finishInteraction(event, viewer);
		}
	}

	onMouseDoubleClick(event, viewer) {
		if (this._controller !== undefined) {
			const item = this._controller.getModel();
			const view = this._controller.getView();
			const treeItemAttr = item.getTreeItemAttributes();
			const depthOffset = treeItemAttr.getDepthOffset().getValue();
			const tmppoint = event.location.copy();
			const relativePoint = view.translateToTreeView(tmppoint, viewer);
			const drawlevel = parseInt(relativePoint.y / depthOffset, 10);
			const selecteditem = view._findSelectedItemByLevel(drawlevel);

			viewer.getGraphView().setFocus(this._controller);

			if (selecteditem &&
				selecteditem.expanded !== null &&
				relativePoint.x < view._expanderOffset + view._treeItemLeftMargin + view._indentOffset * selecteditem.depth
			) {
				return;
			}

			if (this._selectTreeItemAtPosition(relativePoint, depthOffset, viewer)) {
				const isKeyEditing = this._isKeyEditing(tmppoint, depthOffset);
				this._startEditTreeInteraction(event, viewer, isKeyEditing);
			} /* if (item.getTreeItemCount() === 0) */ else {
				this._addTreeItem(false);
			}
		}
	}

	isInside(viewer, location) {
		if (this._controller === undefined) {
			return false;
		}
		const controller = viewer.filterFoundControllers(Shape.FindFlags.AREA, (cont) => true);

		if (
			this._controller !== controller ||
			controller === undefined ||
			!(controller.getModel() instanceof TreeItemsNode)
		) {
			return false;
		}

		const view = this._controller.getView();
		const item = view.getItem();
		const bounds = item.getTranslatedBoundingBox(item.getGraph());
		const point = this.getViewer().translateFromParent(location.copy());

		return bounds.containsPoint(point);
	}
	/**
	 * Expand selected item
	 * @param item Item to expand.
	 */
	expandItem(item) {
		const cmd = new JSG.SetTreeItemExpandFlagCommand(this._controller.getModel(), item.level, !item.expanded);
		const interactionHandler = this.getInteractionHandler();

		interactionHandler.execute(cmd);
	}

	checkItem(item) {
		const cmd = new JSG.SetTreeItemCheckedFlagCommand(this._controller.getModel(), item.level, !item.checked);
		const interactionHandler = this.getInteractionHandler();

		interactionHandler.execute(cmd);
	}

	_startEditTreeInteraction(event, viewer, isKeyEditing) {
		const selectedTreeItem = this._controller.getView().getSelectedItem();
		if (selectedTreeItem === undefined || !selectedTreeItem.editable) {
			return undefined;
		}

		if (this._controller.getModel().getOnlyKeys()) {
			isKeyEditing = true;
		}

		if (this._controller.getModel().isParentArray(selectedTreeItem) && isKeyEditing) {
			return undefined;
		}

		event.doRepaint = JSG.clipTree !== undefined;
		JSG.clipTree = undefined;

		this._controller
			.getModel()
			.getGraph()
			.markDirty();

		const interaction = this.activateInteraction(new EditTreeInteraction(), this);
		interaction._controller = this._controller;
		interaction.startEdit(this._controller, event, viewer, isKeyEditing);
		event.hasActivated = true;

		return interaction;
	}

	activateInteraction(interaction, oldInteraction) {
		const interactionHandler = oldInteraction.getInteractionHandler();
		if (interactionHandler !== undefined) {
			interaction.setStartLocation(oldInteraction.startLocation);
			interaction.setCurrentLocation(oldInteraction.currentLocation);
			interactionHandler.setActiveInteraction(interaction);
		}
		return interaction;
	}

	_selectTreeItemAtPosition(point, depthOffset, viewer) {
		const itemLevel = parseInt(point.y / depthOffset, 10);
		return this._controller.view.setSelectedItem(itemLevel, viewer);
	}

	_isKeyEditing(point, depthOffset) {
		const itemLevel = parseInt(point.y / depthOffset, 10);
		return this._controller.view.isKeyEditing(itemLevel, point.x);
	}

	_addTreeItem(behindCurrent) {
		const model = this._controller.getModel();
		const selectedItem = this._controller.getView().getSelectedItem();
		let index;
		let newItem;

		if (model.getDisableElementChanges()) {
			return;
		}

		if (selectedItem) {
			newItem = new TreeItem(undefined, undefined, '', selectedItem.depth, null);

			newItem.type =
				selectedItem.type === TreeItemsNode.DataType.ARRAYITEM
					? TreeItemsNode.DataType.ARRAYITEM
					: TreeItemsNode.DataType.STRING;
			newItem.visible = true;
			newItem.parent = selectedItem.parent;

			if (behindCurrent) {
				index = selectedItem.level + model.getSubTreeItemCount(selectedItem) + 1;
			} else {
				index = selectedItem.level;
			}
		} /* if (model.getTreeItemCount() === 0) */ else {
			index = -1;
			newItem = new TreeItem(undefined, undefined, '', 0, null);

			newItem.type = TreeItemsNode.DataType.STRING;
			newItem.visible = true;
			newItem.parent = -1;
		}

		const cmd = new JSG.AddTreeItemCommand(model, index, newItem);
		const interactionHandler = this.getInteractionHandler();
		interactionHandler.execute(cmd);

		this._controller.getView().setSelectedItem(newItem.drawlevel, this.getViewer());
	}

	_changeTreeItemDepth(selectedItem, up) {
		const model = this._controller.getModel();
		const item = model.getTreeItemAt(selectedItem.level);

		if (up) {
			if (item.depth === 0) {
				return;
			}
		} else {
			if (item.level === 0) {
				return;
			}

			const prevItem = model.getTreeItemAt(selectedItem.level - 1);

			if (prevItem.depth < item.depth) {
				return;
			}
		}

		const cmd = new JSG.SetTreeItemDepthCommand(model, selectedItem.level, up);
		const interactionHandler = this.getInteractionHandler();

		interactionHandler.execute(cmd);

		this._controller.getView().setSelectedItem(item.drawlevel, this.getViewer());
	}

	handleContextMenu(event, viewer) {
		if (this._controller === undefined) {
			return;
		}

		this.onMouseDown(event, viewer);

		NotificationCenter.getInstance().send(
			new Notification(TreeInteraction.TREE_SHOW_CONTEXT_MENU_NOTIFICATION, {
				event,
				viewer,
				controller: this._controller
			})
		);
	}

	/**
	 * Called to handle mouse wheel in interaction specifically.</br>
	 *
	 * @method onMouseWheel
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onMouseWheel(event, viewer, dispatcher) {
		if (this._controller === undefined) {
			return;
		}

		const zDelta = event.getWheelDelta() < 0 ? 1 : -1;
		let view = this._controller.getView();

		while (view && !(view instanceof ContentNodeView)) {
			view = view.getParent();
		}

		if (view === undefined) {
			return;
		}

		view._didScroll = true;
		const scrollView = view.getScrollView();
		const pt = scrollView.getScrollPosition();

		pt.y += zDelta * 700;
		scrollView.setScrollPositionTo(pt);

		this.getInteractionHandler().repaint();
	}

	cancelInteraction(event, viewer) {
		if (event !== undefined) {
			event.doRepaint = true;
		}
		this._controller = undefined;

		super.cancelInteraction(event, viewer);
	}

	copyToClipboard(item) {
		const model = this._controller.getModel();
		const json = model.getJsonForItem(item);
		if (json === 'error') {
			return;
		}
		const focus = document.activeElement;
		const textarea = document.createElement('textarea');

		// Place in top-left corner of screen regardless of scroll position.
		textarea.style.position = 'fixed';
		textarea.style.top = 0;
		textarea.style.left = 0;

		// Ensure it has a small width and height. Setting to 1px / 1em
		// doesn't work as this gives a negative w/h on some browsers.
		textarea.style.width = '1px';
		textarea.style.height = '1px';
		textarea.style.padding = 0;
		textarea.style.border = 'none';
		textarea.style.outline = 'none';
		textarea.style.boxShadow = 'none';
		textarea.style.background = 'transparent';

		document.body.appendChild(textarea);

		/* Copy the text inside the text field */
		textarea.value = json;
		textarea.select();
		document.execCommand('Copy');
		document.body.removeChild(textarea);
		focus.focus();
	}

	static get TREE_SHOW_CONTEXT_MENU_NOTIFICATION() {
		return TREE_SHOW_CONTEXT_MENU_NOTIFICATION;
	}
}
