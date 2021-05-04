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
const Node = require('./Node');

module.exports = class StreamSheetContainerWrapper extends Node {
	// constructor() {
	// 	super();
	//
	// 	this.getItemAttributes().setClipChildren(true);
	// }

	newInstance() {
		return new StreamSheetContainerWrapper();
	}

	getItemType() {
		return 'streamsheetcontainerwrapper';
	}

	dispose() {
		super.dispose();

		const sheet = this.streamsheet;
		if (sheet) {
			sheet.getStreamSheetContainerAttributes().setSheetType('sheet');

		}
	}

	show(flag) {
		const sheet = this.streamsheet;
		if (sheet) {
			sheet.getItemAttributes().setVisible(true);
		}
	}

	get streamsheet() {
		const attr = this.getAttributeAtPath('streamsheet');
		if (attr) {
			const id = attr.getValue();
			const graph = this.getGraph();
			return graph.getItemById(id);
		}

		return undefined;
	}


	layout() {
		const box = JSG.boxCache.get();
		const size = this.getSize().toPoint();

		super.layout();
	}
};
