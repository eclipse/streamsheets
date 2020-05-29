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
const Properties = require('./Properties');

const combine = (toProps, fromProps) => Object.entries(fromProps).forEach(([key, value]) => { toProps[key] = value;	});

class CellProperties extends Properties {
	static of(defprops) {
		// create prototype chain to hold changed properties for rows or columns...
		const base = Properties.of(defprops);
		const cellprops = Properties.of(base);
		return new CellProperties(cellprops, base);
	}

	constructor(cellprops, base) {
		super(cellprops.attributes, cellprops.formats);
		this.base = base;
	}

	toJSON() {
		const json = super.toJSON();
		const basejson = this.base.toJSON();
		if (basejson.attributes || basejson.formats) json.base = { ...basejson };
		return json;
	}

	initWithJSON(json) {
		super.initWithJSON(json);
		if (json.base) this.base.initWithJSON(json.base);
	}



	isEmpty() {
		return super.isEmpty() && this.base.isEmpty();
	}

	// TODO rename
	toDiffsProperties() {
		const diffs = super.toDiffsProperties();
		const basediffs = this.base.toDiffsProperties();
		combine(basediffs.attributes, diffs.attributes);
		combine(basediffs.formats.text, diffs.formats.text);
		combine(basediffs.formats.styles, diffs.formats.styles);
		return basediffs;
	}
}

module.exports = CellProperties;
