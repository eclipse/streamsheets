
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


module.exports = class LayoutSection {
	constructor(size) {
		// auto, content, 1/100mm, percent
		this._size = size === undefined ? 'auto' : size;
		// auto, px
		this._minSize = 1000;
		this._resize = true;
		this._paddingBefore = 300;
		this._paddingAfter = 300;
		this._marginBefore = 300;
		this._marginAfter = 300;
	}

	get size() {
		return this._size === undefined ? 3000 : this._size;
	}

	set size(size) {
		this._size = size;
	}

	get minSize() {
		return this._minSize === 'auto' ? 1000 : this._minSize;
	}

	fromJSON(json) {
		this._size = json.size;
		this._minSize = json.minSize;
	}

	toJSON() {
		const ret = {};

		ret.size = this._size;
		ret.minSize = this._minSize;

		return ret;
	}
};


