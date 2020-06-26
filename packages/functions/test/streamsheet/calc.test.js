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
const { CALC } = require('../../src/functions');
const { FunctionErrors } = require('@cedalo/error-codes');
const { StreamSheet } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

describe('calc', () => {
	it('should return an error if used in sheet directly', () => {
		const sheet = new StreamSheet().sheet.load({ cells: { A1: { formula: 'A1+1' }, B2: { formula: 'calc()' } } });
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('B2').value).toBe(ERROR.INVALID);
	});
	it('should recalculate sheet without doing a step', () => {
		const sheet = new StreamSheet().sheet.load({ cells: { A1: { formula: 'A1+1' } } });
		CALC(sheet);
		expect(sheet.cellAt('A1').value).toBe(2);
		CALC(sheet);
		CALC(sheet);
		expect(sheet.cellAt('A1').value).toBe(4);
	});
});