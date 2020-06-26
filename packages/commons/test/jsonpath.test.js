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
const { jsonpath } = require('..');

describe('jsonpath', () => {
	describe('parse', () => {
		it('should parse bracket path notation to a path array', () => {
			expect(jsonpath.parse('[Data]')).toEqual(['Data']);
			expect(jsonpath.parse('[Data][Customer]')).toEqual(['Data', 'Customer']);
			expect(jsonpath.parse('[Data][Customer][FirstName]')).toEqual(['Data', 'Customer', 'FirstName']);
			expect(jsonpath.parse('[][][Position]')).toEqual(['', '', 'Position']);
		});
		it('should parse keys string with keys containing square brackets', () => {
			expect(jsonpath.parse('[S1][][[0:0]]')).toEqual(['S1', '', '[0:0]']);
			expect(jsonpath.parse('[S1][][[0:0].Name]')).toEqual(['S1', '', '[0:0].Name']);
			expect(jsonpath.parse('[S1][][[0:0].Name][]]')).toEqual(['S1', '', '[0:0].Name', ']']);
			expect(jsonpath.parse('[S1][[]][[0:0].Name]')).toEqual(['S1', '[]', '[0:0].Name']);
			expect(jsonpath.parse('[S1][[]][[0:0].Name][[]]')).toEqual(['S1', '[]', '[0:0].Name', '[]']);
			expect(jsonpath.parse('[[]][[]][[0:0].Name][[]]')).toEqual(['[]', '[]', '[0:0].Name', '[]']);
			expect(jsonpath.parse('[]][[]][[0:0].Name][[]')).toEqual([']', '[]', '[0:0].Name', '[']);
			expect(jsonpath.parse('[[][[]][[0:0].Name][]]')).toEqual(['[', '[]', '[0:0].Name', ']']);
		});
		it('should return an empty array if passed value is not a string or has no bracket notation', () => {
			expect(jsonpath.parse()).toEqual([]);
			expect(jsonpath.parse(true)).toEqual([]);
			expect(jsonpath.parse(false)).toEqual([]);
			expect(jsonpath.parse(null)).toEqual([]);
			expect(jsonpath.parse('')).toEqual([]);
			expect(jsonpath.parse('Data')).toEqual([]);
		});
	});
})