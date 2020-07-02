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
const JSG = require('../../JSG');
const Numbers = require('../../commons/Numbers');
const Notification = require('../notifications/Notification');
const NotificationCenter = require('../notifications/NotificationCenter');
const MessageContainer = require('./MessageContainer');
const TreeItemsNode = require('./TreeItemsNode');

/**
 * @class InboxContainer

 * @extends Node
 * @constructor
 */
module.exports = class InboxContainer extends MessageContainer {
	constructor() {
		super();

		this.createItems();
		this.getMessageTreeItems()._lastCollapsedState.push('[Metadata]');
		this.getFormat().setLineColor(JSG.theme.frame);

		this._drawEnabled = false;
	}

	onTreeSelectionChanged(notification) {
		const item = notification.object;

		if (item === this.getMessageTreeItems()) {
			const sheetContainer = this.getParent();
			const attr = sheetContainer.getStreamSheetContainerAttributes();
			const selection = item.getSelection(String(item.getSelectionId()));
			const loopAttr = attr.getLoopElement();

			if (!loopAttr || !selection) {
				return;
			}

			const loopPath = loopAttr.getValue();
			const selId = selection.getValue();
			const selectedItem = item.getTreeItemById(selId);

			if (selectedItem === undefined) {
				return;
			}

			const selstr = item.getItemPath(selectedItem);

			if (selstr.startsWith(loopPath)) {
				const parts = TreeItemsNode.splitPath(selstr);
				if (parts.length > 1) {
					const index = parts[1];
					if (Numbers.canBeNumber(index)) {
						attr.setLoopIndex(parseInt(index, 10));
						if (selectedItem.visible === false) {
							item.expandTreeToDepth(selectedItem.depth);
						}
					}
				}
			}
		} else if (item === this.getMessageListItems()) {
			const selection = item.getSelection(String(item.getSelectionId()));
			const messageTree = this.getMessageTreeItems();

			if (selection) {
				const selId = selection.getValue();
				const selectedItem = item.getTreeItemById(selId);
				const currentSelection = messageTree.getSelectedItemPath();

				if (selectedItem !== undefined) {
					let collapsed = messageTree.getCollapsedItemPaths();
					if (collapsed.length === 0) {
						collapsed = messageTree._lastCollapsedState;
					}

					let metadataExpanded;
					if (messageTree.getTreeItemCount()) {
						metadataExpanded = messageTree.getTreeItemAt(0).expanded;
					}
					messageTree.setJson(selectedItem._json);
					// if (collapsed.length && collapsed[0].indexOf('[Metadata]') === -1 &&
					// 	messageTree.getTreeItemCount()) {
					// 	const item = messageTree.getTreeItemAt(0);
					// 	item.expanded = false;
					// }
					messageTree.collapseItemsByPaths(collapsed);
					if (messageTree.getTreeItemCount() && metadataExpanded !== undefined) {
						messageTree.getTreeItemAt(0).expanded = metadataExpanded;
					}

					const activeItem = messageTree
						.getTreeItemAttributes()
						.getActiveElement()
						.getValue();
					if (activeItem === undefined || activeItem === '') {
						// if no loop, try to restore selection
						if (currentSelection) {
							const selitem = messageTree.getItemByPath(TreeItemsNode.splitPath(currentSelection));
							if (selitem !== undefined) {
								messageTree._resetViewport = false;
								NotificationCenter.getInstance().send(
									new Notification(TreeItemsNode.SELECTION_CHANGED_NOTIFICATION, messageTree)
								);
							}
						}
					}
				} else {
					messageTree.setJson('{}');
				}
			} else {
				messageTree.setJson('{}');
			}
		}
	}

	newInstance() {
		return new InboxContainer();
	}

	onClick(button) {
		switch (button.getName().getValue()) {
			case 'loop':
				break;
			default:
				return super.onClick(button);
		}

		return undefined;
	}

	_assignName(id) {
		this.setName(`InboxContainer${id}`);
	}

	getStreamSheet() {
		return this.getParent().getStreamSheet();
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);
		file.writeAttributeString('type', 'inboxcontainer');
	}
};
