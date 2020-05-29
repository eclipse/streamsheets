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
const locale = require('../../src/locale');

const cutOffCET = (str) => {
	if (str.endsWith('(CET)')) {
		str = str.substr(0, str.length - 5).trim();
	}
	return str;
};

const expectDateStr = ms => expect(cutOffCET(new Date(ms).toString()));

const thisYear = new Date().getFullYear();
const ExpectedDate = {
	MonthOnly: cutOffCET(new Date(2012, 2).toString()),
	fullDate: cutOffCET(new Date(2012, 2, 14).toString()),
	andTime: cutOffCET(new Date(2012, 2, 14, 13, 30).toString()),
	thisYear: cutOffCET(new Date(thisYear, 2, 14).toString())
};

describe('locale', () => {
	describe('parsing dates', () => {
		it('should parse EN & US date strings', () => {
			// maybe in later versions we separate them...
			const localizer = locale.use({ locale: 'en' });
			expectDateStr(localizer.parse('14.03.2012')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('14.03.12')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('14.3.12')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('2012-03-14')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('14 March 2012')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('2012-03-14')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('3.14')).toBe(ExpectedDate.thisYear);
			expectDateStr(localizer.parse('3.14.12')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('03.14.12')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('3.14.2012')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('14-Mar')).toBe(ExpectedDate.thisYear);
			expectDateStr(localizer.parse('14-Mar-12')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('14-Mar-2012')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('Mar-12')).toBe(ExpectedDate.MonthOnly);
			expectDateStr(localizer.parse('March-12')).toBe(ExpectedDate.MonthOnly);
			expectDateStr(localizer.parse('March 14, 2012')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('3.14.12 1:30 PM')).toBe(ExpectedDate.andTime);
			expectDateStr(localizer.parse('3.14.12 13:30')).toBe(ExpectedDate.andTime);
		});
		it('should parse DE date strings', () => {
			const localizer = locale.use({ locale: 'de' });
			// const ms = locale.use(localeopts).parse('Mittwoch, 14. März 2012');
			expectDateStr(localizer.parse('2012-03-14')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('Mittwoch, 14. März 2012')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('14.3')).toBe(ExpectedDate.thisYear);
			expectDateStr(localizer.parse('14.3.12')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('14.03.12')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('14. Mrz.')).toBe(ExpectedDate.thisYear);
			expectDateStr(localizer.parse('14. Mrz. 12')).toBe(ExpectedDate.fullDate);
			// // TODO review: how to parse this:
			// expectDateStr(localizer.parse('14. Mrz 12')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('Mrz. 12')).toBe(ExpectedDate.MonthOnly);
			expectDateStr(localizer.parse('März 12')).toBe(ExpectedDate.MonthOnly);
			expectDateStr(localizer.parse('14. März 2012')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('14.3.12 1:30 PM')).toBe(ExpectedDate.andTime);
			expectDateStr(localizer.parse('14.3.12 13:30')).toBe(ExpectedDate.andTime);
			// expectDateStr(localizer.parse('M')).toBe(ExpectedDate.fullDate);
			// expectDateStr(localizer.parse('M 12')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('14.3.2012')).toBe(ExpectedDate.fullDate);
			expectDateStr(localizer.parse('14. Mrz. 2012')).toBe(ExpectedDate.fullDate);
		});
	});
	describe('formatting numbers', () => {
		it('should format numbers to DE locale', () => {
			const localizer = locale.use({ locale: 'de' });
			let nr = 123456.789;
			expect(localizer.formatNr(nr)).toBe('123.456,789');
			nr = 123456789.12345678;
			expect(localizer.formatNr(nr)).toBe('123.456.789,12345678');
		});
		it('should format numbers to DE locale without thousand separator', () => {
			const localizer = locale.use({ locale: 'de', separators: { thousand: '' } });
			let nr = 123456.789;
			expect(localizer.formatNr(nr)).toBe('123456,789');
			nr = 123456789.12345678;
			expect(localizer.formatNr(nr)).toBe('123456789,12345678');
		});
		it('should format numbers to EN locale', () => {
			const localizer = locale.use({ locale: 'en' });
			let nr = 123456.789;
			expect(localizer.formatNr(nr)).toBe('123,456.789');
			nr = 123456789.12345678;
			expect(localizer.formatNr(nr)).toBe('123,456,789.12345678');
		});
		it('should format numbers to EN locale without thousand separator', () => {
			const localizer = locale.use({ locale: 'en', separators: { thousand: '' } });
			let nr = 123456.789;
			expect(localizer.formatNr(nr)).toBe('123456.789');
			nr = 123456789.12345678;
			expect(localizer.formatNr(nr)).toBe('123456789.12345678');
		});
	});
});
