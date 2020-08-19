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
const NumberFormatter = require('../src/NumberFormatter');
const sampleDataSSF = require('./ssf.json');
const sampleDataEN = require('./samples-en.json');
const sampleDataDE = require('./samples-de.json');

const formattedMinutes = (value) => {
	const fmt = 'mm:ss';
	const formatted = NumberFormatter.formatNumber(fmt, value).formattedValue;;
	return formatted.split(':')[0];
};

describe('Test suite for Style Sheet formating.', () => {
	it('should support localization', () => {
		const number = 38123.45;
		const fmt = 'ddd, dd mmm yyyy hh:mm';
		// default culture is 'en-US';
		let result = NumberFormatter.formatNumber(fmt, number);
		expect(result.value).toBe(number);
		expect(result.formattedValue).toBe('Sun, 16 May 2004 10:48');
		expect(result.color).toBeNull();

		result = NumberFormatter.formatNumber(fmt, number, 'date', 'de-DE');
		expect(result.value).toBe(number);
		expect(result.formattedValue).toBe('So., 16 Mai 2004 10:48');
		expect(result.color).toBeNull();

		result = NumberFormatter.formatNumber(fmt, number);
		expect(result.value).toBe(number);
		expect(result.formattedValue).toBe('Sun, 16 May 2004 10:48');
		expect(result.color).toBeNull();
	});

	it('should support color', () => {
		const number = -1234.45;
		const fmt = '#,##0.000;[Red](#,##0.000)';
		const result = NumberFormatter.formatNumber(fmt, number);
		expect(result.value).toEqual(number);
		expect(result.formattedValue).toEqual('(1,234.450)');
		expect(result.color).toEqual('#ff0000');
	});

	it('should throw an error if used with wrong format or number parameters', () => {
		expect(() => NumberFormatter.formatNumber('General', { sheet: 'js' })).toThrow();
		['hhh', 'hhh A/P', 'hhmmm', 'sss', '[hhh]', 'G eneral'].forEach((f) => {
			expect(() => NumberFormatter.formatNumber(f, 12345.6789)).toThrow();
		});
		expect(NumberFormatter.formatNumber('General', 'dafuq')).toBeDefined();
	});

	it('should format with english formats', () => {
		sampleDataEN.forEach((data) => {
			const fmt = data[0];
			const value = data[1][0];
			const expected = data[1][1];
			const actual = NumberFormatter.formatNumber(fmt, value);
			expect(actual.value).toBe(value);
			expect(actual.formattedValue).toBe(expected);
		});
	});

	it('should format with german formats', () => {
		sampleDataDE.dates.forEach((data) => {
			const fmt = data[0];
			const value = data[1][0];
			const expected = data[1][1];
			const actual = NumberFormatter.formatNumber(fmt, value, 'date', 'de-DE');
			expect(actual.value).toBe(value);
			expect(actual.formattedValue).toBe(expected);
		});
		sampleDataDE.numbers.forEach((data) => {
			const fmt = data[0];
			const value = data[1][0];
			const expected = data[1][1];
			const actual = NumberFormatter.formatNumber(fmt, value, undefined, 'de-DE');
			expect(actual.value).toBe(value);
			expect(actual.formattedValue).toBe(expected);
		});
	});
});
describe('formatting SSF sample data', () => {
	test('data working', () => {
		sampleDataSSF.forEach((data) => {
			const fmt = data[0];
			for (let i = 1; i < data.length; i += 1) {
				const value = data[i][0];
				const expected = data[i][1];
				const actual = NumberFormatter.formatNumber(fmt, value);
				expect(actual.value).toBe(value);
				expect(actual.formattedValue).toBe(expected);
			}
		});
	});
	// might fix ir?
	test('data failing', () => {
		const samples = [
			['r', [-1, '-r', '#']],
			['** #,###,#00,000.00,**', [123456822333333000, ' 123,456,822,333,333.00', '#']],
			['[Red][<-25]General;[Blue][>25]General;[Green]General;[Yellow]General', [-26, '26', '#']],
			['[Red][<-25]General;[Blue][>25]General;[Green]General;[Yellow]General', [-50.1, '50', '#']],
			['[Red][<=-25]General;[Blue][>=25]General;[Green]General;[Yellow]General', [-26.1, '26', '#']],
			['[Red][<=-25]General;[Blue][>=25]General;[Green]General;[Yellow]General',  [-50, '50', '#']],
			['B2yyyymmdd', [1000, '13200624', '#']],
			['B2yyyymmdd', [10000, '13451117', '#']]
		];
		samples.forEach((data) => {
			const fmt = data[0];
			const value = data[1][0];
			const expected = data[1][1];
			const actual = NumberFormatter.formatNumber(fmt, value);
			expect(actual.formattedValue).not.toEqual(expected);
		});
	});
	// might fix ir?
	test('data throwing', () => {
		const samples = [
			['[Blue]G3neral', [1], [-1], [0], ['TODO', 'TODO']],
			['hhh:mm AM/PM', [0.7]],
			['hhh:mmm:sss', [0.7]],
			['hh:mmm:sss', [0.7]],
			['hh:mm:sss', [0.7]],
			['[hhh]', [0.7]],
			['[', [0.7]],
			['☃', [0], [1], [-1]],
			['##,##', [12345, '12,345', ''], [12345.4321, '12,345', ''], [12345.6789, '12,346', '']],
			['"foo";"bar";"baz";"qux";"foobar"', [1], [0], [-1], ['sheetjs']]
		];
		samples.forEach((data) => {
			const fmt = data[0];
			const value = data[1][0];
			expect(() => NumberFormatter.formatNumber(fmt, value)).toThrow();
		});
	});
});

