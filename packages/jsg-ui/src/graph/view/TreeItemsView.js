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
	default as JSG,
	NotificationCenter,
	Point,
	GraphUtils,
	Rectangle,
	SetSelectionCommand,
	RemoveSelectionCommand,
	Notification,
	FormatAttributes,
	TreeItemsNode,
	PasteTreeItemCommand
} from '@cedalo/jsg-core';

import TreeFeedbackView from '../feedback/TreeFeedbackView';
import NodeView from './NodeView';
import ContentPaneView from './ContentPaneView';

/**
 * This view is for a {{#crossLink "TreeItemsNode"}}{{/crossLink}} model. Although it
 * can be instantiated directly the recommended way to create this view is by calling
 * {{#crossLink "NodeController/createView:method"}}{{/crossLink}} method.
 * @class TreeItemsView
 * @extends NodeView
 * @param {TreeItemsNode} item The corresponding TreeItemsNode model.
 * @constructor
 */
export default class TreeItemsView extends NodeView {
	constructor(item) {
		super(item);

		const treeItemAttr = this.getItem().getTreeItemAttributes();
		this._treeItemWidth = treeItemAttr.getTreeItemWidth().getValue();
		this._treeItemHeight = treeItemAttr.getTreeItemHeight().getValue();
		this._treeItemLeftMargin = item
			.getItemAttributes()
			.getLeftMargin()
			.getValue();
		this._indentOffset = treeItemAttr.getIndentOffset().getValue();
		this._depthOffset = treeItemAttr.getDepthOffset().getValue();
		this._colorScheme = {
			JSON_VALUE: treeItemAttr.getColorJsonValue().getValue(),
			JSON_KEY_TEXT: treeItemAttr.getColorJsonKeyText().getValue(),
			JSON_SELECTION_OVERLAY_COLOR: treeItemAttr.getSelectionOverlayColor().getValue()
		};

		this._expanderOffset = 300;

		const nc = NotificationCenter.getInstance();
		nc.register(this, TreeItemsNode.SELECTION_CHANGED_NOTIFICATION, 'onTreeSelectionChanged');
		nc.register(this, TreeItemsNode.PRE_COLLAPSE_NOTIFICATION, 'onTreePreCollapse');
		nc.register(this, TreeItemsNode.POST_COLLAPSE_NOTIFICATION, 'onTreePostCollapse');
	}

	dispose() {
		super.dispose();

		// unregister from NotificationCenter:
		const nc = NotificationCenter.getInstance();
		nc.unregister(this, TreeItemsNode.SELECTION_CHANGED_NOTIFICATION);
		nc.unregister(this, TreeItemsNode.PRE_COLLAPSE_NOTIFICATION);
		nc.unregister(this, TreeItemsNode.POST_COLLAPSE_NOTIFICATION);
	}

	drawFill(graphics, format, rect) {
		super.drawFill(graphics, format, rect);

		const visibleJsonTree = this._getVisibleJsonTree();
		this.drawTree(graphics, rect, visibleJsonTree);
	}

	onTreePreCollapse(notification) {
		const item = notification.object;

		if (item.getId() !== this.getItem().getId()) {
			return;
		}

		const contentNode = this.getParent()
			.getParent()
			.getParent()
			.getParent()
			.getParent();
		const offset = contentNode.getScrollOffset();
		const drawlevel = Math.floor(Math.abs(offset.y / this._depthOffset));

		this._resetItem = this._findSelectedItemByLevel(drawlevel);
	}

	onTreePostCollapse(notification) {
		const item = notification.object;

		if (this._resetItem === undefined || item.getId() !== this.getItem().getId()) {
			return;
		}

		let treeItem = item.getTreeItemById(this._resetItem.id);
		if (treeItem === undefined) {
			return;
		}

		const model = item.getJsonTree();

		while (!treeItem.visible && treeItem.parent !== -1) {
			treeItem = model[treeItem.parent];
		}

		const y = treeItem.drawlevel * this._depthOffset;
 		this.setVerticalScroll(y);
	}

	setVerticalScroll(pos) {
		const contentNode = this.getParent()
			.getParent()
			.getParent()
			.getParent()
			.getParent();
		const viewport = contentNode.getViewPort();

		if (!viewport) {
			return;
		}

		const vmodel = viewport.getVerticalRangeModel();

		vmodel.setValue(vmodel._min + pos);
	}

	onTreeSelectionChanged(notification) {
		const item = notification.object;

		if (item.getId() !== this.getItem().getId()) {
			return;
		}

		this.showSelectedItem(this.getSelectedItem());
	}

