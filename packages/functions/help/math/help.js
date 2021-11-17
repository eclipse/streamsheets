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
		ABS: {
			default: {
				category: 'Math',
				description: 'Returns the absolute value of a number.',
				inlineDescription: 'Returns the absolute value of a number.',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Value of which to return the absolute number.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The absolute number.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=ABS(-3)',
							result: '3',
							comment: 'Absolute number is three'
						}
					]
				}
			}
		},
		ARCCOS: {
			default: {
				category: 'Math',
				description: 'Calculates the arc cosine value of the given value',
				inlineDescription: 'Calculates the arc cosine value of the given value',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Value to evaluate arccosine for.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Evaluated angle in radians.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=ARCCOS(0.3)',
							result: '1.26610367'
						}
					]
				}
			}
		},
		ARCSIN: {
			default: {
				category: 'Math',
				description: 'Calculates the arc sine value of the given value',
				inlineDescription: 'Calculates the arc sine value of the given value',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Value to evaluate arcsine for.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Evaluated angle in radians.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=ARCSIN(0.3)',
							result: '0.30469265'
						}
					]
				}
			}
		},
		ARCTAN: {
			default: {
				category: 'Math',
				description: 'Calculates the arc tangent value of the given value',
				inlineDescription: 'Calculates the arc tangent value of the given value',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Value to evaluate arctangent for.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Evaluated angle in radians.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=ARCTAN(0.3)',
							result: '0.2914568'
						}
					]
				}
			}
		},
		ARCTAN2: {
			default: {
				category: 'Math',
				description: 'Calculates the arc tangent value based on the given x and y coordinates.',
				inlineDescription: 'Calculates the arc tangent value based on the given x and y coordinates.',
				arguments: [
					{
						type: '',
						name: 'X',
						description: 'X Coordinate.',
						optional: false
					},
					{
						type: '',
						name: 'Y',
						description: 'Y Coordinate.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Evaluated angle in radians.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=ARCTAN2(50,50)',
							result: '0.78539816',
							comment: 'An equal value for X and Y will lead to a 45 degree angle.'
						}
					]
				}
			}
		},
		CEILING: {
			default: {
				category: 'Math',
				description: 'Returns a given number rounded up to the nearest multiple of specified significance. The multiple to use for rounding is provided as the significance argument. If the number is already an exact multiple, no rounding occurs and the original number is returned. To round down use [```FLOOR()```](./floor.md).',
				inlineDescription: 'Returns number rounded up to the nearest multiple of given significance',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The number to round',
						optional: false
					},
					{
						type: '',
						name: 'Significance',
						description: 'The multiple to use when rounding',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The rounded number or an [error](../../other#error-codes) value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=CEILING(4.32, 0.05)',
							result: '4.35'
						},
						{
							formula: '=CEILING(-2.5, 2)',
							result: '-2'
						}
					]
				}
			}
		},
		COS: {
			default: {
				category: 'Math',
				description: 'Returns the cosine value of the angle.',
				inlineDescription: 'Returns the cosine value of the angle.',
				arguments: [
					{
						type: '',
						name: 'Angle',
						description: 'Angle in radians',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Evaluated cosine value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=COS(PI())',
							result: '-1'
						}
					]
				}
			}
		},
		DEGREES: {
			default: {
				category: 'Math',
				description: 'Converts radian value to degrees.',
				inlineDescription: 'Converts radian value to degrees.',
				arguments: [
					{
						type: '',
						name: 'Radians',
						description: 'Radian value to convert.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Degrees converted from radian angle.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DEGREES(PI())',
							result: '180'
						}
					]
				}
			}
		},
		EVEN: {
			default: {
				category: 'Math',
				description: 'Returns the number rounded up to the nearest event integer.',
				inlineDescription: 'Returns the number rounded up to the nearest event integer.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The number to round.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The rounded number.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=EVEN(1.5)',
							result: '2',
							comment: 'Rounded to nearest even integer'
						},
						{
							formula: '=EVEN(3)',
							result: '4',
							comment: 'Rounded to nearest even integer'
						},
						{
							formula: '=EVEN(2)',
							result: '-2',
							comment: '2 is already even'
						},
						{
							formula: '=EVEN(-1)',
							result: '-2',
							comment: 'Rounded to nearest even integer'
						}
					]
				}
			}
		},
		FLOOR: {
			default: {
				category: 'Math',
				description: 'Returns a given number rounded down to the nearest multiple of specified significance. The multiple to use for rounding is provided as the significance argument. If the number is already an exact multiple, no rounding occurs and the original number is returned. To round up use [```CEILING()```](./ceiling.md).',
				inlineDescription: 'Returns number rounded down to the nearest multiple of given significance',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The number to round',
						optional: false
					},
					{
						type: '',
						name: 'Significance',
						description: 'The multiple to which should be rounded',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The rounded number or an [error](../../other#error-codes) value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=FLOOR(4.32, 0.05)',
							result: '4.3'
						},
						{
							formula: '=FLOOR(-45.67, 2',
							result: '-46'
						},
						{
							formula: '=FLOOR(-45.67, -2)',
							result: '-44'
						}
					]
				}
			}
		},
		FRAC: {
			default: {
				category: 'Math',
				description: 'Returns the fractional part of a number value.',
				inlineDescription: 'Returns the fractional part of a number value.',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Number value to get the fractional part of.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The fractional part of specified number value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=FRAC(1.2)',
							result: '0.2'
						},
						{
							formula: '=FRAC(-1.2)',
							result: '-0.2'
						},
						{
							formula: '=FRAC(23)',
							result: '0'
						}
					]
				}
			}
		},
		INT: {
			default: {
				category: 'Math',
				description: 'Rounds a number value down to its smaller integer.',
				inlineDescription: 'Rounds a number value down to its smaller integer.',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Number value to round down to an integer.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Smaller integer of specified number value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=INT(3.6)',
							result: '3'
						}
					]
				}
			}
		},
		LOG: {
			default: {
				category: 'Math',
				description: 'Returns the logarithm of given number to a specified base.',
				inlineDescription: 'Returns the logarithm of given number to a specified base.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The number for which the logarithm should be calculated.',
						optional: false
					},
					{
						type: '',
						name: 'Base',
						description: 'The base of the logarithm. Defaults to 10.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The logarithm of given number.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=LOG(10)',
							result: '1',
							comment: 'No base specified so 10 is used and hence it must be raised only one time.'
						},
						{
							formula: '=LOG(8, 2)',
							result: '3',
							comment: 'The base value must be raised three times.'
						}
					]
				}
			}
		},
		MOD: {
			default: {
				category: 'Math',
				description: 'Returns the remainder of given number after it was divided by specified divisor. The result has the same sign as divisor.',
				inlineDescription: 'Returns the remainder of given number after it was divided by specified divisor.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The number for which the remainder should be calculated.',
						optional: false
					},
					{
						type: '',
						name: 'Divisor',
						description: 'The number by which the Number should be divided',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The remainder of applied division. Note: it always has the same sign as divisor.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=MOD(3, 2)',
							result: '1',
							comment: 'Remainder of 3/2'
						},
						{
							formula: '=MOD(-3, 2)',
							result: '1',
							comment: 'Same sign as divisor'
						},
						{
							formula: '=MOD(3, -2)',
							result: '-1',
							comment: 'Same sign as divisor'
						}
					]
				}
			}
		},
		ODD: {
			default: {
				category: 'Math',
				description: 'Returns the number rounded up to the nearest odd integer.',
				inlineDescription: 'Returns the number rounded up to the nearest odd integer.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The number to round.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The rounded number.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=ODD(1.5)',
							result: '3',
							comment: 'Rounded to nearest odd integer'
						},
						{
							formula: '=ODD(3)',
							result: '3',
							comment: '3 is already odd'
						},
						{
							formula: '=ODD(2)',
							result: '-3',
							comment: 'Rounded to nearest odd integer'
						},
						{
							formula: '=ODD(-1)',
							result: '-1',
							comment: 'Rounded to nearest odd integer'
						},
						{
							formula: '=ODD(-2)',
							result: '-3',
							comment: 'Rounded to nearest odd integer'
						}
					]
				}
			}
		},
		PI: {
			default: {
				category: 'Math',
				description: 'Returns the value of PI.',
				inlineDescription: 'Returns the value of PI.',
				return: {
					type: '',
					description: 'Value of PI.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=PI()',
							result: '3.14159265'
						}
					]
				}
			}
		},
		POWER: {
			default: {
				category: 'Math',
				description: 'Evaluates the value of base to the power of exponent.',
				inlineDescription: 'Evaluates the value of base to the power of exponent.',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Value to use for base.',
						optional: false
					},
					{
						type: '',
						name: 'Exponent',
						description: 'Exponent to use',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Value of base to the power of exponent.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=POWER(2, 3)',
							result: '8'
						}
					]
				}
			}
		},
		RADIANS: {
			default: {
				category: 'Math',
				description: 'Converts the degrees value to radians.',
				inlineDescription: 'Converts the degrees value to radians.',
				arguments: [
					{
						type: '',
						name: 'Degrees',
						description: 'Degrees value to convert.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Angle in radians.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=RADIANS(180)',
							result: '3.14159'
						}
					]
				}
			}
		},
		RANDBETWEEN: {
			default: {
				category: 'Math',
				description: 'Creates a random value between min and max. It is possible to create a series of increasing or decreasing values by specifying a delta range. The delta is randomly chosen within its range and applied to last returned value.',
				inlineDescription: 'Creates a random value between min and max.',
				arguments: [
					{
						type: '',
						name: 'Min',
						description: 'Minimum value to return.',
						optional: false
					},
					{
						type: '',
						name: 'Max',
						description: 'Maximum value to return.',
						optional: false
					},
					{
						type: '',
						name: 'MinDelta',
						description: 'Minimum value applied to last value in next step. If specified MaxDelta must also be set. Min and MaxDelta together define the possible range of change',
						optional: true
					},
					{
						type: '',
						name: 'MaxDelta',
						description: 'Maximum value applied to last value in next step. If specified MinDelta must also be set.',
						optional: true
					},
					{
						type: '',
						name: 'InitialValue',
						description: 'Initial value to start with. Only used if MinDelta and MaxDelta are given. Note: delta will be applied to initial value.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Random number between minimum and maximum argument.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=RANDBETWEEN(1, 10)',
							result: 'e.g.: 5',
							comment: 'The return value can be any number between 1 and 10.'
						},
						{
							formula: '=RANDBETWEEN(10, 30, -1, 1, 15)',
							result: 'e.g.: 16',
							comment: 'Initial value is 15 to which a random delta of -1, 0 or 1 is added. 1 in this case resulting in 16.'
						},
						{
							formula: '=RANDBETWEEN(10, 30, 1, 3, 15)',
							result: 'e.g.: 16',
							comment: 'Initial value is 15 to which a random delta of 1, 2 or 3 is added. 1 in this case resulting in 16.'
						}
					]
				}
			}
		},
		ROUND: {
			default: {
				category: 'Math',
				description: 'Rounds the value to the given amount of decimals.',
				inlineDescription: 'Rounds the value to the given amount of decimals.',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Value to round.',
						optional: false
					},
					{
						type: '',
						name: 'Decimals.',
						description: 'Allowed decimals in the result.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Rounded value with the allowed number of decimals.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=ROUND(7.3423423, 3)',
							result: '7.342'
						}
					]
				}
			}
		},
		SIGN: {
			default: {
				category: 'Math',
				description: 'Returns the sign of given number.',
				inlineDescription: 'Returns the sign of given number.',
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
					description: 'Returns 1, if number value is positive, -1, if it is negative or 0, if value is 0.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=SIGN(-3)',
							result: '-1'
						}
					]
				}
			}
		},
		SIN: {
			default: {
				category: 'Math',
				description: 'Returns the sine value of the angle.',
				inlineDescription: 'Returns the sine value of the angle.',
				arguments: [
					{
						type: '',
						name: 'Angle',
						description: 'Angle in radians',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Evaluated sine value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=SIN(PI())',
							result: '0'
						}
					]
				}
			}
		},
		SQRT: {
			default: {
				category: 'Math',
				description: 'Evaluate square root of the value.',
				inlineDescription: 'Evaluate square root of the value.',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Value to evaluate square root for.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Evaluated square root.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=SQRT(16)',
							result: '4'
						}
					]
				}
			}
		},
		SUM: {
			default: {
				category: 'Math',
				description: 'Evaluates the sum of all given values.',
				inlineDescription: 'Evaluates the sum of all given values.',
				arguments: [
					{
						type: '',
						name: 'Range1...RangeN',
						description: 'A list of references or ranges to calculate the sum for.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Sum of all given arguments.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=SUM(3, 6, 12)',
							result: '21'
						},
						{
							formula: '=SUM("Test3",A2:B4, 2)<br /><br /> <img src={require("../../_images/SUM.png").default} width="40%"/>',
							result: '50'
						}
					]
				}
			}
		},
		SUMIF: {
			default: {
				category: 'Math',
				description: 'Returns the sum of all cell values in a cell-range which meet a given criterion. To specify multiple criteria please use [SUMIFS](../math/sumifs).',
				inlineDescription: 'Returns the sum of all cell values in a cell-range which meet a given criterion.',
				arguments: [
					{
						type: '',
						name: 'DataRange',
						description: 'Cell-range to calculate sum for.',
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
						name: 'SumRange',
						description: 'If given these cells are used to calculate total sum. If omitted DataRange is used.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The sum of all cell values which meet criterion.'
				},
				examples: {
					infoStart: '\n| |A|B|\n|---|---|---|\n|1|100000|200|\n|2|200000|400|\n|3|300000|400|\n|4|North|600|\n|5|East|800|\n|6|South|1000|\n',
					infoEnd: '',
					formulas: [
						{
							formula: 'SUMIF(<span class="blue">A1:A3</span>, <span class="orange">"250000"</span>)',
							result: '300000',
							comment: 'Only cells A1 and A2 match given criterion.'
						},
						{
							formula: 'SUMIF(<span class="blue">A1:A6</span>, <span class="orange">"=*th"</span>, <span class="green">B1:B6</span>)',
							result: '1600',
							comment: 'Take cells from column A which end with "th" and average corresponding values from column B.'
						}
					]
				}
			}
		},
		SUMIFS: {
			default: {
				category: 'Math',
				description: 'Returns the sum of all cell values which meet multiple criteria.',
				inlineDescription: 'Returns the sum of all cell values which meet multiple criteria.',
				arguments: [
					{
						type: '',
						name: 'SumRange',
						description: 'Cell-range to calculate sum for.',
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
					description: 'The sum of cell values which meet all specified criteria.'
				},
				examples: {
					infoStart: '\n| |A|B|C|D|\n|---|---|---|---|---|\n|1|230000|Freiburg|3|No|\n|2|197000|Cologne|2|Yes|\n|3|345678|Cologne|4|Yes|\n|4|Freiburg|321900|2|Yes|\n|5|Cologne|203000|3|No|\n',
					infoEnd: '',
					formulas: [
						{
							formula: 'SUMIFS(<span class="blue">A1:A5</span>, <span class="orange">B1:B5</span>, <span class="green">"Cologne"</span>)',
							result: '745678',
							comment: 'Total price of all available houses in Cologne.'
						},
						{
							formula: 'SUMIFS(<span class="blue">A1:A5</span>, <span class="orange">B1:B5</span>, <span class="green">"Freiburg"</span>, <span class="orange">C1:C5</span>, <span class="green">"&gt;2"</span>)',
							result: '230000',
							comment: 'Total price of all available houses in Freiburg which have more than 2 rooms.'
						}
					]
				}
			}
		},
		TAN: {
			default: {
				category: 'Math',
				description: 'Returns the tangent value of the angle.',
				inlineDescription: 'Returns the tangent value of the angle.',
				arguments: [
					{
						type: '',
						name: 'Angle',
						description: 'Angle in radians',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Evaluated tangent value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=TAN(PI()/4)',
							result: '1'
						}
					]
				}
			}
		},
		TRUNC: {
			default: {
				category: 'Math',
				description: 'Truncates a number to an integer.',
				inlineDescription: 'Truncates a number to an integer.',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Number value to truncate.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Number value to truncate.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=TRUNC(7.3423423)',
							result: '7'
						}
					]
				}
			}
		}
	},
};
