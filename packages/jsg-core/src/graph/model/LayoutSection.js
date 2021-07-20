
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
	constructor(size, mode) {
		this._size = size === undefined ? 4000 : size;
		this._minSize = 1000;
		this._sizeMode = mode || 'relative';
		this._expandable = false;
		this._expanded = true;
	}

	copy() {
		const copy = new LayoutSection(this._size, this._sizeMode);
		copy._minSize = this._minSize;
		copy._expandable = this._expandable;
		copy._expanded = this._expanded;
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

	get expanded() {
		return this._expanded;
	}

	set expanded(mode) {
		this._expanded = mode;
	}

	get expandable() {
		return this._expandable;
	}

	set expandable(mode) {
		this._expandable = mode;
	}

	fromJSON(json) {
		this._size = json.size;
		this._minSize = json.minSize;
		this._sizeMode = json.sizeMode;
		this._expanded = json.expanded;
		this._expandable = json.expandable;

		if (this._sizeMode === 'metric') {
			this._sizeMode = 'absolute';
		}
	}

	toJSON() {
		const ret = {};

		ret.size = this._size;
		ret.minSize = this._minSize;
		ret.sizeMode = this._sizeMode;
		ret.expanded = this._expanded;
		ret.expandable = this._expandable;

		return ret;
	}
};


