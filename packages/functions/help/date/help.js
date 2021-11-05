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
		DATE: {
			default: {
				category: 'Date',
				description: 'Returns the serial number which represents the date for given years, months and days.',
				inlineDescription: 'Converts a date specified by given years, months and days to a corresponding serial number',
				arguments: [
					{
						type: '',
						name: 'Years',
						description: 'A number which specifies years',
						optional: false
					},
					{
						type: '',
						name: 'Months',
						description: 'A number which specifies months',
						optional: false
					},
					{
						type: '',
						name: 'Days',
						description: 'A number which specifies days',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The corresponding date as serial number or an [Error Code](../../other#error-codes)'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DATE(2018, 5, 18)',
							result: '43238',
							comment: 'The given date value represents the 18th of May, 2018'
						}
					]
				}
			}
		},
		DATEVALUE: {
			default: {
				category: 'Date',
				description: 'Converts date given as text to a serial number that Streamsheets recognizes as a date.',
				inlineDescription: 'Converts a date specified by given text to a serial number',
				arguments: [
					{
						type: '',
						name: 'DateText',
						description: 'Date string to convert.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The corresponding serial number defining the amount of days since 01.01.1900 or an [Error Code](../../other#error-codes)'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DATEVALUE("18.5.2018")',
							result: '43238',
							comment: 'The number to the left of the decimal define the days since 01.01.1900. The number to the right of the decimal define the fraction of the day.'
						}
					]
				}
			}
		},
		DAY: {
			default: {
				category: 'Date',
				description: 'Returns the day of the month of the date value.',
				inlineDescription: 'Returns the day of the time value',
				arguments: [
					{
						type: '',
						name: 'DateValue',
						description: 'Insert a valid timestamp format or a cell reference to a timestamp. A timestamp consists out of two numbers. The number to the left of the decimal define the days since 01.01.1900. The number to the right of the decimal define the fraction of the day.',
						optional: false
					},
					{
						type: '',
						name: 'Round',
						description: 'Defines if value should be rounded. Default is true.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Day of month evaluated from date value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DAY(43238)',
							result: '18',
							comment: 'The given date value represents the 18th of May, 2018'
						},
						{
							formula: '=DAY(43930.999999, true)',
							result: '10',
							comment: 'Rounded to 10'
						},
						{
							formula: '=DAY(43930.999999, false)',
							result: '9',
							comment: 'Same input value as before but no rounding applied'
						}
					]
				}
			}
		},
		EXCEL2JSONTIME: {
			default: {
				category: 'Date',
				description: 'Converts a serial date to an ISO 8601 date of following format: YYYY-MM-DDThh:mm:ss.sssZ A serial date is recognizes as a date by Streamsheets. You can get a serial date by using NOW().',
				inlineDescription: 'Converts a date represented by given serial number to a JSON ISO 8601 date string',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'A serial date which contains a complete date representation.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'An ISO 8601 date string.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=EXCEL2JSONTIME(15453.767864710648)',
							result: '2012-04-23T18:25:43.511Z',
							comment: 'The given serial date represents the 23th of April, 2012, 18:24.'
						}
					]
				}
			}
		},
		HOUR: {
			default: {
				category: 'Date',
				description: 'Returns the hour of the date value.',
				inlineDescription: 'Returns the hour of the time value',
				arguments: [
					{
						type: '',
						name: 'DateValue',
						description: 'Insert a valid timestamp format or a cell reference to a timestamp. A timestamp consists out of two numbers. The number to the left of the decimal define the days since 01.01.1900. The number to the right of the decimal define the fraction of the day.',
						optional: false
					},
					{
						type: '',
						name: 'Round',
						description: 'Defines if value should be rounded. Default is true.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Hour evaluated from date value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=HOUR(43238.5)',
							result: '12',
							comment: 'The given date value represents the 18th of May, 2018, 12:00'
						},
						{
							formula: '=HOUR(43930.999999, true)',
							result: '0',
							comment: 'Rounded to 0'
						},
						{
							formula: '=HOUR(43930.999999, false)',
							result: '23',
							comment: 'Same as before but prevent rounding'
						}
					]
				}
			}
		},
		JSONTIME2EXCEL: {
			default: {
				category: 'Date',
				description: 'Converts an ISO 8601 date string to a serial date. A serial date is recognizes as a date by Streamsheets. You can get a serial date by using NOW().',
				inlineDescription: 'Converts given date, which must be in JSON ISO 8601 format, to a serial number',
				arguments: [
					{
						type: '',
						name: 'text',
						description: 'An ISO 8601 date string of following format: YYYY-MM-DDThh:mm:ss.sssZ. **Note:** minutes, seconds and milliseconds are optional and single digits are allowed.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'A serial date representing the specified date string.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=JSONTIME2EXCEL(2012-04-23T18:25:43.511Z)',
							result: '15453.767864710648',
							comment: 'The given ISO date as serial date.'
						}
					]
				}
			}
		},
		MINUTE: {
			default: {
				category: 'Date',
				description: 'Returns the minute of the date value.',
				inlineDescription: 'Returns the minute of the time value',
				arguments: [
					{
						type: '',
						name: 'DateValue',
						description: 'Insert a valid timestamp format or a cell reference to a timestamp. A timestamp consists out of two numbers. The number to the left of the decimal define the days since 01.01.1900. The number to the right of the decimal define the fraction of the day.',
						optional: false
					},
					{
						type: '',
						name: 'Round',
						description: 'Defines if value should be rounded. Default is true.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Minute evaluated from date value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=MINUTE(43238.5)',
							result: '0',
							comment: 'The given date value represents the 18th of May, 2018, 12:00'
						},
						{
							formula: '=MINUTE(43930.999999, true)',
							result: '0',
							comment: 'Rounded to 0'
						},
						{
							formula: '=MINUTE(43930.999999, false)',
							result: '59',
							comment: 'Same as before but prevent rounding'
						}
					]
				}
			}
		},
		MONTH: {
			default: {
				category: 'Date',
				description: 'Returns the month of the date value.',
				inlineDescription: 'Returns the month of the time value',
				arguments: [
					{
						type: '',
						name: 'DateValue',
						description: 'Insert a valid timestamp format or a cell reference to a timestamp. A timestamp consists out of two numbers. The number to the left of the decimal define the days since 01.01.1900. The number to the right of the decimal define the fraction of the day.',
						optional: false
					},
					{
						type: '',
						name: 'Round',
						description: 'Defines if value should be rounded. Default is true.',
						optional: true
					}
				],
				return: {
					type: '',
					description: '=Month evaluated from date value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=MONTH(43238)',
							result: '5',
							comment: 'The given date value represents the 18th of May, 2018'
						},
						{
							formula: '=MONTH(39447.99999422, true)',
							result: '1',
							comment: 'Rounded to 1'
						},
						{
							formula: '=MONTH(39447.99999422, false)',
							result: '12',
							comment: 'Same input value as before but no rounding applied'
						}
					]
				}
			}
		},
		MSTOSERIAL: {
			default: {
				category: 'Date',
				description: 'Converts the given elapsed milliseconds, since UNIX epoch time, to a serial date value. A serial date is recognized as a date by Streamsheets.',
				inlineDescription: 'Converts the given elapsed milliseconds to a date value',
				arguments: [
					{
						type: '',
						name: 'TimeValue',
						description: 'Milliseconds since UNIX epoch time (1st of January 1970).',
						optional: false
					},
					{
						type: '',
						name: 'UTC',
						description: 'Boolean to specify if conversion should respect locale timezone, i.e. local timezone offset is added. Defaults to FALSE.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Date value deducted from milliseconds.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=MSTOSERIAL(1021072743648)',
							result: '37386.97157',
							comment: 'The given date value represents the 10th of May, 2002, 23:19.'
						},
						{
							formula: '=MSTOSERIAL(1021065543648, TRUE)',
							result: '37386.97157',
							comment: 'Same result as before but converts from UTC milliseconds to local german time.'
						}
					]
				}
			}
		},
		NOW: {
			default: {
				category: 'Date',
				description: 'Returns the current date value.',
				inlineDescription: 'Returns the current local time',
				return: {
					type: '',
					description: 'Current date value. The number to the left of the decimal define the days since 1.1.1900. The number to the right of the decimal define the fraction of the day.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=NOW()',
							result: '43248.70731',
							comment: 'The value represents the 28th of May, 2018 at 4:58 PM'
						}
					]
				}
			}
		},
		SECOND: {
			default: {
				category: 'Date',
				description: 'Returns the second of the date value.',
				inlineDescription: 'Returns the seconds of the time value',
				arguments: [
					{
						type: '',
						name: 'DateValue',
						description: 'Insert a valid timestamp format or a cell reference to a timestamp. A timestamp consists out of two numbers. The number to the left of the decimal define the days since 01.01.1900. The number to the right of the decimal define the fraction of the day.',
						optional: false
					},
					{
						type: '',
						name: 'Round',
						description: 'Defines if value should be rounded. Default is true.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Second evaluated from date value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=SECOND(43238.5)',
							result: '0',
							comment: 'The given date value represents the 18th of May, 2018, 12:00'
						},
						{
							formula: '=SECOND(43930.999999, true)',
							result: '0',
							comment: 'Rounded to 0'
						},
						{
							formula: '=SECOND(43930.999999, false)',
							result: '59',
							comment: 'Same as before but prevent rounding'
						}
					]
				}
			}
		},
		SERIALTOMS: {
			default: {
				category: 'Date',
				description: 'Converts the given serial date to the elapsed milliseconds since 1st of January 1900. A serial date is recognized as a date by Streamsheets. You can get a serial date by using NOW().',
				inlineDescription: 'Converts the given date to the elapsed milliseconds',
				arguments: [
					{
						type: '',
						name: 'Date',
						description: 'Insert a valid serial timestamp or a cell reference to a serial timestamp. A serial timestamp consists out of two numbers. The number to the left of the decimal defines the days since 01.01.1900. The number to the right of the decimal defines the fraction of the day.',
						optional: false
					},
					{
						type: '',
						name: 'UTC',
						description: 'Boolean to specify if conversion should respect locale timezone, i.e. local timezone offset is subtracted. Defaults to FALSE.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Elapsed milliseconds as a number deducted from the DateValue.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=SERIALTOMS(37386.97157)',
							result: '1021072743648',
							comment: 'The given date value represents the 10th of May, 2002, 23:19.'
						},
						{
							formula: '=SERIALTOMS(37386.97157, TRUE)',
							result: '1021065543648',
							comment: 'Same as before but respects local german timezone leading to 10th of May, 2002, 21:19.'
						},
						{
							formula: '=SERIALTOMS(NOW(), TRUE)',
							result: '1628585618164',
							comment: 'Current time in UTC as for local german time 10.08.2021, 10:53.'
						}
					]
				}
			}
		},
		TIME: {
			default: {
				category: 'Date',
				description: 'Calculates the serial number which corresponds to the time specified by given hours, minutes and seconds',
				inlineDescription: 'Calculates the serial number which corresponds to a time specified by given hours, minutes and seconds',
				arguments: [
					{
						type: '',
						name: 'Hours',
						description: 'A number which specifies hours',
						optional: false
					},
					{
						type: '',
						name: 'Minutes',
						description: 'A number which specifies minutes',
						optional: false
					},
					{
						type: '',
						name: 'Seconds',
						description: 'A number which specifies seconds',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'A serial number value which corresponds to specified time.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=TIME(12, 0, 0)',
							result: '0.5',
							comment: 'The given time value represents 12:00 AM.'
						}
					]
				}
			}
		},
		TIMEVALUE: {
			default: {
				category: 'Date',
				description: 'Converts time given as text to a corresponding serial number. String to time converter.',
				inlineDescription: 'Converts time given as text to a corresponding serial number',
				arguments: [
					{
						type: '',
						name: 'TimeText',
						description: 'A text which represents a time value.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'A serial number value which corresponds to specified time.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=TIMEVALUE("12:00 AM")',
							result: '0.5',
							comment: 'The number to the left of the decimal define the days since 1.1.1900. The number to the right of the decimal define the fraction of the day.'
						}
					]
				}
			}
		},
		WEEKDAY: {
			default: {
				category: 'Date',
				description: 'Returns the weekday in form of a number (1 (sunday) - 7 (saturday)) of the date value.',
				inlineDescription: 'Returns the week day of the time value',
				arguments: [
					{
						type: '',
						name: 'DateValue',
						description: 'The number to the left of the decimal define the days since 1.1.1900. The number to the right of the decimal define the fraction of the day.',
						optional: false
					},
					{
						type: '',
						name: 'Round',
						description: 'Defines if value should be rounded. Default is true.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Weekday evaluated from date value. Counting from 1, representing sunday, to 7, representing saturday.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=WEEKDAY(43238)',
							result: '6',
							comment: 'The given date value represents the 18th of May, 2018, which was a friday.'
						},
						{
							formula: '=WEEKDAY(43930.999999, true)',
							result: '6',
							comment: 'Rounded to 6'
						},
						{
							formula: '=WEEKDAY(43930.999999, false)',
							result: '5',
							comment: 'Same input value as before but no rounding applied'
						}
					]
				}
			}
		},
		YEAR: {
			default: {
				category: 'Date',
				description: 'Returns the year of the date value.',
				inlineDescription: 'Returns the year of the date value',
				arguments: [
					{
						type: '',
						name: 'DateValue',
						description: 'Insert a valid timestamp format or a cell reference to a timestamp. A timestamp consists out of two numbers. The number to the left of the decimal define the days since 01.01.1900. The number to the right of the decimal define the fraction of the day.',
						optional: false
					},
					{
						type: '',
						name: 'Round',
						description: 'Defines if value should be rounded. Default is true.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Year evaluated from date value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=YEAR(43238)',
							result: '2018',
							comment: 'The given date value represents the 18th of May, 2018'
						},
						{
							formula: '=YEAR(39447.99999422, true)',
							result: '2008',
							comment: 'Rounded to 2008'
						},
						{
							formula: '=YEAR(39447.99999422, false)',
							result: '2007',
							comment: 'Same input value as before but no rounding applied'
						}
					]
				}
			}
		}
	},
};
