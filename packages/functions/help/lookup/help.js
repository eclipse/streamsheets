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
		CHOOSE: {
			default: {
				category: 'Lookup',
				description: 'Returns the value at the specified index from a list of passed arguments.',
				inlineDescription: 'Returns the value at specified index from parameter list',
				arguments: [
					{
						type: '',
						name: 'Index',
						description: 'Index of item to retrieve',
						optional: false
					},
					{
						type: '',
						name: 'Value1',
						description: 'First value in list',
						optional: false
					},
					{
						type: '',
						name: 'Value2, ...',
						description: 'Other values for the list',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The value at specified index or #VALUE!.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=CHOOSE(2, "German", "English")',
							result: 'English',
							comment: 'Index 2 represents "English"'
						}
					]
				}
			}
		},
		DAVERAGE: {
			default: {
				category: 'Lookup',
				description: 'Returns the average of a specified column in given data range.',
				inlineDescription: 'Returns the average of all cells at specified column in rows which match given criteria',
				arguments: [
					{
						type: '',
						name: 'DataRange',
						description: 'Cell range, that contains the data to evaluate. The range must include the field labels.',
						optional: false
					},
					{
						type: '',
						name: 'ColumnIndex',
						description: 'Column label or index to calculate average for.',
						optional: false
					},
					{
						type: '',
						name: 'CriteriaRange',
						description: 'Specifies the conditions a row in cell range must fulfill. Must define at least one column with a label and a cell below which specifies the condition.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The average of the matching column.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DAVERAGE(A5:C9,2,A2:C3)  <br /> <img src={require("../../_images/DSUM.png").default} width="50%"/>',
							result: '21.5',
							comment: 'Evaluates the average age in "Berlin"'
						}
					]
				}
			}
		},
		DCOUNT: {
			default: {
				category: 'Lookup',
				description: 'Counts all cells that contain a number within a cell range.',
				inlineDescription: 'Counts all cells that represent a number at specified column in rows which match given criterias ',
				arguments: [
					{
						type: '',
						name: 'DataRange',
						description: 'Cell range, that contains the data to evaluate. The range must include the field labels.',
						optional: false
					},
					{
						type: '',
						name: 'ColumnIndex',
						description: 'Column label or index to count values in.',
						optional: false
					},
					{
						type: '',
						name: 'CriteriaRange',
						description: 'Specifies the conditions a row in cell range must fulfill. Must define at least one column with a label and a cell below which specifies the condition.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The counted amount of cells within the given parameters.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DCOUNT(A5:C9,2,A2:C3) <br /> <img src={require("../../_images/DSUM.png").default} width="50%"/>',
							result: '2',
							comment: 'Evaluates the number of valid age entries in "Berlin".'
						}
					]
				}
			}
		},
		DMAX: {
			default: {
				category: 'Lookup',
				description: 'Returns the largest number in a column of cell range which matches the specified criteria.',
				inlineDescription: 'Returns the largest number of all cells at specified column in rows which match given criterias ',
				arguments: [
					{
						type: '',
						name: 'DataRange',
						description: 'Cell range, that contains the data to evaluate. The range must include the field labels.',
						optional: false
					},
					{
						type: '',
						name: 'ColumnIndex',
						description: 'Column label or index to find the maximum value in.',
						optional: false
					},
					{
						type: '',
						name: 'CriteriaRange',
						description: 'Specifies the conditions a row in cell range must fulfill. Must define at least one column with a label and a cell below which specifies the condition.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The maximum value of the matching column.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DMAX(A5:C9,2,A2:C3) <br /> <img src={require("../../_images/DSUM.png").default} width="50%"/>',
							result: '24',
							comment: 'Evaluates the maximum of valid age entries in "Berlin".'
						}
					]
				}
			}
		},
		DMIN: {
			default: {
				category: 'Lookup',
				description: 'Returns the smallest number in a column of cell range which matches the specified criteria.',
				inlineDescription: 'Returns the smallest number of all cells at specified column in rows which match given criteria',
				arguments: [
					{
						type: '',
						name: 'DataRange',
						description: 'Cell range, that contains the data to evaluate. The range must include the field labels.',
						optional: false
					},
					{
						type: '',
						name: 'ColumnIndex',
						description: 'Column label or index to find the minimum value in.',
						optional: false
					},
					{
						type: '',
						name: 'CriteriaRange',
						description: 'Specifies the conditions a row in cell range must fulfill. Must define at least one column with a label and a cell below which specifies the condition.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The minimum value of the matching column.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DMIN(A5:C9,2,A2:C3) <br /> <img src={require("../../_images/DSUM.png").default} width="50%"/>',
							result: '19',
							comment: 'Evaluates the minimum of valid age entries in "Berlin".'
						}
					]
				}
			}
		},
		DSUM: {
			default: {
				category: 'Lookup',
				description: 'Returns the sum of all values in a column of the cell range which matches the specified criteria.',
				inlineDescription: 'Adds all numbers at specified column in rows which match given criterias ',
				arguments: [
					{
						type: '',
						name: 'DataRange',
						description: 'Cell range, that contains the data to evaluate. The range must include the field labels.',
						optional: false
					},
					{
						type: '',
						name: 'ColumnIndex',
						description: 'Column label or index to calculate the sum for.',
						optional: false
					},
					{
						type: '',
						name: 'CriteriaRange',
						description: 'Specifies the conditions a row in cell range must fulfill. Must define at least one column with a label and a cell below which specifies the condition.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The sum of all values of the matching column.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DSUM(A5:C9,2,A2:C3)  <br /> <img src={require("../../_images/DSUM.png").default} width="50%"/>',
							result: '43',
							comment: 'Evaluates the sum of all ages in "Berlin".'
						}
					]
				}
			}
		},
		INDEX: {
			default: {
				category: 'Lookup',
				description: 'Returns a cell within the range using the row and column offset.',
				inlineDescription: 'Returns a cell within the range using the row and column offset',
				arguments: [
					{
						type: '',
						name: 'Range',
						description: 'Range of cells to search in.',
						optional: false
					},
					{
						type: '',
						name: 'Row',
						description: 'Row index or offset starting with 1.',
						optional: false
					},
					{
						type: '',
						name: 'Column',
						description: 'Column index offset starting with 1.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Cell value of the cell within the range with an offset of row and column.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=INDEX(A2:B4,2,1)  <br /> <img src={require("../../_images/INDEX.png").default} width="50%"/>',
							result: '8',
							comment: 'The value of cell A2 is returned.'
						}
					]
				}
			}
		},
		INDIRECT: {
			default: {
				category: 'Lookup',
				description: 'Returns the value of the reference specified by a text string.',
				inlineDescription: 'Returns the value of the reference specified by passed text string',
				arguments: [
					{
						type: '',
						name: 'RefText',
						description: 'A textual representation of a cell reference, cell range reference or a named cell.',
						optional: false
					},
					{
						type: '',
						name: 'R1C1Style',
						description: 'If set to FALSE the given RefText is interpreted as R1C1-style reference. Default is TRUE.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The value at specified reference or #REF! if reference could not be created. Referencing to an indirect() function will result in handing over the reference build with the indirect cell not handing over the value represented by indirect().'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=INDIRECT("A1")',
							result: '10',
							comment: 'Returns the value of cell A1'
						},
						{
							formula: '=INDIRECT("A" & A5)',
							result: '42',
							comment: 'Assuming that A5 contains the value 4 the result represents the value of cell A4'
						}
					]
				}
			}
		},
		MATCH: {
			default: {
				category: 'Lookup',
				description: 'Returns a relative position number of a matching cell inside a specified cell range.',
				inlineDescription: 'Returns relative column index of matching cell inside specified cell range',
				arguments: [
					{
						type: '',
						name: 'value',
						description: 'Value to search for.',
						optional: false
					},
					{
						type: '',
						name: 'SearchRange',
						description: 'A cell range to search in.',
						optional: false
					},
					{
						type: '',
						name: 'Type',
						description: 'Search type with the following options: <br /> `1`: (Default) Find the largest value in cell range which is less than or equal to specified value. Table must be in ascending order. <br />`0`: Find the first value which match exactly specified value. Here the wildcards ? and * are supported. <br /> `-1`: Find the smallest value in cell range which is greater or equal to specified value. Table must be in descending order.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Returns relative position of in cell-range for given value or #NA if no match is found.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '**1.** =MATCH(4,B2:B4, 0) <br /> **2.** =MATCH(2,A2:B2, 0)<br /> <br />  <img src={require("../../_images/match.png").default} width="50%"/>',
							result: '**1.** 2  <br /> **2.** 1  <br />',
							comment: 'The index of the cell with the searched value is returned.'
						}
					]
				}
			}
		},
		OFFSET: {
			default: {
				category: 'Lookup',
				description: 'Returns a cell range that is defined by specified number of rows and columns from an initial range.',
				inlineDescription: 'Returns range of cells that is a specified number of rows and columns from an initial specified range.',
				arguments: [
					{
						type: '',
						name: 'Range',
						description: 'A cell or cell range which defines the base of returned cell range.',
						optional: false
					},
					{
						type: '',
						name: 'RowOffset',
						description: 'Row offset from top left position of Range, might be positive or negative.',
						optional: false
					},
					{
						type: '',
						name: 'ColumnOffset',
						description: 'Column offset from top left position of Range, might be positive or negative.',
						optional: false
					},
					{
						type: '',
						name: 'Height',
						description: 'Number of rows for result range. Height must be greater than zero. If not given the height of specified base cell range is used.',
						optional: true
					},
					{
						type: '',
						name: 'Width',
						description: 'Number of columns for result range. Width must be greater than zero. If not given the width of specified base cell range is used.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'If height and width define a cell: Value of cell   If height and width define a cell range: #VALUE'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '**1.** =OFFSET(<span class="blue">A2</span>, 2, 1, 1, 1)<br /> <strong>2.</strong> =SUM(OFFSET(<span class="blue">A2</span>, 1, 1, 2, 1))<br /> <img src={require("../../_images/OFFSET.png").default} width="70%"/>',
							result: '<strong>1.</strong> 6<br /> <strong>2.</strong> 10',
							comment: '<strong>1.</strong> B4 has an offset of 2 rows and 1 column from A1. The cell value is 6.<br /> <strong>2.</strong> B3 has an offset of 1 row and 1 column from A1. The SUM of the range defined through height and width is 10.'
						}
					]
				}
			}
		},
		VLOOKUP: {
			default: {
				category: 'Lookup',
				description: 'Returns the value of a cell within a specified cell range in a chosen row and characteristic.',
				inlineDescription: 'Looks in the first column of an array and moves across the row to return the value of a cell',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'The value to look for in the first column of a table.',
						optional: false
					},
					{
						type: '',
						name: 'Table',
						description: 'Range to look in. The table from which to retrieve a value.',
						optional: false
					},
					{
						type: '',
						name: 'Col_Index',
						description: 'The column in the table from which to retrieve a value.',
						optional: false
					},
					{
						type: '',
						name: 'Range_Lookup',
						description: 'Optional TRUE = approximate match (default). FALSE = exact match.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Value of cell within the given range and index or offset, if a row with the value was found.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=VLOOKUP("Test3",<span class="blue">A2:B4</span>, 2)<br /><br /> <img src={require("../../_images/VLOOKUP.png").default} width="50%"/>',
							result: '3',
							comment: 'The value of cell B3 within the given range is returned.'
						}
					]
				}
			}
		}
	},
};