describe('getting seconds, minutes and hours from serial number', () => {
	it('should return second of given serial time', () => {
		const fmt = 'ss';
		// NumberFormatter.formatNumber(fmt, value)
		expect(NumberFormatter.formatNumber(fmt,0.0).formattedValue).toBe('00');
		expect(NumberFormatter.formatNumber(fmt,0.00000578).formattedValue).toBe('00'); // max 0
		expect(NumberFormatter.formatNumber(fmt,0.00000579).formattedValue).toBe('01'); // min 1
		expect(NumberFormatter.formatNumber(fmt,0.00001234).formattedValue).toBe('01');
		expect(NumberFormatter.formatNumber(fmt,0.00001736).formattedValue).toBe('01'); // max 1
		expect(NumberFormatter.formatNumber(fmt,0.00001737).formattedValue).toBe('02'); // min 2
		expect(NumberFormatter.formatNumber(fmt,0.00065393).formattedValue).toBe('56'); // max 56
		expect(NumberFormatter.formatNumber(fmt,0.00065394).formattedValue).toBe('57'); // min 57
		expect(NumberFormatter.formatNumber(fmt,0.00066550).formattedValue).toBe('57'); // max 57
		expect(NumberFormatter.formatNumber(fmt,0.00066551).formattedValue).toBe('58'); // min 58
		expect(NumberFormatter.formatNumber(fmt,0.00067708).formattedValue).toBe('58'); // max 58
		expect(NumberFormatter.formatNumber(fmt,0.00067709).formattedValue).toBe('59'); // min 59
		expect(NumberFormatter.formatNumber(fmt,0.00068865).formattedValue).toBe('59'); // max 59
		expect(NumberFormatter.formatNumber(fmt,0.00068866).formattedValue).toBe('00');

		expect(NumberFormatter.formatNumber(fmt,43930.999999).formattedValue).toBe('00');
	});
	it('should return minute of given serial time', () => {
		expect(formattedMinutes(0.00068865)).toBe('00'); // max 0
		expect(formattedMinutes(0.00068866)).toBe('01');	// min 1
		expect(formattedMinutes(0.00069444)).toBe('01');
		expect(formattedMinutes(0.00138310)).toBe('01'); // max 1
		expect(formattedMinutes(0.00138311)).toBe('02'); // min 2
		expect(formattedMinutes(0.04096643)).toBe('58'); // max 58
		expect(formattedMinutes(0.040697361)).toBe('58');
		expect(formattedMinutes(0.04096644)).toBe('59'); // min 59
		expect(formattedMinutes(0.040972222)).toBe('59');
		expect(formattedMinutes(0.04166087)).toBe('59'); // max 59
		expect(formattedMinutes(0.04166088)).toBe('00');

		expect(formattedMinutes(43930.999999)).toBe('00');
	});
	it('should return hour of given serial time', () => {
		const fmt = 'hh';
		expect(NumberFormatter.formatNumber(fmt,0.04166087).formattedValue).toBe('00'); // max 0
		expect(NumberFormatter.formatNumber(fmt,0.04166088).formattedValue).toBe('01'); // min 1
		expect(NumberFormatter.formatNumber(fmt,0.04236111).formattedValue).toBe('01');
		expect(NumberFormatter.formatNumber(fmt,0.08332754).formattedValue).toBe('01'); // max 1
		expect(NumberFormatter.formatNumber(fmt,0.08332755).formattedValue).toBe('02'); // min 2
		expect(NumberFormatter.formatNumber(fmt,0.95832754).formattedValue).toBe('22'); // max 22
		expect(NumberFormatter.formatNumber(fmt,0.95832755).formattedValue).toBe('23'); // min 23
		expect(NumberFormatter.formatNumber(fmt,0.95833333).formattedValue).toBe('23');
		expect(NumberFormatter.formatNumber(fmt,0.99999421).formattedValue).toBe('23'); // max 23
		expect(NumberFormatter.formatNumber(fmt,0.99999422).formattedValue).toBe('00');

		expect(NumberFormatter.formatNumber(fmt,43930.999999).formattedValue).toBe('00');
	});
});