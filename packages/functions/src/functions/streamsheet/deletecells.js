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
const { runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');
const { FunctionErrors } = require('@cedalo/error-codes');


const deleteRange = (cellrange) => {
	const sheet = cellrange.sheet;
	if (cellrange) {
		cellrange.iterate((cell, index) => {
			sheet.setCellAt(index, undefined);
		});
	}
};
const deletecells = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.run(() => {
			let error;
			terms.some((term) => {
				const cellrange = getCellRangeFromTerm(term, sheet);
				error = FunctionErrors.isError(cellrange);
				if (!error) deleteRange(cellrange);
				return !!error;
			});
			return error || true;
		});

module.exports = deletecells;
