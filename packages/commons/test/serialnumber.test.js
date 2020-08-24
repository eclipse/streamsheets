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

const { serialnumber } = require('..');

const toLocalMilliseconds = (date) => date.getTime() - date.getTimezoneOffset() * 60 * 1000;

/**
 * NOTE: all expected values are calculated with Excel 16.39 (200713000) on MacOS
 * date values are based to 1900
 */

describe('milliseconds', () => {
	const { milliseconds } = serialnumber;
	it('should return milliseconds of given serial time', () => {
		expect(milliseconds(0.0)).toBe(0);
		// with values from second
		expect(milliseconds(0.00000578)).toBe(499); // max 0
		expect(milliseconds(0.00000579)).toBe(500); // min 1
		expect(milliseconds(0.00001736)).toBe(500); // max 1
		expect(milliseconds(0.00001737)).toBe(501); // min 2
		expect(milliseconds(0.00067708)).toBe(500); // max 58
		expect(milliseconds(0.00067709)).toBe(501); // min 59
		expect(milliseconds(0.00068865)).toBe(499); // max 59
		expect(milliseconds(0.00068866)).toBe(500);
		// values from minute
		expect(milliseconds(0.00068865)).toBe(499); // max 0
		expect(milliseconds(0.00068866)).toBe(500); // min 1
		expect(milliseconds(0.00138310)).toBe(500); // max 1
		expect(milliseconds(0.00138311)).toBe(501); // min 2
		expect(milliseconds(0.04096643)).toBe(500); // max 58
		expect(milliseconds(0.04096644)).toBe(500); // min 59
		expect(milliseconds(0.04166087)).toBe(499); // max 59
		expect(milliseconds(0.04166088)).toBe(500);
		// values from hour
		expect(milliseconds(0.04166087)).toBe(499); // max 0
		expect(milliseconds(0.04166088)).toBe(500); // min 1
		expect(milliseconds(0.08332754)).toBe(499); // max 1
		expect(milliseconds(0.08332755)).toBe(500); // min 2
		expect(milliseconds(0.95832754)).toBe(499); // max 22
		expect(milliseconds(0.95832755)).toBe(500); // min 23
		expect(milliseconds(0.99999421)).toBe(500); // max 23
		expect(milliseconds(0.99999422)).toBe(501);
	});
	it('should return millisecond of arbitrary serial time', () => {
		expect(milliseconds(0.00001234)).toBe(66);
		expect(milliseconds(0.00069444)).toBe(0);
		expect(milliseconds(0.040697361)).toBe(252);
		expect(milliseconds(0.040972222)).toBe(0);
		expect(milliseconds(0.04236111)).toBe(0);
		expect(milliseconds(0.95833333)).toBe(0);
		expect(milliseconds(43930.999999)).toBe(914);
	});
});
describe('seconds', () => {
	const { seconds } = serialnumber;
	it('should return seconds of given serial time', () => {
		expect(seconds(0.0)).toBe(0);
		expect(seconds(0.00000578)).toBe(0); // max 0
		expect(seconds(0.00000579)).toBe(1); // min 1
		expect(seconds(0.00001234)).toBe(1);
		expect(seconds(0.00001736)).toBe(1); // max 1
		expect(seconds(0.00001737)).toBe(2); // min 2
		expect(seconds(0.00065393)).toBe(56); // max 56
		expect(seconds(0.00065394)).toBe(57); // min 57
		expect(seconds(0.00066550)).toBe(57); // max 57
		expect(seconds(0.00066551)).toBe(58); // min 58
		expect(seconds(0.00067708)).toBe(58); // max 58
		expect(seconds(0.00067709)).toBe(59); // min 59
		expect(seconds(0.00068865)).toBe(59); // max 59
		expect(seconds(0.00068866)).toBe(0);

		expect(seconds(43930.999999)).toBe(0);
	});
});
describe('minutes', () => {
	const { minutes } = serialnumber;
	it('should return minutes of given serial time', () => {
		expect(minutes(0.00068865)).toBe(0); // max 0
		expect(minutes(0.00068866)).toBe(1); // min 1
		expect(minutes(0.00069444)).toBe(1);
		expect(minutes(0.00138310)).toBe(1); // max 1
		expect(minutes(0.00138311)).toBe(2); // min 2
		expect(minutes(0.04096643)).toBe(58); // max 58
		expect(minutes(0.040697361)).toBe(58);
		expect(minutes(0.04096644)).toBe(59); // min 59
		expect(minutes(0.040972222)).toBe(59);
		expect(minutes(0.04166087)).toBe(59); // max 59
		expect(minutes(0.04166088)).toBe(0);

		expect(minutes(43930.999999)).toBe(0);
	});
});
describe('hours', () => {
	const { hours } = serialnumber;
	it('should return hours of given serial time', () => {
		expect(hours(0.04166087)).toBe(0); // max 0
		expect(hours(0.04166088)).toBe(1); // min 1
		expect(hours(0.04236111)).toBe(1);
		expect(hours(0.08332754)).toBe(1); // max 1
		expect(hours(0.08332755)).toBe(2); // min 2
		expect(hours(0.95832754)).toBe(22); // max 22
		expect(hours(0.95832755)).toBe(23); // min 23
		expect(hours(0.95833333)).toBe(23);
		expect(hours(0.99999421)).toBe(23); // max 23
		expect(hours(0.99999422)).toBe(0);

		expect(hours(43930.999999)).toBe(0);
	});
});
describe('year', () => {
	const { year } = serialnumber;
	it('should return year from given serial number', () => {
		expect(year(0)).toBe(1900);
		expect(year(10)).toBe(1900);
		expect(year(100)).toBe(1900);
		expect(year(1000)).toBe(1902);
		expect(year(10000)).toBe(1927);
		expect(year(100000)).toBe(2173);
		expect(year(50000)).toBe(2036);
		expect(year(25000)).toBe(1968);
		expect(year(40000)).toBe(2009);
	});
});
describe('month', () => {
	const { month } = serialnumber;
	it('should return month from given serial number (before 1904)', () => {
		expect(month(0)).toBe(1);
		expect(month(762)).toBe(1);
		expect(month(763)).toBe(2);
		expect(month(790)).toBe(2);
		expect(month(791)).toBe(3);
		expect(month(821)).toBe(3);
		expect(month(822)).toBe(4);
		expect(month(851)).toBe(4);
		expect(month(852)).toBe(5);
		expect(month(882)).toBe(5);
		expect(month(883)).toBe(6);
		expect(month(912)).toBe(6);
		expect(month(913)).toBe(7);
		expect(month(943)).toBe(7);
		expect(month(944)).toBe(8);
		expect(month(974)).toBe(8);
		expect(month(975)).toBe(9);
		expect(month(1004)).toBe(9);
		expect(month(1005)).toBe(10);
		expect(month(1035)).toBe(10);
		expect(month(1036)).toBe(11);
		expect(month(1065)).toBe(11);
		expect(month(1066)).toBe(12);
	});
	it('should return month from given serial number (after 1904)', () => {
		expect(month(36526)).toBe(1);
		expect(month(36556)).toBe(1);
		expect(month(36557)).toBe(2);
		expect(month(36585)).toBe(2);
		expect(month(36586)).toBe(3);
		expect(month(36616)).toBe(3);
		expect(month(36617)).toBe(4);
		expect(month(36646)).toBe(4);
		expect(month(36647)).toBe(5);
		expect(month(36677)).toBe(5);
		expect(month(36678)).toBe(6);
		expect(month(36707)).toBe(6);
		expect(month(36708)).toBe(7);
		expect(month(36738)).toBe(7);
		expect(month(36739)).toBe(8);
		expect(month(36769)).toBe(8);
		expect(month(36770)).toBe(9);
		expect(month(36799)).toBe(9);
		expect(month(36800)).toBe(10);
		expect(month(36830)).toBe(10);
		expect(month(36831)).toBe(11);
		expect(month(36860)).toBe(11);
		expect(month(36861)).toBe(12);
	});
});
describe('day', () => {
	const { day } = serialnumber;
	it('should return day from given serial number (before 1904)', () => {
		expect(day(0)).toBe(1);
		expect(day(1)).toBe(1);
		expect(day(2)).toBe(2);
		expect(day(3)).toBe(3);
		expect(day(4)).toBe(4);
		expect(day(5)).toBe(5);
		expect(day(6)).toBe(6);
		expect(day(7)).toBe(7);
		expect(day(8)).toBe(8);
		expect(day(9)).toBe(9);
		expect(day(10)).toBe(10);
		expect(day(11)).toBe(11);
		expect(day(12)).toBe(12);
		expect(day(13)).toBe(13);
		expect(day(14)).toBe(14);
		expect(day(15)).toBe(15);
		expect(day(16)).toBe(16);
		expect(day(17)).toBe(17);
		expect(day(18)).toBe(18);
		expect(day(19)).toBe(19);
		expect(day(20)).toBe(20);
		expect(day(21)).toBe(21);
		expect(day(22)).toBe(22);
		expect(day(23)).toBe(23);
		expect(day(24)).toBe(24);
		expect(day(25)).toBe(25);
		expect(day(26)).toBe(26);
		expect(day(27)).toBe(27);
		expect(day(28)).toBe(28);
		expect(day(29)).toBe(29);
		expect(day(30)).toBe(30);
		expect(day(31)).toBe(31);
	});
	it('should return day from given serial number (after 1904)', () => {
		expect(day(36526)).toBe(1);
		expect(day(36527)).toBe(2);
		expect(day(36528)).toBe(3);
		expect(day(36529)).toBe(4);
		expect(day(36530)).toBe(5);
		expect(day(36531)).toBe(6);
		expect(day(36532)).toBe(7);
		expect(day(36533)).toBe(8);
		expect(day(36534)).toBe(9);
		expect(day(36535)).toBe(10);
		expect(day(36536)).toBe(11);
		expect(day(36537)).toBe(12);
		expect(day(36538)).toBe(13);
		expect(day(36539)).toBe(14);
		expect(day(36540)).toBe(15);
		expect(day(36541)).toBe(16);
		expect(day(36542)).toBe(17);
		expect(day(36543)).toBe(18);
		expect(day(36544)).toBe(19);
		expect(day(36545)).toBe(20);
		expect(day(36546)).toBe(21);
		expect(day(36547)).toBe(22);
		expect(day(36548)).toBe(23);
		expect(day(36549)).toBe(24);
		expect(day(36550)).toBe(25);
		expect(day(36551)).toBe(26);
		expect(day(36552)).toBe(27);
		expect(day(36553)).toBe(28);
		expect(day(36554)).toBe(29);
		expect(day(36555)).toBe(30);
		expect(day(36556)).toBe(31);
	});
});
describe('weekday', () => {
	const { weekday } = serialnumber;
	test('arbitrary serial numbers', () => {
		expect(weekday(0)).toBe(7);
		expect(weekday(10)).toBe(3);
		expect(weekday(39)).toBe(4);
		expect(weekday(50)).toBe(1);
		expect(weekday(60)).toBe(4);
		expect(weekday(61)).toBe(5);
		expect(weekday(70)).toBe(7);
		expect(weekday(100)).toBe(2);
		expect(weekday(1097)).toBe(5);
		expect(weekday(1462)).toBe(6);
		expect(weekday(3654)).toBe(7);
	});
	it('should return day from given serial number (before 1904)', () => {
		expect(weekday(1)).toBe(1);
		expect(weekday(2)).toBe(2);
		expect(weekday(3)).toBe(3);
		expect(weekday(4)).toBe(4);
		expect(weekday(5)).toBe(5);
		expect(weekday(6)).toBe(6);
		expect(weekday(7)).toBe(7);
		expect(weekday(8)).toBe(1);
		expect(weekday(9)).toBe(2);
		expect(weekday(10)).toBe(3);
		expect(weekday(11)).toBe(4);
		expect(weekday(12)).toBe(5);
		expect(weekday(13)).toBe(6);
		expect(weekday(14)).toBe(7);
		expect(weekday(15)).toBe(1);
		expect(weekday(16)).toBe(2);
		expect(weekday(17)).toBe(3);
		expect(weekday(18)).toBe(4);
		expect(weekday(19)).toBe(5);
		expect(weekday(20)).toBe(6);
		expect(weekday(21)).toBe(7);
		expect(weekday(22)).toBe(1);
		expect(weekday(23)).toBe(2);
		expect(weekday(24)).toBe(3);
		expect(weekday(25)).toBe(4);
		expect(weekday(26)).toBe(5);
		expect(weekday(27)).toBe(6);
		expect(weekday(28)).toBe(7);
		expect(weekday(29)).toBe(1);
		expect(weekday(30)).toBe(2);
		expect(weekday(31)).toBe(3);
	});
	it('should return day from given serial number (after 1904)', () => {
		expect(weekday(36526)).toBe(7);
		expect(weekday(36527)).toBe(1);
		expect(weekday(36528)).toBe(2);
		expect(weekday(36529)).toBe(3);
		expect(weekday(36530)).toBe(4);
		expect(weekday(36531)).toBe(5);
		expect(weekday(36532)).toBe(6);
		expect(weekday(36533)).toBe(7);
		expect(weekday(36534)).toBe(1);
		expect(weekday(36535)).toBe(2);
		expect(weekday(36536)).toBe(3);
		expect(weekday(36537)).toBe(4);
		expect(weekday(36538)).toBe(5);
		expect(weekday(36539)).toBe(6);
		expect(weekday(36540)).toBe(7);
		expect(weekday(36541)).toBe(1);
		expect(weekday(36542)).toBe(2);
		expect(weekday(36543)).toBe(3);
		expect(weekday(36544)).toBe(4);
		expect(weekday(36545)).toBe(5);
		expect(weekday(36546)).toBe(6);
		expect(weekday(36547)).toBe(7);
		expect(weekday(36548)).toBe(1);
		expect(weekday(36549)).toBe(2);
		expect(weekday(36550)).toBe(3);
		expect(weekday(36551)).toBe(4);
		expect(weekday(36552)).toBe(5);
		expect(weekday(36553)).toBe(6);
		expect(weekday(36554)).toBe(7);
		expect(weekday(36555)).toBe(1);
		expect(weekday(36556)).toBe(2);
	});
});

