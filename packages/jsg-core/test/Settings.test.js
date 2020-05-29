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
const Settings = require('../src/layout/Settings');


describe('Settings', () => {
	describe('get & set', () => {
		it('should return undefined for unknown keys', () => {
			const settings = new Settings();
			expect(settings.get(42)).toBeUndefined();
			expect(settings.get('key')).toBeUndefined();
			expect(settings.get()).toBeUndefined();
			expect(settings.get(null)).toBeUndefined();
		});
		it('should return previously set value', () => {
			const settings = new Settings();
			settings.set(42, 42);
			settings.set('key1', 'key1');
			settings.set('key2', null);
			settings.set('key3', true);
			expect(settings.get(42)).toBe(42);
			expect(settings.get('key1')).toBe('key1');
			expect(settings.get('key2')).toBe(null);
			expect(settings.get('key3')).toBe(true);
		});
		it('should ignore null or undefined keys', () => {
			const settings = new Settings();
			settings.set(null, 'null');
			settings.set(undefined, 'undefined');
			expect(settings.get(null)).toBeUndefined();
			expect(settings.get(undefined)).toBeUndefined();
		})
	});
	describe('has', () => {
		it('should return true if settings has a value for given key', () => {
			const settings = new Settings();
			settings.set(42, 42);
			settings.set('key1', 'key1');
			expect(settings.has(42)).toBe(true);
			expect(settings.has('key1')).toBe(true);
		});
		it('should return false if settings has no value for given key', () => {
			const settings = new Settings();
			settings.set(42, 42);
			settings.set('key1', 'key1');
			expect(settings.has(422)).toBe(false);
			expect(settings.has('key2')).toBe(false);
			expect(settings.has()).toBe(false);
			expect(settings.has(null)).toBe(false);
			expect(settings.has(undefined)).toBe(false);
		});
	});
	describe('copy', () => {
		it('should be possible to copy settings', () => {
			const settings = new Settings();
			settings.set(42, 42);
			settings.set('key1', 'key1');
			const copy = settings.copy();
			expect(copy.get(42)).toBe(42);
			expect(copy.get('key1')).toBe('key1');
		});
		test('changing copy does not change original settings', () => {
			const settings = new Settings();
			settings.set(42, 42);
			settings.set('key1', 'key1');
			const copy = settings.copy();
			copy.set('key1', 'new key1');
			copy.set('key2', 'key2');
			expect(copy.get('key1')).toBe('new key1');
			expect(copy.get('key2')).toBe('key2');
			expect(settings.get('key1')).toBe('key1');
			expect(settings.get('key2')).toBeUndefined();
		});
		test('changing original settings does not change copy', () => {
			const settings = new Settings();
			const copy = settings.copy();
			settings.set(42, 42);
			settings.set('key1', 'key1');
			expect(settings.get(42)).toBe(42);
			expect(settings.get('key1')).toBe('key1');
			expect(copy.get(42)).toBeUndefined();
			expect(copy.get('key1')).toBeUndefined();
		});
	});
	describe('derive', () => {
		it('should be possible to build settings hierarchy', () => {
			const settings = new Settings();
			const subSettings = settings.derive();
			// both settings empty:
			expect(subSettings.get(42)).toBeUndefined();
			expect(subSettings.get('key1')).toBeUndefined();
			// add some to base settings
			settings.set(42, 42);
			settings.set('key1', 'key1');
			// available in both
			expect(settings.get(42)).toBe(42);
			expect(settings.get('key1')).toBe('key1');
			expect(subSettings.get(42)).toBe(42);
			expect(subSettings.get('key1')).toBe('key1');
		});
		test('changing setting in derived settings should not change setting in base', () => {
			const settings = new Settings();
			const subSettings = settings.derive();
			settings.set(42, 42);
			settings.set('key1', 'key1');
			subSettings.set(42, 23);
			subSettings.set('key2', 'key2');
			expect(settings.get(42)).toBe(42);
			expect(settings.get('key2')).toBeUndefined();
			expect(subSettings.get(42)).toBe(23);
			expect(subSettings.get('key1')).toBe('key1');
			expect(subSettings.get('key2')).toBe('key2');
		});
		test('changing setting in base settings should change setting in derived too', () => {
			const settings = new Settings();
			const subSettings = settings.derive();
			settings.set(42, 42);
			settings.set('key1', 'key1');
			expect(subSettings.get(42)).toBe(42);
			expect(subSettings.get('key1')).toBe('key1');
			expect(subSettings.get('key2')).toBeUndefined();
			// now change base:
			settings.set(42, 23);
			settings.set('key2', 'key2');
			expect(subSettings.get(42)).toBe(23);
			expect(subSettings.get('key1')).toBe('key1');
			expect(subSettings.get('key2')).toBe('key2');
		});
	});
})