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
const CellRange = require('../CellRange');

const getOrCreateCell = (reference, dataProvider) => {
	const sheet = dataProvider.getSheet();
	const res = CellRange.refToRC(reference, sheet);
	const pos = res ? { x: res.column - sheet.getColumns().getInitialSection(), y: res.row } : undefined;
	return pos ? dataProvider.create(pos) : undefined;
};

module.exports = {
	getOrCreateCell
};
