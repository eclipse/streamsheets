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
const Command = require('./Command');

class AddImageCommand extends Command {
	static createFromObject(data = {}, { graph }) {
		return new AddImageCommand(data.imageId, data.image).initWithObject(
			data
		);
	}

	constructor(id, image) {
		super();

		this._id = id;
		this._image = image;
	}

	execute() {
		this._imageElement = JSG.imagePool.add(this._image, this._id);
	}

	undo() {}

	redo() {
		this.execute();
	}

	toObject() {
		const data = super.toObject();

		data.imageId = this._id;
		data.image = this._image;

		return data;
	}
}

module.exports = AddImageCommand;
