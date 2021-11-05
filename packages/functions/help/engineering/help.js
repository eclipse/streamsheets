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
		BIN2DEC: {
			default: {
				category: 'Engineering',
				description: 'Converts a binary number to decimal.',
				inlineDescription: 'Converts a binary number to decimal.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The binary number to convert.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The decimal number or a #NUM! [error](../../other#error-codes) if given number is not a valid binary number.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=BIN2DEC(1100100)',
							result: '100',
							comment: 'converts binary 1100100 to decimal'
						}
					]
				}
			}
		},
		BIN2FLOAT: {
			default: {
				category: 'Engineering',
				description: 'Converts a binary number to a floating point number. Floating point numbers are represented as a 32bit-IEEE-754 number.',
				inlineDescription: 'Converts a binary number to a floating point number. Floating point numbers are represented as a 32bit-IEEE-754 number.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The binary number to convert.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The floating point number or a #NUM! [error](../../other#error-codes) if given number is not a valid binary number.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=BIN2FLOAT("01000000010010010000111111011011")',
							result: '3.1415927410125732421875',
							comment: 'converts binary number 01000000010010010000111111011011 to floating point number'
						}
					]
				}
			}
		},
		BIN2HEX: {
			default: {
				category: 'Engineering',
				description: 'Converts a binary number to hexadecimal.',
				inlineDescription: 'Converts a binary number to hexadecimal.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The binary number to convert.',
						optional: false
					},
					{
						type: '',
						name: 'Places',
						description: 'The number of characters to use for returned value. If value has less characters then it is padded with leading zeros.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The hexadecimal number or a #NUM! [error](../../other#error-codes) if given number is not a valid binary number. The #VALUE! [error](../../other#error-codes) is returned if specified places is not numeric or negative.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=BIN2HEX(1110)',
							result: 'E',
							comment: 'converts binary 1110 to hexadecimal'
						},
						{
							formula: '=BIN2HEX(1110, 4)',
							result: '000E',
							comment: 'converts binary 1110 to hexadecimal with 4 characters'
						}
					]
				}
			}
		},
		BIN2OCT: {
			default: {
				category: 'Engineering',
				description: 'Converts a binary number to octal.',
				inlineDescription: 'Converts a binary number to octal.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The binary number to convert.',
						optional: false
					},
					{
						type: '',
						name: 'Places',
						description: 'The number of characters to use for returned value. If value has less characters then it is padded with leading zeros.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The octal number or a #NUM! [error](../../other#error-codes) if given number is not a valid binary number. The #VALUE! [error](../../other#error-codes) is returned if specified places is not numeric or negative.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=BIN2OCT(1100100)',
							result: '144',
							comment: 'converts binary 1100100 to octal'
						},
						{
							formula: '=BIN2OCT(1100100, 4)',
							result: '0144',
							comment: 'converts binary 1100100 to octal with 4 characters'
						}
					]
				}
			}
		},
		DEC2BIN: {
			default: {
				category: 'Engineering',
				description: 'Converts a decimal number to binary.',
				inlineDescription: 'Converts a decimal number to binary.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The decimal number to convert.',
						optional: false
					},
					{
						type: '',
						name: 'Places',
						description: 'The number of characters to use for returned value. If value has less characters then it is padded with leading zeros.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The binary number or a #NUM! [error](../../other#error-codes) if given number is not a valid decimal number. The #VALUE! [error](../../other#error-codes) is returned if specified places is not numeric or negative.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DEC2BIN(9)',
							result: '1001',
							comment: 'converts decimal 9 to binary'
						},
						{
							formula: '=DEC2BIN(9, 6)',
							result: '001001',
							comment: 'converts decimal 9 to binary with 6 characters'
						}
					]
				}
			}
		},
		DEC2HEX: {
			default: {
				category: 'Engineering',
				description: 'Converts a decimal number to hexadecimal.',
				inlineDescription: 'Converts a decimal number to hexadecimal.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The decimal number to convert.',
						optional: false
					},
					{
						type: '',
						name: 'Places',
						description: 'The number of characters to use for returned value. If value has less characters then it is padded with leading zeros.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The hexadecimal number or a #NUM! [error](../../other#error-codes) if given number is not a valid decimal number. The #VALUE! [error](../../other#error-codes) is returned if specified places is not numeric or negative.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DEC2HEX(28)',
							result: '1C',
							comment: 'converts decimal 28 to hexadecimal'
						},
						{
							formula: '=DEC2HEX(28, 4)',
							result: '001C',
							comment: 'converts decimal 28 to hexadecimal with 4 characters'
						}
					]
				}
			}
		},
		DEC2OCT: {
			default: {
				category: 'Engineering',
				description: 'Converts a decimal number to octal.',
				inlineDescription: 'Converts a decimal number to octal.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The decimal number to convert.',
						optional: false
					},
					{
						type: '',
						name: 'Places',
						description: 'The number of characters to use for returned value. If value has less characters then it is padded with leading zeros.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The octal number or a #NUM! [error](../../other#error-codes) if given number is not a valid decimal number. The #VALUE! [error](../../other#error-codes) is returned if specified places is not numeric or negative.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DEC2OCT(58)',
							result: '72',
							comment: 'converts decimal 58 to octal'
						},
						{
							formula: '=DEC2OCT(58, 4)',
							result: '0072',
							comment: 'converts decimal 58 to octal with 4 characters'
						}
					]
				}
			}
		},
		FLOAT2BIN: {
			default: {
				category: 'Engineering',
				description: 'Converts a floating point number to binary. Floating point numbers are represented as a 32bit-IEEE-754 number.',
				inlineDescription: 'Converts a floating point number to binary. Floating point numbers are represented as a 32bit-IEEE-754 number.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The floating point number to convert.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The binary number or a #NUM! [error](../../other#error-codes) if given number is not a valid floating point number.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=FLOAT2BIN(2.567)',
							result: '01000000001001000100100110111010',
							comment: 'converts floating point 2.567 to binary'
						}
					]
				}
			}
		},
		FLOAT2HEX: {
			default: {
				category: 'Engineering',
				description: 'Converts a floating point number to hexadecimal. Floating point numbers are represented as a 32bit-IEEE-754 number.',
				inlineDescription: 'Converts a floating point number to hexadecimal. Floating point numbers are represented as a 32bit-IEEE-754 number.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The floating point number to convert.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The hexadecimal number or a #NUM! [error](../../other#error-codes) if given number is not a valid floating point number.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=FLOAT2HEX(2.567)',
							result: '402449BA',
							comment: 'converts floating point 2.567 to hexadecimal'
						}
					]
				}
			}
		},
		HEX2BIN: {
			default: {
				category: 'Engineering',
				description: 'Converts a hexadecimal number to binary.',
				inlineDescription: 'Converts a hexadecimal number to binary.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The hexadecimal number to convert.',
						optional: false
					},
					{
						type: '',
						name: 'Places',
						description: 'The number of characters to use for returned value. If value has less characters then it is padded with leading zeros.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The binary number or a #NUM! [error](../../other#error-codes) if given number is not a valid hexadecimal number. The #VALUE! [error](../../other#error-codes) is returned if specified places is not numeric or negative.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=HEX2BIN("F")',
							result: '1111',
							comment: 'converts hexadecimal F to binary'
						},
						{
							formula: '=HEX2BIN("F", 6)',
							result: '001111',
							comment: 'converts hexadecimal F to binary with 6 characters'
						}
					]
				}
			}
		},
		HEX2DEC: {
			default: {
				category: 'Engineering',
				description: 'Converts a hexadecimal number to decimal.',
				inlineDescription: 'Converts a hexadecimal number to decimal.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The hexadecimal number to convert.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The decimal number or a #NUM! [error](../../other#error-codes) if given number is not a valid hexadecimal number.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=HEX2DEC("A5")',
							result: '165',
							comment: 'converts hexadecimal A5 to decimal'
						}
					]
				}
			}
		},
		HEX2FLOAT: {
			default: {
				category: 'Engineering',
				description: 'Converts a hexadecimal number to a floating point number. Floating point numbers are represented as a 32bit-IEEE-754 number.',
				inlineDescription: 'Converts a hexadecimal number to a floating point number. Floating point numbers are represented as a 32bit-IEEE-754 number.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The hexadecimal number to convert.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The floating point number or a #NUM! [error](../../other#error-codes) if given number is not a valid hexadecimal number.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=HEX2FLOAT("40490FDB")',
							result: '3.1415927410125732421875',
							comment: 'converts hexadecimal number 40490FDB to floating point number'
						}
					]
				}
			}
		},
		HEX2OCT: {
			default: {
				category: 'Engineering',
				description: 'Converts a hexadecimal number to octal.',
				inlineDescription: 'Converts a hexadecimal number to octal.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The hexadecimal number to convert.',
						optional: false
					},
					{
						type: '',
						name: 'Places',
						description: 'The number of characters to use for returned value. If value has less characters then it is padded with leading zeros.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The octal number or a #NUM! [error](../../other#error-codes) if given number is not a valid hexadecimal number. The #VALUE! [error](../../other#error-codes) is returned if specified places is not numeric or negative.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=HEX2OCT("F")',
							result: '17',
							comment: 'converts hexadecimal F to octal'
						},
						{
							formula: '=HEX2OCT("F", 4)',
							result: '0017',
							comment: 'converts hexadecimal F to octal with 4 characters'
						}
					]
				}
			}
		},
		OCT2BIN: {
			default: {
				category: 'Engineering',
				description: 'Converts an octal number to binary.',
				inlineDescription: 'Converts an octal number to binary.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The octal number to convert.',
						optional: false
					},
					{
						type: '',
						name: 'Places',
						description: 'The number of characters to use for returned value. If value has less characters then it is padded with leading zeros.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The binary number or a #NUM! [error](../../other#error-codes) if given number is not a valid octal number. The #VALUE! [error](../../other#error-codes) is returned if specified places is not numeric or negative.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=OCT2BIN(3)',
							result: '11',
							comment: 'converts octal 3 to binary'
						},
						{
							formula: '=OCT2BIN(3, 4)',
							result: '0011',
							comment: 'converts octal 3 to binary with 4 characters'
						}
					]
				}
			}
		},
		OCT2DEC: {
			default: {
				category: 'Engineering',
				description: 'Converts an octal number to decimal.',
				inlineDescription: 'Converts an octal number to decimal.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The octal number to convert.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The decimal number or a #NUM! [error](../../other#error-codes) if given number is not a valid octal number.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=OCT2DEC(54)',
							result: '44',
							comment: 'converts octal 54 to decimal'
						}
					]
				}
			}
		},
		OCT2HEX: {
			default: {
				category: 'Engineering',
				description: 'Converts an octal number to hexadecimal.',
				inlineDescription: 'Converts an octal number to hexadecimal.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'The octal number to convert.',
						optional: false
					},
					{
						type: '',
						name: 'Places',
						description: 'The number of characters to use for returned value. If value has less characters then it is padded with leading zeros.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The hexadecimal number or a #NUM! [error](../../other#error-codes) if given number is not a valid octal number. The #VALUE! [error](../../other#error-codes) is returned if specified places is not numeric or negative.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=OCT2HEX(100)',
							result: '40',
							comment: 'converts octal 100 to hexadecimal'
						},
						{
							formula: '=OCT2HEX(100, 4)',
							result: '0040',
							comment: 'converts octal 100 to hexadecimal with 4 characters'
						}
					]
				}
			}
		}
	},
};
