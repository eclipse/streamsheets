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

class ResizeGroupCommand extends AbstractItemCommand {
	constructor(group, newbox) {
		super(group);

		this.oldpin = group.getPin().copy();
		this.oldbox = group.getBoundingBox();
		this.newbox = newbox.copy();
	}

	undo() {
		if (this._graphItem.isSizeable()) {
			this._graphItem.setBoundingBoxTo(this.oldbox);
			this._graphItem.getPin().setTo(this.oldpin);
			this._graphItem.evaluate();
		}
	}

	redo() {
		if (this._graphItem.isSizeable()) {
			this._graphItem.setBoundingBoxTo(this.newbox);
		}
	}
}

module.exports = ResizeGroupCommand;
