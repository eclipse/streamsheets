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
const { FunctionErrors } = require('@cedalo/error-codes');
const { StreamSheet } = require('@cedalo/machine-core');
const { createTerm } = require('../utilities');

const ERROR = FunctionErrors.code;

describe('json.value', () => {
	it('should return value of key specified by given path', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A1: '{"Name": "Hans"}',
			A2: { formula: 'json(A1)' },
			A3: { formula: 'json.value(A2, "Name")' }
		});
		expect(sheet.cellAt('A3').value).toBe('Hans');
	});
	it('should support nested json objects', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A1: '{"Kunde":{"Name":"Peter","Alter":55,"Adresse":{"Ort":"Freiburg","Strasse":"Hauptstrasse","Hausnummer":7}}}',
			A2: { formula: 'json(A1)' },
			A3: { formula: 'json.value(A2, "Kunde")' },
			A4: { formula: 'json.value(A2, "Kunde", "Name")' },
			A5: { formula: 'json.value(A2, "Kunde", "Alter")' },
			A6: { formula: 'json.value(A2, "Kunde", "Adresse")' },
			A7: { formula: 'json.value(A2, "Kunde", "Adresse", "Ort")' },
			A8: { formula: 'json.value(A2, "Kunde", "Adresse", "Strasse")' },
			A9: { formula: 'json.value(A2, "Kunde", "Adresse", "Hausnummer")' }
		});
		expect(sheet.cellAt('A3').value).toEqual({
			Name: 'Peter',
			Alter: 55,
			Adresse: { Ort: 'Freiburg', Strasse: 'Hauptstrasse', Hausnummer: 7 }
		});
		expect(sheet.cellAt('A4').value).toBe('Peter');
		expect(sheet.cellAt('A5').value).toBe(55);
		expect(sheet.cellAt('A6').value).toEqual({Ort: 'Freiburg', Strasse: 'Hauptstrasse', Hausnummer: 7});
		expect(sheet.cellAt('A7').value).toBe('Freiburg');
		expect(sheet.cellAt('A8').value).toBe('Hauptstrasse');
		expect(sheet.cellAt('A9').value).toBe(7);
	});
	it('should support an array as json object', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A1: '["Foo", "Bar"]',
			A2: { formula: 'json(A1)' },
			A3: { formula: 'json.value(A2, 0)' },
			A4: { formula: 'json.value(A2, "1")' }
		});
		expect(sheet.cellAt('A3').value).toBe('Foo');
		expect(sheet.cellAt('A4').value).toBe('Bar');
	});
	it('should support array of nested json objects', () => {
		const json = [
			{ Kunde: { Name: 'Peter', Products: ['Car', 'Bike'] } },
			{ Kunde: { Name: 'Mara', Products: ['Cube', 'Shoe'] } }
		];
		const sheet = new StreamSheet().sheet.loadCells({
			A1: `${JSON.stringify(json)}`,
			A2: { formula: 'json(A1)' },
			A3: { formula: 'json.value(A2, "0", "Kunde", "Name")' },
			A4: { formula: 'json.value(A2, 0, "Kunde", "Products", "0")' },
			A5: { formula: 'json.value(A2, "0", "Kunde", "Products", 1)' },
			A6: { formula: 'json.value(A2, "1", "Kunde", "Name")' },
			A7: { formula: 'json.value(A2, 1, "Kunde", "Products", 0)' },
			A8: { formula: 'json.value(A2, 1, "Kunde", "Products", "1")' }
		});
		expect(sheet.cellAt('A3').value).toBe('Peter');
		expect(sheet.cellAt('A4').value).toBe('Car');
		expect(sheet.cellAt('A5').value).toBe('Bike');
		expect(sheet.cellAt('A6').value).toBe('Mara');
		expect(sheet.cellAt('A7').value).toBe('Cube');
		expect(sheet.cellAt('A8').value).toBe('Shoe');
	});
	it(`should return ${ERROR.ARGS} if called with no arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('json.value()', sheet).value).toBe(ERROR.ARGS);
	});
	it(`should return ${ERROR.VALUE} if first argument is not a JSON object`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('json.value(,)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('json.value(42)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('json.value("json")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('json.value(true)', sheet).value).toBe(ERROR.VALUE);
	});
	it(`should return ${ERROR.NA} if specified path is invalid`, () => {
		const sheet = new StreamSheet().sheet.load({ cells: {
			A1: '{"Name": "Hans"}',
			A2: { formula: 'json(A1)'},
			A3: { formula: 'json.value(A2, "Name123")'}
		} });
		expect(sheet.cellAt('A3').value).toBe(ERROR.NA);
	});
});