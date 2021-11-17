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
module.exports = {
	functions: {
		AND: {
			default: {
				category: 'Logical',
				description: 'Evaluates, if all given values are true.',
				inlineDescription: 'Evaluates, if all given values are true',
				arguments: [
					{
						type: '',
						name: 'Value1',
						description: 'First value to check',
						optional: false
					},
					{
						type: '',
						name: 'Value2, ...',
						description: 'Other values to check',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if all passed arguments are true, otherwise FALSE.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=AND(TRUE,1)',
							result: 'TRUE',
							comment: 'Numbers not equal 0 are evaluated as TRUE'
						},
						{
							formula: '=AND(TRUE,"Test")',
							result: 'TRUE',
							comment: 'Non empty strings are evaluated as TRUE'
						},
						{
							formula: '=AND(FALSE,"Test")',
							result: 'FALSE',
							comment: 'First Value is "FALSE", function is evaluated as "FALSE"'
						}
					]
				}
			}
		},
		IF: {
			default: {
				category: 'Logical',
				description: 'Returns depending on the condition the true or the false argument. Or, if condition evaluates in an error, the function returns the error message and is not calculated.',
				inlineDescription: 'Returns depending on the condition, the True or the False value',
				arguments: [
					{
						type: '',
						name: 'Condition',
						description: 'Condition to check.',
						optional: false
					},
					{
						type: '',
						name: 'TrueValue',
						description: 'Optional value to return, if the condition is true. If not specified nothing is returned.',
						optional: false
					},
					{
						type: '',
						name: 'FalseValue',
						description: 'Optional value to return, if the condition is false. If not specified nothing is returned.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The appropriate value depending on the condition.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=IF(3&gt;1, "Warning", "OK")',
							result: '"Warning"',
							comment: 'As the condition results to TRUE, the first value is returned.'
						},
						{
							formula: '=IF(A1="no_streamsheets", "Warning", RETURN()) with A1 = #NA',
							result: '#NA',
							comment: 'A1 returns an error and the function will not be calculated'
						}
					]
				}
			}
		},
		NOT: {
			default: {
				category: 'Logical',
				description: 'Evaluates, if all given values are FALSE.',
				inlineDescription: 'Inverts the given boolean value',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Value to invert',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'If value is TRUE, FALSE, otherwise TRUE.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=NOT(TRUE)',
							result: 'FALSE'
						}
					]
				}
			}
		},
		OR: {
			default: {
				category: 'Logical',
				description: 'Evaluates, if at least one of the given values is true.',
				inlineDescription: 'Evaluates, if at least one of the given values is true',
				arguments: [
					{
						type: '',
						name: 'Value1',
						description: 'First value to check',
						optional: false
					},
					{
						type: '',
						name: 'Value2, ...',
						description: 'Other values to check',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if at least one of the arguments are true, otherwise FALSE.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=OR(TRUE, 0)',
							result: 'TRUE',
							comment: '0 is evaluated as FALSE'
						},
						{
							formula: '=OR(FALSE, "Test")',
							result: 'TRUE',
							comment: 'Non empty strings are evaluated as TRUE'
						},
						{
							formula: '=OR(FALSE, 0)',
							result: 'FALSE',
							comment: '0 is evaluated as FALSE'
						}
					]
				}
			}
		},
		SWITCH: {
			default: {
				category: 'Logical',
				description: 'The SWITCH Function switches values, by defining switch conditions and a default value if the switch conditions are not met. The amount of switch conditions is not limited.',
				inlineDescription: 'Evaluates an expression against a list of key-value pairs and returns value of first matched key',
				arguments: [
					{
						type: '',
						name: 'LookupKey',
						description: 'Key to check',
						optional: false
					},
					{
						type: '',
						name: 'KeyValue1, Value1, KeyValue2, Value2 ..., KeyValueN, ValueN',
						description: 'Key/Value pairs to find Key in.',
						optional: false
					},
					{
						type: '',
						name: 'DefaultValue',
						description: 'Return value, if KeyValue is not found.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Default Value when switch condition is not met. ValueN, if LookupKey matched KeyValueN.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=SWITCH(2, 1, "Sun", 2, "Mon", 3, "Tue", "None")',
							result: '"Mon"',
							comment: 'The key 2 corresponds to the value "Mon".'
						},
						{
							formula: '=SWITCH(4, 1, "Sun", 2, "Mon", 3, "Tue", "None")',
							result: '"None"',
							comment: 'The key 4 could not be found.'
						}
					]
				}
			}
		}
	},
};
