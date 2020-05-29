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
const Coordinate = require('../Coordinate');
const ReshapeCoordinate = require('../ReshapeCoordinate');
const RowHeaderNode = require('./RowHeaderNode');
const InboxContainer = require('./InboxContainer');
const ButtonNode = require('./ButtonNode');
const TextNode = require('./TextNode');
const ContentNode = require('./ContentNode');
const SheetButtonNode = require('./SheetButtonNode');
const SheetCheckboxNode = require('./SheetCheckboxNode');
const SheetSliderNode = require('./SheetSliderNode');
const SheetKnobNode = require('./SheetKnobNode');
const CaptionNode = require('./CaptionNode');
const CellsNode = require('./CellsNode');
const HeaderNode = require('./HeaderNode');
const LineNode = require('./LineNode');
const Node = require('./Node');
const Port = require('./Port');
const PortMapper = require('./PortMapper');
const ColumnHeaderNode = require('./ColumnHeaderNode');
const SheetHeaderNode = require('./SheetHeaderNode');
const WorksheetNode = require('./WorksheetNode');
const StreamSheetContainer = require('./StreamSheetContainer');
const StreamSheetsContainer = require('./StreamSheetsContainer');
const MachineContainer = require('./MachineContainer');
const StreamSheet = require('./StreamSheet');
const OutboxContainer = require('./OutboxContainer');
const ScrollbarNode = require('./ScrollbarNode');
const SplitterNode = require('./SplitterNode');
const MachineGraph = require('./MachineGraph');
const TreeNode = require('./TreeNode');
const TreeItemsNode = require('./TreeItemsNode');
const RectangleShape = require('./shapes/RectangleShape');
const BezierShape = require('./shapes/BezierShape');
const OrthoLineShape = require('./shapes/OrthoLineShape');
const PolygonShape = require('./shapes/PolygonShape');
const ItemAttributes = require('../attr/ItemAttributes');
const FormatAttributes = require('../attr/FormatAttributes');
const NumberExpression = require('../expr/NumberExpression');
const Edge = require('./Edge');
const Graph = require('./Graph');
const Group = require('./Group');
const ShapeBuilder = require('./ShapeBuilder');
const GraphItemProperties = require('../properties/GraphItemProperties');
const { SheetPlotNode } = require('@cedalo/jsg-extensions/core');

/**
 * The GraphItemFactory is used to create GraphItems by their name. The generic items are handled
 * by the system creating generic {{#crossLink "Node"}}{{/crossLink}}s
 * and {{#crossLink "Edge"}}{{/crossLink}}s. You can also create complex predefined
 * shapes like stars and others. By extending and deriving this class, you can introduce your own
 * complex shapes by creating them dynamically or reading them from a definition file or database.
 * In addition the factory is called, to give the developer a chance to add custom properties,
 * friend items or container restrictions. By default, these calls are not handled, but you can
 * create your own implementation e.g. to add custom properties to any GraphItem or a specific
 * type of GraphItem.</br>
 * The globally used GraphItemFactory is registered with the global namespace object:
 * {{#crossLink "JSG/graphItemFactory:property"}}{{/crossLink}}
 *
 * @class GraphItemFactory
 * @constructor
 */
