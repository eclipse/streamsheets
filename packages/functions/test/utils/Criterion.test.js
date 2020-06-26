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
const { Criterion } = require('../../src/utils');


describe('Criterion', () => {
	describe('of', () => {
		it('should create instance from given criterion string', () => {
			expect(Criterion.of()).toBeUndefined();
			expect(Criterion.of('>34')).toBeDefined();
			expect(Criterion.of('hello')).toBeDefined();
			expect(Criterion.of('<>hello')).toBeDefined();
			expect(Criterion.of('!=hello')).toBeDefined();
			expect(Criterion.of('<>')).toBeDefined();
		});
	});
	describe('isFulFilledBy', () => {
		it('should return true if a value fulfills criterion', () => {
			let criterion = Criterion.of('>34');
			expect(criterion.isFulFilledBy(45)).toBeTruthy();
			expect(criterion.isFulFilledBy(345)).toBeTruthy();
			criterion = Criterion.of('>=-4');
			expect(criterion.isFulFilledBy(-4)).toBeTruthy();
			expect(criterion.isFulFilledBy(0)).toBeTruthy();
			expect(criterion.isFulFilledBy(100)).toBeTruthy();
			criterion = Criterion.of('hello');
			expect(criterion.isFulFilledBy('hello')).toBeTruthy();
			criterion = Criterion.of('<>hello');
			expect(criterion.isFulFilledBy('gello')).toBeTruthy();
		});
		it('should return false if a value not fulfills criterion', () => {
			let criterion = Criterion.of('>34');
			expect(criterion.isFulFilledBy(-12)).toBeFalsy();
			expect(criterion.isFulFilledBy(0)).toBeFalsy();
			criterion = Criterion.of('>=-4');
			expect(criterion.isFulFilledBy(-5)).toBeFalsy();
			expect(criterion.isFulFilledBy(-100)).toBeFalsy();
			criterion = Criterion.of('hello');
			expect(criterion.isFulFilledBy('')).toBeFalsy();
			expect(criterion.isFulFilledBy('gello')).toBeFalsy();
			criterion = Criterion.of('<>hello');
			expect(criterion.isFulFilledBy('hello')).toBeFalsy();
		});
		it('should support wildcards ? and *', () => {
			let criterion = Criterion.of('=~**');
			expect(criterion.isFulFilledBy('*West')).toBeTruthy();
			expect(criterion.isFulFilledBy('*North')).toBeTruthy();
			expect(criterion.isFulFilledBy('East')).toBeFalsy();
			criterion = Criterion.of('=~*West');
			expect(criterion.isFulFilledBy('*West')).toBeTruthy();
			expect(criterion.isFulFilledBy('MidWest')).toBeFalsy();
			criterion = Criterion.of('=*West');
			expect(criterion.isFulFilledBy('*West')).toBeTruthy();
			expect(criterion.isFulFilledBy('MidWest')).toBeTruthy();
			expect(criterion.isFulFilledBy('South')).toBeFalsy();
			criterion = Criterion.of('=??st');
			expect(criterion.isFulFilledBy('East')).toBeTruthy();
			expect(criterion.isFulFilledBy('*West')).toBeFalsy();
			expect(criterion.isFulFilledBy('MidWest')).toBeFalsy();
			criterion = Criterion.of('=*~?');
			expect(criterion.isFulFilledBy('North?')).toBeTruthy();
			expect(criterion.isFulFilledBy('?North')).toBeFalsy();
			expect(criterion.isFulFilledBy('North?s')).toBeFalsy();
			criterion = Criterion.of('<>*st');
			expect(criterion.isFulFilledBy('West')).toBeFalsy();
			expect(criterion.isFulFilledBy('East')).toBeFalsy();
			expect(criterion.isFulFilledBy('South')).toBeTruthy();
			expect(criterion.isFulFilledBy('North')).toBeTruthy();
		});
		it('should be case insensitive for text criterion', () => {
			const criterion = Criterion.of('hello');
			expect(criterion.isFulFilledBy('hello')).toBeTruthy();
			expect(criterion.isFulFilledBy('HELLO')).toBeTruthy();
			expect(criterion.isFulFilledBy('HeLlO')).toBeTruthy();
		});
	});
});