	/**
	 * Draw the complete tree
	 * @param graphics Graphics to use for drawing
	 * @param rect Rectangle to draw in.
	 * @param treeArray Array with tree model data
	 * @private
	 */
	drawTree(graphics, rect, treeArray) {
		let parent = this.getParent();
		let cv;
		const model = this.getItem();
		const textFormat = model.getTextFormat();
		const fillColor = model.getFormat().getFillColor().getValue();

		if (model._resetViewport) {
			this.resetViewport();
			model._resetViewport = false;
		}

		if (parent instanceof ContentPaneView) {
			parent = parent.getParent();
			if (parent) {
				cv = parent.getContentView();
			}
		} else {
			cv = parent;
		}

		this._vpRect = cv.getViewPort().getVisibleViewRect();
		if (!this._vpRect) {
			return;
		}

		textFormat.applyToGraphics(graphics);

		graphics.setFont();

		rect.y += model
			.getItemAttributes()
			.getTopMargin()
			.getValue();

		const selectedItem = this.getSelectedItem();
		const activeItem = this.getActiveItem();
		this._expanderOffset = this.getItem()._maxDepth ? 300 : 0;
		this._treeItemWidth =
			(this._vpRect.width - (model._checkboxes ? 500 : 0) - model._maxDepth * this._indentOffset - this._expanderOffset - 400) /
			(model.getOnlyKeys() ? 1 : 2);

		const itemRectKey = JSG.rectCache.get();
		const itemRectValue = JSG.rectCache.get();
		const treeItemHeight = parseInt(this._treeItemHeight * (2 / 3), 10);
		const focus =
			this.getGraphView().getFocus() &&
			this.getGraphView()
				.getFocus()
				.getView() === this;

		treeArray.some((item) => {
			if (!item.visible) {
				return false;
			}
			const levelHeight = item.drawlevel * this._depthOffset;
			const indent = item.depth * this._indentOffset;
			const isSelected = selectedItem && item.level === selectedItem.level;
			const isActive = activeItem && item.level === activeItem.level;

			// key rectangle box
			const hasChildren = item.type === TreeItemsNode.DataType.ARRAY || item.type === TreeItemsNode.DataType.OBJECT;

			itemRectKey.x = rect.x + this._expanderOffset + this._treeItemLeftMargin + indent;
			itemRectKey.y = rect.y + levelHeight;
			itemRectKey.width = this._treeItemWidth;
			// itemRectKey.width = hasChildren ? this._treeItemWidth * 2 : this._treeItemWidth;
			itemRectKey.height = this._treeItemHeight;

			const draw = item.disabled === true || model.getHideEnabledItems() === false;

			if (this._vpRect.y + this._vpRect.height < itemRectKey.y) {
				return true;
			}

			if (!draw || itemRectKey.y + itemRectKey.height < this._vpRect.y) {
				return false;
			}
			// draw expander
			if (item.expanded !== null) {
				graphics.setFillColor(JSG.theme.outline);
				graphics.fillText(
					item.expanded ? '-' : '+',
					itemRectKey.x - this._expanderOffset,
					itemRectKey.y + treeItemHeight
				);
			}

			// draw checkbox, if necessary
			if (model._checkboxes && item.checked !== undefined) {
				graphics.drawImage(
					JSG.imagePool.get(item.checked ? JSG.ImagePool.IMG_TREE_CHECKED : JSG.ImagePool.IMG_TREE_UNCHECKED),
					itemRectKey.x,
					itemRectKey.y - 25,
					500,
					500
				);
				itemRectKey.x += 550;
			}

			// draw key background
			graphics.setFillColor(item.color);
			graphics.fillRoundedRectangle(itemRectKey.x, itemRectKey.y, itemRectKey.width, itemRectKey.height, 150, hasChildren ? 150 : 0, 150, hasChildren ? 150 : 0);

			if (isActive) {
				graphics.drawImage(
					JSG.imagePool.get('loop'),
					itemRectKey.getRight() + 200,
					itemRectKey.y + 100,
					500,
					400
				);
			}

			// draw key text
			graphics.setFillColor(this._colorScheme.JSON_KEY_TEXT);
			graphics.fillText(item.key, itemRectKey.x + 100, itemRectKey.y + treeItemHeight);

			if (!hasChildren) {
				// draw value rectangle box
				itemRectValue.x = rect.x + itemRectKey.getRight();
				itemRectValue.y = rect.y + levelHeight;
				itemRectValue.width = this._treeItemWidth;
				itemRectValue.height = this._treeItemHeight;

				graphics.setFillColor(JSG.theme.filllight);
				graphics.fillRoundedRectangle(itemRectValue.x, itemRectValue.y, itemRectValue.width, itemRectValue.height, 0, 150, 0, 150);

				// draw value text
				if (item.value !== undefined && item.value !== null) {
					graphics.setFillColor(JSG.theme.textlight);
					graphics.fillText(item.value, itemRectValue.x + 100, itemRectValue.y + treeItemHeight);

					// overpaint overlapping key text
					graphics.setFillColor(fillColor);
					itemRectValue.x += itemRectValue.width;
					itemRectValue.width = rect.width - itemRectValue.x;
					graphics.fillRectangle(itemRectValue.x, itemRectValue.y, itemRectValue.width, itemRectValue.height);
				}
			}

			itemRectKey.width = this._treeItemWidth * 2;

			if (item.disabled) {
				graphics.setFillColor('#FFFFFF');
				graphics.setTransparency(50);
				graphics.fillRoundedRectangle(itemRectKey.x, itemRectKey.y, itemRectKey.width, itemRectKey.height, 150, 150, 150, 150);
				graphics.setTransparency(100);
			}

			if (isSelected) {
				graphics.setLineWidth(60);
				graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
				graphics.setLineColor(focus ? '#444444' : '#777777');
				itemRectKey.expandBy(20);

				graphics.drawRoundedRectangle(itemRectKey.x, itemRectKey.y, itemRectKey.width, itemRectKey.height, 150, 150, 150, 150);

				graphics.setLineWidth(-1);
				graphics.setLineStyle(FormatAttributes.LineStyle.NONE);
				graphics.setLineColor('#000000');
			}
			return false;
		});

		JSG.rectCache.release(itemRectKey, itemRectValue);

		textFormat.removeFromGraphics(graphics);
	}