class GraphItemFactory {
	/**
	 * Creates a new graph item from given string.
	 *
	 * @method createItemFromString
	 * @param {String} typeStr A unique string to identify the item to create.
	 * @param {Boolean} reading True, if item is created during reading.
	 * @return {GraphItem} A new graph item.
	 */
	createItemFromString(typeStr, reading) {
		const props = GraphItemProperties;
		let edge;

		function initLeftBracketShape(shape) {
			shape._cpFromCoordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
			shape._coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH * 0.55'), shape._newExpression(0))
			);

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0), shape._newExpression(0, 'WIDTH * 0.55'))
			);
			shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'WIDTH')));
			shape._cpToCoordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'WIDTH * 2')));

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT - WIDTH * 2'))
			);
			shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT - WIDTH')));
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT - WIDTH * 0.55'))
			);

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH * 0.55'), shape._newExpression(0, 'HEIGHT'))
			);
			shape._coordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT'))
			);
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT'))
			);
		}

		function initLeftBracketShapeCurved(shape) {
			shape._cpFromCoordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
			shape._coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH * 0.55'), shape._newExpression(0))
			);

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'WIDTH * 0.55'))
			);
			shape._coordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'WIDTH'))
			);
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'WIDTH * 2'))
			);

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 4'))
			);
			shape._coordinates.push(
				new Coordinate(
					shape._newExpression(0, 'WIDTH / 2'),
					shape._newExpression(0, 'HEIGHT / 2 - WIDTH * 0.45')
				)
			);
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 2'))
			);

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT / 2'))
			);
			shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT / 2')));
			shape._cpToCoordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT / 2')));

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 2'))
			);
			shape._coordinates.push(
				new Coordinate(
					shape._newExpression(0, 'WIDTH / 2'),
					shape._newExpression(0, 'HEIGHT / 2 + WIDTH * 0.45')
				)
			);
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT * 0.75'))
			);

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT - WIDTH * 2'))
			);
			shape._coordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT - WIDTH'))
			);
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT - WIDTH * 0.55'))
			);

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH * 0.55'), shape._newExpression(0, 'HEIGHT'))
			);
			shape._coordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT'))
			);
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT'))
			);
		}

		function initRightBracketShape(shape) {
			shape._cpFromCoordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
			shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH * 0.45'), shape._newExpression(0))
			);

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'WIDTH * 0.55'))
			);
			shape._coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'WIDTH')));
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'WIDTH * 2'))
			);

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT - WIDTH * 2'))
			);
			shape._coordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT - WIDTH'))
			);
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT - WIDTH * 0.55'))
			);

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH * 0.45'), shape._newExpression(0, 'HEIGHT'))
			);
			shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));
			shape._cpToCoordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));
		}

		function initRightBracketShapeCurved(shape) {
			shape._cpFromCoordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
			shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH * 0.45'), shape._newExpression(0))
			);

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'WIDTH * 0.55'))
			);
			shape._coordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'WIDTH'))
			);
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'WIDTH * 2'))
			);

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 4'))
			);
			shape._coordinates.push(
				new Coordinate(
					shape._newExpression(0, 'WIDTH / 2'),
					shape._newExpression(0, 'HEIGHT / 2 - WIDTH * 0.45')
				)
			);
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 2'))
			);

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT / 2'))
			);
			shape._coordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT / 2'))
			);
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT / 2'))
			);

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 2'))
			);
			shape._coordinates.push(
				new Coordinate(
					shape._newExpression(0, 'WIDTH / 2'),
					shape._newExpression(0, 'HEIGHT / 2 + WIDTH * 0.45')
				)
			);
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT * 0.75'))
			);

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT - WIDTH * 2'))
			);
			shape._coordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT - WIDTH'))
			);
			shape._cpToCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT - WIDTH * 0.55'))
			);

			shape._cpFromCoordinates.push(
				new Coordinate(shape._newExpression(0, 'WIDTH * 0.45'), shape._newExpression(0, 'HEIGHT'))
			);
			shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));
			shape._cpToCoordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));
		}

		function createPolyEdge(rays, star) {
			const shape = new PolygonShape();
			const node = new Node(shape);
			let i;

			if (star) {
				const p = new ReshapeCoordinate(
					shape._newExpression(0.5),
					shape._newExpression(0.3),
					0.5,
					0.5,
					0,
					0.5,
					'DEPTH',
					ReshapeCoordinate.ReshapeType.NONE,
					ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT
				);
				node._reshapeCoordinates.push(p);
			}

			for (i = 0; i < rays; i += 1) {
				const sinValue = Math.round(Math.sin(((Math.PI * 2) / rays) * i - Math.PI / 2) * 100) / 100;
				const cosValue = Math.round(Math.cos(((Math.PI * 2) / rays) * i - Math.PI / 2) * 100) / 100;
				const innerSinValue =
					Math.round(Math.sin(((Math.PI * 2) / rays) * (i + 0.5) - Math.PI / 2) * 100) / 100;
				const innerCosValue =
					Math.round(Math.cos(((Math.PI * 2) / rays) * (i + 0.5) - Math.PI / 2) * 100) / 100;

				shape._coordinates.push(
					new Coordinate(
						shape._newExpression(0, `WIDTH / 2 * ${1 + cosValue}`),
						shape._newExpression(0, `HEIGHT / 2 * ${1 + sinValue}`)
					)
				);
				if (star) {
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, `WIDTH / 2 + WIDTH / 2 * ${innerCosValue} * (1 - DEPTH * 2)`),
							shape._newExpression(0, `HEIGHT / 2 + HEIGHT / 2 * ${innerSinValue} * (1 - DEPTH * 2)`)
						)
					);
				}
			}

			if (star) {
				node._reshapeProperties.addIndexProperty('DEPTH', props.getReshapePointY, props.setReshapePointY, 0);
			}

			return node;
		}

		function initLocalPin(node) {
			const pin = node.getPin();
			pin.setLocalCoordinate(new NumberExpression(0, 'WIDTH * 0.5'), new NumberExpression(0, 'HEIGHT * 0.5'));
		}

		function createItem(type) {
			let shape;
			let node;
			let p;
			let nodeLeft;
			let shapeLeft;
			let pin;
			let shapeRight;
			let nodeRight;

			switch (type) {
				case 'rect':
					shape = new RectangleShape();
					node = new Node(shape);
					break;
				case 'roundRect':
				case 'roundRectCornerCut':
				case 'roundRectCornerCutSame':
				case 'roundRectCornerCutDiagonal': {
					shape = new BezierShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0.1),
						shape._newExpression(0),
						0,
						0.5,
						0,
						0,
						'ROUND',
						ReshapeCoordinate.ReshapeType.XRELATIVETOMINFROMRIGHT,
						ReshapeCoordinate.ReshapeType.NONE
					);
					node._reshapeCoordinates.push(p);

					if (type === 'roundRectCornerCutSame') {
						p = new ReshapeCoordinate(
							shape._newExpression(0.0),
							shape._newExpression(1),
							0,
							0.5,
							1,
							1,
							'ROUND2',
							ReshapeCoordinate.ReshapeType.XRELATIVETOMIN,
							ReshapeCoordinate.ReshapeType.NONE
						);
						node._reshapeCoordinates.push(p);
					} else if (type === 'roundRectCornerCutDiagonal') {
						p = new ReshapeCoordinate(
							shape._newExpression(0.0),
							shape._newExpression(0),
							0,
							0.5,
							0,
							0,
							'ROUND2',
							ReshapeCoordinate.ReshapeType.XRELATIVETOMIN,
							ReshapeCoordinate.ReshapeType.NONE
						);
						node._reshapeCoordinates.push(p);
					}

					// left top
					let factor = 'ROUND';
					if (type === 'roundRectCornerCutDiagonal') {
						factor = 'ROUND2';
					}
					if (type === 'roundRectCornerCut') {
						shape._cpFromCoordinates.push(
							new Coordinate(shape._newExpression(0), shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.2'))
						);
						shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
						shape._cpToCoordinates.push(
							new Coordinate(shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.2'), shape._newExpression(0))
						);
					} else {
						shape._cpFromCoordinates.push(
							new Coordinate(
								shape._newExpression(0, `MIN(WIDTH, HEIGHT) * ${factor} * 0.45`),
								shape._newExpression(0)
							)
						);
						shape._coordinates.push(
							new Coordinate(
								shape._newExpression(0, `MIN(WIDTH, HEIGHT) * ${factor}`),
								shape._newExpression(0)
							)
						);
						shape._cpToCoordinates.push(
							new Coordinate(shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.4'), shape._newExpression(0))
						);
					}

					// right top
					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.6'), shape._newExpression(0))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - MIN(WIDTH, HEIGHT) * ROUND'),
							shape._newExpression(0)
						)
					);
					shape._cpToCoordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - MIN(WIDTH, HEIGHT) * ROUND * 0.45'),
							shape._newExpression(0)
						)
					);

					shape._cpFromCoordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH'),
							shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * ROUND * 0.45')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH'),
							shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * ROUND')
						)
					);
					shape._cpToCoordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH'),
							shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.4')
						)
					);

					// right bottom
					factor = 'ROUND';
					if (type === 'roundRectCornerCutSame' || type === 'roundRectCornerCutDiagonal') {
						factor = 'ROUND2';
					}
					if (type === 'roundRectCornerCut') {
						shape._cpFromCoordinates.push(
							new Coordinate(
								shape._newExpression(0, 'WIDTH'),
								shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.8')
							)
						);
						shape._coordinates.push(
							new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT'))
						);
						shape._cpToCoordinates.push(
							new Coordinate(
								shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.8'),
								shape._newExpression(0, 'HEIGHT')
							)
						);
					} else {
						shape._cpFromCoordinates.push(
							new Coordinate(
								shape._newExpression(0, 'WIDTH'),
								shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.6')
							)
						);
						shape._coordinates.push(
							new Coordinate(
								shape._newExpression(0, 'WIDTH'),
								shape._newExpression(0, `HEIGHT - ${factor} * MIN(WIDTH, HEIGHT)`)
							)
						);
						shape._cpToCoordinates.push(
							new Coordinate(
								shape._newExpression(0, 'WIDTH'),
								shape._newExpression(0, `HEIGHT - MIN(WIDTH, HEIGHT) * ${factor} * 0.45`)
							)
						);
						shape._cpFromCoordinates.push(
							new Coordinate(
								shape._newExpression(0, `WIDTH - MIN(WIDTH, HEIGHT) * ${factor} * 0.45`),
								shape._newExpression(0, 'HEIGHT')
							)
						);
						shape._coordinates.push(
							new Coordinate(
								shape._newExpression(0, `WIDTH - MIN(WIDTH, HEIGHT) * ${factor}`),
								shape._newExpression(0, 'HEIGHT')
							)
						);
						shape._cpToCoordinates.push(
							new Coordinate(
								shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.6'),
								shape._newExpression(0, 'HEIGHT')
							)
						);
					}

					// left bottom
					factor = 'ROUND';
					if (type === 'roundRectCornerCutSame') {
						factor = 'ROUND2';
					}
					if (type === 'roundRectCornerCut') {
						shape._cpFromCoordinates.push(
							new Coordinate(
								shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.2'),
								shape._newExpression(0, 'HEIGHT')
							)
						);
						shape._coordinates.push(
							new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT'))
						);
						shape._cpToCoordinates.push(
							new Coordinate(shape._newExpression(0), shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.8'))
						);
					} else {
						shape._cpFromCoordinates.push(
							new Coordinate(
								shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.4'),
								shape._newExpression(0, 'HEIGHT')
							)
						);
						shape._coordinates.push(
							new Coordinate(
								shape._newExpression(0, `MIN(WIDTH, HEIGHT) * ${factor}`),
								shape._newExpression(0, 'HEIGHT')
							)
						);
						shape._cpToCoordinates.push(
							new Coordinate(
								shape._newExpression(0, `MIN(WIDTH, HEIGHT) * ${factor} * 0.45`),
								shape._newExpression(0, 'HEIGHT')
							)
						);
						shape._cpFromCoordinates.push(
							new Coordinate(
								shape._newExpression(0),
								shape._newExpression(0, `HEIGHT - MIN(WIDTH, HEIGHT) * ${factor} * 0.45`)
							)
						);
						shape._coordinates.push(
							new Coordinate(
								shape._newExpression(0),
								shape._newExpression(0, `HEIGHT - MIN(WIDTH, HEIGHT) * ${factor}`)
							)
						);
						shape._cpToCoordinates.push(
							new Coordinate(shape._newExpression(0), shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.6'))
						);
					}

					// left top
					factor = 'ROUND';
					if (type === 'roundRectCornerCutDiagonal') {
						factor = 'ROUND2';
					}
					if (type !== 'roundRectCornerCut') {
						shape._cpFromCoordinates.push(
							new Coordinate(shape._newExpression(0), shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * 0.4'))
						);
						shape._coordinates.push(
							new Coordinate(
								shape._newExpression(0),
								shape._newExpression(0, `MIN(WIDTH, HEIGHT) * ${factor}`)
							)
						);
						shape._cpToCoordinates.push(
							new Coordinate(
								shape._newExpression(0),
								shape._newExpression(0, `MIN(WIDTH, HEIGHT) * ${factor} * 0.45`)
							)
						);
					}

					node._reshapeProperties.addIndexProperty(
						'ROUND',
						props.getReshapePointX,
						props.setReshapePointX,
						0
					);
					if (type === 'roundRectCornerCutSame' || type === 'roundRectCornerCutDiagonal') {
						node._reshapeProperties.addIndexProperty(
							'ROUND2',
							props.getReshapePointX,
							props.setReshapePointX,
							1
						);
					}
					break;
				}
				case 'rectCornerCut':
					shape = new PolygonShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0.1),
						shape._newExpression(0),
						0,
						1,
						0,
						0,
						'CUT',
						ReshapeCoordinate.ReshapeType.XRELATIVETOMINFROMRIGHT,
						ReshapeCoordinate.ReshapeType.NONE
					);
					node._reshapeCoordinates.push(p);

					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH'),
							shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * CUT')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - MIN(WIDTH, HEIGHT) * CUT'),
							shape._newExpression(0)
						)
					);

					node._reshapeProperties.addIndexProperty('CUT', props.getReshapePointX, props.setReshapePointX, 0);
					break;
				case 'rectCornerCutSame':
					shape = new PolygonShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0.1),
						shape._newExpression(0),
						0,
						0.5,
						0,
						0,
						'CUTTOP',
						ReshapeCoordinate.ReshapeType.XRELATIVETOMIN,
						ReshapeCoordinate.ReshapeType.NONE
					);
					node._reshapeCoordinates.push(p);
					p = new ReshapeCoordinate(
						shape._newExpression(0.0),
						shape._newExpression(1),
						0,
						0.5,
						1,
						1,
						'CUTBOTTOM',
						ReshapeCoordinate.ReshapeType.XRELATIVETOMIN,
						ReshapeCoordinate.ReshapeType.NONE
					);
					node._reshapeCoordinates.push(p);

					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * CUTTOP'), shape._newExpression(0))
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * CUTTOP'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0),
							shape._newExpression(0, 'HEIGHT - MIN(WIDTH, HEIGHT) * CUTBOTTOM')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * CUTBOTTOM'),
							shape._newExpression(0, 'HEIGHT')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - MIN(WIDTH, HEIGHT) * CUTBOTTOM'),
							shape._newExpression(0, 'HEIGHT')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH'),
							shape._newExpression(0, 'HEIGHT - MIN(WIDTH, HEIGHT) * CUTBOTTOM')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH'),
							shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * CUTTOP')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - MIN(WIDTH, HEIGHT) * CUTTOP'),
							shape._newExpression(0)
						)
					);

					node._reshapeProperties.addIndexProperty(
						'CUTTOP',
						props.getReshapePointX,
						props.setReshapePointX,
						0
					);
					node._reshapeProperties.addIndexProperty(
						'CUTBOTTOM',
						props.getReshapePointX,
						props.setReshapePointX,
						1
					);
					break;
				case 'rectCornerCutDiagonal':
					shape = new PolygonShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0.1),
						shape._newExpression(0),
						0,
						0.5,
						0,
						0,
						'CUTLTRB',
						ReshapeCoordinate.ReshapeType.XRELATIVETOMIN,
						ReshapeCoordinate.ReshapeType.NONE
					);
					node._reshapeCoordinates.push(p);
					p = new ReshapeCoordinate(
						shape._newExpression(0.0),
						shape._newExpression(0),
						0,
						0.5,
						0,
						0,
						'CUTRTLB',
						ReshapeCoordinate.ReshapeType.XRELATIVETOMINFROMRIGHT,
						ReshapeCoordinate.ReshapeType.NONE
					);
					node._reshapeCoordinates.push(p);

					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * CUTLTRB'), shape._newExpression(0))
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * CUTLTRB'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0),
							shape._newExpression(0, 'HEIGHT - MIN(WIDTH, HEIGHT) * CUTRTLB')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * CUTRTLB'),
							shape._newExpression(0, 'HEIGHT')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - MIN(WIDTH, HEIGHT) * CUTLTRB'),
							shape._newExpression(0, 'HEIGHT')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH'),
							shape._newExpression(0, 'HEIGHT - MIN(WIDTH, HEIGHT) * CUTLTRB')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH'),
							shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * CUTRTLB')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - MIN(WIDTH, HEIGHT) * CUTRTLB'),
							shape._newExpression(0)
						)
					);

					node._reshapeProperties.addIndexProperty(
						'CUTLTRB',
						props.getReshapePointX,
						props.setReshapePointX,
						0
					);
					node._reshapeProperties.addIndexProperty(
						'CUTRTLB',
						props.getReshapePointX,
						props.setReshapePointX,
						1
					);
					break;
				case 'trapezoidalTop':
					shape = new PolygonShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0.2),
						shape._newExpression(0),
						0,
						0.5,
						0,
						0,
						'TOP',
						ReshapeCoordinate.ReshapeType.XRELATIVETOMIN,
						ReshapeCoordinate.ReshapeType.NONE
					);
					node._reshapeCoordinates.push(p);

					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * TOP'), shape._newExpression(0))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - MIN(WIDTH, HEIGHT) * TOP'),
							shape._newExpression(0)
						)
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT'))
					);
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));

					node._reshapeProperties.addIndexProperty('TOP', props.getReshapePointX, props.setReshapePointX, 0);
					break;
				case 'trapezoidalBottom':
					shape = new PolygonShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0.2),
						shape._newExpression(0),
						0,
						0.5,
						1,
						1,
						'BOTTOM',
						ReshapeCoordinate.ReshapeType.XRELATIVETOMIN,
						ReshapeCoordinate.ReshapeType.NONE
					);
					node._reshapeCoordinates.push(p);

					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
					shape._coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - MIN(WIDTH, HEIGHT) * BOTTOM'),
							shape._newExpression(0, 'HEIGHT')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MIN(WIDTH, HEIGHT) * BOTTOM'),
							shape._newExpression(0, 'HEIGHT')
						)
					);

					node._reshapeProperties.addIndexProperty(
						'BOTTOM',
						props.getReshapePointX,
						props.setReshapePointX,
						0
					);
					break;
				case 'parallelogrammTopToRight':
					shape = new PolygonShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0.2),
						shape._newExpression(0),
						0,
						0.5,
						0,
						0,
						'TOP',
						ReshapeCoordinate.ReshapeType.XRELATIVETOWIDTH,
						ReshapeCoordinate.ReshapeType.NONE
					);
					node._reshapeCoordinates.push(p);

					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * TOP'), shape._newExpression(0))
					);
					shape._coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - WIDTH * TOP'),
							shape._newExpression(0, 'HEIGHT')
						)
					);
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));

					node._reshapeProperties.addIndexProperty('TOP', props.getReshapePointX, props.setReshapePointX, 0);
					break;
				case 'parallelogrammLeftToBottom':
					shape = new PolygonShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0.0),
						shape._newExpression(0.2),
						0,
						0,
						0,
						0.5,
						'LEFT',
						ReshapeCoordinate.ReshapeType.NONE,
						ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT
					);
					node._reshapeCoordinates.push(p);

					shape._coordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * LEFT'))
					);
					shape._coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH'),
							shape._newExpression(0, 'HEIGHT - HEIGHT * LEFT')
						)
					);
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));

					node._reshapeProperties.addIndexProperty('LEFT', props.getReshapePointY, props.setReshapePointY, 0);
					break;
				case 'bracketSimpleBoth':
					shape = new RectangleShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0),
						shape._newExpression(0.2),
						0,
						0,
						0,
						0.3,
						'CURVE',
						ReshapeCoordinate.ReshapeType.NONE,
						ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT
					);
					node._reshapeCoordinates.push(p);
					node.getFormat().setFillStyle(FormatAttributes.FillStyle.NONE);
					node.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
					node.getItemAttributes().setSelectParentFirst(true);
					node.setItemAttribute(ItemAttributes.EDITMASK, ItemAttributes.EditMask.COORDINATES);
					node._reshapeProperties.addIndexProperty(
						'CURVE',
						props.getReshapePointY,
						props.setReshapePointY,
						0
					);

					// left bracket
					if (type !== 'bracketSimpleRight') {
						shapeLeft = new BezierShape();
						nodeLeft = new Node(shapeLeft);
						nodeLeft.setItemAttribute(ItemAttributes.SIZEABLE, false);
						nodeLeft.setItemAttribute(ItemAttributes.MOVEABLE, ItemAttributes.Moveable.NONE);
						nodeLeft.setItemAttribute(ItemAttributes.CLOSED, false);
						nodeLeft.setItemAttribute(ItemAttributes.CONTAINER, false);
						nodeLeft.setItemAttribute(ItemAttributes.ITEMPART, true);
						nodeLeft.setSize(
							new NumberExpression(0, 'Parent!HEIGHT * Parent!CURVE'),
							new NumberExpression(0, 'Parent!HEIGHT')
						);
						initLocalPin(nodeLeft);
						pin = nodeLeft.getPin();
						pin.setCoordinate(
							new NumberExpression(0, 'Parent!HEIGHT * Parent!CURVE / 2'),
							new NumberExpression(0, 'Parent!HEIGHT / 2')
						);
						initLeftBracketShape(shapeLeft);
						node.addItem(nodeLeft);
					}

					// right bracket
					if (type !== 'bracketSimpleLeft') {
						shapeRight = new BezierShape();
						nodeRight = new Node(shapeRight);
						nodeRight.setItemAttribute(ItemAttributes.SIZEABLE, false);
						nodeRight.setItemAttribute(ItemAttributes.MOVEABLE, ItemAttributes.Moveable.NONE);
						nodeRight.setItemAttribute(ItemAttributes.CLOSED, false);
						nodeRight.setItemAttribute(ItemAttributes.CONTAINER, false);
						nodeRight.setItemAttribute(ItemAttributes.ITEMPART, true);
						nodeRight.setSize(
							new NumberExpression(0, 'Parent!HEIGHT * Parent!CURVE'),
							new NumberExpression(0, 'Parent!HEIGHT')
						);
						initLocalPin(nodeRight);
						pin = nodeRight.getPin();
						pin.setCoordinate(
							new NumberExpression(0, 'Parent!WIDTH - Parent!HEIGHT * Parent!CURVE / 2'),
							new NumberExpression(0, 'Parent!HEIGHT / 2')
						);
						initRightBracketShape(shapeRight);
						node.addItem(nodeRight);
					}
					break;
				case 'bracketSimpleLeft':
					shape = new BezierShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0),
						shape._newExpression(0.2),
						0,
						0,
						0,
						0.4,
						'CURVE',
						ReshapeCoordinate.ReshapeType.NONE,
						ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT
					);
					node._reshapeCoordinates.push(p);
					node._reshapeProperties.addIndexProperty(
						'CURVE',
						props.getReshapePointY,
						props.setReshapePointY,
						0
					);

					node.setItemAttribute(ItemAttributes.CLOSED, false);
					node.setItemAttribute(ItemAttributes.CONTAINER, false);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0))
					);
					shape._coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.55'), shape._newExpression(0))
					);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * CURVE / 2'))
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * CURVE'))
					);
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT / 2'))
					);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT / 2'))
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT - HEIGHT * CURVE'))
					);
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT - HEIGHT * CURVE / 2'))
					);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.55'), shape._newExpression(0, 'HEIGHT'))
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT'))
					);
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT'))
					);
					break;
				case 'bracketSimpleRight':
					shape = new BezierShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(1),
						shape._newExpression(0.2),
						1,
						1,
						0,
						0.4,
						'CURVE',
						ReshapeCoordinate.ReshapeType.NONE,
						ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT
					);
					node._reshapeCoordinates.push(p);
					node._reshapeProperties.addIndexProperty(
						'CURVE',
						props.getReshapePointY,
						props.setReshapePointY,
						0
					);

					node.setItemAttribute(ItemAttributes.CLOSED, false);
					node.setItemAttribute(ItemAttributes.CONTAINER, false);

					shape._cpFromCoordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.45'), shape._newExpression(0))
					);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * CURVE / 2'))
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * CURVE'))
					);
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT / 2'))
					);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT / 2'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH'),
							shape._newExpression(0, 'HEIGHT - HEIGHT * CURVE')
						)
					);
					shape._cpToCoordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH'),
							shape._newExpression(0, 'HEIGHT - HEIGHT * CURVE / 2')
						)
					);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.45'), shape._newExpression(0, 'HEIGHT'))
					);
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT'))
					);
					break;
				case 'bracketCurvedBoth':
					shape = new RectangleShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0),
						shape._newExpression(0.2),
						0,
						0,
						0,
						0.3,
						'CURVE',
						ReshapeCoordinate.ReshapeType.NONE,
						ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT
					);
					node._reshapeCoordinates.push(p);
					node.getFormat().setFillStyle(FormatAttributes.FillStyle.NONE);
					node.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
					node.getItemAttributes().setSelectParentFirst(true);
					node.setItemAttribute(ItemAttributes.EDITMASK, ItemAttributes.EditMask.COORDINATES);
					node._reshapeProperties.addIndexProperty(
						'CURVE',
						props.getReshapePointY,
						props.setReshapePointY,
						0
					);

					// left bracket
					if (type !== 'bracketCurvedRight') {
						shapeLeft = new BezierShape();
						nodeLeft = new Node(shapeLeft);
						nodeLeft.setItemAttribute(ItemAttributes.SIZEABLE, false);
						nodeLeft.setItemAttribute(ItemAttributes.MOVEABLE, ItemAttributes.Moveable.NONE);
						nodeLeft.setItemAttribute(ItemAttributes.CLOSED, false);
						nodeLeft.setItemAttribute(ItemAttributes.CONTAINER, false);
						nodeLeft.setItemAttribute(ItemAttributes.ITEMPART, true);
						nodeLeft.setSize(
							new NumberExpression(0, 'Parent!HEIGHT * Parent!CURVE'),
							new NumberExpression(0, 'Parent!HEIGHT')
						);
						initLocalPin(nodeLeft);
						pin = nodeLeft.getPin();
						pin.setCoordinate(
							new NumberExpression(0, 'Parent!HEIGHT * Parent!CURVE / 2'),
							new NumberExpression(0, 'Parent!HEIGHT / 2')
						);
						initLeftBracketShapeCurved(shapeLeft);
						node.addItem(nodeLeft);
					}

					// right bracket
					if (type !== 'bracketCurvedLeft') {
						shapeRight = new BezierShape();
						nodeRight = new Node(shapeRight);
						nodeRight.setItemAttribute(ItemAttributes.SIZEABLE, false);
						nodeRight.setItemAttribute(ItemAttributes.MOVEABLE, ItemAttributes.Moveable.NONE);
						nodeRight.setItemAttribute(ItemAttributes.CLOSED, false);
						nodeRight.setItemAttribute(ItemAttributes.CONTAINER, false);
						nodeRight.setItemAttribute(ItemAttributes.ITEMPART, true);
						nodeRight.setSize(
							new NumberExpression(0, 'Parent!HEIGHT * Parent!CURVE'),
							new NumberExpression(0, 'Parent!HEIGHT')
						);
						initLocalPin(nodeRight);
						pin = nodeRight.getPin();
						pin.setCoordinate(
							new NumberExpression(0, 'Parent!WIDTH - Parent!HEIGHT * Parent!CURVE / 2'),
							new NumberExpression(0, 'Parent!HEIGHT / 2')
						);
						initRightBracketShapeCurved(shapeRight);
						node.addItem(nodeRight);
					}
					break;
				case 'bracketCurvedLeft':
					shape = new BezierShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0),
						shape._newExpression(0.2),
						0,
						0,
						0,
						0.4,
						'CURVE',
						ReshapeCoordinate.ReshapeType.NONE,
						ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT
					);
					node._reshapeCoordinates.push(p);
					node._reshapeProperties.addIndexProperty(
						'CURVE',
						props.getReshapePointY,
						props.setReshapePointY,
						0
					);

					node.setItemAttribute(ItemAttributes.CLOSED, false);
					node.setItemAttribute(ItemAttributes.CONTAINER, false);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0))
					);
					shape._coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.55'), shape._newExpression(0))
					);

					shape._cpFromCoordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH / 2'),
							shape._newExpression(0, 'HEIGHT * CURVE / 2')
						)
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT * CURVE'))
					);
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 2'))
					);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 4'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH / 2'),
							shape._newExpression(0, 'HEIGHT / 2 - HEIGHT * CURVE / 2')
						)
					);
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 2'))
					);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT / 2'))
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT / 2'))
					);
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT / 2'))
					);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 2'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH / 2'),
							shape._newExpression(0, 'HEIGHT / 2 + HEIGHT * CURVE / 2')
						)
					);
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT * 0.75'))
					);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 2'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH / 2'),
							shape._newExpression(0, 'HEIGHT - HEIGHT * CURVE')
						)
					);
					shape._cpToCoordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH / 2'),
							shape._newExpression(0, 'HEIGHT - HEIGHT * CURVE / 2')
						)
					);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.55'), shape._newExpression(0, 'HEIGHT'))
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT'))
					);
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT'))
					);

					break;
				case 'bracketCurvedRight':
					shape = new BezierShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(1),
						shape._newExpression(0.2),
						1,
						1,
						0,
						0.4,
						'CURVE',
						ReshapeCoordinate.ReshapeType.NONE,
						ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT
					);
					node._reshapeCoordinates.push(p);
					node._reshapeProperties.addIndexProperty(
						'CURVE',
						props.getReshapePointY,
						props.setReshapePointY,
						0
					);

					node.setItemAttribute(ItemAttributes.CLOSED, false);
					node.setItemAttribute(ItemAttributes.CONTAINER, false);

					shape._cpFromCoordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.45'), shape._newExpression(0))
					);

					shape._cpFromCoordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH / 2'),
							shape._newExpression(0, 'HEIGHT * CURVE / 2')
						)
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT * CURVE'))
					);
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 2'))
					);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 4'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH / 2'),
							shape._newExpression(0, 'HEIGHT / 2 - HEIGHT * CURVE / 2')
						)
					);
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 2'))
					);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT / 2'))
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT / 2'))
					);
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT / 2'))
					);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 2'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH / 2'),
							shape._newExpression(0, 'HEIGHT / 2 + HEIGHT * CURVE / 2')
						)
					);
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT * 0.75'))
					);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT / 2'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH / 2'),
							shape._newExpression(0, 'HEIGHT - HEIGHT * CURVE')
						)
					);
					shape._cpToCoordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH / 2'),
							shape._newExpression(0, 'HEIGHT - HEIGHT * CURVE / 2')
						)
					);

					shape._cpFromCoordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.45'), shape._newExpression(0, 'HEIGHT'))
					);
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));
					shape._cpToCoordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT'))
					);
					break;
				case 'arrowLeft':
					shape = new PolygonShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(1),
						shape._newExpression(0.2),
						1,
						1,
						0,
						0.5,
						'BASE',
						ReshapeCoordinate.ReshapeType.NONE,
						ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT
					);
					node._reshapeCoordinates.push(p);
					p = new ReshapeCoordinate(
						shape._newExpression(0.5),
						shape._newExpression(0),
						0,
						1,
						0,
						0,
						'ARROWLENGTH',
						ReshapeCoordinate.ReshapeType.XRELATIVETOHEIGHT,
						ReshapeCoordinate.ReshapeType.NONE
					);
					node._reshapeCoordinates.push(p);

					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * BASE'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MIN(WIDTH, ARROWLENGTH * HEIGHT)'),
							shape._newExpression(0, 'HEIGHT * BASE')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MIN(WIDTH, ARROWLENGTH * HEIGHT)'),
							shape._newExpression(0)
						)
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.5'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MIN(WIDTH, ARROWLENGTH * HEIGHT)'),
							shape._newExpression(0, 'HEIGHT')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MIN(WIDTH, ARROWLENGTH * HEIGHT)'),
							shape._newExpression(0, 'HEIGHT * (1 - BASE)')
						)
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * (1 - BASE)'))
					);

					node._reshapeProperties.addIndexProperty('BASE', props.getReshapePointY, props.setReshapePointY, 0);
					node._reshapeProperties.addIndexProperty(
						'ARROWLENGTH',
						props.getReshapePointX,
						props.setReshapePointX,
						1
					);
					break;
				case 'arrowUp':
					shape = new PolygonShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0.2),
						shape._newExpression(1),
						0,
						0.5,
						1,
						1,
						'BASE',
						ReshapeCoordinate.ReshapeType.XRELATIVETOWIDTH,
						ReshapeCoordinate.ReshapeType.NONE
					);
					node._reshapeCoordinates.push(p);
					p = new ReshapeCoordinate(
						shape._newExpression(0),
						shape._newExpression(0.5),
						0,
						0,
						0,
						1,
						'ARROWLENGTH',
						ReshapeCoordinate.ReshapeType.NONE,
						ReshapeCoordinate.ReshapeType.YRELATIVETOWIDTH
					);
					node._reshapeCoordinates.push(p);

					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * BASE'), shape._newExpression(0, 'HEIGHT'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH * BASE'),
							shape._newExpression(0, 'MIN(HEIGHT, ARROWLENGTH * WIDTH)')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0),
							shape._newExpression(0, 'MIN(HEIGHT, ARROWLENGTH * WIDTH)')
						)
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.5'), shape._newExpression(0))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH'),
							shape._newExpression(0, 'MIN(HEIGHT, ARROWLENGTH * WIDTH)')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH * (1 - BASE)'),
							shape._newExpression(0, 'MIN(HEIGHT, ARROWLENGTH * WIDTH)')
						)
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * (1 - BASE)'), shape._newExpression(0, 'HEIGHT'))
					);

					node._reshapeProperties.addIndexProperty('BASE', props.getReshapePointX, props.setReshapePointX, 0);
					node._reshapeProperties.addIndexProperty(
						'ARROWLENGTH',
						props.getReshapePointY,
						props.setReshapePointY,
						1
					);
					break;
				case 'arrowRight':
					shape = new PolygonShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0),
						shape._newExpression(0.2),
						0,
						0,
						0,
						0.5,
						'BASE',
						ReshapeCoordinate.ReshapeType.NONE,
						ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT
					);
					node._reshapeCoordinates.push(p);
					p = new ReshapeCoordinate(
						shape._newExpression(0.5),
						shape._newExpression(0),
						0,
						1,
						0,
						0,
						'ARROWLENGTH',
						ReshapeCoordinate.ReshapeType.XRELATIVETOHEIGHTFROMRIGHT,
						ReshapeCoordinate.ReshapeType.NONE
					);
					node._reshapeCoordinates.push(p);

					shape._coordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * BASE'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MAX(0, WIDTH - HEIGHT * ARROWLENGTH)'),
							shape._newExpression(0, 'HEIGHT * BASE')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MAX(0, WIDTH - HEIGHT * ARROWLENGTH)'),
							shape._newExpression(0)
						)
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.5'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MAX(0, WIDTH - HEIGHT * ARROWLENGTH)'),
							shape._newExpression(0, 'HEIGHT')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MAX(0, WIDTH - HEIGHT * ARROWLENGTH)'),
							shape._newExpression(0, 'HEIGHT * (1 - BASE)')
						)
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * (1 - BASE)'))
					);

					node._reshapeProperties.addIndexProperty('BASE', props.getReshapePointY, props.setReshapePointY, 0);
					node._reshapeProperties.addIndexProperty(
						'ARROWLENGTH',
						props.getReshapePointX,
						props.setReshapePointX,
						1
					);
					break;
				case 'arrowDown':
					shape = new PolygonShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0.2),
						shape._newExpression(1),
						0,
						0.5,
						0,
						0,
						'BASE',
						ReshapeCoordinate.ReshapeType.XRELATIVETOWIDTH,
						ReshapeCoordinate.ReshapeType.NONE
					);
					node._reshapeCoordinates.push(p);
					p = new ReshapeCoordinate(
						shape._newExpression(0),
						shape._newExpression(0.5),
						0,
						0,
						0,
						1,
						'ARROWLENGTH',
						ReshapeCoordinate.ReshapeType.NONE,
						ReshapeCoordinate.ReshapeType.YRELATIVETOWIDTHFROMBOTTOM
					);
					node._reshapeCoordinates.push(p);

					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * BASE'), shape._newExpression(0))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH * BASE'),
							shape._newExpression(0, 'MAX(0, HEIGHT - ARROWLENGTH * WIDTH)')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0),
							shape._newExpression(0, 'MAX(0, HEIGHT - ARROWLENGTH * WIDTH)')
						)
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.5'), shape._newExpression(0, 'HEIGHT'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH'),
							shape._newExpression(0, 'MAX(0, HEIGHT - ARROWLENGTH * WIDTH)')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH * (1 - BASE)'),
							shape._newExpression(0, 'MAX(0, HEIGHT - ARROWLENGTH * WIDTH)')
						)
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * (1 - BASE)'), shape._newExpression(0))
					);

					node._reshapeProperties.addIndexProperty('BASE', props.getReshapePointX, props.setReshapePointX, 0);
					node._reshapeProperties.addIndexProperty(
						'ARROWLENGTH',
						props.getReshapePointY,
						props.setReshapePointY,
						1
					);
					break;
				case 'arrowDblHorz':
					shape = new PolygonShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0.5),
						shape._newExpression(0.2),
						0.5,
						0.5,
						0,
						0.5,
						'BASE',
						ReshapeCoordinate.ReshapeType.NONE,
						ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT
					);
					node._reshapeCoordinates.push(p);
					p = new ReshapeCoordinate(
						shape._newExpression(0.5),
						shape._newExpression(0),
						0,
						1,
						0,
						0,
						'ARROWLENGTH',
						ReshapeCoordinate.ReshapeType.XRELATIVETOHEIGHT,
						ReshapeCoordinate.ReshapeType.NONE
					);
					node._reshapeCoordinates.push(p);

					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MIN(WIDTH / 2, ARROWLENGTH * HEIGHT)'),
							shape._newExpression(0, 'HEIGHT * BASE')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MIN(WIDTH / 2, ARROWLENGTH * HEIGHT)'),
							shape._newExpression(0)
						)
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT * 0.5'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MIN(WIDTH / 2, ARROWLENGTH * HEIGHT)'),
							shape._newExpression(0, 'HEIGHT')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MIN(WIDTH / 2, ARROWLENGTH * HEIGHT)'),
							shape._newExpression(0, 'HEIGHT * (1 - BASE)')
						)
					);

					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MAX(WIDTH / 2, WIDTH - HEIGHT * ARROWLENGTH)'),
							shape._newExpression(0, 'HEIGHT * (1 - BASE)')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MAX(WIDTH / 2, WIDTH - HEIGHT * ARROWLENGTH)'),
							shape._newExpression(0, 'HEIGHT')
						)
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT * 0.5'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MAX(WIDTH / 2, WIDTH - HEIGHT * ARROWLENGTH)'),
							shape._newExpression(0)
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MAX(WIDTH / 2, WIDTH - HEIGHT * ARROWLENGTH)'),
							shape._newExpression(0, 'HEIGHT * BASE')
						)
					);

					node._reshapeProperties.addIndexProperty('BASE', props.getReshapePointY, props.setReshapePointY, 0);
					node._reshapeProperties.addIndexProperty(
						'ARROWLENGTH',
						props.getReshapePointX,
						props.setReshapePointX,
						1
					);
					break;
				case 'arrowDblVert':
					shape = new PolygonShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0.2),
						shape._newExpression(0.5),
						0,
						0.5,
						0.5,
						0.5,
						'BASE',
						ReshapeCoordinate.ReshapeType.XRELATIVETOWIDTH,
						ReshapeCoordinate.ReshapeType.NONE
					);
					node._reshapeCoordinates.push(p);
					p = new ReshapeCoordinate(
						shape._newExpression(0),
						shape._newExpression(0.5),
						0,
						0,
						0,
						1,
						'ARROWLENGTH',
						ReshapeCoordinate.ReshapeType.NONE,
						ReshapeCoordinate.ReshapeType.YRELATIVETOWIDTH
					);
					node._reshapeCoordinates.push(p);

					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH * BASE'),
							shape._newExpression(0, 'MIN(HEIGHT / 2, ARROWLENGTH * WIDTH)')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0),
							shape._newExpression(0, 'MIN(HEIGHT / 2, ARROWLENGTH * WIDTH)')
						)
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.5'), shape._newExpression(0))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH'),
							shape._newExpression(0, 'MIN(HEIGHT / 2, ARROWLENGTH * WIDTH)')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH * (1 - BASE)'),
							shape._newExpression(0, 'MIN(HEIGHT / 2, ARROWLENGTH * WIDTH)')
						)
					);

					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH * (1 - BASE)'),
							shape._newExpression(0, 'MAX(HEIGHT / 2, HEIGHT - ARROWLENGTH * WIDTH)')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH'),
							shape._newExpression(0, 'MAX(HEIGHT / 2, HEIGHT - ARROWLENGTH * WIDTH)')
						)
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH * 0.5'), shape._newExpression(0, 'HEIGHT'))
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0),
							shape._newExpression(0, 'MAX(HEIGHT / 2, HEIGHT - ARROWLENGTH * WIDTH)')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH * BASE'),
							shape._newExpression(0, 'MAX(HEIGHT / 2, HEIGHT - ARROWLENGTH * WIDTH)')
						)
					);

					node._reshapeProperties.addIndexProperty('BASE', props.getReshapePointX, props.setReshapePointX, 0);
					node._reshapeProperties.addIndexProperty(
						'ARROWLENGTH',
						props.getReshapePointY,
						props.setReshapePointY,
						1
					);

					break;
				case 'arrowTopLeft':
					shape = new PolygonShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0.1),
						shape._newExpression(0.1),
						0.0,
						0.5,
						0.0,
						0.5,
						'BASE',
						ReshapeCoordinate.ReshapeType.XRELATIVETOMINFROMRIGHT,
						ReshapeCoordinate.ReshapeType.YRELATIVETOMINFROMBOTTOM
					);
					node._reshapeCoordinates.push(p);
					p = new ReshapeCoordinate(
						shape._newExpression(1),
						shape._newExpression(0.2),
						1,
						1,
						0,
						0.5,
						'ARROWLENGTH',
						ReshapeCoordinate.ReshapeType.NONE,
						ReshapeCoordinate.ReshapeType.YRELATIVETOMIN
					);
					node._reshapeCoordinates.push(p);
					p = new ReshapeCoordinate(
						shape._newExpression(0.4),
						shape._newExpression(0.0),
						0,
						0.7,
						0,
						0,
						'ARROWWIDTH',
						ReshapeCoordinate.ReshapeType.XRELATIVETOMINFROMRIGHT,
						ReshapeCoordinate.ReshapeType.NONE
					);
					node._reshapeCoordinates.push(p);

					// up arrow
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - (ARROWWIDTH - BASEX) * MIN(WIDTH, HEIGHT)'),
							shape._newExpression(0, 'MIN(HEIGHT / 2, ARROWLENGTH * MIN(WIDTH, HEIGHT))')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - (ARROWWIDTH * MIN(WIDTH, HEIGHT))'),
							shape._newExpression(0, 'MIN(HEIGHT / 2, ARROWLENGTH * MIN(WIDTH, HEIGHT))')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - (ARROWWIDTH / 2) * MIN(WIDTH, HEIGHT)'),
							shape._newExpression(0)
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH'),
							shape._newExpression(0, 'MIN(HEIGHT / 2, ARROWLENGTH * MIN(WIDTH, HEIGHT))')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - BASEX * MIN(WIDTH, HEIGHT)'),
							shape._newExpression(0, 'MIN(HEIGHT / 2, ARROWLENGTH * MIN(WIDTH, HEIGHT))')
						)
					);

					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - BASEX * MIN(WIDTH, HEIGHT)'),
							shape._newExpression(0, 'HEIGHT - BASEY * MIN(WIDTH, HEIGHT)')
						)
					);

					// left arrow
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MIN(WIDTH / 2, ARROWLENGTH * MIN(WIDTH, HEIGHT))'),
							shape._newExpression(0, 'HEIGHT - BASEY * MIN(WIDTH, HEIGHT)')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MIN(WIDTH / 2, ARROWLENGTH * MIN(WIDTH, HEIGHT))'),
							shape._newExpression(0, 'HEIGHT')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0),
							shape._newExpression(0, 'HEIGHT - (ARROWWIDTH / 2) * MIN(WIDTH, HEIGHT)')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MIN(WIDTH / 2, ARROWLENGTH * MIN(WIDTH, HEIGHT))'),
							shape._newExpression(0, 'HEIGHT - ARROWWIDTH * MIN(HEIGHT, WIDTH)')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'MIN(WIDTH / 2, ARROWLENGTH * MIN(WIDTH, HEIGHT))'),
							shape._newExpression(0, 'HEIGHT - (ARROWWIDTH - BASEY) * MIN(HEIGHT, WIDTH)')
						)
					);

					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - (ARROWWIDTH - BASEX) * MIN(WIDTH, HEIGHT)'),
							shape._newExpression(0, 'HEIGHT - (ARROWWIDTH - BASEY) * MIN(HEIGHT, WIDTH)')
						)
					);

					node._reshapeProperties.addIndexProperty(
						'BASEX',
						props.getReshapePointX,
						props.setReshapePointX,
						0
					);
					node._reshapeProperties.addIndexProperty(
						'BASEY',
						props.getReshapePointY,
						props.setReshapePointY,
						0
					);
					node._reshapeProperties.addIndexProperty(
						'ARROWLENGTH',
						props.getReshapePointY,
						props.setReshapePointY,
						1
					);
					node._reshapeProperties.addIndexProperty(
						'ARROWWIDTH',
						props.getReshapePointX,
						props.setReshapePointX,
						2
					);
					break;
				case 'arrowTopRight':
					shape = new PolygonShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0.1),
						shape._newExpression(0.1),
						0.0,
						0.5,
						0.0,
						0.5,
						'BASE',
						ReshapeCoordinate.ReshapeType.XRELATIVETOMIN,
						ReshapeCoordinate.ReshapeType.YRELATIVETOMINFROMBOTTOM
					);
					node._reshapeCoordinates.push(p);
					p = new ReshapeCoordinate(
						shape._newExpression(0),
						shape._newExpression(0.2),
						0,
						0,
						0,
						0.5,
						'ARROWLENGTH',
						ReshapeCoordinate.ReshapeType.NONE,
						ReshapeCoordinate.ReshapeType.YRELATIVETOMIN
					);
					node._reshapeCoordinates.push(p);
					p = new ReshapeCoordinate(
						shape._newExpression(0.4),
						shape._newExpression(0.0),
						0,
						0.7,
						0,
						0,
						'ARROWWIDTH',
						ReshapeCoordinate.ReshapeType.XRELATIVETOMIN,
						ReshapeCoordinate.ReshapeType.NONE
					);
					node._reshapeCoordinates.push(p);

					// up arrow
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, '(ARROWWIDTH - BASEX) * MIN(WIDTH, HEIGHT)'),
							shape._newExpression(0, 'MIN(HEIGHT / 2, ARROWLENGTH * MIN(WIDTH, HEIGHT))')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, '(ARROWWIDTH * MIN(WIDTH, HEIGHT))'),
							shape._newExpression(0, 'MIN(HEIGHT / 2, ARROWLENGTH * MIN(WIDTH, HEIGHT))')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, '(ARROWWIDTH / 2) * MIN(WIDTH, HEIGHT)'),
							shape._newExpression(0)
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, '0'),
							shape._newExpression(0, 'MIN(HEIGHT / 2, ARROWLENGTH * MIN(WIDTH, HEIGHT))')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'BASEX * MIN(WIDTH, HEIGHT)'),
							shape._newExpression(0, 'MIN(HEIGHT / 2, ARROWLENGTH * MIN(WIDTH, HEIGHT))')
						)
					);

					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'BASEX * MIN(WIDTH, HEIGHT)'),
							shape._newExpression(0, 'HEIGHT - BASEY * MIN(WIDTH, HEIGHT)')
						)
					);

					// right arrow
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - MIN(WIDTH / 2, ARROWLENGTH * MIN(WIDTH, HEIGHT))'),
							shape._newExpression(0, 'HEIGHT - BASEY * MIN(WIDTH, HEIGHT)')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - MIN(WIDTH / 2, ARROWLENGTH * MIN(WIDTH, HEIGHT))'),
							shape._newExpression(0, 'HEIGHT')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH'),
							shape._newExpression(0, 'HEIGHT - (ARROWWIDTH / 2) * MIN(WIDTH, HEIGHT)')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - MIN(WIDTH / 2, ARROWLENGTH * MIN(WIDTH, HEIGHT))'),
							shape._newExpression(0, 'HEIGHT - ARROWWIDTH * MIN(HEIGHT, WIDTH)')
						)
					);
					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, 'WIDTH - MIN(WIDTH / 2, ARROWLENGTH * MIN(WIDTH, HEIGHT))'),
							shape._newExpression(0, 'HEIGHT - (ARROWWIDTH - BASEY) * MIN(HEIGHT, WIDTH)')
						)
					);

					shape._coordinates.push(
						new Coordinate(
							shape._newExpression(0, '(ARROWWIDTH - BASEX) * MIN(WIDTH, HEIGHT)'),
							shape._newExpression(0, 'HEIGHT - (ARROWWIDTH - BASEY) * MIN(HEIGHT, WIDTH)')
						)
					);

					node._reshapeProperties.addIndexProperty(
						'BASEX',
						props.getReshapePointX,
						props.setReshapePointX,
						0
					);
					node._reshapeProperties.addIndexProperty(
						'BASEY',
						props.getReshapePointY,
						props.setReshapePointY,
						0
					);
					node._reshapeProperties.addIndexProperty(
						'ARROWLENGTH',
						props.getReshapePointY,
						props.setReshapePointY,
						1
					);
					node._reshapeProperties.addIndexProperty(
						'ARROWWIDTH',
						props.getReshapePointX,
						props.setReshapePointX,
						2
					);
					break;
				case 'triangleLeft':
					shape = new PolygonShape();
					node = new Node(shape);
					shape._coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT / 2'))
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT'))
					);
					break;
				case 'triangleRight':
					shape = new PolygonShape();
					node = new Node(shape);
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT / 2'))
					);
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));
					break;
				case 'triangleTop':
					shape = new PolygonShape();
					node = new Node(shape);
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0))
					);
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT'))
					);
					break;
				case 'triangleBottom':
					shape = new PolygonShape();
					node = new Node(shape);
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH / 2'), shape._newExpression(0, 'HEIGHT'))
					);
					shape._coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
					break;
				case 'triangleLeftTop':
					shape = new PolygonShape();
					node = new Node(shape);
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT'))
					);
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));
					break;
				case 'triangleRightTop':
					shape = new PolygonShape();
					node = new Node(shape);
					shape._coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT'))
					);
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));
					break;
				case 'triangleLeftBottom':
					shape = new PolygonShape();
					node = new Node(shape);
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
					shape._coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0, 'HEIGHT')));
					break;
				case 'triangleRightBottom':
					shape = new PolygonShape();
					node = new Node(shape);
					shape._coordinates.push(new Coordinate(shape._newExpression(0), shape._newExpression(0)));
					shape._coordinates.push(new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0)));
					shape._coordinates.push(
						new Coordinate(shape._newExpression(0, 'WIDTH'), shape._newExpression(0, 'HEIGHT'))
					);
					break;
				case 'polyedge4':
					node = createPolyEdge(4, false);
					break;
				case 'polyedge5':
					node = createPolyEdge(5, false);
					break;
				case 'polyedge6':
					node = createPolyEdge(6, false);
					break;
				case 'polyedge8':
					node = createPolyEdge(8, false);
					break;
				case 'polyedge10':
					node = createPolyEdge(10, false);
					break;
				case 'polyedge12':
					node = createPolyEdge(12, false);
					break;
				case 'star3':
					node = createPolyEdge(3, true);
					break;
				case 'star4':
					node = createPolyEdge(4, true);
					break;
				case 'star5':
					node = createPolyEdge(5, true);
					break;
				case 'star6':
					node = createPolyEdge(6, true);
					break;
				case 'star8':
					node = createPolyEdge(8, true);
					break;
				case 'star12':
					node = createPolyEdge(12, true);
					break;
				case 'arc':
				case 'pie':
				case 'arcclosed':
					shape = new BezierShape();
					shape.setPie(type === 'pie');
					node = new Node(shape);
					node.setItemAttribute(ItemAttributes.CLOSED, type === 'arcclosed' || type === 'pie');

					p = new ReshapeCoordinate(
						shape._newExpression(0.0),
						shape._newExpression(0.0),
						-1,
						1,
						0,
						0,
						'START',
						ReshapeCoordinate.ReshapeType.RADIAL,
						ReshapeCoordinate.ReshapeType.RADIAL
					);
					node._reshapeCoordinates.push(p);
					p.setShapeBuilder(ShapeBuilder[String(type).toUpperCase()]);
					p.setShapeBuilderName(String(type).toUpperCase());

					p = new ReshapeCoordinate(
						shape._newExpression(0.75),
						shape._newExpression(0.75),
						-1,
						1,
						0,
						0,
						'END',
						ReshapeCoordinate.ReshapeType.RADIAL,
						ReshapeCoordinate.ReshapeType.RADIAL
					);
					node._reshapeCoordinates.push(p);
					p.setShapeBuilder(ShapeBuilder[String(type).toUpperCase()]);
					p.setShapeBuilderName(String(type).toUpperCase());

					p.getShapeBuilder().call(node);
					break;
				case 'callout':
				case 'calloutline':
					shape = new PolygonShape();
					node = new Node(shape);

					p = new ReshapeCoordinate(
						shape._newExpression(0.1),
						shape._newExpression(1.4),
						-3,
						3,
						-3,
						3,
						type.toUpperCase(),
						ReshapeCoordinate.ReshapeType.XRELATIVETOWIDTH,
						ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT
					);
					node._reshapeCoordinates.push(p);

					p.setShapeBuilder(ShapeBuilder[String(type).toUpperCase()]);
					p.setShapeBuilderName(String(type).toUpperCase());
					p.getShapeBuilder().call(node);

					node._reshapeProperties.addIndexProperty(
						`${type.toUpperCase()}X`,
						props.getReshapePointX,
						props.setReshapePointX,
						0
					);
					node._reshapeProperties.addIndexProperty(
						`${type.toUpperCase()}Y`,
						props.getReshapePointY,
						props.setReshapePointY,
						0
					);
					break;
				case 'calloutroundrect':
				case 'calloutroundrectline':
				case 'calloutround':
				case 'calloutroundline':
					shape = new BezierShape();
					node = new Node(shape);
					p = new ReshapeCoordinate(
						shape._newExpression(0.1),
						shape._newExpression(1.4),
						-3,
						3,
						-3,
						3,
						type.toUpperCase(),
						ReshapeCoordinate.ReshapeType.XRELATIVETOWIDTH,
						ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT
					);
					node._reshapeCoordinates.push(p);

					p.setShapeBuilder(ShapeBuilder[String(type).toUpperCase()]);
					p.setShapeBuilderName(String(type).toUpperCase());
					p.getShapeBuilder().call(node);

					node._reshapeProperties.addIndexProperty(
						`${type.toUpperCase()}X`,
						props.getReshapePointX,
						props.setReshapePointX,
						0
					);
					node._reshapeProperties.addIndexProperty(
						`${type.toUpperCase()}Y`,
						props.getReshapePointY,
						props.setReshapePointY,
						0
					);
					break;
				default:
					return undefined;
			}
			node.setType(type);
			node.evaluate();
			return node;
		}

		switch (typeStr) {
			case 'node':
				return new Node();
			case 'group':
				return new Group();
			case 'linenode':
			case 'polylinenode':
				return new LineNode();
			case 'contentnode':
				return new ContentNode();
			case 'edge':
				return new Edge();
			case 'edgeArrow':
				edge = new Edge();
				edge.getFormat().setLineArrowEnd(FormatAttributes.ArrowStyle.ARROWFILLED);
				edge.getFormat().setFillColor('#000000');
				return edge;
			case 'edgeDoubleArrow':
				edge = new Edge();
				edge.getFormat().setLineArrowStart(FormatAttributes.ArrowStyle.ARROWFILLED);
				edge.getFormat().setLineArrowEnd(FormatAttributes.ArrowStyle.ARROWFILLED);
				edge.getFormat().setFillColor('#000000');
				return edge;
			case 'orthogonalEdge':
				edge = new Edge(new OrthoLineShape());
				return edge;
			case 'orthogonalEdgeArrow':
				edge = new Edge(new OrthoLineShape());
				edge.getFormat().setLineArrowEnd(FormatAttributes.ArrowStyle.ARROWFILLED);
				edge.getFormat().setFillColor('#000000');
				return edge;
			case 'orthogonalEdgeDoubleArrow':
				edge = new Edge(new OrthoLineShape());
				edge.getFormat().setLineArrowStart(FormatAttributes.ArrowStyle.ARROWFILLED);
				edge.getFormat().setLineArrowEnd(FormatAttributes.ArrowStyle.ARROWFILLED);
				edge.getFormat().setFillColor('#000000');
				return edge;
			case 'orthogonalRoundedEdge':
				edge = new Edge(new OrthoLineShape());
				edge.getFormat().setLineCorner(150);
				return edge;
			case 'orthogonalRoundedEdgeArrow':
				edge = new Edge(new OrthoLineShape());
				edge.getFormat().setFillColor('#000000');
				edge.getFormat().setLineCorner(150);
				edge.getFormat().setLineArrowEnd(FormatAttributes.ArrowStyle.ARROWFILLED);
				return edge;
			case 'orthogonalRoundedEdgeDoubleArrow':
				edge = new Edge(new OrthoLineShape());
				edge.getFormat().setFillColor('#000000');
				edge.getFormat().setLineCorner(150);
				edge.getFormat().setLineArrowEnd(FormatAttributes.ArrowStyle.ARROWFILLED);
				edge.getFormat().setLineArrowStart(FormatAttributes.ArrowStyle.ARROWFILLED);
				return edge;
			case 'orthogonalRoundedEdgeArrowDash':
				edge = new Edge(new OrthoLineShape());
				edge.getFormat().setLineCorner(150);
				edge.getFormat().setLineStyle(FormatAttributes.LineStyle.DASH);
				edge.getFormat().setLineArrowEnd(FormatAttributes.ArrowStyle.ARROWFILLED);
				return edge;
			case 'graph':
				return new Graph();
			case 'port':
				return new Port();
			case PortMapper.TYPE:
				return new PortMapper();
			case 'text':
				return new TextNode();
			case 'machinegraph':
				return new MachineGraph();
			case 'worksheetnode':
				return new WorksheetNode();
			case 'headernode':
				return new HeaderNode();
			case 'sheetheadernode':
				return new SheetHeaderNode();
			case 'rowheadernode':
				return new RowHeaderNode();
			case 'columnheadernode':
				return new ColumnHeaderNode();
			case 'cellsnode':
				return new CellsNode();
			case 'treenode':
				return new TreeNode();
			case 'treeitemsnode':
				return new TreeItemsNode();
			case 'processcontainer':
				return new StreamSheetsContainer();
			case 'processsheetcontainer':
				return new StreamSheetContainer();
			case 'machinecontainer':
				return new MachineContainer();
			case 'processsheet':
				return new StreamSheet();
			case 'splitternode':
				return new SplitterNode();
			case 'scrollbarnode':
				return new ScrollbarNode();
			case 'captionnode':
				return new CaptionNode();
			case 'buttonnode':
				return new ButtonNode();
			case 'sheetbuttonnode':
				return new SheetButtonNode();
			case 'sheetcheckboxnode':
				return new SheetCheckboxNode();
			case 'sheetslidernode':
				return new SheetSliderNode();
			case 'sheetknobnode':
				return new SheetKnobNode();
			case 'sheetchartstatenode':
				return new Node();
			case 'chartnode':
			case 'sheetplotnode':
			case 'streamchart':
				return new SheetPlotNode();
			case 'inboxcontainer':
				return new InboxContainer();
			case 'outboxcontainer':
				return new OutboxContainer();
			default:
				return createItem(typeStr);
		}
	}

	createShape(name) {}

	/**
	 * Creates and returns an array of {{#crossLink "GraphItem"}}{{/crossLink}}s which
	 * represents the friends for items of specified type.</br>
	 * Note: this method is intended to be overwritten by subclasses. Default implementation simply returns
	 * <code>undefined</code>.
	 *
	 * @method getFriends
	 * @param {GraphItem} item The GraphItem to create friends for.
	 * @return {Array} An array of GraphItems
	 */
	getFriends(item) {
		// custom implementation optional
		return undefined;
	}

	/**
	 * Returns a StringExpression which represents the link for the given type.</br>
	 * Note: this method is intended to be overwritten by subclasses. Default implementation simply returns
	 * <code>undefined</code>.
	 *
	 * @method getLink
	 * @param {String} type A unique string to identify the link to create.
	 * @return {StringExpression} Returns a StringExpression representing the link.
	 */
	getLink(type) {
		// custom implementation optional
		return undefined;
	}

	/**
	 * Checks if given type classifies a valid subitem for the specified container.</br>
	 * Note: this method is intended to be overwritten by subclasses. Default implementation simply returns
	 * <code>true</code>.
	 *
	 * @method isValidSubItem
	 * @param {GraphItem} item to verify.
	 * @param {String} containerType A unique string to classify the container type.
	 * @param {GraphItem} item of the potential container.
	 * @return {Boolean} <code>true</code> if subitem type is valid for given container type, <code>false</code>
	 *     otherwise.
	 */
	isValidSubItem(item, containerType, container) {
		if (container instanceof StreamSheetsContainer) {
			return item instanceof StreamSheetContainer;
		}

		return !(item instanceof StreamSheetContainer);
		// return true;
	}

	/**
	 * Gives a custom GraphItemFactory the possibility to adjust a GraphItem after it was restored from XML.</br>
	 * Note: this method is intended to be overwritten by subclasses. Default implementation does nothing.
	 *
	 * @method initReadItem
	 * @param {GraphItem} item GraphItem to initialize.
	 * deprecated DON'T USE! Currently under review!!
	 */
	initReadItem(item) {}
}

module.exports = GraphItemFactory;
