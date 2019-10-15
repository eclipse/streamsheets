const { Message, StreamSheet } = require('../..');
const { MSTOSERIAL, SERIALTOMS } = require('../../src/functions');
const { Term } = require('@cedalo/parser');

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
