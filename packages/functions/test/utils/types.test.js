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
const {	TYPE, asType, termAsType } = require('../../src/utils/types');
const { Machine, SheetIndex, StreamSheet } = require('@cedalo/machine-core');

const cellAt = (idxstr, sheet) => sheet.cellAt(SheetIndex.create(idxstr));

const setupStreamSheet = (cells) => {
	const machine = new Machine();
	const streamsheet = new StreamSheet();
	streamsheet.sheet.load({ cells });
	machine.addStreamSheet(streamsheet);
	return streamsheet;
};

describe('asType', () => {
	describe('integer', () => {
		const typeDef = { name: TYPE.INTEGER };
		it('should read an integer', () => {
			expect(asType('0', typeDef)).toBe(0);
			expect(asType(140, typeDef)).toBe(140);
			expect(asType('-44', typeDef)).toBe(-44);
		});
		it('should read and truncate floats', () => {
			expect(asType('0.1', typeDef)).toBe(0);
			expect(asType(140.43, typeDef)).toBe(140);
			expect(asType('-44.2', typeDef)).toBe(-44);
		});
		it('should read string as undefined', () => {
			expect(asType('', typeDef)).toBeUndefined();
			expect(asType('test', typeDef)).toBeUndefined();
		});
		it('should read object as undefined', () => {
			expect(asType({}, typeDef)).toBeUndefined();
		});
		it('should read NaN as undefined', () => {
			expect(asType(NaN, typeDef)).toBeUndefined();
		});
		it('should read Infinity as undefined', () => {
			expect(asType(Infinity, typeDef)).toBeUndefined();
		});
		it('should read a boolean as undefined', () => {
			expect(asType(true, typeDef)).toBeUndefined();
			expect(asType(false, typeDef)).toBeUndefined();
		});
	});
	describe('number', () => {
		const typeDef = { name: TYPE.NUMBER };
		it('should read a number', () => {
			expect(asType('0', typeDef)).toBe(0);
			expect(asType(140, typeDef)).toBe(140);
			expect(asType('-44', typeDef)).toBe(-44);
			expect(asType('0.1', typeDef)).toBe(0.1);
			expect(asType(140.43, typeDef)).toBe(140.43);
			expect(asType('-44.2', typeDef)).toBe(-44.2);
		});
		it('should read string as undefined', () => {
			expect(asType('test', typeDef)).toBeUndefined();
			expect(asType('', typeDef)).toBeUndefined();
		});
		it('should read object as undefined', () => {
			expect(asType({}, typeDef)).toBeUndefined();
		});
		it('should read NaN as undefined', () => {
			expect(asType(NaN, typeDef)).toBeUndefined();
		});
		it('should read Infinity as undefined', () => {
			expect(asType(Infinity, typeDef)).toBeUndefined();
		});
		it('should read a boolean as undefined', () => {
			expect(asType(true, typeDef)).toBeUndefined();
			expect(asType(false, typeDef)).toBeUndefined();
		});
	});
	describe('string', () => {
		const typeDef = { name: TYPE.STRING };
		it('should read a string', () => {
			expect(asType('0', typeDef)).toBe('0');
			expect(asType('', typeDef)).toBe('');
			expect(asType('test', typeDef)).toBe('test');
			expect(asType('-44.2', typeDef)).toBe('-44.2');
		});
		it('should transform number to string', () => {
			expect(asType(0, typeDef)).toBe('0');
			expect(asType(-44, typeDef)).toBe('-44');
			expect(asType(140.43, typeDef)).toBe('140.43');
		});
		it('should read object as [object Object]', () => {
			expect(asType({}, typeDef)).toBe('[object Object]');
		});
		it('should transform a boolean to string', () => {
			expect(asType(true, typeDef)).toBe('true');
			expect(asType(false, typeDef)).toBe('false');
		});
	});
	describe('enum', () => {
		const typeDef = { name: TYPE.ENUM, values: ['Test', 'CEDALO'] };
		it('should return the string if matching', () => {
			expect(asType('Test', typeDef)).toBe('Test');
			expect(asType('CEDALO', typeDef)).toBe('CEDALO');
		});
		it('should match regardless of case, but return original case', () => {
			expect(asType('tEst', typeDef)).toBe('Test');
			expect(asType('cedalo', typeDef)).toBe('CEDALO');
		});
		it('should read anything else as undefined', () => {
			expect(asType(0, typeDef)).toBeUndefined();
			expect(asType(-44, typeDef)).toBeUndefined();
			expect(asType(140.43, typeDef)).toBeUndefined();
			expect(asType(true, typeDef)).toBeUndefined();
			expect(asType(false, typeDef)).toBeUndefined();
			expect(asType({}, typeDef)).toBeUndefined();
		});
	});
	describe('boolean', () => {
		const typeDef = { name: TYPE.BOOLEAN };
		it('should return true for true, "TRUE" and 1', () => {
			expect(asType('TRUE', typeDef)).toBe(true);
			expect(asType(true, typeDef)).toBe(true);
			expect(asType(1, typeDef)).toBe(true);
		});
		it('should return false for false, "FALSE" and 0', () => {
			expect(asType('FALSE', typeDef)).toBe(false);
			expect(asType(false, typeDef)).toBe(false);
			expect(asType(0, typeDef)).toBe(false);
		});
		it('should read anything else as undefined', () => {
			expect(asType(-44, typeDef)).toBeUndefined();
			expect(asType('', typeDef)).toBeUndefined();
			expect(asType('test', typeDef)).toBeUndefined();
			expect(asType(140.43, typeDef)).toBeUndefined();
			expect(asType({}, typeDef)).toBeUndefined();
		});
	});
	describe('list', () => {
		const withSubType = subType => Object.assign({ name: TYPE.LIST }, { type: subType });
		it('should return the input if it is correctly typed', () => {
			const typeDefInt = withSubType({ name: TYPE.INTEGER });
			expect(asType([0, 1], typeDefInt)).toEqual([0, 1]);
			const typeDefListInt = withSubType(withSubType({ name: TYPE.INTEGER }));
			expect(asType([[0, 1], [3]], typeDefListInt)).toEqual([[0, 1], [3]]);
			const typeDefString = withSubType({ name: TYPE.STRING });
			expect(asType(['test', 'string'], typeDefString)).toEqual(['test', 'string']);
		});

		it('should convert elements to the correct type', () => {
			const typeDefInt = withSubType({ name: TYPE.INTEGER });
			expect(asType([0, '1'], typeDefInt)).toEqual([0, 1]);
			const typeDefListInt = withSubType(withSubType({ name: TYPE.INTEGER }));
			expect(asType([[0, '1'], ['3']], typeDefListInt)).toEqual([[0, 1], [3]]);
			const typeDefString = withSubType({ name: TYPE.STRING });
			expect(asType([true, 'string', 5], typeDefString)).toEqual(['true', 'string', '5']);
		});

		it('should wrap primitiv values in a list', () => {
			const typeDefInt = withSubType({ name: TYPE.INTEGER });
			expect(asType(0, typeDefInt)).toEqual([0]);
			const typeDefListInt = withSubType(withSubType({ name: TYPE.INTEGER }));
			expect(asType('3', typeDefListInt)).toEqual([[3]]);
			expect(asType([[0, '1'], '3', 5], typeDefListInt)).toEqual([[0, 1], [3], [5]]);
			const typeDefString = withSubType({ name: TYPE.STRING });
			expect(asType(true, typeDefString)).toEqual(['true']);
		});

		it('should return undefined if a value cannot be to a type', () => {
			const typeDefInt = withSubType({ name: TYPE.INTEGER });
			expect(asType([0, 'test'], typeDefInt)).toBeUndefined();
		});
	});
	describe('json', () => {
		const typeDef = {
			name: TYPE.JSON
		};
		it('should read an object', () => {
			const result = asType({ field1: 'test', field2: true, field3: {} }, typeDef);
			expect(result).toEqual({ field1: 'test', field2: true, field3: {} });
		});
		it('should try to parse a string as JSON object', () => {
			const result = asType('{"field1":"test","field2":true,"field3":{}}', typeDef);
			expect(result).toEqual({ field1: 'test', field2: true, field3: {} });
		});
		it('should return undefined on all other values', () => {
			expect(asType(true, typeDef)).toBeUndefined();
			expect(asType(5, typeDef)).toBeUndefined();
			expect(asType('', typeDef)).toBeUndefined();
			expect(asType('test', typeDef)).toBeUndefined();
			expect(asType(null, typeDef)).toBeUndefined();
			expect(asType(undefined, typeDef)).toBeUndefined();
			expect(asType(NaN, typeDef)).toBeUndefined();
		});
		describe('with fields', () => {
			const typeDefFields = {
				name: TYPE.JSON,
				fields: [
					{
						id: 'field1',
						type: {
							name: TYPE.STRING
						}
					},
					{
						id: 'field2',
						type: {
							name: TYPE.INTEGER
						},
						optional: true
					},
					{
						id: 'field3',
						type: {
							name: TYPE.BOOLEAN
						},
						defaultValue: true
					}
				]
			};
			describe('from array', () => {
				it('should read an array', () => {
					const result = asType(['test', 1, false], typeDefFields);
					expect(result).toEqual({ field1: 'test', field2: 1, field3: false });
				});
				it('should allow omitting optionals', () => {
					const result = asType(['test', '', false], typeDefFields);
					expect(result).toEqual({ field1: 'test', field3: false });
				});
				it('should fall back to default value', () => {
					const result = asType(['test'], typeDefFields);
					expect(result).toEqual({ field1: 'test', field3: true });
				});
				it('should return undefined if required field is missing', () => {
					const result = asType([], typeDefFields);
					expect(result).toBeUndefined();
				});
			});
			describe('from object', () => {
				it('should read a JSON object', () => {
					const result = asType({ field1: 'test', field2: 0, field3: false }, typeDefFields);
					expect(result).toEqual({ field1: 'test', field2: 0, field3: false });
				});
				it('should allow omitting optionals', () => {
					const result = asType({ field1: 'test', field3: true }, typeDefFields);
					expect(result).toEqual({ field1: 'test', field3: true });
				});
				it('should fall back to default value', () => {
					const result = asType({ field1: 'test' }, typeDefFields);
					expect(result).toEqual({ field1: 'test', field3: true });
				});
				it('should return undefined if required field is missing', () => {
					const result = asType({}, typeDefFields);
					expect(result).toBeUndefined();
				});
			});

			describe('from JSON string object', () => {
				it('should read an object from JSON', () => {
					const result = asType('{"field1":"test","field2":0,"field3":false}', typeDefFields);
					expect(result).toEqual({ field1: 'test', field2: 0, field3: false });
				});
				it('should allow omitting optionals', () => {
					const result = asType('{"field1":"test","field3":true}', typeDefFields);
					expect(result).toEqual({ field1: 'test', field3: true });
				});
				it('should fall back to default value', () => {
					const result = asType('{"field1":"test"}', typeDefFields);
					expect(result).toEqual({ field1: 'test', field3: true });
				});
				it('should return undefined if required field is missing', () => {
					const result = asType('{}', typeDefFields);
					expect(result).toBeUndefined();
				});
			});
			describe('from JSON string array', () => {
				it('should read an array from JSON', () => {
					const result = asType('["test",1,false]', typeDefFields);
					expect(result).toEqual({ field1: 'test', field2: 1, field3: false });
				});
				it('should allow omitting optionals', () => {
					const result = asType('["test","",false]', typeDefFields);
					expect(result).toEqual({ field1: 'test', field3: false });
				});
				it('should fall back to default value', () => {
					const result = asType('["test"]', typeDefFields);
					expect(result).toEqual({ field1: 'test', field3: true });
				});
				it('should return undefined if required field is missing', () => {
					const result = asType('[]', typeDefFields);
					expect(result).toBeUndefined();
				});
			});
		});
		describe('with field type', () => {
			const typeDefFieldTypeString = {
				name: TYPE.JSON,
				fieldType: {
					name: TYPE.STRING
				}
			};
			it('should read an object', () => {
				const result = asType({ field1: 'test', field2: true }, typeDefFieldTypeString);
				expect(result).toEqual({ field1: 'test', field2: 'true' });
			});
			it('should try to parse a string as JSON obect', () => {
				const result = asType('{"field1":"test","field2":true}', typeDefFieldTypeString);
				expect(result).toEqual({ field1: 'test', field2: 'true' });
			});
			it('should return undefined if a field can not be converted to type', () => {
				const typeDefFieldTypeInt = {
					name: TYPE.JSON,
					fieldType: {
						name: TYPE.INTEGER
					}
				};
				const result = asType({ field1: 'test', field2: 1 }, typeDefFieldTypeInt);
				expect(result).toBeUndefined();
			});
			it('should return undefined on all other values', () => {
				expect(asType(true, typeDefFieldTypeString)).toBeUndefined();
				expect(asType(5, typeDefFieldTypeString)).toBeUndefined();
				expect(asType('', typeDefFieldTypeString)).toBeUndefined();
				expect(asType('test', typeDefFieldTypeString)).toBeUndefined();
				expect(asType(null, typeDefFieldTypeString)).toBeUndefined();
				expect(asType(undefined, typeDefFieldTypeString)).toBeUndefined();
				expect(asType(NaN, typeDefFieldTypeString)).toBeUndefined();
			});
		});
	});
});

