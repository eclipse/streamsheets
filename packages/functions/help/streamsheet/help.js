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
		ARRAY: {
			default: {
				category: 'Streamsheet',
				description: 'This function can be used to efficiently add array items to a message. Creates a JSON array entry using the given keys and values. If the range has one row or column, one array entry for each cell is created. If there are two columns or rows, a nested array (array containing a subarray) will be created. Note that if both nest and flat parameters are set to true one can use range instead.',
				inlineDescription: 'This function can be used to efficiently add array items to a message.',
				arguments: [
					{
						type: '',
						name: 'Range',
						description: 'Source Range to retrieve data from',
						optional: false
					},
					{
						type: '',
						name: 'Nest',
						description: 'Direction on how to nest items, if range has more than one row or column. FALSE to nest by column and TRUE to nest by row. Default is TRUE.',
						optional: true
					},
					{
						type: '',
						name: 'Flat',
						description: 'If this Argument is supplied (any value works!) the returned Array is always nested, even if only one row or column is specified. If Argument is missing than the returned array is only nested if there are more than one row or column.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Comma separated list of array items.'
				},
				examples: {
					infoStart: '',
					infoEnd: '\n:::tip\n  If you want to create an Outbox array step by step, you can use "-1" as last outbox data path to automatically add a new array element to the existing outbox message. `=WRITE(OUTBOXDATA("Message";"data";-1);JSON(B1:C5);)` \n:::\n ',
					formulas: [
						{
							formula: '=WRITE(OUTBOXDATA("Message", "NewItem"), ARRAY(A2:B5, FALSE), "Array") with the following cell content: <br /> <img src={require("../../_images/ARRAY1.png").default} width="50%"/>',
							result: '<img src={require("../../_images/ARRAY2.png").default} width="100%"/>',
							comment: 'Appending an array to a message. <br /> Since Nest is set to FALSE, the array items are created by columns <br /> leading to two array entries. The two entries contain <br /> the elements from the rows top to bottom. <br /> The message content will look as follows'
						},
						{
							formula: '=WRITE(OUTBOXDATA("Message","NewItem"),<br /> ARRAY(A2:A5,FALSE),"Array") =WRITE(OUTBOXDATA("Message","NewItem2"),<br /> ARRAY(B2:B5,FALSE,TRUE),"Array")<br /> <img src={require("../../_images/nested.png").default} width="50%"/>',
							result: '<img src={require("../../_images/nestedout.png").default} width="100%"/>',
							comment: 'Example usage of the nested parameter.'
						}
					]
				}
			}
		},
		AWAIT: {
			default: {
				category: 'Streamsheet',
				description: 'Pauses sheet calculation until all specified requests resolve. Please refer to AWAIT.ONE too.',
				inlineDescription: 'Pauses sheet calculation until all specified requests resolve.',
				arguments: [
					{
						type: '',
						name: 'CellReference1...CellReferenceN',
						description: 'A list of cell-references or cell-ranges containing the requests to wait for.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE or an [error](../../other#error-codes) if a cell reference is not valid.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: 'AWAIT(A1)',
							comment: 'Waits for the request in A1 to resolve'
						},
						{
							formula: 'AWAIT(A1, C4, F8)',
							comment: 'Waits for all requests to resolve'
						},
						{
							formula: 'AWAIT(A1, B2:C3)',
							comment: 'Waits for the request in A1 and all requests in specified range to resolve'
						}
					]
				}
			}
		},
		'AWAIT.ONE': {
			default: {
				category: 'Streamsheet',
				description: 'Pauses sheet calculation until at least one of specified requests resolves. Please refer to AWAIT too.',
				inlineDescription: 'Pauses sheet calculation until at least one of specified requests resolves.',
				arguments: [
					{
						type: '',
						name: 'CellReference1...CellReferenceN',
						description: 'A list of cell-references or cell-ranges containing the requests to wait for.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE or an [error](../../other#error-codes) if a cell reference is not valid.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: 'AWAIT.ONE(A1)',
							comment: 'Waits for the request in A1 to resolve'
						},
						{
							formula: 'AWAIT.ONE(A1, C4, F8)',
							comment: 'Waits for one request to resolve'
						},
						{
							formula: 'AWAIT.ONE(A1, B2:C3)',
							comment: 'Waits for request in A1 and or one of the requests in specified range to resolve'
						}
					]
				}
			}
		},
		BREAK: {
			license: 'enterprise',
			default: {
				category: 'Streamsheet',
				description: 'Immediately stops traversing a JSON object via [```JSON.PROCESS()```](./jsonprocess.md).',
				inlineDescription: 'Immediately stops traversing a JSON object via JSON.PROCESS().',
				return: {
					type: '',
					description: 'TRUE or an [error](../../other#error-codes) value.'
				},
				examples: {
					infoStart: 'Traverse only first key-value pair of following JSON\n\n ``` A1: {"name": "foo", "age": 42 } \nA2: =CONCAT(A2, A4, "-") \nA3: =CONCAT(A3, B3, "-") \nA4: =BREAK() \nA5: =JSON.PROCESS(JSON(A1), B3, A2:A4) \n``` ',
					infoEnd: '',
					formulas: [
						{
							formula: '=BREAK()',
							result: 'TRUE',
							comment: 'Cells A2 and A3 contain only first key-value pair, namely ```-name-``` and ```-foo-``` respectively.'
						}
					]
				}
			}
		},
		CALC: {
			default: {
				category: 'Streamsheet',
				description: 'Recalculates streamsheet without doing a complete streamsheet step. Note: this function should not be used in a cell directly. Rather it is intended to be used as a parameter to drawing functions, e.g. like ONCLICK().',
				inlineDescription: 'Recalculates streamsheet without doing a complete streamsheet step.',
				return: {
					type: '',
					description: 'Nothing.'
				}
			}
		},
		CLEARCELLS: {
			default: {
				category: 'Streamsheet',
				description: 'Removes value, formula or format of cells in specified range.',
				inlineDescription: 'Removes value, formula or format of cells in specified range.',
				arguments: [
					{
						type: '',
						name: 'Range',
						description: 'Range of cells to clear.',
						optional: false
					},
					{
						type: '',
						name: 'Type',
						description: 'Number to specify what to clear. Note: a combination of type numbers is supported too. <br />Options (Defaults to 1):<br />1 : Clear cell value<br />2 : Clear cell formula',
						optional: true
					},
				],
				return: {
					type: '',
					description: 'TRUE on success or an [error](../../other#error-codes) code otherwise.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=CLEARCELLS(A1:B2)',
							result: 'TRUE',
							comment: 'Clears the value of each cell in range A1:B1.'
						},
						{
							formula: '=CLEARCELLS(A1:B2, 1)',
							result: 'TRUE',
							comment: 'Same as before.'
						},
						{
							formula: '=CLEARCELLS(A1:B2, 3)',
							result: 'TRUE',
							comment: 'Clears value and formula of each cell in range A1:B1.'
						},
						{
							formula: '=CLEARCELLS(A1:B2, 7)',
							result: 'TRUE',
							comment: 'Deletes all cells in range A1:B1.'
						}
					]
				}
			}
		},
		'COLOR.CONVERT': {
			default: {
				category: 'Streamsheet',
				description: 'Converts a given color value to another color format. Currently following color formats are supported: CMYK, HEX, HSL, HSV and RGB.',
				inlineDescription: 'Converts a given color value to another color format.',
				arguments: [
					{
						type: '',
						name: 'Color',
						description: 'A string specifying the color value to convert.',
						optional: false
					},
					{
						type: '',
						name: 'FromColor',
						description: 'A color format string which matches given color value. One of CMYK, HEX, HSL, HSV or RGB.',
						optional: false
					},
					{
						type: '',
						name: 'ToColor',
						description: 'A color format string which defines resulting color value. One of CMYK, HEX, HSL, HSV or RGB.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'String, the converted color value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=COLOR.CONVERT("128,128,128", "RGB", "CMYK")',
							result: '"0,0,0,50"',
							comment: 'CMYK color value'
						},
						{
							formula: '=COLOR.CONVERT("0CF030", "HEX", "HSV")',
							result: '"129,95,94"',
							comment: 'HSV color value'
						}
					]
				}
			}
		},
		CONTINUE: {
			default: {
				category: 'Streamsheet',
				description: 'Continue current calculation at given cell. Note that if specified cell is before current cell the calculation is continued on next step. Normally a Streamsheet is calculated from left to right and top to bottom. Using CONTINUE you can jump within the calculation logic.',
				inlineDescription: 'Continue current calculation at given cell.',
				arguments: [
					{
						type: '',
						name: 'Cell',
						description: 'Target cell of CONTINUE.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE, if successful, otherwise [error](../../other#error-codes) code.'
				},
				examples: {
					infoStart: '',
					infoEnd: '\n:::warning\n Be careful, when using CONTINUE, as you can define an endless loop using this function. \n:::\n',
					formulas: [
						{
							formula: '=CONTINUE(B1)',
							result: 'TRUE',
							comment: 'The step stops at the CONTINUE() function, jumps back to B1 and starts the next step at B1.'
						}
					]
				}
			}
		},
		COPYVALUES: {
			default: {
				category: 'Streamsheet',
				description: 'Copies the values from the given source range to the target range. Beware that only the values are copied and not formulas. If the target range is a multiple of the source range, the target range is filled repeatedly with the source values.',
				inlineDescription: 'Copies the values from the given source range to the target range.',
				arguments: [
					{
						type: '',
						name: 'SourceRange',
						description: 'Source Range to retrieve data from',
						optional: false
					},
					{
						type: '',
						name: 'TargetRange',
						description: 'Target Range to copy values to. If Range smaller or bigger as Source Range values will be added accordingly (less input or multiple input).',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE, if successful.'
				},
				examples: {
					infoStart: '',
					infoEnd: '\n:::warning\n Only the values will be moved. Formulas will be removed. \n:::\n',
					formulas: [
						{
							formula: '=COPYVALUES(A2:B2,A4:B4) <br /> <img src={require("../../_images/COPYVALUES1.png").default} width="60%"/>',
							result: 'TRUE',
							comment: '<img src={require("../../_images/COPYVALUES2.png").default} width="60%"/>'
						}
					]
				}
			}
		},
		COUNTER: {
			default: {
				category: 'Streamsheet',
				description: 'Increments or decrements a cell value by specified step amount. The initial value is defined by "Start" parameter. An optional "End" parameter can be set to define a lower or upper bound. Furthermore an optional "Reset" flag can be used to restart counter if its value evaluates to TRUE.',
				inlineDescription: 'Increments or decrements a cell value by specified step amount.',
				arguments: [
					{
						type: '',
						name: 'Start',
						description: 'A number to initialize the counter with.',
						optional: false
					},
					{
						type: '',
						name: 'Step',
						description: 'Number which specifies the increment (positive number) or decrement (negative number) steps.',
						optional: false
					},
					{
						type: '',
						name: 'End',
						description: 'Number or Condition which defines upper or lower bound.',
						optional: true
					},
					{
						type: '',
						name: 'Reset',
						description: 'If it evaluates to TRUE the counter is reset to Start. Defaults to FALSE. Since immediately resets if TRUE, mostly used as a condition or reference on a condition.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Number'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=COUNTER(2, 2)',
							result: '2',
							comment: 'Will initialize counter with 2 and increment by 2 on each step, i.e.: 2, 4, 6,...'
						},
						{
							formula: '=COUNTER(10, -2)',
							result: '10',
							comment: 'Will initialize counter with 10 and decrement by -2 on each step, i.e.: 10, 8, 6,...'
						},
						{
							formula: '=COUNTER(2, 1, ,GETSTEP() % 2 &lt;&gt; 0)',
							result: '2',
							comment: 'Will initialize counter with 2 and resets it on each even step count, i.e.: 2, 3, 2, 3,...'
						},
						{
							formula: '=COUNTER(2, 2, 10)',
							result: '2',
							comment: 'Will count from 2 to 10 in steps of 2, i.e. 2, 4, 6, 8, 10'
						},
						{
							formula: '=COUNTER(10, -2, 0)',
							result: '10',
							comment: 'Will count from 10 down to 0 in steps of -2, i.e. 10, 8, ..., 0'
						},
						{
							formula: '=COUNTER(10, -2, 26)',
							result: '10',
							comment: 'Will not decrement since lower bound is greater then start value.'
						}
					]
				}
			}
		},
		DELETE: {
			default: {
				category: 'Streamsheet',
				description: 'Delete a message or message content based on the key. The key is provided by using one of the following functions. INBOX, OUTBOX, INBOXDATA, INBOXMETADATA, OUTBOXMETADATA, OUTBOXDATA.',
				inlineDescription: 'Delete a message or message content based on the key.',
				arguments: [
					{
						type: '',
						name: 'Key',
						description: 'Key of the to be deleted message or message content.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE, if successful.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DELETE(INBOX("S1", "Message"))',
							result: 'TRUE',
							comment: 'Message has to be an existing message in the Inbox in a StreamSheet named S1.'
						}
					]
				}
			}
		},
		DELETECELLS: {
			default: {
				category: 'Streamsheet',
				description: 'Delete cell values in given range. Is able to delete itself.',
				inlineDescription: 'Delete cell values in given range. Is able to delete itself.',
				arguments: [
					{
						type: '',
						name: 'Range',
						description: 'Range of cells to delete.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE, if successful.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DELETECELLS(A1:B2)',
							result: 'TRUE',
							comment: ''
						}
					]
				}
			}
		},
		DICTIONARY: {
			default: {
				category: 'Streamsheet',
				description: 'Creates a JSON Object using the given keys and values.',
				inlineDescription: 'Creates a JSON Object using the given keys and values.',
				arguments: [
					{
						type: '',
						name: 'Range',
						description: 'Range providing the source data, that will be used for the JSON. The left or top cells will feed the keys and the bottom or right the values.',
						optional: false
					},
					{
						type: '',
						name: 'Horizontal',
						description: 'FALSE, if keys are aligned vertical (Default), TRUE if horizontal.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if successful.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=WRITE(OUTBOXDATA("Message", "NewItem"), DICTIONARY(A2:B5), FALSE), "Dictionary") with the following cell content: <br /> <img src={require("../../_images/DICTIONARY1.png").default} width="50%"/>',
							result: 'Appending an object to a message. The message content will look as follows <br /> <img src={require("../../_images/DICTIONARY2.png").default} width="50%"/>'
						},
						{
							formula: '=WRITE(OUTBOXDATA("Message", "NewItem"), DICTIONARY(A2:A5,FALSE),"DICTIONARY") <br />=WRITE(OUTBOXDATA("Message","NewItem2"),<br /> DICTIONARY(B2:B5,FALSE,TRUE),"Dictionary")<br /> <img src={require("../../_images/DICTIONARY3.png").default} width="70%"/>',
							result: '<br /> <img src={require("../../_images/DICTIONARY4.png").default} width="50%"/>'
						}
					]
				}
			}
		},
		'EDGE.DETECT': {
			default: {
				category: 'Streamsheet',
				description: 'Detects if the result of a given condition changed from FALSE to TRUE. This functions detects if a given condition evaluates from FALSE to TRUE. Only in this case TRUE is returned. In all other cases, i.e. TRUE to FALSE, FALSE to FALSE or TRUE to TRUE, EDGE.DETECT returns FALSE. If the function is processed for the first time it is assumed that a previous condition result was FALSE. That means that if the condition immediately evaluates to TRUE, this function returns TRUE. The behaviour of this function can be influenced by two optional parameters, namely *Period* and *Delay*. *Period* specifies for how long this function still returns TRUE, even if no changes were detected. On the other hand *Delay* specifies for how long this function returns FALSE, after a change was detected. The default value of both parameters is 0, meaning they have no effect. If both parameters are set and greater zero, *Period* starts after *Delay*. It is not recommended to use EDGE.DETECT within another function.',
				inlineDescription: 'Detects if the result of a given condition changed from FALSE to TRUE.',
				arguments: [
					{
						type: '',
						name: 'Condition',
						description: 'Value or formula that returns a boolean value.',
						optional: false
					},
					{
						type: '',
						name: 'Period',
						description: 'Time in milliseconds, where the result of this formula still is TRUE. Starting after an optional delay. Defaults to 0.',
						optional: true
					},
					{
						type: '',
						name: 'Delay',
						description: 'Delay in Milliseconds, where the result of this formula still is FALSE even if condition change was detected. Defaults to 0.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if condition result changes from FALSE to TRUE or FALSE otherwise.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=EDGE.DETECT(TRUE, 0)',
							result: 'TRUE',
							comment: 'period has no effect'
						},
						{
							formula: '=EDGE.DETECT(TRUE, 1000)',
							result: 'TRUE',
							comment: 'returns TRUE for all cycles which run within next second'
						},
						{
							formula: '=EDGE.DETECT(TRUE, 1000, 1000)',
							result: 'FALSE',
							comment: 'returns TRUE after a delay of 1 second and then keeps returning TRUE for one second'
						}
					]
				}
			}
		},
		EXECUTE: {
			default: {
				category: 'Streamsheet',
				description: 'Triggers the recalculation of another `Streamsheet`. The executed Sheet will only be executed if Streamsheet settings of executed Sheet allow execution. Calculate Streamsheet "On Execute".',
				inlineDescription: 'Triggers the recalculation of another `Streamsheet`.',
				arguments: [
					{
						type: '',
						name: 'Streamsheet',
						description: 'Name of Streamsheet to trigger. (Put the name of the Streamsheet in quotes e.g. "S1")',
						optional: false
					},
					{
						type: '',
						name: 'Repeat',
						description: 'Number of repetitions. If larger than 1 (Default), the execute function will be executed multiple times',
						optional: true
					},
					{
						type: '',
						name: 'JSON',
						description: 'JSON to use as message data to process, when executing.',
						optional: true
					},
					{
						type: '',
						name: 'Selector',
						description: 'Selector to use when selecting a message from the inbox for processing.',
						optional: true
					}
				],
				return: {
					type: '',
					description: '**NOTE:** if the execution of the triggered StreamSheet is stopped via the RETURN function, its result is returned instead.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=EXECUTE("S2")',
							result: 'TRUE',
							comment: 'Triggers the calculation of a second Streamsheet, called "S2".'
						}
					]
				}
			}
		},
		FEEDINBOX: {
			default: {
				category: 'Streamsheet',
				description: 'This function feeds the inbox of a Streamsheet within the same App. The Streamsheet Settings must be set to "On Data Arrival", to trigger the calculation. This way a dependent Streamsheet can be triggered in two different ways. Either using the FEEDINBOX() function, which leads to an "asynchronous" call, since the message is just added to the inbox and waits for the next step. Or using EXECUTE(), which will lead to a direct execution (synchronous).',
				inlineDescription: 'This function feeds the inbox of a Streamsheet within the same App.',
				arguments: [
					{
						type: '',
						name: 'JSON',
						description: 'A key to a json object, defined by JSON, DICTIONARY, READ, SUBTREE, INBOX or OUTBOX.',
						optional: false
					},
					{
						type: '',
						name: 'Target',
						description: 'A location sheet name where the JSON will be placed in the inbox.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE, if successful.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=FEEDINBOX(DICTIONARY(A2:B5), "S1") <br /> <img src={require("../../_images/FEEDINBOX1.png").default} width="50%"/>',
							result: 'Appending an object to a message. The message content will look as follows <br /> <img src={require("../../_images/FEEDINBOX2.png").default} width="50%"/>'
						}
					]
				}
			}
		},
		GETCYCLE: {
			default: {
				category: 'Streamsheet',
				description: 'Returns the Streamsheet steps done in repeat-calculation mode.\n\n:::info\n This function is only valid for Streamsheets which settings are defined to calculate repeatedly. If this is not the case this function always returns 1. \n:::\n To get the number of times a Streamsheet was processed refer to getstep and to get the steps for a Streamsheet which was repeatedly triggered by execute refer to repeatindex',
				inlineDescription: 'Returns the Streamsheet steps done in repeat-calculation mode.',
				return: {
					type: '',
					description: 'Steps done in repeat-calculation mode or 1 if Streamsheet mode is different.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=GETCYCLE()',
							result: '2'
						}
					]
				}
			}
		},
		GETCYCLETIME: {
			default: {
				category: 'Streamsheet',
				description: 'Returns the current cycle time. The Cycle Time is an overall setting in an App that applies to each Streamsheet within the App. It generally defines how long the system pauses between calculation cycles (in ms).',
				inlineDescription: 'Returns the current cycle time.',
				return: {
					type: '',
					description: 'Current cycle time in milliseconds.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=GETCYCLETIME()',
							result: '1000',
							comment: 'The App is calculating every second.'
						}
					]
				}
			}
		},
		GETEXECUTESTEP: {
			default: {
				category: 'Streamsheet',
				description: 'Returns the number of repetitions of the execute function. EXECUTE triggers the recalculation of another Streamsheet. With the repeat Parameter you can set the number of repetitions. If larger than 1 (Default), the execute function will be executed multiple times.',
				inlineDescription: 'Returns the number of repetitions of the execute function.',
				return: {
					type: '',
					description: 'Current repetition step of the execute function.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=GETEXECUTESTEP()',
							result: '3',
							comment: '=EXECUTE("S2",3)'
						}
					]
				}
			}
		},
		GETMACHINESTEP: {
			default: {
				category: 'Streamsheet',
				description: 'Returns the current step. The machine step is increased either on each machine cycle, i.e. when a machine runs, or on each manually triggered step, i.e. if an App is stopped or paused. To get the steps for a Streamsheet refer to getstep.',
				inlineDescription: 'Returns the current step.',
				return: {
					type: '',
					description: 'Current step.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=GETMACHINESTEP()',
							result: '1'
						}
					]
				}
			}
		},
		GETSTEP: {
			default: {
				category: 'Streamsheet',
				description: 'Returns the current Streamsheet step. \n:::info\n A Streamsheet step is increased only if the Streamsheet is processed, which is not necessarily the case on each App step. \n:::\n To get the steps for an App refer to getmachinestep and to get the steps for Streamsheets which are repeatedly triggered by execute refer to repeatindex.',
				inlineDescription: 'Returns the current Streamsheet step.',
				arguments: [
					{
						type: '',
						name: 'Streamsheet',
						description: 'Define the Streamsheet to retrieve step count from. If not specified affiliated Streamsheet is used.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Current Streamsheet step.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=GETSTEP()',
							result: '1'
						},
						{
							formula: '=GETSTEP("S2")',
							result: '1'
						}
					]
				}
			}
		},
		INBOX: {
			default: {
				category: 'Streamsheet',
				description: 'Creates a key to reference an inbox item. This key is used in functions like DELETE to identify messages inside an inbox.',
				inlineDescription: 'Creates a key to reference an inbox item. ',
				arguments: [
					{
						type: '',
						name: 'Streamsheet',
						description: 'Define the Streamsheet to retrieve message data from. If empty the affiliated Streamsheet is used.',
						optional: true
					},
					{
						type: '',
						name: 'Message',
						description: 'ID of Message to identify. If left empty, the current message in the inbox is used.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Key for the inbox item.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=INBOX("S1")',
							result: '[S1][]',
							comment: 'Returns an identifier that can be used in other Streamsheet functions like DELETE.'
						}
					]
				}
			}
		},
		INBOXDATA: {
			default: {
				category: 'Streamsheet',
				description: 'Creates a JSON key from the given values or range to retrieve data from within a message. This function is normally used in the READ function. INBOXDATA retrieves values from the Data section of a message.',
				inlineDescription: 'Creates a JSON key from the given values or range to retrieve data from within a message.',
				arguments: [
					{
						type: '',
						name: 'Streamsheet',
						description: 'Define the Streamsheet to retrieve inbox data from.',
						optional: false
					},
					{
						type: '',
						name: 'Message',
						description: 'Message to retrieve data from. If left empty, the current message in the inbox is used.',
						optional: false
					},
					{
						type: '',
						name: 'ValuesOrRange',
						description: 'A list of values or a range of cells describing the path to the element path within a JSON structure.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'A string key to provide a path within a message.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=INBOXDATA(,, "Customer", "Name")',
							result: '[P1][][Customer][Name]',
							comment: 'Returns an identifier that can be used in other Streamsheet functions like READ. As Streamsheet and Message are left empty, the current Streamsheet and inbox Message is used.'
						},
						{
							formula: '=INBOXDATA(,, B1:B2)',
							result: '[P1][][Customer][Name]',
							comment: 'Here the values within the cell range B1:B2 ("Customer", "Name") will be used to concatenate the JSON path.'
						},
						{
							formula: '=READ(INBOXDATA(,, "Customer", "Name"), C7, "String")',
							result: 'Name',
							comment: 'The READ function return the last part of the JSON Path. The value of the Message at the given Path will be pushed into cell C7.'
						}
					]
				}
			}
		},
		INBOXMETADATA: {
			default: {
				category: 'Streamsheet',
				description: 'Creates a JSON key from the given values or range to retrieve metadata from within a message. This function is normally used in the READ function. INBOXMETADATA retrieves values from the Metadata section of a message.',
				inlineDescription: 'Creates a JSON key from the given values or range to retrieve metadata from within a message.',
				arguments: [
					{
						type: '',
						name: 'Streamsheet',
						description: 'Streamsheet, where to look for inbox.',
						optional: true
					},
					{
						type: '',
						name: 'Message',
						description: 'Message to retrieve data from. If left empty, the current message in the inbox is used.',
						optional: true
					},
					{
						type: '',
						name: 'ValuesOrRange',
						description: 'A list of values or a range of cells describing the path to the element path within a JSON structure.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'A string key to retrieve data from a message.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=INBOXMETADATA(,,"arrivalTime")',
							result: '[S1][][arrivalTime]',
							comment: 'Returns an identifier that can be used in other Streamsheet functions like READ. As Streamsheet and Message are left empty, the current Streamsheet and inbox Message is used.'
						},
						{
							formula: '=READ(INBOXMETADATA(,,"arrivalTime"),C11,"Number")',
							result: 'arrivalTime',
							comment: 'The READ function return the last part of the JSON Path. The value of the Message at the given Path will be pushed into cell C11. Here we retrieve the arrival time of a message, which is a default Metadata field added to each message.'
						}
					]
				}
			}
		},
		JSON: {
			default: {
				category: 'Streamsheet',
				description: 'A Streamsheet has the possibility to process, generate and accumulate data. Before sending this data, the cells from a data range have to be structured, in order for an App to interpret them correctly. JSON() is paring two columns together to a key and value pair using the JSON Syntax. Alternatively it is possible to specify a text which will be parsed to JSON or use one of the various INBOX/OUTBOX functions to reference an element from a message stored in inbox or outbox respectively. The optional second parameter can be used to convert the resulting JSON object to a textual representation. This function is mostly used within publish functions like: MQTTPUBLISH. The JSON structure supports quotes "". eg. {"Key":"value"}',
				inlineDescription: 'Converts given cell range, text or message element to JSON',
				arguments: [
					{
						type: '',
						name: 'DataRangeOrTextOrInboxOutboxFunction',
						description: 'A data range over at least two columns, only interpreting the first and last column into the JSON object. Or a text which will be evaluated to JSON. Or an INBOX/OUTBOX function to reference an element of a message.',
						optional: false
					},
					{
						type: '',
						name: 'ResultAsText',
						description: 'Set to TRUE to return a textual representation of resulting JSON object. Defaults to FALSE.',
						optional: true
					}
				],
				return: {
					type: '',
					description: '{ JSON } as a placeholder for JSON object or a textual representation, if successful.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=JSON(B6:C8)',
							result: '{ JSON }',
							comment: 'This is the representation of a cell filled with JSON data.'
						},
						{
							formula: '=JSON(B6:C8, TRUE)',
							result: '{"values":{"temperature":16918,"CO2":49}}',
							comment: 'The textual representation of resulting JSON data.'
						},
						{
							formula: '=JSON(C4) with following text in C4: {"values":{"temperature":16918,"CO2":49}}',
							result: '{ JSON }',
							comment: 'This is the representation of a cell filled with JSON data.'
						},
						{
							formula: '=JSON(OUTBOXDATA("MessageId","Customer"))',
							result: '{ JSON }',
							comment: 'This is the representation of a cell filled with JSON data. Internally the cell has a JSON object which represents the "Customer" value from specified outbox message.'
						},
						{
							formula: '=FEEDINBOX(B11,"S1") with B11 JSON(B6:C8)',
							result: '![JSON](../../_images/JSON.PNG)',
							comment: 'In Streamsheet S1 the Inbox will be  filled with the JSON gathered by B11'
						}
					]
				}
			}
		},
		'JSON.PROCESS': {
			license: 'enterprise',
			default: {
				category: 'Streamsheet',
				description: 'Traverses given JSON object and processes each cell in specified cell-range. Before the cell-range is processed the current JSON value is written to defined value cell, whereas the corresponding key is returned from the function itself. A nested JSON can be completely traversed by setting the optional recursive parameter to TRUE. To immediately stop the JSON traversal use [```BREAK()```](./break.md) in processed cell-range.',
				inlineDescription: 'Traverses given JSON object and processes each cell in specified cell-range.',
				arguments: [
					{
						type: '',
						name: 'JSON',
						description: 'A JSON object to process.',
						optional: false
					},
					{
						type: '',
						name: 'ValueCell',
						description: 'Cell-reference to write current JSON value to.',
						optional: false
					},
					{
						type: '',
						name: 'CellRange',
						description: 'Cell-range to process for each JSON value.',
						optional: false
					},
					{
						type: '',
						name: 'Recursive',
						description: 'Specify TRUE to completely traverse a nested JSON object. Defaults to FALSE.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Currently processed JSON key or an [error](../../other#error-codes) value.'
				},
				examples: {
					infoStart: 'Traverse simple JSON and process specified cell-range: \n```\nA1: {"name": "foo", "age": 42 } \nA2: =CONCAT(A2, A4, "-") \nA3: =CONCAT(A3, B3, "-") \n``` ',
					infoEnd: '',
					formulas: [
						{
							formula: '=JSON.PROCESS(JSON(A1), B3, A2:A3)',
							result: 'age',
							comment: 'Processes given cell-range for each JSON key-value pair. When finished A2 contains all the keys (```-name-age-```) and  A3 all the corresponding values (```-foo-42-```)'
						}
					]
				}
			}
		},
		'JSON.RANGE': {
			default: {
				category: 'Streamsheet',
				description: 'Writes the content of given json to a specified cell range. It is recommended, but not a mandatory, to encode passed json with either array, dictionary, range or the json function itself. For better results the encoding type and direction parameters can be specified. Please refer to JSON.VALUE if only a single json value should be extracted.',
				inlineDescription: 'Writes the content of given json to a specified cell range.',
				arguments: [
					{
						type: '',
						name: 'JSON',
						description: 'A json object which data will be written to specified target range.',
						optional: false
					},
					{
						type: '',
						name: 'TargetRange',
						description: 'A cell range to write json data to. If the range size covers only one cell, it will be automatically increased to match content of given json.',
						optional: false
					},
					{
						type: '',
						name: 'Type',
						description: 'A text which describes the function used for encoding. Should be one of ARRAY, DICTIONARY, JSON, JSONROOT or RANGE. Note: the difference beteween JSON and JSONROOT is that JSON traverses the complete json while JSONROOT stops after first level. Defaults to JSON.',
						optional: true
					},
					{
						type: '',
						name: 'Direction',
						description: 'Specify TRUE to align keys vertically for type ARRAY, JSON or JSONROOT and horizontally for type DICTIONARY or RANGE. Note that the result might depends on the direction used to encode given json. Defaults to TRUE.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if no error occurred, otherwise an [error](../../other#error-codes) value.'
				},
				examples: {
					infoStart: 'Below examples assumes following SourceRange:\n\n|  | A | B |\n|---|---|---|\n|1|v1|23|\n|1|v2|42| \n',
					infoEnd: '',
					formulas: [
						{
							formula: '=JSON.RANGE(ARRAY(A1:B2), A5:B6, ”ARRAY”)',
							result: 'Results in: <br /> A5=”v1”, B5=”23” <br /> A6=”v1”, B6=”42”'
						},
						{
							formula: '=JSON.RANGE(DICTIONARY(A1:B2), A5:B6, ”DICTIONARY”,FALSE)',
							result: 'Results in: <br /> A5=”v1”, B5=”23” <br /> A6=”v1”, B6=”42”'
						},
						{
							formula: '=JSON.RANGE(JSON(A1:B2), A5:B6, FALSE)',
							result: 'Results in: <br /> A5=”v1”, B5=”v2” A6=”23”,<br /> B6=”42”'
						},
						{
							formula: '=JSON.RANGE(RANGE(A1:B2), A5:B6, ”RANGE”, FALSE)',
							result: 'Results in: <br /> A5=”v1”, B5=”v2” <br /> A6=”23”, B6=”42”'
						}
					]
				}
			}
		},
		'JSON.TO.XML': {
			license: 'enterprise',
			default: {
				category: 'Streamsheet',
				description: 'Converts given JSON object into an XML text.',
				inlineDescription: 'Converts given JSON object into an XML text.',
				arguments: [
					{
						type: '',
						name: 'JSON',
						description: 'A JSON object to convert.',
						optional: false
					},
					{
						type: '',
						name: 'XMLHeader',
						description: 'Provide a custom header text or specify TRUE to add a standard XML header or FALSE to add no header. Defaults to TRUE.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'A text representing XML or an [error](../../other#error-codes) value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=JSON.TO.XML(JSON(A1))',
							result: '&lt;?xml version="1.0" encoding="utf-8"?&gt;<br/>&lt;name&gt;foo&lt;/name&gt;<br/>&lt;age&gt;42&lt;/age&gt;',
							comment: 'Create an XML from a simple JSON: <br/>```A1: {"name": "foo", "age": 42 }```<br/><br/>JSON keys are used as element tags and their values as element text. A standard xml header is added.'
						},
						{
							formula: '=JSON.TO.XML(JSON(A1), FALSE)',
							result: '&lt;Customer id="1234" version="1.2"&gt;<br/>&lt;name&gt;John&lt;/name&gt;<br/>&lt;/Customer&gt;',
							comment: 'Create an XML with tag attributes (Note: currently only keys with object/array values can have attributes): <br/>```A1: { "Customer id=\'1234\' version=\'1.2\'": { "name": "John" } }```<br/><br/>Attributes are simply listed within the JSON key.'
						},
						{
							formula: '=JSON.TO.XML(JSON(A1), FALSE)',
							result: '&lt;Customer&gt;<br/>&lt;!--a comment inside--&gt;<br/>&lt;name&gt;John&lt;/name&gt;<br/>&lt;/Customer&gt;',
							comment: 'Create an XML with comments: <br/>```A1: { "Customer": { "<!--": "a comment inside", "name": "John" } }```<br/>`<br/>Comments must have a &lt;!-- JSON key'
						},
						{
							formula: '=JSON.TO.XML(JSON(A1), FALSE)',
							result: '&lt;Customers&gt;<br/>&lt;Customer&gt;<br/>&lt;name&gt;John&lt;/name&gt;<br/>&lt;/Customer&gt;<br/>&lt;Customer&gt;<br/>&lt;name&gt;Doe&lt;/name&gt;<br/>&lt;/Customer&gt;<br/>&lt;/Customers&gt;',
							comment: 'Create an XML with list elements: <br/>```A1: { "Customers": { "Customer": [ { "name": "John" }, { "name": "Doe" } ] }```<br/><br/>All objects inside list must be under same JSON key.'
						},
						{
							formula: '=JSON.TO.XML(JSON(A1), B1)',
							result: '&lt;?xml version="1.0" ?&gt;<br/>&lt;name&gt;John&lt;/name&gt;',
							comment: 'Create an XML with custom XML header: <br/>```A1: { "name": "John" }, B1: "<?xml version="1.0" ?>```<br/><br/>A custom header is simply added without any further validation.'
						}
					]
				}
			}
		},
		'JSON.VALUE': {
			default: {
				category: 'Streamsheet',
				description: 'Returns a value from a JSON object. The value to return corresponds to the path specified by given keys. Please refer to JSON.RANGE for writing the complete data of a JSON object to the sheet.',
				inlineDescription: 'Returns a value from a JSON object',
				arguments: [
					{
						type: '',
						name: 'JSON',
						description: 'A JSON object to read value from.',
						optional: false
					},
					{
						type: '',
						name: 'Key1...KeyN',
						description: 'A list of keys which build up a path within given JSON object.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The value at specified path or an error if no JSON object is passed or path is invalid.'
				},
				examples: {
					infoStart: 'Below examples assumes following text in A1:<br/>{"Name": "Peter", "Kids": ["Paul", "Mary"]}} ',
					infoEnd: '',
					formulas: [
						{
							formula: '=JSON.VALUE(JSON(A1),"Customer","Name")',
							result: 'Peter',
							comment: 'Value at Customer.Name'
						},
						{
							formula: '=JSON.VALUE(JSON(A1),"Customer","Kids", 1)',
							result: 'Mary',
							comment: 'Value at Customer.Kids[1]'
						},
						{
							formula: '=JSON.VALUE(JSON(A1),"Customer","Kids", "Name")',
							result: '#NA',
							comment: 'Invalid json path'
						}
					]
				}
			}
		},
		LOOPCOUNT: {
			default: {
				category: 'Streamsheet',
				description: 'Returns the length of specified loop array or #NA if loop is not available or not defined. Used to analyze Inbox loops.',
				inlineDescription: 'Returns the length of specified loop array or #NA if loop is not available or not defined.',
				return: {
					type: '',
					description: 'Number, representing the length of defined loop array.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: 'LOOPCOUNT()',
							result: '3',
							comment: 'If the loop array contains 3 elements.'
						}
					]
				}
			}
		},
		LOOPINDEX: {
			default: {
				category: 'Streamsheet',
				description: 'Returns the current index within processed loop element or #NA  if loop is not available or not defined. Used to analyze Inbox loops. \n:::info\n The index is based to 1. \n:::\n',
				inlineDescription: 'Returns the current index within processed loop element or #NA  if loop is not available or not defined.',
				return: {
					type: '',
					description: 'Number, representing current loop index.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: 'LOOPINDEX()',
							result: '2',
							comment: 'If second loop element is currently processed.'
						}
					]
				}
			}
		},
		MOVEVALUES: {
			default: {
				category: 'Streamsheet',
				description: 'Move values in source range to target range.',
				inlineDescription: 'Move values in source range to target range.',
				arguments: [
					{
						type: '',
						name: 'SourceRange',
						description: 'Range to get values to move from.',
						optional: false
					},
					{
						type: '',
						name: 'TargetRange',
						description: 'Range to move values to. Smaller Target Range leads to the removal of all Source Values, but not in the writing of all. Bigger does not have any further consequences.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE, if no [error](../../other#error-codes).'
				},
				examples: {
					infoStart: '',
					infoEnd: '\n:::warning\n Only the values will be moved. Formulas will be removed. \n:::\n',
					formulas: [
						{
							formula: '=MOVEVALUES(A2:B2,A4:B4) <br /> <img src={require("../../_images/MOVEVALUES1.png").default} width="80%"/>',
							result: 'TRUE',
							comment: '<br /> <img src={require("../../_images/MOVEVALUES2.png").default} width="80%"/>'
						}
					]
				}
			}
		},
		OPENURL: {
			default: {
			category: 'Streamsheet',
				description: 'Opens any given URL. The given URL needs to start with http/https \n:::info\n OPENURL only works in an Event. \n:::\n',
				inlineDescription: 'Opens any given URL. OPENURL only works in an Event.',
				arguments: [
					{
						type: '',
						name: 'URL',
						description: 'URL to open',
						optional: false
					},
					{
						type: '',
						name: 'TAB',
						description: 'TRUE or FALSE. Decides if URL will be opened in new TAB or same TAB. Default = TRUE.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: 'OPENURL("<https://cedalo.com/>")',
							result: 'TRUE',
							comment: 'Opens the cedalo.com page in another Tab.'
						}
					]
				}
			}
		},
		OUTBOX: {
			default: {
				category: 'Streamsheet',
				description: 'Creates a key to reference an outbox message. This key is used in functions like DELETE to identify messages inside an outbox.',
				inlineDescription: 'Creates a key to reference an outbox message.',
				arguments: [
					{
						type: '',
						name: 'Message',
						description: 'ID of Message to identify. If left empty, the current message in the outbox is used.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'A key to identify message.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=OUTBOX("Message")',
							result: '[Message]',
							comment: 'Returns an identifier that can be used in other Streamsheet functions like DELETE.'
						}
					]
				}
			}
		},
		'OUTBOX.GETIDS': {
			default: {
				category: 'Streamsheet',
				description: 'Creates a list with IDs of all messages currently available in the outbox. An optional id filter can be specified to control which IDs to return.',
				inlineDescription: 'Creates a list with IDs of all messages currently available in the outbox.',
				arguments: [
					{
						type: '',
						name: 'IdFilterText',
						description: 'A text to filter IDs. Excel wildcards like * and ? are supported. If not specified the returned list contains the IDs of all messages currently in outbox.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'A list of message IDs.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=OUTBOX.GETIDS()',
							result: '["message.id1", "message.id2"]',
							comment: 'Returns a list with message identifiers that can be used to reference outbox messages.'
						},
						{
							formula: '=OUTBOX.GETIDS("?id2")',
							result: '["message.id2"]',
							comment: 'Returns a list with message identifiers that can be used to reference outbox messages.'
						}
					]
				}
			}
		},
		OUTBOXDATA: {
			default: {
				category: 'Streamsheet',
				description: 'Creates a JSON key from the given values or range to reference data from within a message. This function is normally used in the WRITE function. OUTBOXDATA references values from the Data section of a message.',
				inlineDescription: 'Creates a JSON key from the given values or range to reference data from within a message.',
				arguments: [
					{
						type: '',
						name: 'Message',
						description: 'Message to reference data from.',
						optional: false
					},
					{
						type: '',
						name: 'ValuesOrRange',
						description: 'A list of values or a range of cells describing the path to the element path within a JSON structure.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'A string key to provide a path within a message.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=OUTBOXDATA(“Message, “NewItem”)',
							result: '[Message][Newitem]',
							comment: 'Returns an identifier that can be used in other Streamsheet functions like WRITE.'
						},
						{
							formula: '=OUTBOXDATA(“Message”, B1:B2)',
							result: '[Message][Customer][Name]',
							comment: 'The WRITE function returns the last part of the JSON Path. The value in C7 will be written into the Message at the given JSON Path.'
						},
						{
							formula: '=WRITE(OUTBOXDATA(“Message”,<br />”Output”,-1),JSON(J22:K24),)',
							result: 'Pro tip: If you want to create an array in the Outbox, use -1 as the last OUTBOXDATA() parameter. This way the array will automatically increment starting from 0.',
							comment: '<br /> <img src={require("../../_images/increment.png").default} width="80%"/>'
						}
					]
				}
			}
		},
		OUTBOXMETADATA: {
			default: {
				category: 'Streamsheet',
				description: 'Creates a JSON key from the given values or range to retrieve metadata from within a message. This function is normally used in the READ function. OUTBOXMETADATA retrieves values from the Metadata section of an outbox message.',
				inlineDescription: 'Creates a JSON key from the given values or range to retrieve metadata from within a message.',
				arguments: [
					{
						type: '',
						name: 'MessageID',
						description: 'ID of the message to retrieve data from. If left empty, the current message in the inbox is used.',
						optional: false
					},
					{
						type: '',
						name: 'ValuesOrRange',
						description: 'A list of values or a range of cells describing the path to the element path within a JSON structure.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'A string key to retrieve metadata from a message.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=OUTBOXMETADATA("out1", "arrivalTime")',
							result: '[out1][arrivalTime]',
							comment: 'Returns an identifier that can be used in other Streamsheet functions like READ.'
						},
						{
							formula: '=READ(OUTBOXMETADATA("out1","arrivalTime"),C11,"Number")',
							result: 'arrivalTime',
							comment: 'The READ function returns the last part of the JSON Path. The value of the Message at the given path will be pushed into cell C11. Here we retrieve the arrival time of a message, which is a default Metadata field added to each message.'
						}
					]
				}
			}
		},
		RANGE: {
			default: {
				category: 'Streamsheet',
				description: 'Creates a nested JSON array from specified cell range. Basically this is the same as using array with nested and flat parameter set to true.',
				inlineDescription: 'Creates a nested JSON array from specified cell range.',
				arguments: [
					{
						type: '',
						name: 'Cellrange',
						description: 'Source Range to retrieve data from.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'A nested list of cell values.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=RANGE(A1:A1)',
							result: '[[42]]',
							comment: 'Range defines only one cell, so returned list contains one list with one value.'
						},
						{
							formula: '=RANGE(A1:C1)',
							result: '[[42, 23, 13]]',
							comment: 'Range defines 3 values over 1 row, so returned list contains a list with 3 values.'
						},
						{
							formula: '=RANGE(A1:B2)',
							result: '[[42, 23], [13, 17]]',
							comment: 'Range defines 4 values over 2 rows, so returned list contains 2 lists with 2 values each.'
						}
					]
				}
			}
		},
		READ: {
			default: {
				category: 'Streamsheet',
				description: 'Reads the values from a JSON object using the given key. Mainly used to read inbox payloads.',
				inlineDescription: 'Reads the values from a JSON object using the given key. ',
				arguments: [
					{
						type: '',
						name: 'Key',
						description: 'A key to a data item, that should be read. The key is usually created by using utility functions like INBOXDATA, INBOXMETADATA, OUTBOXMETADATA or OUTBOXDATA. The key consists of the path to the item within the JSON object. Each path element is surrounded by brackets, Depending on the used utility function, you can retrieve data from different sources (e.g. Inbox or Outbox).',
						optional: false
					},
					{
						type: '',
						name: 'TargetCell or Range',
						description: 'Target cell or range to write the resulting value into.',
						optional: true
					},
					{
						type: '',
						name: 'Type',
						description: 'Type of Value. Allowed types are String, Number, Bool/Boolean, Array, Dictionary, Json or Jsonroot. The type defines the color of the target cell. Defaults to Json.',
						optional: true
					},
					{
						type: '',
						name: 'Direction',
						description: 'Specify TRUE to align keys vertically for type ARRAY, JSON or JSONROOT and horizontally for type DICTIONARY or RANGE. Defaults to TRUE.',
						optional: true
					},
					{
						type: '',
						name: 'ErrorOnMissing',
						description: 'If this is set to TRUE #NA! will be returned if no data is available. If set to FALSE last read value will be returned or a default value if none was read before. Drag&Drop automatically sets TRUE. Empty parameter equals FALSE.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The last part of the key of the data value to be retrieved.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=READ(INBOXDATA(“”, “”, “Customer”), B1, “String”)',
							result: '[[42]]',
							comment: 'Customer'
						},
						{
							formula: '=READ(INBOXDATA(“”, “”, “Customer”, “Name”), C2, “String”,,TRUE)',
							result: '#NA',
							comment: 'Returns error code if customer name is not available because last parameter is to TRUE.'
						},
						{
							formula: '=READ(INBOXDATA(,,”Products”,”0”),<br />F19:J25,”Dictionary”,,TRUE)',
							result: 'Read function with target range.',
							comment: 'Example to read a whole table with the help of the DICTIONARY() function and a target range.<br /> <img src={require("../../_images/READ.png").default} width="100%"/>'
						}
					]
				}
			}
		},
		REPEATINDEX: {
			default: {
				category: 'Streamsheet',
				description: 'Returns the number of times a Streamsheet was triggered by execute. To get the number of steps a Streamsheet was processed refer to getstep and to get the number of steps for a Streamsheet in repeat-calculation mode refer to getcycle. Only works in the repeating Streamsheet.',
				inlineDescription: 'Returns the number of times a Streamsheet was triggered by execute.',
				return: {
					type: '',
					description: 'Current execute repetition.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=REPEATINDEX()',
							result: '1',
							comment: ''
						}
					]
				}
			}
		},
		RETURN: {
			default: {
				category: 'Streamsheet',
				description: 'Interrupts the recalculation cycle. This is of special interest, if a Streamsheet starts to evaluate on process start and is set to evaluate endlessly. Using RETURN, you can stop this endless recalculation.',
				inlineDescription: 'Interrupts the recalculation cycle. ',
				return: {
					type: '',
					description: 'TRUE or [error](../../other#error-codes) value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=RETURN()',
							result: 'TRUE'
						}
					]
				}
			}
		},
		SELECT: {
			default: {
				category: 'Streamsheet',
				description: 'Display a pick list below the cell to select a value from the pick list as the cell value. This function can only be used as an outer function, otherwise no pick list will be displayed. The function is recreated by replacing the Actual Value, when an item in the list is selected. The actual value will also be the initial value.',
				inlineDescription: 'Display a pick list below the cell to select a value from the pick list as the cell value.',
				arguments: [
					{
						type: '',
						name: 'ListRange',
						description: 'Range with the values to display in the pick list..',
						optional: false
					},
					{
						type: '',
						name: 'ActualValue',
						description: 'Value to select in the pick list.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Current selected value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=SELECT(B1:D1,"Germany")',
							result: 'The selected value.',
							comment: 'If you click on the cell with the SELECT function, a list would display the values in the cell range B1:D1.'
						}
					]
				}
			}
		},
		SETCYCLETIME: {
			default: {
				category: 'Streamsheet',
				description: 'Set the current Cycle Time. The Cycle Time is an overall setting in an App that applies to each Streamsheet in the App. It generally defines how long the system pauses between calculation cycles (in ms).',
				inlineDescription: 'Set the current Cycle Time.',
				return: {
					type: '',
					description: 'Depends on condition. TRUE or FALSE'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=SETCYCLETIME(1000)',
							result: 'TRUE',
							comment: 'The cycle time is set to one second.'
						}
					]
				}
			}
		},
		SETPHASE: {
			default: {
				category: 'Streamsheet',
				description: 'Puts the Text into the target cell, if the condition is true.',
				inlineDescription: 'Puts the Text into the target cell, if the condition is true.',
				arguments: [
					{
						type: '',
						name: 'Condition',
						description: 'Condition to check for action.',
						optional: false
					},
					{
						type: '',
						name: 'Text',
						description: 'Text to copy to the target cell, if condition equals TRUE.',
						optional: false
					},
					{
						type: '',
						name: 'TargetCell',
						description: 'Cell to put text into.',
						optional: false
					},
					{
						type: '',
						name: 'OverwriteFormula',
						description: 'Set to TRUE will overwrite cell formula. Defaults to FALSE.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Depends on condition. TRUE or FALSE'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=SETPHASE(21, "Test", B1)',
							result: 'TRUE',
							comment: 'Will put text "Test" in cell B1, as 2 is always larger than 1.'
						},
						{
							formula: '=SETPHASE(21, "Test", B1, TRUE)',
							result: 'TRUE',
							comment: 'Same as before, but overwrites possible cell formula so that "Test" is returned on subsequent App steps'
						}
					]
				}
			}
		},
		SETVALUE: {
			default: {
				category: 'Streamsheet',
				description: 'Writes a given value into target cell, if specified condition evaluates to true.',
				inlineDescription: 'Writes a given value into target cell, if specified condition evaluates to true.',
				arguments: [
					{
						type: '',
						name: 'Condition',
						description: 'Condition to check for action. Defaults to FALSE if no condition is given.',
						optional: true
					},
					{
						type: '',
						name: 'Value',
						description: 'Value to write to target cell, if condition evaluates to TRUE.',
						optional: false
					},
					{
						type: '',
						name: 'TargetCell',
						description: 'Cell to put value into.',
						optional: false
					},
					{
						type: '',
						name: 'OverwriteFormula',
						description: 'Set to TRUE remove any cell formula. Defaults to FALSE.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=SETVALUE(21, 42, B1)',
							result: 'TRUE',
							comment: 'Will put value 42 in cell B1, but keeps possible cell formula'
						},
						{
							formula: '=SETVALUE(21, 42, B1, TRUE)',
							result: 'TRUE',
							comment: 'Same as before, but overwrites possible cell formula so that 42 is returned on subsequent App steps'
						},
						{
							formula: '=SETVALUE(, 42, B1)',
							result: 'TRUE',
							comment: 'Does nothing because no condition is specified'
						}
					]
				}
			}
		},
		SLEEP: {
			default: {
				category: 'Streamsheet',
				description: 'Pauses sheet processing for a specified amount of time.',
				inlineDescription: 'Pauses sheet processing for a specified amount of time.',
				return: {
					type: '',
					description: 'TRUE'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=SLEEP(2)',
							comment: 'Pauses sheet processing for 2 seconds.'
						},
						{
							formula: '=SLEEP(0.1)',
							comment: 'Pauses sheet processing for 100 milliseconds.'
						}
					]
				}
			}
		},
		SUBTREE: {
			default: {
				category: 'Streamsheet',
				description: 'Extracts a sub tree from the current message.',
				inlineDescription: 'Extracts a sub tree from the current message.',
				arguments: [
					{
						type: '',
						name: 'TopElement',
						description: 'Path to the parent element from where to extract the sub tree.',
						optional: false
					},
					{
						type: '',
						name: 'IncludeElementKey',
						description: 'Optional flag which indicates if key of requested element should be included. Default is FALSE.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The return value contains the JSON Object and is only usable within other functions. See sample below.'
				}
			}
		},
		SWAPVALUES: {
			default: {
				category: 'Streamsheet',
				description: 'Copies the values from the given source range to the target range and vice versa. Beware that only the values are copied and not formulas. If the target range is a multiple of the source range, the target range is filled repeatedly with the source values.',
				inlineDescription: 'Copies the values from the given source range to the target range and vice versa.',
				arguments: [
					{
						type: '',
						name: 'Range1',
						description: 'Range to exchange',
						optional: false
					},
					{
						type: '',
						name: 'Range2',
						description: 'Range to exchange',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE, if successful.'
				},
				examples: {
					infoStart: '',
					infoEnd: '\n:::warning\n Only the values will be moved. Formulas will be removed. \n:::\n ',
					formulas: [
						{
							formula: '<br /> <img src={require("../../_images/SWAPVALUES1.png").default} width="90%"/>',
							result: 'TRUE',
							comment: '<<br /> <img src={require("../../_images/SWAPVALUES2.png").default} width="90%"/>'
						}
					]
				}
			}
		},
		'TABLE.GET': {
			default: {
				category: 'Streamsheet',
				description: 'Gets the value from the table cell at specified index.   To create a table like cell range please refer to TABLE.UPDATE.',
				inlineDescription: 'Gets the value from the table cell at specified index.',
				arguments: [
					{
						type: '',
						name: 'CellRange',
						description: 'Cell range to treat like a table. Its first row and its first column are used to reference table cells.',
						optional: false
					},
					{
						type: '',
						name: 'RowIndex',
						description: 'The row index of a table cell.',
						optional: false
					},
					{
						type: '',
						name: 'ColumnIndex',
						description: 'The column index of a table cell',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The value of specified table cell or an [error](../../other#error-codes) value if cell range does not contain specified cell.'
				},
				examples: {
					infoStart: '|Time|Turbine1|Turbine2|Turbine3|\n|---|---|---|---|\n93370|1000|2000|3000|\n|93360|1500|2500|3500|\n',
					infoEnd: '',
					formulas: [
						{
							formula: '=TABLE.GET(A3:D5, 93370, "Turbine 1")',
							result: '1000'
						},
						{
							formula: '=TABLE.GET(A3:D5, 93360, "Turbine 2")',
							result: '2500'
						}
					]
				}
			}
		},
		'TABLE.ORDERCOLUMN': {
			default: {
				category: 'Streamsheet',
				description: 'Orders specified table columns according to corresponding reference columns.   To create a table like cell range please refer to TABLE.UPDATE.',
				inlineDescription: 'Orders specified table columns according to corresponding reference columns.',
				arguments: [
					{
						type: '',
						name: 'ColumnsRange',
						description: 'Cell range to treat like table columns. Its first row defines the column header.',
						optional: false
					},
					{
						type: '',
						name: 'ReferenceColumnsRange',
						description: 'Cell range which defines the order of referenced table columns. Its first row defines the column header.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE or an [error](../../other#error-codes) value.'
				},
				examples: {
					infoStart: '|Col1|Col2|Col1|Col2|\n|---|---|---|---|\n21|"hello"|42|"world"|\n|42|"world"|63|"hello"|\n|63|"!!!"| | |',
					infoEnd: '',
					formulas: [
						{
							formula: '=TABLE.ORDERCOLUMN(A3:B5,C3:C5)',
							result: 'TRUE'
						},
						{
							formula: '=TABLE.ORDERCOLUMN(A3:D5, C3:D5)',
							result: 'TRUE'
						}
					]
				}
			}
		},
		'TABLE.UPDATE': {
			default: {
				category: 'Streamsheet',
				description: 'Creates and updates a defined cell range in a table like manner. The first row and first column of specified cell range defines the indices used to reference a table cell. To set or update a cell its corresponding row and column indices must be given. If a row index does not exist in current range, it can be automatically added to top or bottom. The same applies for a column index which can be automatically added to the left or right. To simply read values from a table cell refer to TABLE.GET',
				inlineDescription: 'Creates and updates a defined cell range in a table like manner. ',
				arguments: [
					{
						type: '',
						name: 'CellRange',
						description: 'Cell range to treat like a table. Its first row and its first column are used to reference table cells.',
						optional: false
					},
					{
						type: '',
						name: 'Value',
						description: 'A value to set in referenced table cell.',
						optional: false
					},
					{
						type: '',
						name: 'RowIndex',
						description: 'The row index of a table cell. If not defined no value is set. The PushRowAt parameter can be used to add the row index if the table has no equal index.',
						optional: true
					},
					{
						type: '',
						name: 'ColumnIndex',
						description: 'The column index of a table cell. If not defined no value is set. The PushColumnAt parameter can be used to add the column index if the table has no equal index.',
						optional: true
					},
					{
						type: '',
						name: 'PushRowAt',
						description: 'Defines where to insert a new row index. Should be either 1, -1, or 0. To insert new row at the bottom specify 1, -1 will insert it at the top and 0 will not insert at all. Defaults to 0.',
						optional: true
					},
					{
						type: '',
						name: 'PushColumnAt',
						description: 'Defines where to insert a new column index. Should be either 1, -1, or 0. To insert new column to the right specify 1, -1 will insert it to the left and 0 will not insert at all. Defaults to 0.',
						optional: true
					},
					{
						type: '',
						name: 'AggregationMethod',
						description: 'One of the predefined numbers which specifies the aggregation method to use for specified table cell. <br />Options (Defaults to 0):<br />0 : NONE (No aggregation is performed and the last valid value is returned)<br />1 : AVERAGE (Calculates the average of all received values)<br />2 : COUNT (Counts the number of received values)<br />3 : COUNTA (Counts all values which are not zero)<br />4 : MAX (Determines the maximum of all received values)<br />5 : MIN (Determines the minimum of all received values)<br />6 : PRODUCT (Calculates the product of all received values)<br />7 : STDEV.S (Calculates the standard deviation of all received values)<br />8 : STDEV.P (Currently not available!!)<br />9 : SUM (Calculates the sum of all received values)',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE or an [error](../../other#error-codes) value.'
				},
				examples: {
					infoStart: '|Time|Turbine1|Turbine2|Turbine3|\n|---|---|---|---|\n93370|1000|2000|3000|\n|93360|1500|2500|3500|\n',
					formulas: [
						{
							formula: '=TABLE.UPDATE(A3:D5, 42, 93360, "Turbine 1")',
							result: 'TRUE'
						},
						{
							formula: '=TABLE.UPDATE(A3:D5, 42, 93300, "Turbine 42", 1, 1)',
							result: 'TRUE'
						}
					]
				}
			}
		},
		TRIGGERSTEP: {
			default: {
				category: 'Streamsheet',
				description: 'Triggers a streamsheet step. Note: this function should not be used in a cell directly. Rather it is intended to be used as a parameter to drawing functions, e.g. like ONCLICK.',
				inlineDescription: 'Triggers a streamsheet step.',
				return: {
					type: '',
					description: 'Nothing.'
				}
			}
		},
		// WEBPAGE: {
		// 	default: {
		// 		category: 'Streamsheet',
		// 		description: 'Creates a webpage at the given URL. This uses a special REST feeder internally.',
		// 		arguments: [
		// 			{
		// 				type: '',
		// 				name: 'URL',
		// 				description: 'A URL suffix which is appended to the base url provided by internally used feeder.',
		// 				optional: false
		// 			},
		// 			{
		// 				type: '',
		// 				name: 'HTML',
		// 				description: 'A String which defines the webpage to create.',
		// 				optional: false
		// 			},
		// 			{
		// 				type: '',
		// 				name: 'Refresh',
		// 				description: 'The http refresh rate in seconds',
		// 				optional: false
		// 			}
		// 		],
		// 		return: {
		// 			type: '',
		// 			description: 'TRUE on success or [error](../../other#error-codes) code otherwise.'
		// 		},
		// 		examples: {
		// 			infoStart: 'We assume that the used REST feeder provides following base URL: `https://dev.cedalo.com/rest/v1.0/webpages` ',
		// 			infoEnd: '',
		// 			formulas: [
		// 				{
		// 					formula: '=WEBPAGE(“test1/test2”,“`<html><body><h1>HELLO</h1></body></html>`”, 5)',
		// 					result: 'TRUE',
		// 					comment: 'Creates a webpage with a single HELLO title. The webpage is accessable at: `https://dev.cedalo.com/rest/v1.0/webpages/test1/test2`'
		// 				}
		// 			]
		// 		}
		// 	}
		// },
		WRITE: {
			default: {
				category: 'Streamsheet',
				description: 'Adds the key and value to a JSON object in the outbox. The path to the key will be created as needed.',
				inlineDescription: 'Adds the key and value to a JSON object in the outbox. The path to the key will be created as needed.',
				arguments: [
					{
						type: '',
						name: 'Key',
						description: 'A key to a data item, that should be written. The key is usually created by using the OUTBOXMETADATA or OUTBOXDATA utility functions. The key consists of the path to the item within the JSON object.',
						optional: false
					},
					{
						type: '',
						name: 'Value',
						description: 'Value to assign to key.',
						optional: false
					},
					{
						type: '',
						name: 'Type',
						description: 'Type of Value. Allowed types are String, Number, Boolean, Array, Dictionary. The type defines the color of the cell.',
						optional: true
					},
					{
						type: '',
						name: 'TTL',
						description: 'The "time to live" period in seconds. If the specified period expires the corresponding message will be removed from the outbox. Default is indefinitely.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The last part of the key of the data value to write.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=WRITE(OUTBOXDATA("Message",<br />"Customer", "Name"), "Maier", "String")',
							result: 'Outbox Message: <br /> <img src={require("../../_images/WRITE.png").default} width="90%"/>',
							comment: 'Example to write a value to a JSON object in the outbox.'
						},
						{
							formula: '=WRITE(OUTBOXDATA("Message",<br />"Units"),READ(INBOXDATA(,,"Units"))) <br /> Inbox Message: <br /> <img src={require("../../_images/ARRAYIn.png").default} width="80%"/>',
							result: '<br /> <img src={require("../../_images/ARRAYOut.png").default} width="100%"/>',
							comment: 'You can also direct data from the<br /> Inbox into the Outbox. In this example the<br /> “Units” array from the Inbox is automatically transferred to the Outbox.'
						},
						{
							formula: '=WRITE(OUTBOXDATA("Message",<br />"Output",-1),JSON(J22:K24),)',
							result: 'Outbox Message: <br /> <img src={require("../../_images/increment.png").default} width="80%"/>',
							comment: 'Pro tip: If you want to automatically create an array, <br />use -1 as the last OUTBOXDATA() parameter. <br />This way the array will increment starting from 0.'
						}
					]
				}
			}
		}
	},
};
