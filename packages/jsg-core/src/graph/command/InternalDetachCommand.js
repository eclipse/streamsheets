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

class InternalDetachCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph, viewer, factory }) {
		let cmd;
		const item = graph.getItemById(data.itemId);
		if (item) {
			const fromPort = graph.getItemById(data.portId);
			cmd = new InternalDetachCommand(item, fromPort).initWithObject(data);
			if (data.oldPortId) cmd._oldport = graph.getItemById(data.oldPortId);
		}
		return cmd;
	}

	constructor(edge, fromPort) {
		super(edge);

		this._fromPort = fromPort;
		this._oldport = undefined; // current port is set on execute, because it might be undefined if its parent node
		// was deleted before!
		this._fromSource = fromPort === edge.getSourcePort(); // fromSource;
	}

	toObject() {
		const data = super.toObject();
		if (this._oldport) data.oldPortId = this._oldport.getId();
		if (this._fromPort) data.portId = this._fromPort.getId();
		return data;
	}

	execute() {
		this._oldport = this._fromSource
			? this._graphItem.getSourcePort()
			: this._graphItem.getTargetPort();

		super.execute();
	}

	undo() {
		if (this._oldport) {
			const attachFunc = this._fromSource
				? this._graphItem.setSourcePort
				: this._graphItem.setTargetPort;
			attachFunc.call(this._graphItem, this._oldport);
		}
	}

	redo() {
		this._graphItem.detachPort(this._oldport);
	}
}

module.exports = InternalDetachCommand;
