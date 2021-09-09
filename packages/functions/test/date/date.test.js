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
const { createTerm } = require('../utilities');
const { StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

describe('date & time functions', () => {
	describe('date', () => {
		it('should return serial date number from specified years, months and days', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: 3, B2: 14, C2: 2012 } });
			expect(createTerm('date(C2, A2, B2)', sheet).value).toBe(40982);
		});
		// DL-1325
		it('should return an error for invalid parameters', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('date("2018s,5,18)")', sheet).value.code).toBe(ERROR.ARGS);
			expect(createTerm('date(2017s,3,19)', sheet).value.code).toBe(ERROR.NAME);
		});
	});
	describe('datevalue', () => {
		it('should return serial date number from a given date string', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: 11, A3: 3, A4: 2011 } });
			expect(createTerm('datevalue("8/22/2011")', sheet).value).toBe(40777);
			expect(createTerm('datevalue("17.05.2018")', sheet).value).toBe(43237);
			expect(createTerm('datevalue("22-MAY-2011")', sheet).value).toBe(40685);
			expect(createTerm('datevalue("2011/02/23")', sheet).value).toBe(40597);
			// expect(createTerm('datevalue("5-JUL")', sheet).value).toBe(40597);
			expect(createTerm('datevalue("11/3/2011")', sheet).value).toBe(40850);
			expect(createTerm('datevalue(A2+"/"+A3+"/"+A4)', sheet).value.code).toBe(ERROR.VALUE);
			expect(createTerm('datevalue(concat(A2,"/",A3,"/",A4))', sheet).value).toBe(40850);
		});
	});
	describe('time', () => {
		it('should return serial time number from given hours, minutes and seconds', () => {
			/* eslint-disable */
			const sheet = new StreamSheet().sheet.load({ cells: {
				A2: 12, B2: 0, C2: 0,
				A3: 16, B3: 48, C3: 10 } });
			/* eslint-ensable */
			expect(createTerm('time(A2, B2, C2)', sheet).value).toBe(0.5);
			expect(createTerm('time(A3, B3, C3)', sheet).value).toBe(0.70011574);
		});
	});
	describe('timevalue', () => {
		it('should return serial time number from given string value', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('timevalue("2:24 AM")', sheet).value).toBe(0.10);
			expect(createTerm('timevalue("22-Aug-2011 6:35 AM")', sheet).value).toBe(0.27430556);
		});
	});

	describe('excel2jsontime', () => {
		it('should convert a serial date number to an ISO-8601 date string', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('excel2jsontime(41022.76786471065)', sheet).value).toBe('2012-04-23T18:25:43.511Z');
			// convert an UTC string
			const utc = '2019-02-26T16:29:39.160Z';
			const exceltime = createTerm(`jsontime2excel("${utc}")`, sheet).value;
			expect(createTerm(`excel2jsontime(${exceltime})`, sheet).value).toBe(utc);
		});
	});
	describe('jsontime2excel', () => {
		it('should return a serial date number from given ISO-8601 date string', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('jsontime2excel("2012-04-23T18:25:43.511Z")', sheet).value).toBe(41022.76786471065);
			// convert now() serial time:
			const now = createTerm('now()', sheet).value;
			const jsontime = createTerm(`excel2jsontime(${now})`, sheet).value;
			expect(createTerm(`jsontime2excel("${jsontime}")`, sheet).value).toBe(now);
		});
		// DL-5135
		it('should allow single month, day and hours, minutes, seconds and milliseconds', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('jsontime2excel("2012-4-23T18:25:43.511Z")', sheet).value).toBe(41022.76786471065);
			expect(createTerm('jsontime2excel("2012-04-3T1:5:4.1Z")', sheet).value).toBe(41002.04518519676);			
			expect(createTerm('jsontime2excel("2012-04-3T1:5:4Z")', sheet).value).toBe(41002.04518518518);
			expect(createTerm('jsontime2excel("2012-04-3T1:5Z")', sheet).value).toBe(41002.04513888889);
			expect(createTerm('jsontime2excel("2012-04-3T1Z")', sheet).value).toBe(41002.041666666664);
			expect(createTerm('jsontime2excel("2021-12-31T03:00:00Z")', sheet).value).toBe(44561.125);
		});
		it(`should return ${ERROR.VALUE} if given date string is not in UTC based ISO-8601 format `, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('jsontime2excel("2012-04-23T18:25:43.511")', sheet).value.code).toBe(ERROR.VALUE);
			expect(createTerm('jsontime2excel("2012-04-23T")', sheet).value.code).toBe(ERROR.VALUE);
			expect(createTerm('jsontime2excel("2012-04-23TZ")', sheet).value.code).toBe(ERROR.VALUE);
			expect(createTerm('jsontime2excel("2012-04-23T18.51Z")', sheet).value.code).toBe(ERROR.VALUE);
			expect(createTerm('jsontime2excel("2012-04-23T18:25.51Z")', sheet).value.code).toBe(ERROR.VALUE);
			expect(createTerm('jsontime2excel("2012-04-23T18:25.51Z")', sheet).value.code).toBe(ERROR.VALUE);
			// negative not supported by js Date class
			expect(createTerm('jsontime2excel("-0333-04-11T8:5:3.1Z")', sheet).value.code).toBe(ERROR.VALUE);
		});
	});

	describe('rounding of time functions', () => {
		it('should round by default', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('hour(43930.999999)', sheet).value).toBe(0);
			expect(createTerm('minute(43930.999999)', sheet).value).toBe(0);
			expect(createTerm('second(43930.999999)', sheet).value).toBe(0);
			expect(createTerm('hour(43930.999999,true)', sheet).value).toBe(0);
			expect(createTerm('minute(43930.999999,true)', sheet).value).toBe(0);
			expect(createTerm('second(43930.999999,true)', sheet).value).toBe(0);
		});
		it('should not round if corresponding parameter is set to false', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('hour(43930.999999,false)', sheet).value).toBe(23);
			expect(createTerm('minute(43930.999999,false)', sheet).value).toBe(59);
			expect(createTerm('second(43930.999999,false)', sheet).value).toBe(59);
		});
	});

	describe('rounding of time functions', () => {
		it('should round by default', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('hour(43930.999999)', sheet).value).toBe(0);
			expect(createTerm('minute(43930.999999)', sheet).value).toBe(0);
			expect(createTerm('second(43930.999999)', sheet).value).toBe(0);
			expect(createTerm('hour(43930.999999,true)', sheet).value).toBe(0);
			expect(createTerm('minute(43930.999999,true)', sheet).value).toBe(0);
			expect(createTerm('second(43930.999999,true)', sheet).value).toBe(0);
		});
		it('should not round if corresponding parameter is set to false', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('hour(43930.999999,false)', sheet).value).toBe(23);
			expect(createTerm('minute(43930.999999,false)', sheet).value).toBe(59);
			expect(createTerm('second(43930.999999,false)', sheet).value).toBe(59);
		});
	});
	describe('rounding of date functions', () => {
		it('should round by default', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('day(39447.99999421)', sheet).value).toBe(31);
			expect(createTerm('day(39447.99999422)', sheet).value).toBe(1);

			expect(createTerm('month(31,99999421)', sheet).value).toBe(1);
			expect(createTerm('month(31.99999422)', sheet).value).toBe(2);
			expect(createTerm('month(39447.99999421)', sheet).value).toBe(12);
			expect(createTerm('month(39447.99999422)', sheet).value).toBe(1);


			expect(createTerm('year(39447.99999421)', sheet).value).toBe(2007);
			expect(createTerm('year(39447.99999422)', sheet).value).toBe(2008);
			expect(createTerm('year(38352.99999421)', sheet).value).toBe(2004);
			expect(createTerm('year(38352.99999422)', sheet).value).toBe(2005);

			// JS Date never has a 0 day
			// expect(createTerm('day(0.99999422)', sheet).value).toBe(1);
			// expect(createTerm('day(0.99999421)', sheet).value).toBe(0);
		});
		it('should not round if corresponding parameter is set to false', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('day(39447.99999422, false)', sheet).value).toBe(31);

			expect(createTerm('month(31.99999422, false)', sheet).value).toBe(1);
			expect(createTerm('month(39447.99999422, false)', sheet).value).toBe(12);

			expect(createTerm('year(39447.99999422, false)', sheet).value).toBe(2007);
			expect(createTerm('year(38352.99999422, false)', sheet).value).toBe(2004);
		});
	});
});
