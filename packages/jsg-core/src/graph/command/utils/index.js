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
const json = require('./json');
const cellrange = require('./cellrange');
const copycells = require('./copycells');
const expression = require('./expression');
const map = require('./map');

const getSheetFromItem = (item) => {
	let sheet;
	if (item != null) sheet = item.isStreamSheet ? item : getSheetFromItem(item.getParent());
	return sheet;
};

module.exports = {
	...cellrange,
	...copycells,
	...expression,
	getSheetFromItem,
	...map,
	...json
};
