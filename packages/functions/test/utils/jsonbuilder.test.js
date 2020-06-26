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
const jb = require('../../src/utils/jsonbuilder');


describe('jsonbuilder', () => {
	describe('adding simple key/value pairs', () => {
		it('should add a number value', () => {
			const json = {};
			expect(jb.add(json, ['Nr'], 1234)).toBeTruthy();
			expect(json).toBeDefined();
			expect(json.Nr).toBe(1234);
		});
		it('should add a string value', () => {
			const json = {};
			expect(jb.add(json, ['Name'], 'Hans')).toBeTruthy();
			expect(json).toBeDefined();
			expect(json.Name).toBe('Hans');
		});
		it('should add an empty object value', () => {
			const json = {};
			expect(jb.add(json, ['Kunde'], {})).toBeTruthy();
			expect(json).toBeDefined();
			expect(json.Kunde).toBeDefined();
			expect(json.Kunde).toEqual({});
		});
		it('should add an empty array value', () => {
			const json = {};
			expect(jb.add(json, ['Orders'], [])).toBeTruthy();
			expect(json).toBeDefined();
			expect(json.Orders).toBeDefined();
			expect(json.Orders).toEqual([]);
		});
	});
	describe('adding implicit parent creation', () => {
		it('should add an object parent', () => {
			const json = {};
			expect(jb.add(json, ['Kunde', 'Nr'], 1234)).toBeTruthy();
			expect(json).toBeDefined();
			expect(json.Kunde).toBeDefined();
			expect(json.Kunde.Nr).toBe(1234);
		});
		it('should add an array parent', () => {
			const json = {};
			expect(jb.add(json, ['Kunden', '0'], {})).toBeTruthy();
			expect(json).toBeDefined();
			expect(json.Kunden).toBeDefined();
			expect(json.Kunden.length).toBe(1);
		});
		it('should add nested parents', () => {
			const json = {};
			expect(jb.add(json, ['Positionen', '0', 'ArtikelNr'], '1234')).toBeTruthy();
			expect(json).toBeDefined();
			expect(json.Positionen).toBeDefined();
			expect(json.Positionen[0]).toBeDefined();
			expect(json.Positionen[0].ArtikelNr).toBe('1234');
		});
	});
	describe('adding values to array parent', () => {
		it('should add a value at specified index', () => {
			const json = {};
			expect(jb.add(json, ['Positionen'], [])).toBeTruthy();
			expect(json).toBeDefined();
			expect(json.Positionen).toBeDefined();
			expect(jb.add(json, ['Positionen', '0'], {})).toBeTruthy();
			expect(json.Positionen[0]).toBeDefined();
			expect(json.Positionen[0]).toEqual({});
			expect(jb.add(json, ['Positionen', '0', 'Kunde'], 'Max')).toBeTruthy();
			expect(json.Positionen[0].Kunde).toBe('Max');
		});
		it('should replace value at specified index', () => {
			const json = {};
			expect(jb.add(json, ['Positionen', '0'], {})).toBeTruthy();
			expect(json.Positionen[0]).toEqual({});
			expect(jb.add(json, ['Positionen', '0'], [])).toBeTruthy();
			expect(json.Positionen[0]).toEqual([]);
			expect(json.Positionen.length).toBe(1);
		});
		it('should insert value at first index on -1', () => {
			const json = {};
			expect(jb.add(json, ['Customers'], [])).toBeTruthy();
			expect(jb.add(json, ['Customers', '-1'], 'Max')).toBeTruthy();
			expect(json.Customers[0]).toBe('Max');
			expect(json.Customers.length).toBe(1);
			expect(jb.add(json, ['Customers', '-1'], 'Fred')).toBeTruthy();
			expect(json.Customers[0]).toBe('Fred');
			expect(json.Customers[1]).toBe('Max');
			expect(json.Customers.length).toBe(2);
		});
	});
	describe('various tests with nested parents', () => {
		test('Kunde.Nachname, Mustermann, String', () => {
			const json = {};
			expect(jb.add(json, ['Kunde', 'Nachname'], 'Mustermann')).toBeTruthy();
			expect(json.Kunde).toBeDefined();
			expect(json.Kunde.Nachname).toBe('Mustermann');
		});
		test('Positionen.0, , Dictionary', () => {
			const json = {};
			expect(jb.add(json, ['Positionen', '0'], {})).toBeTruthy();
			expect(json.Positionen).toBeDefined();
			expect(json.Positionen[0]).toEqual({});
		});
		test('Positionen.0, , Array', () => {
			const json = {};
			expect(jb.add(json, ['Positionen', '0'], [])).toBeTruthy();
			expect(json.Positionen).toBeDefined();
			expect(json.Positionen[0]).toEqual([]);
		});
		test('Kunde.Max.Orders.1.Preis, 3.99, Number', () => {
			const json = {};
			expect(jb.add(json, ['Kunde', 'Max', 'Orders', 1, 'Preis'], 3.99, 'number')).toBeTruthy();
			expect(json.Kunde).toBeDefined();
			expect(json.Kunde.Max.Orders[1].Preis).toBe(3.99);
		});
	});
});