describe('termAsType', () => {
	describe('boolean', () => {
		it('should read "TRUE" as true', () => {
			const typeDef = {
				name: TYPE.BOOLEAN
			};
			const streamsheet = setupStreamSheet({ A1: { value: 'TRUE' } });
			const sheet = streamsheet.sheet;
			sheet.startProcessing();
			const term = cellAt('A1', sheet);
			const typedValue = termAsType(term, typeDef);
			expect(typedValue).toBe(true);
		});
		it('should read true as true', () => {
			const typeDef = {
				name: TYPE.BOOLEAN
			};
			const streamsheet = setupStreamSheet({ A1: { value: true } });
			const sheet = streamsheet.sheet;
			sheet.startProcessing();
			const term = cellAt('A1', sheet);
			const typedValue = termAsType(term, typeDef);
			expect(typedValue).toBe(true);
		});
		it('should read "1" as true', () => {
			const typeDef = {
				name: TYPE.BOOLEAN
			};
			const streamsheet = setupStreamSheet({ A1: { value: '1' } });
			const sheet = streamsheet.sheet;
			sheet.startProcessing();
			const term = cellAt('A1', sheet);
			const typedValue = termAsType(term, typeDef);
			expect(typedValue).toBe(true);
		});
		it('should read "FALSE" as false', () => {
			const typeDef = {
				name: TYPE.BOOLEAN
			};
			const streamsheet = setupStreamSheet({ A1: { value: 'TRUE' } });
			const sheet = streamsheet.sheet;
			sheet.startProcessing();
			const term = cellAt('A1', sheet);
			const typedValue = termAsType(term, typeDef);
			expect(typedValue).toBe(true);
		});
		it('should read false as false', () => {
			const typeDef = {
				name: TYPE.BOOLEAN
			};
			const streamsheet = setupStreamSheet({ A1: { value: true } });
			const sheet = streamsheet.sheet;
			sheet.startProcessing();
			const term = cellAt('A1', sheet);
			const typedValue = termAsType(term, typeDef);
			expect(typedValue).toBe(true);
		});
		it('should read "0" as false', () => {
			const typeDef = {
				name: TYPE.BOOLEAN
			};
			const streamsheet = setupStreamSheet({ A1: { value: '1' } });
			const sheet = streamsheet.sheet;
			sheet.startProcessing();
			const term = cellAt('A1', sheet);
			const typedValue = termAsType(term, typeDef);
			expect(typedValue).toBe(true);
		});
		it('should read invalid value as #INVALID_PARAM', () => {
			const typeDef = {
				name: TYPE.BOOLEAN
			};
			const streamsheet = setupStreamSheet({ A1: { value: 'test' } });
			const sheet = streamsheet.sheet;
			sheet.startProcessing();
			const term = cellAt('A1', sheet);
			const typedValue = termAsType(term, typeDef);
			expect(typedValue).toBe('#INVALID_PARAM');
		});
	});
});
