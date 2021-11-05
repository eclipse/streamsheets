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
		BAR: {
			default: {
				category: 'Shape',
				description: 'Draw a bar within a cell . A bar is only drawn in the cell, if it is the outer function within a formula.',
				inlineDescription: 'Draw a bar in the cell, where the function resides',
				arguments: [
					{
						type: '',
						name: 'Value',
						description: 'Size of bar covering the cell, that the function contains. The size is given as a factor of the height or width between 0 and 1, where 1 will cover the complete cell. Negative vales are allowed.',
						optional: false
					},
					{
						type: '',
						name: 'Direction',
						description: 'Options:<br /><br />`0` : Display horizontal bar<br />`1` : Display vertical bar',
						optional: false
					},
					{
						type: '',
						name: 'FillColor',
						description: 'Fill color value. The default value is \'#00FF00\'.',
						optional: true
					},
					{
						type: '',
						name: 'LineColor',
						description: 'Line color value. By default the line is set to invisible.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The value passed as the first argument.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=BAR(0.5, 0, \'#FF0000\')',
							result: '0.5',
							comment: 'Draw a horizontal with with a red fill color filling half the height of the cell.'
						}
					]
				}
			}
		},
		CLASSIFYPOINT: {
			default: {
				category: 'Shape',
				description: 'This function determines whether a given X, Y coordinate is inside or outside or on the border of a given polygon defined by the points given.',
				inlineDescription: 'Checks, if a point lies within a polygon',
				arguments: [
					{
						type: '',
						name: 'X',
						description: 'X coordinate of the point to test',
						optional: false
					},
					{
						type: '',
						name: 'Y',
						description: 'Y coordinate of the point to test',
						optional: false
					},
					{
						type: '',
						name: 'PolygonPointsRange',
						description: 'A vertical range with 2 columns and N rows where the first column contains the X and the second column contains the Y coordinates of a (closed) Polygon',
						optional: false
					}
				],
				return: {
					type: '',
					description: '-1: Point is outside of polygon   0: Point is on polygon border   1: Point is inside polygon'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=CLASSIFYPOINT(500, 500, <span class="blue">A2:B5</span>)',
							result: '1',
							comment: 'Where A2:B5 looks as follows:<br /> <br /> <img src={require("../../_images/CLASSIFYPOINT.png").default} width="50%"/>'
						}
					]
				}
			}
		},
		'DRAW.BEZIER': {
			default: {
				category: 'Shape',
				description: 'Define a graphical bezier curve. The control points are created automatically.',
				inlineDescription: 'Define a graphical bezier curve. The control points are created automatically.',
				arguments: [
					{
						type: '',
						name: 'X',
						description: 'X Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Y',
						description: 'Y Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Width',
						description: 'Width in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Height',
						description: 'Height in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'LineColor',
						description: 'Options: <br /> - `None` for no line <br /> - Hexadecimal color value (`#FF0000` for Red)',
						optional: true
					},
					{
						type: '',
						name: 'FillColor',
						description: 'Hexadecimal color value (`#FF0000` for Red)',
						optional: true
					},
					{
						type: '',
						name: 'Angle',
						description: 'Angle in radians.',
						optional: true
					},
					{
						type: '',
						name: 'PointRange',
						description: 'Cell Range with coordinates. A coordinate is defined by a fraction of the width and height of the bezier ranging from 0 to . 1 would place the coordinate at the bottom or right corner of the object. The range must have 2 columns. The left column contains the x coordinates and the right column the y coordinates. If the object was drawn using the mouse or one of the predefined objects was used, the given coordinates will be used, as long as no coordinates are defined using this parameter.',
						optional: true
					},
					{
						type: '',
						name: 'Close',
						description: 'Close bezier curve by connecting the first and last point (Default: TRUE)',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if bezier curve could be created.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DRAW.BEZIER(28171,7171,21616,12991)',
							result: 'TRUE',
							comment: 'Draw a bezier using the given coordinates.'
						}
					]
				}
			}
		},
		'DRAW.BUTTON': {
			default: {
				category: 'Shape',
				description: 'Define a graphical button on a given drawing.',
				inlineDescription: 'Define a graphical button on a given drawing.',
				arguments: [
					{
						type: '',
						name: 'X',
						description: 'X Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Y',
						description: 'Y Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Width',
						description: 'Width in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Height',
						description: 'Height in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'LineColor',
						description: 'Options: <br /> - `None` for no line <br /> - Hexadecimal color value (`#FF0000` for Red) <br />',
						optional: true
					},
					{
						type: '',
						name: 'FillColor',
						description: 'Hexadecimal color value ("#FF0000" for Red)',
						optional: true
					},
					{
						type: '',
						name: 'Angle',
						description: 'Angle in radians.',
						optional: true
					},
					{
						type: '',
						name: 'Label',
						description: 'Label to display',
						optional: false
					},
					{
						type: '',
						name: 'Value',
						description: 'Current state of the button. TRUE for pushed and FALSE for released. If a cell reference is used, a value change from user interaction will be pushed into that cell.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if button could be created.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DRAW.BUTTON(5801,20056,5292,3625,,,,"Button",A1)',
							result: 'TRUE',
							comment: 'A button with "Button" as label. A1 turns TRUE as long as the button is pressed.'
						}
					]
				}
			}
		},
		'DRAW.CHECKBOX': {
			default: {
				category: 'Shape',
				description: 'Define a graphical checkbox button on a given drawing.',
				inlineDescription: 'Define a graphical checkbox button on a given drawing.',
				arguments: [
					{
						type: '',
						name: 'X',
						description: 'X Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Y',
						description: 'Y Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Width',
						description: 'Width in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Height',
						description: 'Height in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'LineColor',
						description: 'Options: <br /> - `None` for no line <br /> - Hexadecimal color value (`#FF0000` for Red) <br />',
						optional: true
					},
					{
						type: '',
						name: 'FillColor',
						description: 'Hexadecimal color value ("#FF0000" for Red)',
						optional: true
					},
					{
						type: '',
						name: 'Angle',
						description: 'Angle in radians.',
						optional: true
					},
					{
						type: '',
						name: 'Label',
						description: 'Label to display',
						optional: false
					},
					{
						type: '',
						name: 'Value',
						description: 'Current state of the button. TRUE for pushed and FALSE for released. If a cell reference is used, a value change from user interaction will be pushed into that cell.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if checkbox could be created.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DRAW.CHECKBOX(5377,17106,4286,1217,,,,"Checkbox",A1)',
							result: 'TRUE',
							comment: 'A checkbox with "Checkbox" as label. In A1 TRUE or FALSE is printed, depending on the state of the box.'
						}
					]
				}
			}
		},
		'DRAW.ELLIPSE': {
			default: {
				category: 'Shape',
				description: 'Define an ellipse on a given drawing.',
				inlineDescription: 'Define an ellipse on a given drawing.',
				arguments: [
					{
						type: '',
						name: 'X',
						description: 'X Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Y',
						description: 'Y Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Width',
						description: 'Width in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Height',
						description: 'Height in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'LineColor',
						description: 'Options: <br /> - `None` for no line <br /> - Hexadecimal color value (`#FF0000` for Red)',
						optional: true
					},
					{
						type: '',
						name: 'FillColor',
						description: 'Hexadecimal color value (`#FF0000` for Red)',
						optional: true
					},
					{
						type: '',
						name: 'Angle',
						description: 'Angle in radians.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if ellipse could be created.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DRAW.ELLIPSE(23607,22663,20055,A1)',
							result: 'TRUE',
							comment: 'Ellipse with the height depending on A1'
						}
					]
				}
			}
		},
		'DRAW.KNOB': {
			default: {
				category: 'Shape',
				description: 'Define a graphical knob on a given drawing.',
				inlineDescription: 'Define a graphical knob on a given drawing.',
				arguments: [
					{
						type: '',
						name: 'X',
						description: 'X Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Y',
						description: 'Y Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Width',
						description: 'Width in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Height',
						description: 'Height in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'LineColor',
						description: 'Options: <br /> - `None` for no line <br /> - Hexadecimal color value (`#FF0000` for Red)',
						optional: true
					},
					{
						type: '',
						name: 'FillColor',
						description: '- Hexadecimal color value ("#FF0000" for Red)',
						optional: true
					},
					{
						type: '',
						name: 'Angle',
						description: 'Angle in radians.',
						optional: true
					},
					{
						type: '',
						name: 'Label',
						description: 'Label to display',
						optional: false
					},
					{
						type: '',
						name: 'Value',
						description: 'Current state of the button. TRUE for pushed and FALSE for released. If a cell reference is used, a value change from user interaction will be pushed into that cell.',
						optional: true
					},
					{
						type: '',
						name: 'Min',
						description: 'Minimum value displayed in the knob.',
						optional: false
					},
					{
						type: '',
						name: 'Max',
						description: 'Maximum value displayed in the knob.',
						optional: false
					},
					{
						type: '',
						name: 'Step',
						description: 'Step to use for interaction while changing the knob value.',
						optional: false
					},
					{
						type: '',
						name: 'Marker',
						description: 'Marker style to indicate the current value. Allowed values are: <br />`none` <br />`arrowinner` <br />`line`  <br />`circlesmall` <br /> Default is a large circle.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if button could be created.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DRAW.KNOB(8711,14368,9578,3942,,,,"Knob",50,0,100,5,,0,0.52,5.76)',
							result: 'TRUE',
							comment: 'A knob with an interval from 0 to 100 and a step value of 5. Current Value is 50.'
						}
					]
				}
			}
		},
		'DRAW.LABEL': {
			default: {
				category: 'Shape',
				description: 'Define a graphical text object.',
				inlineDescription: 'Define a graphical text object.',
				arguments: [
					{
						type: '',
						name: 'X',
						description: 'X Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Y',
						description: 'Y Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Width',
						description: 'Width in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Height',
						description: 'Height in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'LineColor',
						description: 'Options: <br /> - `None` for no line <br /> - Hexadecimal color value (`#FF0000` for Red)',
						optional: true
					},
					{
						type: '',
						name: 'FillColor',
						description: 'Hexadecimal color value (`#FF0000` for Red)',
						optional: true
					},
					{
						type: '',
						name: 'Angle',
						description: 'Angle in radians.',
						optional: true
					},
					{
						type: '',
						name: 'Text',
						description: 'Text to display',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE, if label could be created.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DRAW.LABEL(9684,5318,889,617,,,,"Text")',
							result: 'TRUE',
							comment: 'Creates a label with "Text".'
						}
					]
				}
			}
		},
		'DRAW.LINE': {
			default: {
				category: 'Shape',
				description: 'Define a graphical line.',
				inlineDescription: 'Define a graphical line.',
				arguments: [
					{
						type: '',
						name: 'X1',
						description: 'X Start Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Y1',
						description: 'Y Start Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'X2',
						description: 'X End Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Y2',
						description: 'Y End Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'LineColor',
						description: '- Hexadecimal color value (`#FF0000` for Red)',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if line could be created.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DRAW.LINE(47791,940,55332,5279)',
							result: 'TRUE',
							comment: 'Draw a line.'
						}
					]
				}
			}
		},
		'DRAW.POLYGON': {
			default: {
				category: 'Shape',
				description: 'Define a graphical polygon.',
				inlineDescription: 'Define a graphical polygon.',
				arguments: [
					{
						type: '',
						name: 'X',
						description: 'X Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Y',
						description: 'Y Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Width',
						description: 'Width in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Height',
						description: 'Height in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'LineColor',
						description: 'Options: <br /> - `None` for no line <br /> - Hexadecimal color value (`#FF0000` for Red)',
						optional: true
					},
					{
						type: '',
						name: 'FillColor',
						description: 'Hexadecimal color value (`#FF0000` for Red)',
						optional: true
					},
					{
						type: '',
						name: 'Angle',
						description: 'Angle in radians.',
						optional: true
					},
					{
						type: '',
						name: 'PointRange',
						description: 'Cell Range with coordinates. A coordinate is defined by a fraction of the width and height of the bezier ranging from 0 to . 1 would place the coordinate at the bottom or right corner of the object. The range must have 2 columns. The left column contains the x coordinates and the right column the y coordinates. If the object was drawn using the mouse or one of the predefined objects was used, the given coordinates will be used, as long as no coordinates are defined using this parameter.',
						optional: true
					},
					{
						type: '',
						name: 'Close',
						description: 'Close bezier curve by connecting the first and last point (Default: TRUE)',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if polygon could be created.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DRAW.POLYGON(52726,24647,12462,6456)',
							result: 'TRUE',
							comment: 'Draw a polygon using the given coordinates.'
						}
					]
				}
			}
		},
		'DRAW.RECTANGLE': {
			default: {
				category: 'Shape',
				description: 'Define a rectangle on a given drawing.',
				inlineDescription: 'Define a rectangle on a given drawing.',
				arguments: [
					{
						type: '',
						name: 'X',
						description: 'X Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Y',
						description: 'Y Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Width',
						description: 'Width in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Height',
						description: 'Height in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'LineColor',
						description: 'Options: <br /> - `None` for no line <br /> - Hexadecimal color value (`#FF0000` for Red)',
						optional: true
					},
					{
						type: '',
						name: 'FillColor',
						description: 'Hexadecimal color value (`#FF0000` for Red)',
						optional: true
					},
					{
						type: '',
						name: 'Angle',
						description: 'Angle in radians.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if rectangle could be created.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=DRAW.RECTANGLE(43980,13587,19368,10636)',
							result: 'TRUE',
							comment: 'A rectangle.'
						}
					]
				}
			}
		},
		'DRAW.SLIDER': {
			default: {
				category: 'Shape',
				description: 'Define a graphical slider on a given drawing.',
				inlineDescription: 'Define a graphical slider on a given drawing.',
				arguments: [
					{
						type: '',
						name: 'X',
						description: 'X Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Y',
						description: 'Y Coordinate in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Width',
						description: 'Width in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'Height',
						description: 'Height in 1/100th mm',
						optional: false
					},
					{
						type: '',
						name: 'LineColor',
						description: 'Options: <br /> - `None` for no line <br /> - Hexadecimal color value (`#FF0000` for Red)',
						optional: true
					},
					{
						type: '',
						name: 'FillColor',
						description: '- Hexadecimal color value ("#FF0000" for Red)',
						optional: true
					},
					{
						type: '',
						name: 'Angle',
						description: 'Angle in radians.',
						optional: true
					},
					{
						type: '',
						name: 'Label',
						description: 'Label to display',
						optional: false
					},
					{
						type: '',
						name: 'Value',
						description: 'Current state of the button. TRUE for pushed and FALSE for released. If a cell reference is used, a value change from user interaction will be pushed into that cell.',
						optional: true
					},
					{
						type: '',
						name: 'Min',
						description: 'Minimum value displayed in the knob.',
						optional: false
					},
					{
						type: '',
						name: 'Max',
						description: 'Maximum value displayed in the knob.',
						optional: false
					},
					{
						type: '',
						name: 'Step',
						description: 'Step to use for interaction while changing the knob value.',
						optional: false
					},
					{
						type: '',
						name: 'Marker',
						description: 'Marker style to indicate the current value. Allowed values are: <br />`none` <br />`arrowinner` <br />`line`  <br />`circlesmall` <br /> Default is a large circle.',
						optional: true
					},
					{
						type: '',
						name: 'FormatRange',
						description: 'Cell range to provide additional scale information. It must be a range with 3 columns. The values in the first column provides a scale value. The value in the second column provides a label, that is displayed instead of the scale value. This is optional. The value in the third column can provide a hexadecimal color value. This is used to color the scale between the last value and the current value in column one. This way you can define a colored scale indicating valid, invalid oder desired values ranges. See the sample below.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if slider could be created.'
				},
				examples: {
					infoStart: '\n| | A | B | C |\n|---|---|---|---|\n| 1 | 0 | Bad  | #FF0000 |\n| 2 | 30 | Average | #00FF00 |\n| 3 | 70 | Good | #0000FF |\n',
					infoEnd: '',
					formulas: [
						{
							formula: '=DRAW.SLIDER(51800,20705,14314,6509, "#AAAAAA","#DDDDDD",,"Slider", A1,0,100,5,,D11:F13)',
							result: 'TRUE',
							comment: 'Draw a slider with an interval from 0 to 100 and a step value of 5. As a format range is given, the slider scale will be colored and custom labels will be applied. The selected value will be pushed into cell A1.'
						},
					]
				}
			}
		},
		QRCODE: {
			default: {
				category: 'Shape',
				description: 'Create a QRCode key, that can be used for an image fill.',
				inlineDescription: 'Create a QRCode key, that can be used for an image fill.',
				arguments: [
					{
						type: '',
						name: 'Text',
						description: 'Text to encode in QRCode image',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'QRCode identifier'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: 'QRCODE("Text)',
							result: '"qrcode:Test"',
							comment: 'The return as fill pattern to indicate the desired image.'
						}
					]
				}
			}
		}
	},
};