describe('ms2serial', () => {
	const { ms2serial, year, month, day, hours, minutes, seconds, milliseconds } = serialnumber;
	it('should convert milliseconds to serial date number', () => {
		// Z signals time-string is based on UTC, so no local timezone offset is added by Date!!
		const date = Date.parse('2019-02-26T16:29:39.160Z');
		const serial = ms2serial(date);
		expect(year(serial)).toBe(2019);
		expect(month(serial)).toBe(2);
		expect(day(serial)).toBe(26);
		expect(hours(serial)).toBe(16);
		expect(minutes(serial)).toBe(29);
		expect(seconds(serial)).toBe(39);
		expect(milliseconds(serial)).toBe(160);
	});
});
describe('serial2ms', () => {
	const { serial2ms } = serialnumber;
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
describe('date2serial', () => {
	const { date2serial, ms2serial } = serialnumber;
	it('should convert a given Date object to serial date number', () => {
		const date = new Date('26 Feb 2019 16:29:39');
		const serial = date2serial(date);
		// expect(serial).toBe(ms2serial(toLocalMilliseconds(date)));
		expect(serial).toBe(ms2serial(date.getTime()));
		expect(date2serial(new Date('01 Feb 2000 00:00:00.000Z'))).toBe(36557);
		expect(date2serial(new Date('01 Feb 2014 23:59:00.000Z')).toFixed(8)).toBe('41671.99930556');
		expect(date2serial(new Date('29 Jun 2020 22:36:00.000Z')).toFixed(8)).toBe('44011.94166667');
		expect(date2serial(new Date('26 Feb 2019 16:29:39.160Z')).toFixed(8)).toBe('43522.68725880');
	});
	it('should convert a given Date previous to 1970 to serial date number', () => {
		expect(date2serial(new Date('01 Apr 1900 00:00:00.000Z'))).toBe(92);
		expect(date2serial(new Date('01 Apr 1900 02:00:00.000Z')).toFixed(6)).toBe('92.083333');
		expect(date2serial(new Date('26 Mar 1900 00:00:00.000Z'))).toBe(86);
		expect(date2serial(new Date('29 Feb 1900 00:00:00.000Z'))).toBe(60);
		expect(date2serial(new Date('28 Feb 1900 00:00:00.000Z'))).toBe(59);
	});
});
describe('dateLocal2serial', () => {
	const { dateLocal2serial,  ms2serial } = serialnumber;
	it('should convert a given Date object to serial date number', () => {
		const date = new Date('26 Feb 2019 16:29:39');
		const serial = dateLocal2serial(date);
		expect(serial).toBe(ms2serial(toLocalMilliseconds(date)));
		expect(dateLocal2serial(new Date('01 Feb 2000'))).toBe(36557);
		expect(dateLocal2serial(new Date('01 Feb 2014 23:59:00')).toFixed(8)).toBe('41671.99930556');
		expect(dateLocal2serial(new Date('29 Jun 2020 22:36:00')).toFixed(8)).toBe('44011.94166667');
		expect(dateLocal2serial(new Date('26 Feb 2019 16:29:39.160')).toFixed(8)).toBe('43522.68725880');
	});
	it('should convert a given Date previous to 1970 to serial date number', () => {
		expect(dateLocal2serial(new Date('01 Apr 1900'))).toBe(92);
		expect(dateLocal2serial(new Date('01 Apr 1900 02:00:00')).toFixed(6)).toBe('92.083333');
		expect(dateLocal2serial(new Date('26 Mar 1900 00:00:00'))).toBe(86);
		expect(dateLocal2serial(new Date('29 Feb 1900 00:00:00'))).toBe(60);
		expect(dateLocal2serial(new Date('28 Feb 1900 00:00:00'))).toBe(59);
	});
});
describe('serial2date', () => {
	const { serial2date } = serialnumber;
	it('should convert serial number to JS date object', () => {
		// 26 Feb 2019 16:29:39:160
		const serial = 43522.68725879629;
		let date = serial2date(serial);
		expect(date.getUTCFullYear()).toBe(2019);
		expect(date.getUTCMonth() + 1).toBe(2);
		expect(date.getUTCDate()).toBe(26);
		expect(date.getUTCHours()).toBe(16);
		expect(date.getUTCMinutes()).toBe(29);
		expect(date.getUTCSeconds()).toBe(39);
		expect(date.getUTCMilliseconds()).toBe(160);
		// 29.06.2020 22:36
		date = serial2date(44011.9416666667);
		expect(date.getUTCFullYear()).toBe(2020);
		expect(date.getUTCMonth() + 1).toBe(6);
		expect(date.getUTCDate()).toBe(29);
		expect(date.getUTCHours()).toBe(22);
		expect(date.getUTCMinutes()).toBe(36);
		expect(date.getUTCSeconds()).toBe(0);
		expect(date.getUTCMilliseconds()).toBe(0);
		// 26 Feb 2019 16:29:39:00
		date = serial2date(43522.687256944446);
		expect(date.getUTCFullYear()).toBe(2019);
		expect(date.getUTCMonth() + 1).toBe(2);
		expect(date.getUTCDate()).toBe(26);
		expect(date.getUTCHours()).toBe(16);
		expect(date.getUTCMinutes()).toBe(29);
		expect(date.getUTCSeconds()).toBe(39);
		expect(date.getUTCMilliseconds()).toBe(0);
	});
});
describe('usage to convert ms to serial and back', () => {
	const { ms2serial, serial2ms } = serialnumber;
	it('should work with our now() function', () => {
		// serial of 2019-02-26T16:29:39.160
		const serial = 43522.68725878;
		expect(ms2serial(serial2ms(serial)).toFixed(8)).toBe(`${serial}`);
		const nowms = Date.now();
		expect(serial2ms(ms2serial(nowms))).toBe(nowms);
	});
});
describe('usage to convert with serial2date and date2serial', () => {
	const { date2serial, serial2date } = serialnumber;
	it('should convert Date to serial and back', () => {
		const date = new Date('29 Jun 2020 21:26:34.000Z');
		const serial = date2serial(date);
		const date2 = serial2date(serial);
		const serial2 = date2serial(date2);
		expect(date2).toEqual(date);
		expect(serial2).toBe(serial);
	});
});
describe('now', () => {
	const { ms2serial, now } = serialnumber;
	it('should return current time as serial number', () => {
		const today = new Date();
		const serialNow = now();
		// Date.now() is in UTC, so add local TZ to it
		const msNow = toLocalMilliseconds(today);
		expect(ms2serial(msNow).toFixed(6)).toBe(serialNow.toFixed(6));
	});
});