	// Return only tree items that are visible. Also, reasjusts items levels.
	_getVisibleJsonTree() {
		const visibleTree = [];
		let lastVisibleItem;
		this.getItem()
			.getJsonTree()
			.forEach((item) => {
				if (item.visible) {
					let visibleItem = item;
					if (lastVisibleItem === undefined) {
						visibleItem = item;
					} else {
						visibleItem = item;
						item.drawlevel = lastVisibleItem.drawlevel + 1;
					}
					visibleTree.push(visibleItem);
					lastVisibleItem = visibleItem;
				}
			});
		return visibleTree;
	}

	// Returns a new instance of rectangle for specified dimensions
	_createTreeItemRectangle(width, height) {
		if (width === undefined || width < this._treeItemWidth) {
			width = this._treeItemWidth;
		}
		if (height === undefined || height < this._treeItemHeight) {
			height = this._treeItemHeight;
		}
		const rectangle = JSG.rectCache.get();
		rectangle.setSize(width, height);
		return rectangle;
	}

	translateToTreeView(point, viewer) {
		viewer.translateFromParent(point);

		GraphUtils.traverseDown(this.getGraphView(), this, (v) => {
			v.translateFromParent(point);
			return true;
		});

		return point;
	}

	setSelection(selectedItem, viewer) {
		const item = this.getItem();
		let cmd;

		if (selectedItem) {
			cmd = new SetSelectionCommand(
				item,
				item.getSelectionId(),
				selectedItem.id.toString(),
				item.getItemPath(selectedItem)
			);
			this.showSelectedItem(selectedItem);
		} else {
			cmd = new RemoveSelectionCommand(item, item.getSelectionId());
		}

		viewer.getInteractionHandler().execute(cmd);

		NotificationCenter.getInstance().send(
			new Notification(TreeItemsNode.SELECTION_CHANGED_NOTIFICATION, this.getItem())
		);
	}

	getContentNodeView() {
		return this.getParent()
			.getParent()
			.getParent()
			.getParent()
			.getParent();
	}

	resetViewport() {
		const contentNode = this.getContentNodeView();
		const viewport = contentNode.getViewPort();

		if (!viewport) {
			return false;
		}
		contentNode._didScroll = false;
		viewport.getHorizontalRangeModel().setValue(0);
		viewport.getVerticalRangeModel().setValue(0);

		return true;
	}

