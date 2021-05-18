
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
		this._size = size === undefined ? 4000 : size;
		this._minSize = 1000;
		this._sizeMode = 'auto';
		this._paddingBefore = 300;
		this._paddingAfter = 300;
		this._marginBefore = 300;
		this._marginAfter = 300;
	}

	copy() {
		const copy = new LayoutSection(this._size);
		copy._minSize = this._minSize;
		copy._sizeMode = this._sizeMode;
		copy._paddingBefore = this._paddingBefore;
		copy._paddingAfter = this._paddingAfter;
		copy._marginBefore = this._marginBefore;
		copy._marginAfter = this._marginAfter;
		copy.layoutSize = this.layoutSize;

		return copy;
	}

	get size() {
		return this._size;
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

		if (this._sizeMode === 'metric') {
			this._sizeMode = 'absolute';
		}
	}

	toJSON() {
		const ret = {};

		ret.size = this._size;
		ret.minSize = this._minSize;
		ret.sizeMode = this._sizeMode;

		return ret;
	}
};


