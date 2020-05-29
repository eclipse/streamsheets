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
const { MSTOSERIAL, SERIALTOMS } = require('../../src/functions');
const { Term } = require('@cedalo/parser');
const { Message, StreamSheet } = require('@cedalo/machine-core');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('mstoserial', () => {
	it('should return a number in excel serial format', () => {
		const sheet = new StreamSheet().sheet;
		expect(SERIALTOMS(sheet, Term.fromNumber(MSTOSERIAL(sheet, Term.fromNumber(SECOND))))).toBe(SECOND);
		expect(SERIALTOMS(sheet, Term.fromNumber(MSTOSERIAL(sheet, Term.fromNumber(MINUTE))))).toBe(MINUTE);
		expect(SERIALTOMS(sheet, Term.fromNumber(MSTOSERIAL(sheet, Term.fromNumber(HOUR))))).toBe(HOUR);
		expect(SERIALTOMS(sheet, Term.fromNumber(MSTOSERIAL(sheet, Term.fromNumber(DAY))))).toBe(DAY);
		const msg = new Message();
		expect(MSTOSERIAL(sheet, Term.fromNumber(SERIALTOMS(sheet, Term.fromNumber(msg.metadata.arrivalTime)))))
			.toBe(msg.metadata.arrivalTime);

		const now = Date.now();
		expect(SERIALTOMS(sheet, Term.fromNumber(MSTOSERIAL(sheet, Term.fromNumber(now))))).toBe(now);
	});
});
