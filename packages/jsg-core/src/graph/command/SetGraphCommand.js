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
const AbstractItemCommand = require('./AbstractItemCommand');

module.exports = class SetGraphCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetGraphCommand(
					item,
					data.graph,
			  ).initWithObject(data)
			: undefined;
	}

	constructor(item, graph) {
		super(item);

		this._graph = graph;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.graph = this._graph;
		return data;
	}

	undo() {
	}

	redo() {
	}

	doAfterRedo() {}

	doAfterUndo() {}
};
