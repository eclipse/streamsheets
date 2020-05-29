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
const { readObject, writeJSON } = require('./utils');
const AbstractItemCommand = require('./AbstractItemCommand');
const Pin = require('../Pin');
const GraphUtils = require('../GraphUtils');

/**
 * This commands changes the parent item of a GraphItem. This is used e.g. to assign a GraphItem to another container
 * GraphItem.
 *
 * @class ChangeParentCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item Item whose parent is subject to change.
 * @param {GraphItem} parent New parent GraphItem for given item.
 */
class ChangeParentCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		// const item = readGraphItem(data.json);
		const item = graph.getItemById(data.itemId);
		const newParent = graph.getItemById(data.newParentId) || graph;
		return item
			? new ChangeParentCommand(item, newParent).initWithObject(
					data,
					graph
			  )
			: undefined;
	}

	constructor(item, parent) {
		super(item);
		this._oldPin = item.getPin().copy();
		this._oldParent = item.getParent();
		this._newParent = parent;
	}

	initWithObject(data, graph) {
		const cmd = super.initWithObject(data);
		cmd._oldPin = readObject('pin', data.oldPin, new Pin(this._graphItem));
		cmd._oldParent = graph.getItemById(data.oldParentId);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.oldPin = writeJSON('pin', this._oldPin);
		data.oldParentId = this._oldParent.getId();
		data.newParentId = this._newParent.getId();
		return data;
	}

	/**
	 * Undo the previous assignment of a new parent GraphItem.
	 *
	 * @method undo
	 */
	undo() {
		// restore old pin and parent:
		this._graphItem.getPin().setTo(this._oldPin);
		this._graphItem.changeParent(this._oldParent);
		this._graphItem.getPin().evaluate(this._graphItem);
	}

	/**
	 * Redo a previously undone Change Parent command.
	 *
	 * @method redo
	 */
	redo() {
		this._translateItemToParent(this._newParent);
		this._graphItem.changeParent(this._newParent);
	}

	_translateItemToParent(parent) {
		const graph = this._graphItem.getGraph();
		const pinPoint = this._graphItem.getPinPoint(JSG.ptCache.get());
		const eventEnabled = this._graphItem.disableEvents();

		function up(item) {
			item.translateToParent(pinPoint);
		}

		function down(item) {
			item.translateFromParent(pinPoint);
		}

		GraphUtils.traverseItemUp(this._graphItem.getParent(), graph, up);
		GraphUtils.traverseItemDown(graph, parent, down);
		this._graphItem.setPinPointTo(pinPoint);
		if (eventEnabled) {
			this._graphItem.enableEvents();
		}
		JSG.ptCache.release(pinPoint);
	}
}

module.exports = ChangeParentCommand;
