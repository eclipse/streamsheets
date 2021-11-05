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
		AVERAGE: {
			default: {
				category: 'Statistical',
				description: 'Returns the average of specified cell values. Values which do not represent a number are ignored.',
				inlineDescription: 'Returns the average of specified cell values. Values which do not represent a number are ignored.',
				arguments: [
					{
						type: '',
						name: 'Value1',
						description: 'Cell or cell-range to calculate average for.',
						optional: false
					},
					{
						type: '',
						name: 'Value2, ...',
						description: 'Additional Cells or cell-ranges to calculate average for.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The average over all specified cell values.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=AVERAGE(4, 5, 6, 7)',
							result: '5.5',
							comment: 'Average is 5.5'
						}
					]
				}
			}
		},
		AVERAGEIF: {
			default: {
				category: 'Statistical',
				description: 'Returns the average of all cell values in a cell-range which meet a given criterion. To specify multiple criteria please use AVERAGEIFS.',
				inlineDescription: 'Returns the average of all cell values in a cell-range which meet a given criterion.',
				arguments: [
					{
						type: '',
						name: 'DataRange',
						description: 'Cell-range to calculate average for.',
						optional: false
					},
					{
						type: '',
						name: 'Criterion',
						description: 'The criterion each cell has to fulfill.',
						optional: false
					},
					{
						type: '',
						name: 'AverageRange',
						description: 'If given these cells are used to calculate average. If ommitted DataRange is used.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The average over all cell values which meet criterion.'
				},
				examples: {
					infoStart: '\n| |A|B|\n|---|---|---|\n|1|100000|200|\n|2|200000|400|\n|3|300000|400|\n|4|North|600|\n|5|East|800|\n|6|South|1000|\n',
					infoEnd: '',
					formulas: [
						{
							formula: 'AVERAGEIF(<span class="blue">A1:A3</span>, <span class="orange">"&lt;250000"</span>)',
							result: '150000',
							comment: 'Only cells A1 and A2 match given criterion'
						},
						{
							formula: 'AVERAGEIF(<span class="blue">A1:A6</span>, <span class="orange">"=*th"</span>, <span class="green">B1:B6</span>)',
							result: '800',
							comment: 'Take cells from column A which end with "th" and average corresponding values from column B'
						}
					]
				}
			}
		},
		AVERAGEIFS: {
			default: {
				category: 'Statistical',
				description: 'Returns the average of all cell values which meet multiple criteria.',
				inlineDescription: 'Returns the average of all cell values which meet multiple criteria.',
				arguments: [
					{
						type: '',
						name: 'AverageRange',
						description: 'Cell-range to calculate average for.',
						optional: false
					},
					{
						type: '',
						name: 'CriterionRange1',
						description: 'The cell-range which is checked against the criterion.',
						optional: false
					},
					{
						type: '',
						name: 'Criterion1',
						description: 'The criterion each cell of CriterionRange1 has to fulfill.',
						optional: false
					},
					{
						type: '',
						name: 'CriterionRange2,...',
						description: 'Additional cell-range which is checked against next criterion.',
						optional: true
					},
					{
						type: '',
						name: 'Criterion2,...',
						description: 'Additional criterion each cell of CriterionRange2 has to fulfill.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The average over all cell values which meet all specified criteria.'
				},
				examples: {
					infoStart: '\n| |A|B|C|D|\n|---|---|---|---|---|\n|1|230000|Freiburg|3|No|\n|2|197000|Cologne|2|Yes|\n|3|345678|Cologne|4|Yes|\n|4|Freiburg|321900|2|Yes|\n|5|Cologne|203000|3|No|\n',
					infoEnd: '',
					formulas: [
						{
							formula: 'AVERAGEIFS(<span class="blue">A1:A5</span>, <span class="orange">B1:B5</span>, <span class="green">"Cologne"</span>, <span class="orange">C1:C5</span>, <span class="green">"&gt;2"</span>)',
							result: '200000',
							comment: 'Average price of houses in Cologne that have at least 3 rooms.'
						},
						{
							formula: 'AVERAGEIFS(<span class="blue">A1:A5</span>, <span class="orange">C1:C5</span>, <span class="green">"&gt;=4"</span>)',
							result: '345678',
							comment: 'Average price of houses with 4 or more rooms.'
						},
						{
							formula: 'AVERAGEIFS(<span class="blue">A1:A5</span>, <span class="orange">C1:C5</span>, <span class="green">"&gt;4"</span>)',
							result: '<span class="red">#DIV/0!</span>',
							comment: 'No cell fulfills given criterion.'
						}
					]
				}
			}
		},
		CORREL: {
			default: {
				category: 'Statistical',
				description: 'Returns the correlation coefficient of two cell ranges.',
				inlineDescription: 'Returns the correlation coefficient of two cell ranges.',
				arguments: [
					{
						type: '',
						name: 'CellRange1',
						description: 'A cell range which defines x numbers. No number values are ignored.',
						optional: false
					},
					{
						type: '',
						name: 'CellRange2',
						description: 'A cell range which defines y numbers. No number values are ignored.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'A number representing the correlation between all x and y values.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=CORREL(A2:A6,B2:B6)',
							result: '0.997054486',
							comment: 'with cell values A2: 3, A3: 2, A4: 4, A5: 5, A6: 6 and B2: 9, B3: 7, B4: 12, B5: 15, B6: 17'
						},
						{
							formula: '=CORREL(A2:A4,B2:B6)',
							result: '#NA!',
							comment: 'number of of given x and y values are not equal'
						},
						{
							formula: '=CORREL(A7:A12,B2:B6)',
							result: '#DIV0!',
							comment: 'no x or y values'
						}
					]
				}
			}
		},
		COUNT: {
			default: {
				category: 'Statistical',
				description: 'Counts the amount of number values in specified cells.',
				inlineDescription: 'Counts the amount of number values in specified cells.',
				arguments: [
					{
						type: '',
						name: 'Value1',
						description: 'Cell range or reference range in which number values should be counted.',
						optional: false
					},
					{
						type: '',
						name: 'Value2...ValueN',
						description: 'Other cell references or ranges to check.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Amount of number values.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=COUNT(A2:B4, 1) <br /> <img src={require("../../_images/COUNT.png").default} width="40%"/>',
							result: '3',
							comment: 'Empty cells are not counted.'
						}
					]
				}
			}
		},
		COUNTA: {
			default: {
				category: 'Statistical',
				description: 'Counts the number of defined cells in a given range.',
				inlineDescription: 'Counts the number of defined cells in a given range.',
				arguments: [
					{
						type: '',
						name: 'Value1',
						description: 'Cell or range to check for defined cells.',
						optional: false
					},
					{
						type: '',
						name: 'Value2...ValueN',
						description: 'Additional cells or ranges to check.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Amount of defined cells.'
				},
				examples: {
					infoStart: '\n| | A | B | C |\n|---|---|---|---|\n|1|42|hi| |\n|2|FALSE|0| |\n',
					infoEnd: '',
					formulas: [
						{
							formula: '=COUNTA(A1)',
							result: '1',
							comment: 'Single defined cell.'
						},
						{
							formula: '=COUNTA(C1)',
							result: '0',
							comment: 'Cell in C1 has no value.'
						},
						{
							formula: '=COUNTA(A1:C3)',
							result: '4',
							comment: 'Range contains only 4 defined cells in A1, B1, A2 and B2.'
						},
						{
							formula: '=COUNTA(A1:B1,A2:B2)',
							result: '4',
							comment: 'Same as before but using multiple ranges.'
						}
					]
				}
			}
		},
		COUNTIF: {
			default: {
				category: 'Statistical',
				description: 'Returns the number of cells in a cell-range which meet a given criterion. To specify multiple criteria please use COUNTIFS.',
				inlineDescription: 'Returns the number of cells in a cell-range which meet a given criterion.',
				arguments: [
					{
						type: '',
						name: 'CellRange',
						description: 'The range of cells to count.',
						optional: false
					},
					{
						type: '',
						name: 'Criterion',
						description: 'The criterion a cell has to fulfill in order to be counted.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The number of cells which meet criterion.'
				},
				examples: {
					infoStart: '\n| | A | B |\n|---|---|---|\n|1|apples|32|\n|2|oranges|54|\n|3|peaches|75|\n|4|apples|86|\n',
					infoEnd: '',
					formulas: [
						{
							formula: 'COUNTIF(<span class="blue">A1:A4</span>, <span class="orange">"apples"</span>)',
							result: '2',
							comment: 'Counts all apples.'
						},
						{
							formula: 'COUNTIF(<span class="blue">B1:B4</span>, <span class="orange">"&gt;55"</span>)',
							result: '2',
							comment: 'Counts all cells which values is greater than 55.'
						}
					]
				}
			}
		},
		COUNTIFS: {
			default: {
				category: 'Statistical',
				description: 'Returns the number of cells from several cell-ranges which meet all corresponding criteria.',
				inlineDescription: 'Returns the number of cells from several cell-ranges which meet all corresponding criteria.',
				arguments: [
					{
						type: '',
						name: 'CriterionRange1',
						description: 'The range of cells to count.',
						optional: false
					},
					{
						type: '',
						name: 'Criterion1',
						description: 'The criterion each cell of CriterionRange1 has to fulfill.',
						optional: false
					},
					{
						type: '',
						name: 'CriterionRange2,...',
						description: 'Additional cell-range which is checked against next criterion.',
						optional: true
					},
					{
						type: '',
						name: 'Criterion2,...',
						description: 'Additional criterion each cell of CriterionRange2 has to fulfill.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The number of cells which meet all specified criteria.'
				},
				examples: {
					infoStart: '\n| |A|B|C|D|\n|---|---|---|---|---|\n|1|230000|Freiburg|3|No|\n|2|197000|Cologne|2|Yes|\n|3|345678|Cologne|4|Yes|\n|4|Freiburg|321900|2|Yes|\n|5|Cologne|203000|3|No|\n',
					infoEnd: '',
					formulas: [
						{
							formula: 'COUNTIFS(<span class="blue">C1:C4</span>, <span class="orange">"&gt;=3"</span>)',
							result: '3',
							comment: 'Counts all houses which have three or more rooms.'
						},
						{
							formula: 'COUNTIFS(<span class="blue">B1:B5</span>, <span class="orange">"Cologne"</span>, <span class="blue">D1:D5</span>, <span class="orange">"=Yes"</span>)',
							result: '2',
							comment: 'Counts all houses in Cologne which have a garage.'
						}
					]
				}
			}
		},
		FORECAST: {
			default: {
				category: 'Statistical',
				description: 'Calculates a future Y value for a given X value based on existing values.',
				inlineDescription: 'Calculates a future Y value for a given X value based on existing values.',
				arguments: [
					{
						type: '',
						name: 'X',
						description: 'Number for which a value should be predicted. Passing non numeric values results in #VALUE! [error](../../other#error-codes).',
						optional: false
					},
					{
						type: '',
						name: 'KnownYs',
						description: 'A cell range which defines the dependent y numbers. No number values are ignored.',
						optional: false
					},
					{
						type: '',
						name: 'KnownXs',
						description: 'A cell range which defines the dependent x numbers. No number values are ignored.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'A number representing the predicted Y value for given X value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=FORECAST(30,A2:A6,B2:B6)',
							result: '10.607253\'',
							comment: 'with cell values A2: 6, A3: 7, A4: 9, A5: 15, A6: 21 and B2: 20, B3: 28, B4: 31, B5: 38, B6: 40'
						},
						{
							formula: '=FORECAST(30,A7:A12,B2:B6)',
							result: '#NA!',
							comment: 'no y values'
						}
					]
				}
			}
		},
		MAX: {
			default: {
				category: 'Statistical',
				description: 'Evaluates the maximum value of all given values.',
				inlineDescription: 'Evaluates the maximum value of all given values.',
				arguments: [
					{
						type: '',
						name: 'Value1, Value2...',
						description: 'Number values to evaluate max from.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Maximum value from all given values.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=MAX(3, 6, 12)',
							result: '12'
						}
					]
				}
			}
		},
		MAXIFS: {
			default: {
				category: 'Statistical',
				description: 'Returns the maximum value of all cells which meet multiple criteria.',
				inlineDescription: 'Returns the maximum value of all cells which meet multiple criteria.',
				arguments: [
					{
						type: '',
						name: 'MaxRange',
						description: 'Cell-range to determine maximum value of.',
						optional: false
					},
					{
						type: '',
						name: 'CriterionRange1',
						description: 'The cell-range which is checked against the criterion.',
						optional: false
					},
					{
						type: '',
						name: 'Criterion1',
						description: 'The criterion each cell of CriterionRange1 has to fulfill.',
						optional: false
					},
					{
						type: '',
						name: 'CriterionRange2,...',
						description: 'Additional cell-range which is checked against next criterion.',
						optional: true
					},
					{
						type: '',
						name: 'Criterion2,...',
						description: 'Additional criterion each cell of CriterionRange2 has to fulfill.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The maximum of all cell values which meet all specified criteria.'
				},
				examples: {
					infoStart: '\n| |A|B|C|D|\n|---|---|---|---|---|\n|1|89|1|a|1|\n|2|93|2|b|2|\n|3|96|2|a|3|\n|4|85|3|b|4|\n|5|91|1|b|5|\n|6|88|1|a|6|\n',
					infoEnd: '',
					formulas: [
						{
							formula: 'MAXIFS(<span class="blue">A1:A6</span>, <span class="orange">B1:B6</span>, <span class="green">1</span>)',
							result: '91',
							comment: 'Maximum value of cells which have 1 in their B-column.'
						},
						{
							formula: 'MAXIFS(<span class="blue">A1:A6</span>, <span class="orange">C1:C6</span>, <span class="green">"b"</span>, <span class="orange">D6:D6</span>, <span class="green">"&gt;=2"</span>)',
							result: '93',
							comment: 'Maximum value of all cells which have "b" in their C-column and its D-column value is greater or equal 2.'
						},
						{
							formula: 'MAXIFS(<span class="blue">A1:A6</span>, <span class="orange">B1:B6</span>, <span class="green">"&gt;4"</span>)',
							result: '0',
							comment: 'No cell fulfills given criterion.'
						},
						{
							formula: 'MAXIFS(<span class="blue">A1:A6</span>, <span class="orange">B1:D7</span>, <span class="green">"&gt;4"</span>)',
							result: '<span class="red">#VALUE!</span>',
							comment: 'MaxRange and CriteriaRange have different height and/or with.'
						}
					]
				}
			}
		},
		MIN: {
			default: {
				category: 'Statistical',
				description: 'Evaluates the minimum value of all given values.',
				inlineDescription: 'Evaluates the minimum value of all given values.',
				arguments: [
					{
						type: '',
						name: 'Value1, Value2...',
						description: 'Number values to evaluate minimum from.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Minimum value from all given values.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=MIN(3, 6, 12)',
							result: '3'
						}
					]
				}
			}
		},
		MINIFS: {
			default: {
				category: 'Statistical',
				description: 'Returns the minimum value of all cells which meet multiple criteria.',
				inlineDescription: 'Returns the minimum value of all cells which meet multiple criteria.',
				arguments: [
					{
						type: '',
						name: 'MinRange',
						description: 'Cell-range to determine minimum value of.',
						optional: false
					},
					{
						type: '',
						name: 'CriterionRange1',
						description: 'The cell-range which is checked against the criterion.',
						optional: false
					},
					{
						type: '',
						name: 'Criterion1',
						description: 'The criterion each cell of CriterionRange1 has to fulfill.',
						optional: false
					},
					{
						type: '',
						name: 'CriterionRange2,...',
						description: 'Additional cell-range which is checked against next criterion.',
						optional: true
					},
					{
						type: '',
						name: 'Criterion2,...',
						description: 'Additional criterion each cell of CriterionRange2 has to fulfill.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The minimum of all cell values which meet all specified criteria.'
				},
				examples: {
					infoStart: '\n| |A|B|C|D|\n|---|---|---|---|---|\n|1|89|1|a|1|\n|2|93|2|b|2|\n|3|96|2|a|3|\n|4|85|3|b|4|\n|5|91|1|b|5|\n|6|88|1|a|6|\n',
					infoEnd: '| Function                                                                                                                                                                           | Result                            | Comment                                                                                                   | |------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------|-----------------------------------------------------------------------------------------------------------| | MINIFS(<span class="blue">A1:A6</span>, <span class="orange">B1:B6</span>, <span class="green">1</span>)                                                                           | 88                                | Minimum value of cells which have 1 in their B-column.                                                    | | MINIFS(<span class="blue">A1:A6</span>, <span class="orange">C1:C6</span>, <span class="green">"b"</span>, <span class="orange">D6:D6</span>, <span class="green">"&gt;=2"</span>) | 85                                | Minimum value of all cells which have "b" in their C-column and its D-column value is greater or equal 2. | | MINIFS(<span class="blue">A1:A6</span>, <span class="orange">B1:B6</span>, <span class="green">"&gt;4"</span>)                                                                     | 0                                 | No cell fulfills given criterion.                                                                         | | MINIFS(<span class="blue">A1:A6</span>, <span class="orange">B1:D7</span>, <span class="green">"&gt;4"</span>)                                                                     | <span class="red">#VALUE!</span> | MinRange and CriteriaRange have different height and/or with.                                             | ',
					formulas: [
						{
							formula: 'MINIFS(<span class="blue">A1:A6</span>, <span class="orange">B1:B6</span>, <span class="green">1</span>)',
							result: '88',
							comment: 'Minimum value of cells which have 1 in their B-column.'
						},
						{
							formula: 'MINIFS(<span class="blue">A1:A6</span>, <span class="orange">C1:C6</span>, <span class="green">"b"</span>, <span class="orange">D6:D6</span>, <span class="green">"&gt;=2"</span>)',
							result: '85',
							comment: 'Minimum value of all cells which have "b" in their C-column and its D-column value is greater or equal 2.'
						},
						{
							formula: 'MINIFS(<span class="blue">A1:A6</span>, <span class="orange">B1:B6</span>, <span class="green">"&gt;4"</span>)',
							result: '0',
							comment: 'No cell fulfills given criterion.'
						},
						{
							formula: 'MINIFS(<span class="blue">A1:A6</span>, <span class="orange">B1:D7</span>, <span class="green">"&gt;4"</span>)',
							result: '<span class="red">#VALUE!</span>',
							comment: 'MinRange and CriteriaRange have different height and/or with.'
						}
					]
				}
			}
		},
		'STDEV.S': {
			default: {
				category: 'Statistical',
				description: 'Returns the standard derivation of specified values.',
				inlineDescription: 'Returns the standard derivation of specified values.',
				arguments: [
					{
						type: '',
						name: 'Number1',
						description: 'A number or text representing a number or cell- or cell-range references.',
						optional: false
					},
					{
						type: '',
						name: 'Number2, ...',
						description: 'Further numbers or cell- or cell-range-references.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The standard derivation of specified values.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=STDEV.S(A2:A5)',
							result: '28.92519',
							comment: 'with cell values A2: 1345, A3: 1301, A4: 1368, A5: 1322'
						}
					]
				}
			}
		}
	},
};
