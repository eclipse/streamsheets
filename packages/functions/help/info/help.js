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
		IFERROR: {
			default: {
				category: 'Info',
				description: 'Returns specified ErrorValue, if given value represents an error. If not, this function simply returns given value.',
				inlineDescription: 'Returns ValueOnError if given Value represents an error otherwise the Value itself',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Value to check against each defined error values.',
						optional: false
					},
					{
						type: '',
						name: 'ErrorValue',
						description: 'The value to return, if first value returns an error.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'ErrorValue, if [error](../../other#error-codes) occurs, otherwise the Value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=IFERROR(2 / 0, "Warning")',
							result: '"Warning"',
							comment: 'As the Value leads to a DIV/0 error, the text "Warning" is displayed.'
						}
					]
				}
			}
		},
		ISERR: {
			default: {
				category: 'Info',
				description: 'Returns TRUE if given value represents an error, except #NA.',
				inlineDescription: 'Returns TRUE if given value represents an error, except #NA',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Value to check.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE if given value represents an [error](../../other#error-codes), except #NA, otherwise FALSE.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=ISERR(B3)',
							result: 'FALSE',
							comment: 'In B3 is no error value.'
						}
					]
				}
			}
		},
		ISERROR: {
			default: {
				category: 'Info',
				description: 'Checks, if given value represents an error.',
				inlineDescription: 'Returns TRUE if given value represents an error',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Value to check.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE if given value represents an [error](../../other#error-codes), otherwise FALSE.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=ISERROR(3/0)',
							result: 'TRUE',
							comment: 'DIV/0 error is passed by the Value argument.'
						}
					]
				}
			}
		},
		ISEVEN: {
			default: {
				category: 'Info',
				description: 'Checks, if given value is an even number.',
				inlineDescription: 'Returns TRUE if given value is an even number',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Value to check.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE if value is an even number, otherwise FALSE.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=ISEVEN(3)',
							result: 'FALSE',
							comment: 'Three is no even value.'
						}
					]
				}
			}
		},
		ISNA: {
			default: {
				category: 'Info',
				description: 'Checks, if given value represents an #NA error.',
				inlineDescription: 'Returns TRUE if given value represents a #NA error',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Value to check.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE if given value represents an #NA [error](../../other#error-codes), otherwise FALSE.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=ISNA(3)',
							result: 'FALSE',
							comment: 'No #NA detected.'
						}
					]
				}
			}
		},
		ISOBJECT: {
			default: {
				category: 'Info',
				description: 'Checks, if given value represents an object value.',
				inlineDescription: 'Returns TRUE if given value represents an object value',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Value to check.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE if given value represents an object, otherwise FALSE.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=ISOBJECT(JSON(A1:B1))',
							result: 'TRUE',
							comment: 'JSON returns an object value'
						},
						{
							formula: '=ISOBJECT("object")',
							result: 'FALSE',
							comment: 'a text is not an object value'
						}
					]
				}
			}
		},
		ISODD: {
			default: {
				category: 'Info',
				description: 'Checks, if given value is an odd number.',
				inlineDescription: 'Returns TRUE if given value is an odd number',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Value to check.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE if value is an odd number, otherwise FALSE.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=ISODD(3)',
							result: 'TRUE',
							comment: 'Three is a odd number.'
						}
					]
				}
			}
		},
		NA: {
			default: {
				category: 'Info',
				description: 'Returns the error code #NA. Use this function to mark empty cells which might are used in calculation unintentionally. By doing this the referencing formula will result in an #NA error.',
				inlineDescription: `Returns the error value #NA`,
				return: {
					type: '',
					description: 'The #NA [error](../../other#error-codes).'
				}
			}
		}
	},
};