	/**
	 * Show the given item in the viewport.
	 * @param {TreeItem} selectedItem Item, that should be made visible.
	 * @returns {boolean} Returns, if a scroll operation took place to show the item.
	 */
	showSelectedItem(selectedItem) {
		if (!selectedItem) {
			return false;
		}

		const contentNode = this.getContentNodeView();

		if (contentNode._didScroll) {
			return false;
		}

		const offset = contentNode.getScrollOffset();
		const viewport = contentNode.getViewPort();

		if (!viewport) {
			return false;
		}

		const bounds = viewport.getBounds();
		let changed = false;
		let model;
		const rect = JSG.rectCache.get();

		rect.x = 0;
		rect.y = selectedItem.drawlevel * this._depthOffset;
		rect.width = this._treeItemWidth;
		rect.height = this._treeItemHeight;

		if (rect.x + offset.x < 0) {
			model = viewport.getHorizontalRangeModel();
			model.setValue(model._min + rect.x);
			changed = true;
		}

		if (rect.y + offset.y < 0) {
			model = viewport.getVerticalRangeModel();
			model.setValue(model._min + rect.y);
			changed = true;
		}

		if (rect.getRight() + offset.x > bounds.width) {
			model = viewport.getHorizontalRangeModel();
			model.setValue(model._min + rect.getRight() - bounds.width);
			changed = true;
		}

		if (rect.getBottom() + offset.y > bounds.height - 500) {
			model = viewport.getVerticalRangeModel();
			// eslint-disable-next-line
			model.setValue(model._min + rect.getBottom() - bounds.height + 500);
			changed = true;
		}

		JSG.rectCache.release(rect);

		return changed;
	}

	setFirstItemAsSelected(viewer) {
		const item = this._findSelectedItemByLevel(0);
		this.setSelection(item, viewer);
	}

	setLastItemAsSelected(viewer) {
		const {length} = this._getVisibleJsonTree();
		const item = this._findSelectedItemByLevel(length - 1);

		this.setSelection(item, viewer);
	}

	setPreviousRootItemAsSelected(viewer) {
		const currentlySelected = this.getSelectedItem();
		const visibleTree = this._getVisibleJsonTree();
		let i;
		for (i = currentlySelected.level; i > 0; i -= 1) {
			const item = visibleTree[i];
			if (item !== undefined && item.depth === currentlySelected.depth - 1) {
				this.setSelection(item, viewer);
				break;
			}
		}
	}

	setNextSubItemAsSelected(viewer) {
		const currentlySelected = this.getSelectedItem();
		const visibleTree = this._getVisibleJsonTree();
		let i;
		for (i = currentlySelected.level; i < visibleTree.length; i += 1) {
			const item = visibleTree[i];
			if (item !== undefined && item.depth === currentlySelected.depth + 1) {
				this.setSelection(item, viewer);
				break;
			}
		}
	}

	/**
	 * Set item on given position as selected.
	 * @param {Number} drawlevel Visual position of item to select.
	 * @param {GraphViewer} viewer Current GraphViewer.
	 * @returns {TreeItem} Tree item that is selected.
	 */
	setSelectedItem(drawlevel, viewer) {
		const item = this._findSelectedItemByLevel(drawlevel);

		this.setSelection(item, viewer);

		return item;
	}

	/**
	 * Retrieve the items, that is marked as active
	 * @returns {TreeItem} Marked tree item.
	 */
	getActiveItem() {
		const item = this.getItem();
		const activeItem = item
			.getTreeItemAttributes()
			.getActiveElement()
			.getValue();

		if (activeItem === undefined || activeItem === '') {
			return undefined;
		}

		const path = TreeItemsNode.splitPath(activeItem);
		const model = this.getItem().getJsonTree();
		let depth = 0;
		let index;

		model.some((litem, i) => {
			if (litem.key === path[depth] && litem.depth <= depth) {
				if (litem.depth === path.length - 1) {
					index = i;
					return true;
				}
				depth += 1;
			}
			return false;
		});

		if (index !== undefined) {
			return model[index];
		}

		return undefined;
	}

	/**
	 * Return the current selected item
	 * @returns {TreeItem} Current item, that is selected.
	 */
	getSelectedItem() {
		const item = this.getItem();
		const mySelection = item.getSelection(String(item.getSelectionId()));

		if (mySelection === undefined) {
			return undefined;
		}

		return item.getTreeItemById(mySelection.getValue());
	}

	_findSelectedItemByLevel(drawlevel) {
		if (drawlevel < 0) {
			return undefined;
		}
		const visibleJsonTree = this._getVisibleJsonTree();
		if (visibleJsonTree.length > 0 && drawlevel < visibleJsonTree.length) {
			return visibleJsonTree[drawlevel];
		}
		return undefined;
	}

