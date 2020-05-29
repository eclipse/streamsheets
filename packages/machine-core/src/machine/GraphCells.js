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
const NamedCells = require('./NamedCells');

class GraphCells extends NamedCells {
	constructor(sheet) {
		super();
		this.sheet = sheet;
	}

	set(name, cell) {
		const didIt = super.set(name, cell);
		if (didIt && cell == null) {
			this.sheet.getDrawings().removeGraphItem(name);
		}
		return didIt;
	}
}

module.exports = GraphCells;
