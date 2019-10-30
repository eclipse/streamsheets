const { createTerm } = require('./utils');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Cell, StreamSheet } = require('@cedalo/machine-core');


describe('opcua.json', () => {

	it('should create an opcua suitable json from specified range', () => {
		const t1 = new StreamSheet();
		/* eslint-disable */
		const sheet = t1.sheet.load({ cells: {
			// A1: 'name', B1: 'type', C1: 'value',
			A2: { value: 'factory', level: 0},
			A3: { value: 'sensors', level: 1},
			A4: { value: 'acceleration', level: 2}, B4: 1900
		} });
		/* eslint-enable */
		const json = createTerm('opcua.json(A2:C4)', sheet).value;
		expect(json).toBeDefined();
		expect(json.type).toBe('folder');
		expect(json.name).toBe('factory');
		expect(json.children.length).toBe(1);
		expect(json.children[0].type).toBe('folder');
		expect(json.children[0].name).toBe('sensors');
		expect(json.children[0].children.length).toBe(1);
		expect(json.children[0].children[0].type).toBe('variable');
		expect(json.children[0].children[0].name).toBe('acceleration');
		expect(json.children[0].children[0].value).toBe(1900);
	});
	it('should support up to 3 more optional columns', () => {
		const t1 = new StreamSheet();
		/* eslint-disable */
		const sheet = t1.sheet.load({ cells: {
			// A1: 'name', B1: 'type', C1: 'value',
			A2: { value: 'factory', level: 0}, C2: 'directory',
			A3: { value: 'sensors', level: 1}, D3: 'custom',
			A4: { value: 'acceleration', level: 2}, B4: 1900, E4: 'integer'
		} });
		/* eslint-enable */
		const json = createTerm('opcua.json(A2:E4)', sheet).value;
		expect(json).toBeDefined();
		expect(json.type).toBe('folder');
		expect(json.name).toBe('factory');
		expect(json.dataType).toBe('directory');
		expect(json.children.length).toBe(1);
		expect(json.children[0].type).toBe('folder');
		expect(json.children[0].name).toBe('sensors');
		expect(json.children[0].typeDefinition).toBe('custom');
		expect(json.children[0].children.length).toBe(1);
		expect(json.children[0].children[0].type).toBe('integer');
		expect(json.children[0].children[0].name).toBe('acceleration');
		expect(json.children[0].children[0].value).toBe(1900);
	});
	it('should return an error if width of passed range is less than 2 or greater than 5', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('opcua.json(A2:A2)', sheet).value).toBe(FunctionErrors.code.RANGE);
		expect(createTerm('opcua.json(A2:F2)', sheet).value).toBe(FunctionErrors.code.RANGE);
	});
	it('should ignore empty columns or rows', () => {
		const t1 = new StreamSheet();
		/* eslint-disable */
		const sheet = t1.sheet.load({ cells: {
			A2: { value: 'factory', level: 0},
			A3: { value: 'sensors', level: 1},
			A4: { value: 'acceleration', level: 2}, B4: 1900
		} });
		/* eslint-enable */
		const json = createTerm('opcua.json(A1:E6)', sheet).value;
		expect(json).toBeDefined();
		expect(json.type).toBe('folder');
		expect(json.name).toBe('factory');
		expect(json.children.length).toBe(1);
		expect(json.children[0].type).toBe('folder');
		expect(json.children[0].name).toBe('sensors');
		expect(json.children[0].children.length).toBe(1);
		expect(json.children[0].children[0].type).toBe('variable');
		expect(json.children[0].children[0].name).toBe('acceleration');
		expect(json.children[0].children[0].value).toBe(1900);
	});
	it('should support depth of several levels', () => {
		const t1 = new StreamSheet();
		/* eslint-disable */
		const sheet = t1.sheet.load({ cells: {
			A2: { value: 'factory', level: 0},
			A3: { value: 'sensors', level: 1},
			A4: { value: 'temperature', level: 2}, B4: 1660,
			A5: { value: 'humidity', level: 2}, B5: 1951,
			A6: { value: 'acceleration', level: 2}, B6: 1473,
			A7: { value: 'sensors2', level: 1},
			A8: { value: 'temperature', level: 2}, B8: 1350,
			A9: { value: 'humidity', level: 2}, B9: 336,
			A10: { value: 'acceleration', level: 2}, B10: 602
		} });
		/* eslint-enable */
		const json = createTerm('opcua.json(A1:C10)', sheet).value;
		expect(json.type).toBe('folder');
		expect(json.name).toBe('factory');
		expect(json.children.length).toBe(2);
		expect(json.children[0].type).toBe('folder');
		expect(json.children[0].name).toBe('sensors');
		expect(json.children[0].children.length).toBe(3);
		expect(json.children[0].children[0].type).toBe('variable');
		expect(json.children[0].children[0].name).toBe('temperature');
		expect(json.children[0].children[0].value).toBe(1660);
		expect(json.children[0].children[1].type).toBe('variable');
		expect(json.children[0].children[1].name).toBe('humidity');
		expect(json.children[0].children[1].value).toBe(1951);
		expect(json.children[0].children[2].type).toBe('variable');
		expect(json.children[0].children[2].name).toBe('acceleration');
		expect(json.children[0].children[2].value).toBe(1473);
		expect(json.children[1].type).toBe('folder');
		expect(json.children[1].name).toBe('sensors2');
		expect(json.children[1].children.length).toBe(3);
		expect(json.children[1].children[0].type).toBe('variable');
		expect(json.children[1].children[0].name).toBe('temperature');
		expect(json.children[1].children[0].value).toBe(1350);
		expect(json.children[1].children[1].type).toBe('variable');
		expect(json.children[1].children[1].name).toBe('humidity');
		expect(json.children[1].children[1].value).toBe(336);
		expect(json.children[1].children[2].type).toBe('variable');
		expect(json.children[1].children[2].name).toBe('acceleration');
		expect(json.children[1].children[2].value).toBe(602);
	});

	it('should use a specified type or "folder" / "variable" by default', () => {
		const t1 = new StreamSheet();
		/* eslint-disable */
		const sheet = t1.sheet.load({ cells: {
			A2: { value: 'factory', level: 0},
			A3: { value: 'sensors', level: 1},
			A4: { value: 'acceleration', level: 2}, B4: 1900
		} });
		/* eslint-enable */
		let json = createTerm('opcua.json(A2:B4)', sheet).value;
		expect(json).toEqual({
			'type': 'folder',
			'name': 'factory',
			'children': [{
				'type': 'folder',
				'name': 'sensors',
				'children': [{
					'type': 'variable',
					'name': 'acceleration',
					'value': 1900
				}]
			}]
		});
		sheet.setCellAt('E2', new Cell('directory'));
		sheet.setCellAt('E3', new Cell('actuators'));
		sheet.setCellAt('E4', new Cell('integer'));
		json = createTerm('opcua.json(A2:E4)', sheet).value;
		expect(json).toEqual({
			'type': 'directory',
			'name': 'factory',
			'children': [{
				'type': 'actuators',
				'name': 'sensors',
				'children': [{
					'type': 'integer',
					'name': 'acceleration',
					'value': 1900
				}]
			}]
		});
	});

	it('should ignore undefined cells', () => {
		const t1 = new StreamSheet();
		/* eslint-disable */
		const sheet = t1.sheet.load({ cells: {
			A2: { value: 'factory', level: 0}, E2: 'folderA',
			A3: { value: 'sensors', level: 1},
			A4: { value: 'acceleration', level: 2}, B4: 1900
		} });
		/* eslint-enable */
		const json = createTerm('opcua.json(A1:E4)', sheet).value;
		expect(json).toEqual({
			'name': 'factory',
			'type': 'folderA',
			'children': [{
				'name': 'sensors',
				'type': 'folder',
				'children': [{
					'name': 'acceleration',
					'type': 'variable',
					'value': 1900
				}]
			}]
		});
	});

	it('should support default types if no corresponding column is defined', () => {
		const t1 = new StreamSheet();
		/* eslint-disable */
		const sheet = t1.sheet.load({ cells: {
			A2: { value: 'factory', level: 0},
			A3: { value: 'sensors', level: 1},
			A4: { value: 'temperature', level: 2}, B4: 1660,
			A5: { value: 'humidity', level: 2}, B5: 1951,
			A6: { value: 'acceleration', level: 2}, B6: 1473,
			A7: { value: 'sensors2', level: 1},
			A8: { value: 'temperature', level: 2}, B8: 1350,
			A9: { value: 'humidity', level: 2}, B9: 336,
			A10: { value: 'acceleration', level: 2}, B10: 602
		} });
		/* eslint-enable */
		const json = createTerm('opcua.json(A2:C10)', sheet).value;
		expect(json.type).toBe('folder');
		expect(json.children.length).toBe(2);
		expect(json.children[0].type).toBe('folder');
		expect(json.children[0].children.length).toBe(3);
		expect(json.children[0].children[0].type).toBe('variable');
		expect(json.children[0].children[1].type).toBe('variable');
		expect(json.children[0].children[2].type).toBe('variable');
		expect(json.children[1].type).toBe('folder');
		expect(json.children[1].children.length).toBe(3);
		expect(json.children[1].children[0].type).toBe('variable');
		expect(json.children[1].children[1].type).toBe('variable');
		expect(json.children[1].children[2].type).toBe('variable');
	});
});
