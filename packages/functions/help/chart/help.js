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
		AXIS: {
			cellEditor: false,
			default: {
				category: 'Chart',
				description: 'Define axis settings of a chart axis.',
				inlineDescription: 'Defines axis parameters',
				hint: 'This function is shown in the edit bar, if an axis is selected. It should not be used in a cell',
				arguments: [
					{
						type: 'Number',
						name: 'Min',
						description: 'Minimum axis Value.',
						optional: false
					},
					{
						type: 'Number',
						name: 'Max',
						description: 'Maximum axis value',
						optional: false
					},
					{
						type: 'Number',
						name: 'Step',
						description: 'Step for axis ticks or grid lines. For time axis the step will increment the time step.',
						optional: true
					},
					{
						type: 'String',
						name: 'Time Step',
						description: 'Step type for time units. Allowed values are \'year\', \'quarter\', \'month\', \'day\', \'hour\', \'minute\', \'second\' or \'millisecond\'.',
						optional: true
					},
					{
						type: 'Number',
						name: 'ZoomMin',
						description: 'Axis minimum to use, if chart is zoomed. This value will be filled automatically, if axis is zoomed using the mouse.',
						optional: true
					},
					{
						type: 'Number',
						name: 'ZoomMax',
						description: 'Axis maximum to use, if chart is zoomed. This value will be filled automatically, if axis is zoomed using the mouse.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE or an [Error Code](../../other#error-codes)'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=AXIS(0, 200, 50)',
							result: 'TRUE',
							comment: 'Scales the axis from 0 to 200 using a step of 50 units.'
						}
					]
				}
			}
		},
		CELLCHART: {
			default: {
				category: 'Chart',
				description: 'Draw a chart inside a cell.',
				inlineDescription: 'Displays a chart in the cell',
				arguments: [
					{
						type: 'Range',
						name: 'DataRange',
						description: 'Cell Range to retrieve the data for the chart from',
						optional: false
					},
					{
						type: 'String',
						name: 'ChartType',
						description: 'Valid Chart Type. Default is line. Valid values are : line, column, bar, pie, doughnut, bubble, scatter, area.',
						optional: true
					},
					{
						type: 'String',
						name: 'LineColor',
						description: 'Line Color to use for first series as hexadecimal color value',
						optional: true
					},
					{
						type: 'String',
						name: 'FillColor',
						description: 'Fill Color to use for first series as hexadecimal color value',
						optional: true
					},
					{
						type: 'Number',
						name: 'Minimum',
						description: 'Value Axis Minimum',
						optional: true
					},
					{
						type: 'Number',
						name: 'Maximum',
						description: 'Value Axis Maximum',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE or an [Error Code](../../other#error-codes)'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=CELLCHART(B2:B5,"line")',
							result: 'TRUE',
							comment: 'Draw a chart in the current cell.'
						}
					]
				}
			}
		},
		'DRAW.STREAMCHART': {
			cellEditor: false,
			default: {
				category: 'Chart',
				description: 'Define a chart on a given drawing.',
				inlineDescription: 'Contains chart parameters',
				hint: 'This function is shown in the edit bar, if a chart is selected. It should not be used in a cell',
				arguments: [
					{
						type: 'Number',
						name: 'X',
						description: 'X Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: 'Number',
						name: 'Y',
						description: 'Y Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: 'Number',
						name: 'Width',
						description: 'Width in 1/100th mm',
						optional: false
					},
					{
						type: 'Number',
						name: 'Height',
						description: 'Height in 1/100th mm',
						optional: false
					},
					{
						type: 'String',
						name: 'LineColor',
						description: 'Options: <br /> - `None` for no line <br /> - Hexadecimal color value (`#FF0000` for Red)',
						optional: true
					},
					{
						type: 'String',
						name: 'FillColor',
						description: 'Options: <br /> - `None` for no fill  <br />- Hexadecimal color value (`#FF0000` for Red)',
						optional: true
					},
					{
						type: 'Number',
						name: 'Angle',
						description: 'Angle in radians.',
						optional: true
					},
				],
				return: {
					type: '',
					description: 'TRUE or an [Error Code](../../other#error-codes)'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DRAW.STREAMCHART(1000, 1000, 3000, 3000, "#000000", "#FFFFFF")',
							result: 'TRUE',
							comment: 'Draw a chart.'
						}
					]
				}
			}
		},
	},
};
