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
		TIMEAGGREGATE: {
			default: {
				category: 'Timeseries',
				description: 'Aggregates number values over a specified time period. TIMEAGGREGATE saves the raw values in the cell and/or in a TargetRange. The returned value in the cell is aggregated over all numbers within the period. This function only stores data in memory. As soon as the app stops and restarts again the data collection starts over. To store data persistent use a Stream function connecting to a data base (e.g. TimescaleDB).',
				inlineDescription: 'Aggregates number values over a specified time period.',
				arguments: [{
					type: '',
					name: 'DataCell',
					description: 'The data source cell which should evaluate to a number. All other values are ignored.',
					optional: false
				}, {
					type: '',
					name: 'Period',
					description: 'The time period in seconds in which data is collected. Defaults to 60 seconds.',
					optional: true
				}, {
					type: '',
					name: 'AggregationMethod',
					description: 'One of the predefined numbers which specifies the aggregation method to use. Defaults to 9. ' +
						'<p/><table><tbody>' +
						'<tr><td style="width:50px;">Number</td><td style="width:60px;">Method</td><td>Description</td></tr>' +
						'<tr><td>0</td><td>NONE</td><td>No aggregation is performed and the last valid value of specified DataCell is returned.</td></tr>' +
						'<tr><td>1</td><td>AVERAGE</td><td>Calculates the average of all received values.</td></tr>' +
						'<tr><td>2</td><td>COUNT</td><td>Counts the number of received values.</td></tr>' +
						'<tr><td>3</td><td>COUNTA</td><td>Counts all values which are not zero.</td></tr>' +
						'<tr><td>4</td><td>MAX</td><td>Determines the maximum of all received values.</td></tr>' +
						'<tr><td>5</td><td>MIN</td><td>Determines the minimum of all received values.</td></tr>' +
						'<tr><td>6</td><td>PRODUCT</td><td>Calculates the product of all received values.</td></tr>' +
						'<tr><td>7</td><td>STDEV.S</td><td>Calculates the standard deviation of all recieved values.</td></tr>' +
						'<tr><td>8</td><td>STDEV.P</td><td>Currently not available!!</td></tr>' +
						'<tr><td>9</td><td>SUM</td><td>Calculates the sum of all received values.</td></tr>' +
						'</tbody></table>',
					optional: true
				}, {
					type: '',
					name: 'TimeSerial',
					description: 'A serial number to use as key for each aggregated value. Defaults to now.',
					optional: true
				}, {
					type: '',
					name: 'Interval',
					description: 'An interval in seconds at which values should be aggregated. Defaults to the specified period. To not loose any data, an Interval should always be a divisor of the Period. Note: Default Interval collects a different TargetRange as a handwritten equal Period. Default Interval: collects all values within the specified Period. Interval equals Period: aggregates all values to one value.',
					optional: true
				}, {
					type: '',
					name: 'TargetRange',
					description: 'A cell range to write the aggregated values to. Collects aggregation intervals and displays them. Differs if interval is left blank (see interval).',
					optional: true
				}, {
					type: '',
					name: 'Sort',
					description: 'Set to TRUE if values should be sorted by time. Most useful if a custom TimeSerial parameter is provided. Defaults to FALSE.',
					optional: true
				}, {
					type: '',
					name: 'Limit',
					description: 'Specifies the maximum number of values stored. If limit is reached the function returns a #LIMIT error. Defaults to 1000.',
					optional: true
				}],
				return: {
					type: '', description: 'A number value aggregated over all values within specified period.'
				},
				examples: {
					infoStart: '',
					infoEnd: '\n\n![TA](../../_images/TS/TA.png)\n\nThe image shows all methods in action. Eight TIMEAGGREGATE functions watch over the values from either the parameter "Berlin", "Paris" or "London". E.g. "TIMEAGGREGATE(B6,,1)* ',
					formulas: [{
						formula: '=TIMEAGGREGATE(C2, 20)',
						comment: 'Calculates the sum of all values read from C2 over a period of 20 seconds.'
					}, {
						formula: '=TIMEAGGREGATE(C2, 20, 1,,2, D4:E14)',
						comment: 'Calculates the average each 2 seconds and writes roughly 10 values to target range D4:E14'
					}]
				}
			}
		},
		TIMEQUERY: {
			default: {
				category: 'Timeseries',
				description: 'Used to query values stored by TIMESTORE. The result can be saved to a specified TargetRange or used as an input for charts.',
				inlineDescription: 'Used to query values stored by TIMESTORE.',
				arguments: [{
					type: '',
					name: 'TimestoreCell',
					description: 'A reference to the timestore cell on which the query should be executed.',
					optional: false
				}, {
					type: '',
					name: 'Query',
					description: 'A JSON object which specifies the query to perform. See below for more information. A query consists of the following fields:' +
						'<p/><table><tbody>' +
						'<tr><td style="width:50px;">Name</td><td>Description</td></tr>' +
						'<tr><td>select</td><td>Defines the values to query. Multiple values are separated by comma. The wildcard * will select all values.</td></tr>' +
						'<tr><td>aggregate</td><td>Optional. Defines the aggregation method to use for each value separted by comma. Must match the number of values in select clause. ' +
						'See below for a complete list of defined aggregation methods. Defaults to none.' +
						'<p/><table><tbody>' +
						'<tr><td style="width:50px;">Number</td><td style="width:60px;">Method</td><td>Description</td></tr>' +
						'<tr><td>0</td><td>none</td><td>No aggregation is performed and the last valid value of specified DataCell is returned.</td></tr>' +
						'<tr><td>1</td><td>average</td><td>Calculates the average of all received values.</td></tr>' +
						'<tr><td>2</td><td>count</td><td>Counts the number of received values.</td></tr>' +
						'<tr><td>3</td><td>counta</td><td>Counts all values which are not zero.</td></tr>' +
						'<tr><td>4</td><td>max</td><td>Determines the maximum of all received values.</td></tr>' +
						'<tr><td>5</td><td>min</td><td>Determines the minimum of all received values.</td></tr>' +
						'<tr><td>6</td><td>product</td><td>Calculates the product of all received values.</td></tr>' +
						'<tr><td>7</td><td>stdev.s</td><td>Calculates the standard deviation of all recieved values.</td></tr>' +
						'<tr><td>8</td><td>stdev.p</td><td>Currently not available!!</td></tr>' +
						'<tr><td>9</td><td>sum</td><td>Calculates the sum of all received values.</td></tr>' +
						'</tbody></table>' +
						'</td></tr>' +
						'<tr><td>where</td><td>Optional. Only values which fulfill the condition defined by the where clause are taken. To compare values >, >=, <, <=, = != are supported. Use AND and OR to combine conditions.</td></tr>' +
						'</tbody></table>',
					optional: false
				}, {
					type: '',
					name: 'Interval',
					description: 'An interval in seconds at which the query should be executed. Only values with a timestamp within given interval are used as query input. If no interval is specified the query is performed on each step.',
					optional: true
				}, {
					type: '',
					name: 'TargetRange',
					description: 'A cell range to write the query result to.',
					optional: true
				}, {
					type: '',
					name: 'Limit',
					description: 'Specifies the maximum number of results stored. If limit is reached the function returns a #LIMIT error. Defaults to 1000.',
					optional: true
				}],
				return: {
					type: '', description: 'TRUE, if successful.'
				},
				examples: {
					infoStart: 'Query Source: \n\n| |A|B|Description|\n' +
						'|---|---|---|---|\n' +
						'|1|select|v1|JSON(A1:B3)|\n' +
						'|2|aggregate|sum|will sum up all values of v1|\n' +
						'|3|where|v2 > 50 AND v1 < 100|for entries with a v2 value greater 50 and a v1 value less 100|\n' +
						'|4| | | |\n' +
						'|5|select|v1, v2|JSON(A5:B6)|\n' +
						'|6|aggregate|sum, max|will sum up v1 and determine maximum of v2|\n' +
						'|7| | | |\n' +
						'|8|select|*|JSON(A8:B10)|\n' +
						'|9|aggregate|avg|will calculate the average of all values|\n' +
						'|10|where|v1 > 30|for entries with a v1 value greater 30|\n' +
						'',
					infoEnd: '\n\n![TQ](../../_images/TS/TQ.png) ![TQTRR](../../_images/TS/TQTRR.png) \n\nTIMEQUERY(F19,JSON(G21:H21),,A16:D39,) A query to gather all information (G21:H21) from the TIMESTORE function (F19) and display them in a Target Range (A16:D39). Left image shows the query, right image shows the Target Range.',
					formulas: [{
						formula: '=TIMEQUERY(C1, JSON(A1:B2))', comment: 'Queries the total values for v1 on each step'
					}, {
						formula: '=TIMEQUERY(C1, JSON(A5:B6), 10)',
						comment: 'Queries the total for v1 and the maximum of v2 every 10 seconds'
					}, {
						formula: '=TIMEQUERY(C1, JSON(A8:B8),,D4:E14)',
						comment: 'Simply writes all stored values to target range on each step'
					}]
				}
			}
		},
		TIMESTORE: {
			default: {
				category: 'Timeseries',
				description: 'Stores key-value pairs over a specified time period. To query stored values use TIMEQUERY. This function only stores data in memory. As soon as the app stops and restarts again the data collection starts over. To store data persistent use a Stream function connecting to a data base (e.g. TimescaleDB).',
				inlineDescription: 'Stores key-value pairs over a specified time period.',
				arguments: [{
					type: '',
					name: 'Json',
					description: 'A JSON object which contains the key-value pairs to store.',
					optional: false
				}, {
					type: '',
					name: 'Period',
					description: 'The time period in seconds over which data is collected. Older data is dropped. Defaults to 60 seconds.',
					optional: true
				}, {
					type: '',
					name: 'TimeSerial',
					description: 'A serial number to use as key for each stored value. Note: data is always sorted according to its corresponding timestamp. Defaults to now.',
					optional: true
				}, {
					type: '',
					name: 'Limit',
					description: 'Specifies the maximum number of values stored. If limit is reached the function returns a #LIMIT error. Defaults to 1000.',
					optional: true
				}],
				return: {
					type: '', description: 'TRUE, if successful.'
				},
				examples: {
					infoStart: 'Example Sheet\n\n| | A | B|\n|---|---|---|\n|1|v1|=A1+1|\n|2|v2|=RANDBETWEEN(0,100)|\n',
					infoEnd: '\n\n![TS](../../_images/TS/TS.png)\n\nStoring data from Berlin, Paris and London. Now a TIMEQUERY can be used to access the stored values',
					formulas: [{
						formula: '=TIMESTORE(JSON(A1:B2))', comment: 'Stores the values for v1 and v2 on each step.'
					}, {
						formula: '=TIMESTORE(JSON(A1:B2), 100, , 10)',
						comment: 'Same as before but stores only over a period of 100 seconds and limits number of stored values to 10'
					}]
				}
			}
		},
	},
};
