const { createTerm } = require('../utilities');
const { ms2serial, serial2ms, serial2date } = require('../../src/utils').date;
const { StreamSheet } = require('@cedalo/machine-core');


describe('date utilities function', () => {
	describe('ms2serial', () => {
		it('should convert milliseconds to serial date number', () => {
			const sheet = new StreamSheet().sheet;
			// Z signals time-string is based on UTC, so no local timezone offset is added by Date!!
			const date = Date.parse('2019-02-26T16:29:39.160Z');
			const serial = ms2serial(date);
			expect(createTerm(`YEAR(${serial})`, sheet).value).toBe(2019);
			expect(createTerm(`MONTH(${serial})`, sheet).value).toBe(2);
			expect(createTerm(`DAY(${serial})`, sheet).value).toBe(26);
			expect(createTerm(`HOUR(${serial})`, sheet).value).toBe(16);
			expect(createTerm(`MINUTE(${serial})`, sheet).value).toBe(29);
			expect(createTerm(`SECOND(${serial})`, sheet).value).toBe(39);
			expect(createTerm(`MILLISECOND(${serial})`, sheet).value).toBe(160);
		});
	});
	describe('serial2ms', () => {
		it('should convert serial date number to milliseconds', () => {
			const serial = 43522.68725879629; // '2019-02-26T16:29:39.160Z'
			const millis = serial2ms(serial);
			const date = new Date(millis);
			// created date is based on local timezone, so we have to use UTC methods...
			expect(date.getUTCFullYear()).toBe(2019);
			expect(date.getUTCMonth() + 1).toBe(2);
			expect(date.getUTCDate()).toBe(26);
			expect(date.getUTCHours()).toBe(16);
			expect(date.getUTCMinutes()).toBe(29);
			expect(date.getUTCSeconds()).toBe(39);
			expect(date.getUTCMilliseconds()).toBe(160);
		});
	});
	describe('serial2date', () => {
		const serial = 43522.68725879629; // '2019-02-26T16:29:39.160Z'
		const date = serial2date(serial);
		// returned date is based on local timezone, so we have to use UTC methods...
		expect(date.getUTCFullYear()).toBe(2019);
		expect(date.getUTCMonth() + 1).toBe(2);
		expect(date.getUTCDate()).toBe(26);
		expect(date.getUTCHours()).toBe(16);
		expect(date.getUTCMinutes()).toBe(29);
		expect(date.getUTCSeconds()).toBe(39);
		expect(date.getUTCMilliseconds()).toBe(160);
	});
	describe('usage to convert ms to serial and back', () => {
		it('should work with our now() function', () => {
			const now = createTerm('now()').value;
			expect(ms2serial(serial2ms(now))).toBe(now);
			const nowms = Date.now();
			expect(serial2ms(ms2serial(nowms))).toBe(nowms);
		});
	})
});