	isKeyEditing(level, xCoordinate) {
		if (level < 0 || xCoordinate < 0) {
			return false;
		}
		const visibleJsonTree = this._getVisibleJsonTree();
		const item = visibleJsonTree[level];
		const indent = item.depth * this._indentOffset + this._treeItemLeftMargin;

		return xCoordinate >= indent && xCoordinate <= indent + this._treeItemWidth;
	}

	isAtLeftKeyHalf(selectedItem, point, viewer) {
		let tmppoint = point.copy();
		tmppoint = this.translateToTreeView(tmppoint, viewer);

		if (selectedItem === undefined || tmppoint.x < 0) {
			return false;
		}
		const indent = selectedItem.depth * this._indentOffset + this._treeItemLeftMargin;

		return tmppoint.x >= indent && tmppoint.x <= indent + this._treeItemWidth / 2;
	}

	getItemRect(item, keyEditing) {
		let x = 0;
		let y = 0;
		let width = 0;
		const tree = this.getItem();

		if (keyEditing) {
			x = item.depth * this._indentOffset;
			y = item.drawlevel * this._depthOffset;
			width = this._treeItemWidth;
		} else {
			x = item.depth * this._indentOffset + this._treeItemWidth;
			y = item.drawlevel * this._depthOffset;
			const textWidth = item.value === undefined || item.value === null ? 1500 : item.value.toString().length * 210;
			width = textWidth < this._treeItemWidth ? this._treeItemWidth : textWidth;
		}

		if (tree.getCheckboxes() && item.checked !== undefined) {
			x += 550;
		}

		x +=
			tree
				.getItemAttributes()
				.getLeftMargin()
				.getValue() + (this.getItem()._maxDepth ? 250 : -50);
		y += tree
			.getItemAttributes()
			.getTopMargin()
			.getValue();

		return new Rectangle(x, y, width, this._treeItemHeight);
	}

	deleteTreeItem(item, viewer) {
		const model = this.getItem();

		this.setSelection(undefined, viewer);

		const cmd = new JSG.DeleteTreeItemCommand(model, item === undefined ? -1 : item.level);

		viewer.getInteractionHandler().execute(cmd);
	}

	pasteTree(item, viewer) {
		if (JSG.clipTree === undefined || item === undefined) {
			return false;
		}

		const cmd = new PasteTreeItemCommand(this.getItem(), item.level, JSG.clipTree);

		viewer.getInteractionHandler().execute(cmd);

		return true;
	}

	onDrop(feedback, title, sourceView, event, viewer) {
		if (sourceView === undefined || sourceView === this) {
			return;
		}

		const selection = sourceView.getSelectedItem();
		if (selection === undefined) {
			return;
		}

		sourceView.getItem().saveCopyDataForLevel(selection);

		const cmd = new PasteTreeItemCommand(this.getItem(), -1, JSG.clipTree);

		viewer.getInteractionHandler().execute(cmd);
	}

	getDragTarget() {
		return this;
	}

	getFeedback(location, startLocation, title, sourceView, key, event, viewer) {
		if (sourceView === undefined) {
			return undefined;
		}

		const point = new Point(0, 0);

		point.setTo(location);
		// point = this.translateToTreeView(point, viewer);

		const feedback = new TreeFeedbackView(title);
		feedback.setLocationTo(point);

		return feedback;
	}

	showTooltip(viewer, event) {
		const item = this.getItem();
		const view = this;
		const treeItemAttr = item.getTreeItemAttributes();
		const depthOffset = treeItemAttr.getDepthOffset().getValue();
		const tmppoint = event.location.copy();
		const relativePoint = view.translateToTreeView(tmppoint, viewer);
		const drawlevel = parseInt(relativePoint.y / depthOffset, 10);

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

				GraphUtils.traverseUp(this, viewer.getRootView(), (v) => {
					v.translateToParent(pos);
					return true;
				});

				JSG.toolTip.startTooltip(event, text, JSG.toolTip.getDelay() * 1.5, undefined, () => {
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
					div.style.fontSize = `${9 * zoom}pt`;
					div.style.fontFamily = 'Verdana';
					div.style.left = `${(cs.logToDeviceX(pos.x, false) + rect.x + 2).toFixed()}px`;
					div.style.top = `${(cs.logToDeviceX(pos.y, false) + rect.y - 2).toFixed()}px`;
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
