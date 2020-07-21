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
const Node = require('./Node');
const MessageContainer = require('./MessageContainer');
const CaptionNode = require('./CaptionNode');

/**
 * @class InboxContainer

 * @extends Node
 * @constructor
 */
module.exports = class OutboxContainer extends MessageContainer {
	constructor() {
		super();

		// outbox caption
		this._outboxCaption = new CaptionNode();
		this._outboxCaption.setName(JSG.getLocalizedString('Outbox'));
		this._outboxCaption.setType('oc');
		this.setType('outboxcontainer');
		this.addItem(this._outboxCaption);

		this._topMargin = 650;

		this.createItems();
	}

	newInstance() {
		return new OutboxContainer();
	}

	onTreeSelectionChanged(notification) {
		const item = notification.object;

		if (item.getId() === this.getMessageListItems().getId()) {
			const selection = item.getSelection(String(item.getSelectionId()));

			if (selection === undefined) {
				const messageTree = this.getMessageTreeItems();
				messageTree.setJson('{}');
			} else {
				const selId = selection.getValue();
				const selectedItem = item.getTreeItemById(selId);

				if (selectedItem !== undefined) {
					const messageTree = this.getMessageTreeItems();
					let collapsed = messageTree.getCollapsedItemPaths();
					if (collapsed.length === 0) {
						collapsed = messageTree._lastCollapsedState;
					}

					if (selectedItem._json) {
						messageTree.setJson(selectedItem._json);
						messageTree.collapseItemsByPaths(collapsed);
					} else if (selectedItem._userItems) {
						messageTree.setJsonTree(selectedItem._userItems);
						messageTree.updateLevels();
					} else {
						messageTree.setJson('{}');
					}
				}
			}
		}
	}

	_assignName(id) {
		this.setName(`OutboxContainer${id}`);
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);
		file.writeAttributeString('type', 'outboxcontainer');
	}

	layout() {
		const box = JSG.boxCache.get();
		const size = this.getSize().toPoint();

		box.setTop(0);
		box.setLeft(0);
		box.setHeight(this._topMargin);
		box.setWidth(size.x);

		this._outboxCaption.setBoundingBoxTo(box);

		JSG.boxCache.release(box);

		super.layout();
	}
};
