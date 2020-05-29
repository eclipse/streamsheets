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
const { SheetIndex } = require('../..');
const { SheetParser } = require('../../src/parser/SheetParser');


const createCellAt = (idxstr, value, sheet) => {
	const cell = SheetParser.createCell(value, sheet);
	const index = SheetIndex.create(idxstr);
	sheet.setCellAt(index, cell);
	return cell;
};

const createTerm = (formula, sheet) => SheetParser.parse(formula, sheet);

module.exports = {
	createCellAt,
	createTerm
};
