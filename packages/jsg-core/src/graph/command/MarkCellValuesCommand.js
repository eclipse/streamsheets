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
const Command = require('./Command');
const { getSheetFromItem } = require('./utils');
// const StreamSheet = require('../model/StreamSheet');

const getItems = (graph) => (all, id) => {
	const item = graph.getItemById(id);
	if (item) all.push(item);
	return all;
};

class MarkCellValuesCommand extends Command {
	static createFromObject(data = {}, { graph }) {
		const items = data.items.reduce(getItems(graph), []);
		return new MarkCellValuesCommand(items).initWithObject(data);
	}

	static fromItemCellRefMap(map) {
		const items = [];
		const references = [];
		const markers = [];
		const markerMap = new Map();
		map.forEach((ref, item) => {
			const marker = markerMap.get(ref) || item.newUniqueId();
			items.push(item);
			markers.push(marker);
			references.push(ref);
			markerMap.set(ref, marker);
		});
		return new MarkCellValuesCommand(items, references, markers);
	}

	constructor(items, cellrefs, markers) {
		super();
		this.items = items;
		this.markers = markers;
		this.cellrefs = cellrefs;
		this.isVolatile = true;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		const markers = [];
		const cellrefs = [];
		data.markers.forEach(({ marker, reference }) => {
			markers.push(marker);
			cellrefs.push(reference);
		});
		cmd.markers = markers;
		cmd.cellrefs = cellrefs;
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		const cellrefs = this.cellrefs;
		data.items = this.items.map((item) => item.getId());
		data.markers = this.markers.map((marker, index) => ({ reference: cellrefs[index], marker }));
		return data;
	}

	get sheet() {
		return getSheetFromItem(this.items[0]);
	}

	execute() {
		const markers = this.markers;
		this.items.forEach((item, index) => {
			item.cellValuesMarker = markers[index];
		});
	}

	redo() {}
	undo() {}
	doAfterRedo() {}
	doAfterUndo() {}
}

module.exports = MarkCellValuesCommand;
