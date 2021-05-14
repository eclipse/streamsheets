
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
		this._sizeMode = 'auto';
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
		return this._minSize;
	}

	set minSize(size) {
		this._minSize = size;
	}

	get sizeMode() {
		return this._sizeMode;
	}

	set sizeMode(mode) {
		this._sizeMode = mode;
	}

	fromJSON(json) {
		this._size = json.size;
		this._minSize = json.minSize;
		this._sizeMode = json.sizeMode;
	}

	toJSON() {
		const ret = {};

		ret.size = this._size;
		ret.minSize = this._minSize;
		ret.sizeMode = this._sizeMode;

		return ret;
	}
};


