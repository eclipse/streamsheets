const { aggregations } = require('../../src/utils');

describe('aggregations methods', () => {
	test('none', () => {
		const none = aggregations.createMethod('none');
		expect(none('')).toBe('');
		expect(none('hello')).toBe('hello');
		expect(none(0)).toBe(0);
		expect(none(1234)).toBe(1234);
		expect(none(true)).toBe(true);
		expect(none(false)).toBe(false);
		expect(none(null)).toBe(null);
		expect(none()).toBeUndefined();
	});
	test('avg', () => {
		const avg = aggregations.createMethod('avg');
		expect(avg(2)).toBe(2);
		expect(avg(4)).toBe(3);
		expect(avg(24)).toBe(10);
		expect(avg(-10)).toBe(5);
	});
	test('avg should ignore non number values', () => {
		const avg = aggregations.createMethod('avg');
		expect(avg(2)).toBe(2);
		expect(avg(4)).toBe(3);
		expect(avg()).toBe(3);
		expect(avg('')).toBe(3);
		expect(avg(true)).toBe(3);
		expect(avg(false)).toBe(3);
		expect(avg(null)).toBe(3);
		expect(avg(24)).toBe(10);
	});
	test('count', () => {
		const count = aggregations.createMethod('count');
		expect(count(2)).toBe(1);
		expect(count(-121)).toBe(2);
		expect(count(0)).toBe(3);
		expect(count(-0)).toBe(4);
		expect(count(-10)).toBe(5);
		expect(count(24)).toBe(6);
	});
	test('count should ignore non number values', () => {
		const count = aggregations.createMethod('count');
		expect(count(2)).toBe(1);
		expect(count()).toBe(1);
		expect(count('')).toBe(1);
		expect(count(true)).toBe(1);
		expect(count(false)).toBe(1);
		expect(count(null)).toBe(1);
		expect(count(24)).toBe(2);
	});
	test('counta', () => {
		const counta = aggregations.createMethod('counta');
		expect(counta(2)).toBe(1);
		expect(counta(-121)).toBe(2);
		expect(counta(0)).toBe(2);
		expect(counta(-0)).toBe(2);
		expect(counta(-10)).toBe(3);
		expect(counta(24)).toBe(4);
	});
	test('counta should ignore non number values', () => {
		const counta = aggregations.createMethod('counta');
		expect(counta(2)).toBe(1);
		expect(counta()).toBe(1);
		expect(counta('')).toBe(1);
		expect(counta(true)).toBe(1);
		expect(counta(false)).toBe(1);
		expect(counta(null)).toBe(1);
		expect(counta(24)).toBe(2);
	});
	test('max', () => {
		const max = aggregations.createMethod('max');
		expect(max(-200)).toBe(-200);
		expect(max(0)).toBe(0);
		expect(max(-10)).toBe(0);
		expect(max(24)).toBe(24);
	});
	test('max should ignore non number values', () => {
		const max = aggregations.createMethod('max');
		expect(max(-20000)).toBe(-20000);
		expect(max()).toBe(-20000);
		expect(max(1)).toBe(1);
		expect(max('')).toBe(1);
		expect(max(true)).toBe(1);
		expect(max(false)).toBe(1);
		expect(max(null)).toBe(1);
	});
	test('min', () => {
		const min = aggregations.createMethod('min');
		expect(min(200)).toBe(200);
		expect(min(0)).toBe(0);
		expect(min(-10)).toBe(-10);
		expect(min(24)).toBe(-10);
	});
	test('min should ignore non number values', () => {
		const min = aggregations.createMethod('min');
		expect(min(2)).toBe(2);
		expect(min()).toBe(2);
		expect(min('')).toBe(2);
		expect(min(true)).toBe(2);
		expect(min(false)).toBe(2);
		expect(min(null)).toBe(2);
	});
	test('product', () => {
		const product = aggregations.createMethod('product');
		expect(product(2)).toBe(2);
		expect(product(4)).toBe(8);
		expect(product(-4)).toBe(-32);
		expect(product(-2)).toBe(64);
		expect(product(0)).toBe(0);
	});
	test('product should ignore non number values', () => {
		const product = aggregations.createMethod('product');
		expect(product()).toBe(1);
		expect(product('')).toBe(1);
		expect(product(true)).toBe(1);
		expect(product(false)).toBe(1);
		expect(product(null)).toBe(1);
		expect(product(23)).toBe(23);
	});
	test('stdev', () => {
		const stdev = aggregations.createMethod('stdevs');
		expect(stdev(1345)).toBe(0);
		stdev(1301);
		stdev(1368);
		stdev(1322);
		stdev(1310);
		stdev(1370);
		stdev(1318);
		stdev(1350);
		stdev(1303);
		expect(stdev(1299).toFixed(8)).toBe('27.46391572');
	});
	test('stdev should ignore non number values', () => {
		const stdev = aggregations.createMethod('stdevs');
		expect(stdev(1345)).toBe(0);
		expect(stdev()).toBe(0);
		expect(stdev('')).toBe(0);
		expect(stdev(true)).toBe(0);
		expect(stdev(false)).toBe(0);
		expect(stdev(null)).toBe(0);
	});
	test('sum', () => {
		const sum = aggregations.createMethod('sum');
		expect(sum(2)).toBe(2);
		expect(sum(4)).toBe(6);
		expect(sum(-4)).toBe(2);
		expect(sum(-2)).toBe(0);
		expect(sum(0)).toBe(0);
	});
	test('sum should ignore non number values', () => {
		const sum = aggregations.createMethod('sum');
		expect(sum()).toBe(0);
		expect(sum('')).toBe(0);
		expect(sum(true)).toBe(0);
		expect(sum(false)).toBe(0);
		expect(sum(null)).toBe(0);
		expect(sum(42)).toBe(42);
	});
});
