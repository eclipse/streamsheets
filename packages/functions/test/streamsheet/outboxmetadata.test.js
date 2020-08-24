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
const { FunctionErrors } = require('@cedalo/error-codes');
const { StreamSheet } = require('@cedalo/machine-core');
const { createCellAt, createTerm } = require('../utilities');

const ERROR = FunctionErrors.code;


describe('outboxmetadata', () => {
	it(`should return ${ERROR.ARGS} if called with too few arguments`, () => {
		const sheet = new StreamSheet().sheet;
		// need at least message id...
		expect(createTerm('outboxmetadata()', sheet).value).toBe(ERROR.ARGS);
	});
	it(`should return ${ERROR.NO_MSG_ID} if called no message id is provided`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('outboxmetadata(,)', sheet).value).toBe(ERROR.NO_MSG_ID);
	});
	it('should return path to referenced metatdata', () => {
		const sheet = new StreamSheet().sheet;
		createCellAt('A1', 'value', sheet);
		expect(createTerm('outboxmetadata("msg1","id")', sheet).value).toBe('[msg1][id]');
		expect(createTerm('outboxmetadata("msg1",A1)', sheet).value).toBe('[msg1][value]');
		expect(createTerm('outboxmetadata("msg1","list", 0)', sheet).value).toBe('[msg1][list][0]');
	});
	it('should except a cell-range as parameter', () => {
		const sheet = new StreamSheet().sheet;
		createCellAt('A1', 'list', sheet);
		createCellAt('B1', 0, sheet);
		expect(createTerm('outboxmetadata("msg1",A1:B1)', sheet).value).toBe('[msg1][list][0]');
	});
});
