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
/* eslint-disable no-empty */
/* global window sessionStorage localStorage document */

const { Drawings, FuncTerm, Term, NullTerm } = require('@cedalo/parser');
const qrjs2 = require('qrjs2');

const JSG = require('../../JSG');
const Point = require('../../geometry/Point');
const MathUtils = require('../../geometry/MathUtils');
const Node = require('./Node');
const Edge = require('./Edge');
const TextNode = require('./TextNode');
const GraphItem = require('./GraphItem');
const SheetButtonNode = require('./SheetButtonNode');
const SheetCheckboxNode = require('./SheetCheckboxNode');
const SheetSliderNode = require('./SheetSliderNode');
const SheetKnobNode = require('./SheetKnobNode');
const Graph = require('./Graph');
const FormatAttributes = require('../attr/FormatAttributes');
const TextFormatAttributes = require('../attr/TextFormatAttributes');
const ItemAttributes = require('../attr/ItemAttributes');
const Numbers = require('../../commons/Numbers');
const Strings = require('../../commons/Strings');
const JSONReader = require('../../commons/JSONReader');
const JSONWriter = require('../../commons/JSONWriter');
const Attribute = require('../attr/Attribute');
const AttributeUtils = require('../attr/AttributeUtils');
const StringAttribute = require('../attr/StringAttribute');
const NumberExpression = require('../expr/NumberExpression');
const LineShape = require('./shapes/LineShape');
const EllipseShape = require('./shapes/EllipseShape');
const RectangleShape = require('./shapes/RectangleShape');
const BezierShape = require('./shapes/BezierShape');
const PolygonShape = require('./shapes/PolygonShape');
const Expression = require('../expr/Expression');
const SheetReference = require('../expr/SheetReference');
const WorksheetNode = require('./WorksheetNode');
const CellsNode = require('./CellsNode');
const CellRange = require('./CellRange');
const NotificationCenter = require('../notifications/NotificationCenter');
const Notification = require('../notifications/Notification');
const Coordinate = require('../Coordinate');
const GraphUtils = require('../GraphUtils');
const AddImageCommand = require('../command/AddImageCommand');
const { SheetPlotNode } = require('@cedalo/jsg-extensions/core');

const setSheetCaption = (sheetName, sheetContainer) => {
	if (sheetContainer) {
		const step = sheetContainer
			.getStreamSheetContainerAttributes()
			.getStep()
			.getValue();
		sheetContainer.getSheetCaption().setName(`${sheetName} - ${JSG.getLocalizedString('Step')} ${step}`);
	}
};

/**
 * Node representing a worksheet. The worksheet contains additional nodes for the rows,
 * columns, cells and the top left corner.
 *
 * @class StreamSheet
 * @extends WorksheetNode
 * @constructor
 */
module.exports = class StreamSheet extends WorksheetNode {
	constructor() {
		super();

		let attr = this.getWorksheetAttributes();
		attr.setCalcOnDemand(true);
		attr.setShowFormulas(false);

		this.getFormat().setLineColor('#AAAAAA');

		const columns = this.getColumns();
		columns.setSectionSize(0, 0);
		columns.setSectionSize(1, 700);

		attr = this.getItemAttributes();
		attr.setSelectionMode(ItemAttributes.SelectionMode.NONE);
		attr.setPortMode(ItemAttributes.PortMode.NONE);
		attr.setContainer(false);

		// this.getCells().getItemAttributes().setContainer(false);

		this.getWorksheetAttributes().setCalcOnDemand(true);
		if (typeof sessionStorage !== 'undefined') {
			const sessionId = sessionStorage.getItem('sessionId');
			const user = JSON.parse(localStorage.getItem('user'));
			if (user && sessionId) {
				const id = `${sessionId};${user.id};${user.displayName}`;
				this.setSelectionId(id);
			}
		}

		this._drawings = new Drawings();
		this._addImageCmds = [];
	}

	newInstance() {
		return new StreamSheet();
	}

	// to prevent cyclic dependencies if StreamSheet is used in commands
	get isStreamSheet() {
		return true;
	}

	assignIdsToChildren(item, lid) {
		this._contentPane.getItems().forEach((subItem) => {
			subItem._id = lid;
			lid += 1;
			// graph items in sheet keep their id (port etc.)
			if (!(subItem instanceof CellsNode)) {
				lid = subItem.assignIdsToChildren(subItem, lid);
			}
		});

		return lid;
	}

	getItemType() {
		return 'processsheet';
	}

	saveForUndo() {
		const writer = new JSONWriter();
		writer.writeStartDocument();
		this.saveCondensed(writer, true);
		writer.writeEndDocument();

		return writer.flush();
	}

	saveCondensed(writer, undo = false) {
		this.compress();

		writer.writeStartElement('processsheet');

		if (undo === false) {
			// save worksheet attributes
			this.getWorksheetAttributes().saveCondensed(writer, 'attributes');

			// name for references
			this._name.save('name', writer);
		}

		// header infos
		this._rows.saveCondensed(writer, 'rows');
		this._columns.saveCondensed(writer, 'columns');

		if (undo) {
			const saveFormula = (item) => {
				const attrFormula = item.getItemAttributes().getAttribute('sheetformula');
				if (attrFormula) {
					const expr = attrFormula.getExpression();
					if (expr !== undefined && expr.hasFormula()) {
						writer.writeStartElement('xpr');
						writer.writeAttributeString('id', String(item.getId()));
						expr.save('expr', writer, 2);
						writer.writeEndElement();
						// item.expressions.forEach(exp => {
						// });
					}
				}
			};

			writer.writeStartArray('drawformulas');
			GraphUtils.traverseItem(this.getCells(), (item) => saveFormula(item));
			writer.writeEndArray('drawformulas');
		} else {
			writer.writeStartElement('drawings');
			this._cells._saveSubItems(writer);
			writer.writeEndElement();

			// save default cell
			writer.writeStartElement('defaultcell');
			this._defaultCell.save(writer);
			writer.writeEndElement();
		}

		// save data provider
		this.getDataProvider().save(writer);

		writer.writeEndElement();
	}

	readFromUndo(json) {
		const reader = new JSONReader(json);
		reader.version = 2;
		const root = reader.getObject(reader.getRoot(), 'processsheet');

		// clear
		this.getRows().clear();
		this.getColumns().clear();
		this.getDataProvider().clear();

		this.read(reader, root);
	}

	read(reader, object) {
		if (reader.version >= 1) {
			reader.iterateObjects(object, (name, child) => {
				switch (name) {
					case 'attributes':
						this.getWorksheetAttributes().readCondensed(reader, child);
						break;
					case 'name':
						this._name.read(reader, child);
						break;
					case 'rows':
						this._rows.read(reader, child);
						break;
					case 'columns':
						this._columns.read(reader, child);
						break;
					case 'data':
						this.getDataProvider().read(reader, child);
						break;
					case 'drawings':
						reader.iterateObjects(child, (subname, subnode) => {
							switch (subname) {
								case 'graphitem':
								case 'gi': {
									const type = reader.getAttribute(subnode, 'type');
									const graphItem = JSG.graphItemFactory.createItemFromString(type, true);
									if (graphItem) {
										graphItem.read(reader, subnode);
										graphItem._reading = true;
										this._cells.addItem(graphItem);
										graphItem._reading = false;
										this._cells.onReadSubItem(graphItem, this, reader);
									}
									break;
								}
								default:
									break;
							}
						});
						break;
					case 'drawformulas': {
						const id = reader.getAttributeNumber(child,'id');
						if (id !== undefined) {
							const item = this.getItemById(id);
							if (item) {
								const attrFormula = item.getItemAttributes().getAttribute('sheetformula');
								if (attrFormula) {
									const expr = attrFormula.getExpression();
									if (expr) {
										const obj = reader.getObject(child, 'expr');
										if (obj) {
											expr.read(reader, obj);
											expr.evaluate(item);
										}
									}
								}
							}
						}
					}
						break;
					case 'defaultcell': {
						const cell = reader.getObject(child, 'cell');
						if (cell) {
							this._defaultCell.read(reader, cell);
						}
						break;
					}
				}
			});
			if (this.getStreamSheetContainer()) {
				this.getStreamSheetContainer()
					.getSheetCaption()
					.setName(`${this._name.getValue()}`);
			}
		} else {
			super.read(reader, object);
		}

		const attr = this.getWorksheetAttributes();
		attr.setCalcOnDemand(true);
	}

	_assignName(/* id */) {
		if (this.getGraph()._reading) {
			return;
		}

		const myId = this.getId();
		const graph = this.getGraph();
		const oldName = this.getName().getValue();
		let newId = 1;
		let newName = oldName || 'S1';
		let item = graph.getItemByName(newName);

		while (item && item.getId() !== myId) {
			newId += 1;
			newName = `S${newId}`;
			item = graph.getItemByName(newName);
		}
		// if(newName !== oldName) {
		this.setName(newName);
		setSheetCaption(newName, this.getStreamSheetContainer());
		// }
	}

	setName(newName) {
		let changed = false;

		if (this.newName instanceof Expression) {
			changed = this.newName.getValue() !== this.getName().getValue();
		} else {
			changed = this.newName !== this.getName().getValue();
		}

		super.setName(newName);

		if (this.getStreamSheetContainer()) {
			setSheetCaption(newName, this.getStreamSheetContainer());
			if (changed) {
				this.updateFormulas();
			}
		}
	}

	updateFormulas() {
		const container = this.getStreamSheetContainer().getStreamSheetsContainer();

		if (container === undefined) {
			return;
		}

		container.enumerateStreamSheetContainers((sheetContainer) => {
			const sheet = sheetContainer.getStreamSheet();
			const data = sheet.getDataProvider();
			data.enumerate((column, row, cell) => {
				const expr = cell.getExpression();
				if (expr !== undefined) {
					expr.correctFormula(sheet);
				}
			});
		});
	}

	getLoopElement() {
		return this.getStreamSheetContainer()
			.getStreamSheetContainerAttributes()
			.getLoopElement()
			.getValue();
	}

	getLoopIndex() {
		return this.getStreamSheetContainer()
			.getStreamSheetContainerAttributes()
			.getLoopIndex()
			.getValue();
	}

	isAddLabelAllowed() {
		return false;
	}

	getTreeItemsNode() {
		return this.getStreamSheetContainer()
			.getInboxContainer()
			.getMessageTreeItems();
	}

	getOutboxContainer() {
		return this.getStreamSheetContainer()
			.getStreamSheetsContainer()
			.getOutboxContainer();
	}

	getStreamSheetContainer() {
		const parent = this.getParent();
		if (parent instanceof Graph) {
			return undefined;
		}
		return parent;
	}

	getDrawings() {
		return this._drawings;
	}

	getDigits(parent) {
		switch (
			parent
				.getItemAttributes()
				.getScaleType()
				.getValue()
		) {
			case 'scale':
				return 0;
			case 'bottom':
				return 0;
			default:
				break;
		}

		return 0;
	}

	convertToChildPos(point, parent) {
		if (parent === undefined) {
			return point;
		}

		if (Numbers.isNumber(point.x)) {
			switch (
				parent
					.getItemAttributes()
					.getScaleType()
					.getValue()
			) {
				case 'scale': {
					const width = parent.getWidth().getValue();
					point.x = (point.x / 10000) * width;
					break;
				}
				default:
					break;
			}
		} else if (typeof point.x === 'string') {
			const column = this.getColumns();
			const index = CellRange.getColumnFromString(point.x);
			if (index > 0 && index < this.getColumnCount()) {
				point.x = column.getSectionPos(index - column.getInitialSection() - 1);
			}
		}

		if (Numbers.isNumber(point.y)) {
			switch (
				parent
					.getItemAttributes()
					.getScaleType()
					.getValue()
			) {
				case 'scale': {
					const height = parent.getHeight().getValue();
					point.y = (point.y / 10000) * height;
					break;
				}
				case 'bottom': {
					const height = parent.getHeight().getValue();
					point.y = height - point.y;
					break;
				}
				default:
					break;
			}
		} else if (typeof point.y === 'string') {
			const row = this.getRows();
			const index = parseInt(point.y, 10);
			if (index > 0 && index < this.getRowCount()) {
				point.y = row.getSectionPos(index - 1);
			}
		}

		return point;
	}

	convertToChildSize(point, parent) {
		if (parent === undefined) {
			return point;
		}
		switch (
			parent
				.getItemAttributes()
				.getScaleType()
				.getValue()
		) {
			case 'scale': {
				const width = parent.getWidth().getValue();
				point.x = (point.x / 10000) * width;
				const height = parent.getHeight().getValue();
				point.y = (point.y / 10000) * height;
				break;
			}
			default:
				break;
		}

		return point;
	}

	setDrawAttributes(node, formatJSON) {
		const attr = node.getItemAttributes();
		let def = {};

		if (formatJSON !== undefined && formatJSON !== '' && !Numbers.isNumber(formatJSON)) {
			try {
				def = JSON.parse(formatJSON);
			} catch (e) {}
		}

		if (def.clip !== undefined) {
			attr.setClipChildren(def.clip);
		}

		if (!this._editing) {
			if (def.visible !== undefined) {
				attr.setVisible(def.visible);
			} else {
				attr.setVisible(true);
			}
		}

		if (def.selectable !== undefined) {
			attr.setSelectionMode(def.selectable ? 4 : 0);
		}

		if (def.container !== undefined) {
			attr.setScaleType(def.container === 'none' ? 'top' : def.container);
			attr.setContainer(def.container !== 'none');
		}
	}

	setEvents(node, eventJSON) {
		if (eventJSON === undefined || eventJSON === '') {
			node._sheetEvents = undefined;
			return;
		}

		try {
			node._sheetEvents = JSON.parse(eventJSON);
		} catch (e) {
			node._sheetEvents = undefined;
		}
	}

	setLineFormat(node, formatJSON) {
		const format = node.getFormat();
		let def = {};

		try {
			def = JSON.parse(formatJSON);
		} catch (e) {
			if (formatJSON) {
				def.style = formatJSON.toUpperCase() === 'NONE' ? 0 : 1;
				def.color = formatJSON && formatJSON.length ? formatJSON : undefined;
			}
		}

		if (def.color) {
			format.setLineColor(def.color);
		} else {
			const path = AttributeUtils.createPath(FormatAttributes.NAME, FormatAttributes.LINECOLOR);
			node.removeAttributeAtPath(path);
		}
		if (def.width !== undefined) {
			format.setLineWidth(def.width);
		} else {
			const path = AttributeUtils.createPath(FormatAttributes.NAME, FormatAttributes.LINEWIDTH);
			node.removeAttributeAtPath(path);
		}
		if (def.style !== undefined) {
			format.setLineStyle(def.style);
		} else {
			const path = AttributeUtils.createPath(FormatAttributes.NAME, FormatAttributes.LINESTYLE);
			node.removeAttributeAtPath(path);
		}
	}

	setFillFormat(node, formatJSON) {
		if (formatJSON === undefined || formatJSON === '') {
			let path = AttributeUtils.createPath(FormatAttributes.NAME, FormatAttributes.FILLCOLOR);
			node.removeAttributeAtPath(path);
			path = AttributeUtils.createPath(FormatAttributes.NAME, FormatAttributes.FILLSTYLE);
			node.removeAttributeAtPath(path);
			return;
		}

		const format = node.getFormat();

		let def;
		try {
			def = JSON.parse(formatJSON);
		} catch (e) {
			def = {};
			switch (formatJSON.toUpperCase()) {
				case 'NONE':
					def.type = 'none';
					break;
				case '':
					def.type = 'solid';
					def.color = JSG.theme.fill;
					break;
				default:
					def.type = 'solid';
					def.color = formatJSON;
					break;
			}
		}
		switch (def.type) {
			case 'pattern': {
				if (def.image) {
					let pattern = def.image.length ? def.image : JSG.ImagePool.IMG_NOTAVAIL;
					format.setFillStyle(FormatAttributes.FillStyle.PATTERN);

					if (pattern) {
						try {
							const qr = pattern.indexOf('qrcode:');
							if (qr !== -1) {
								if (window) {
									const text = pattern.slice(7);
									pattern = window.QRCode.generatePNG(text, {
										ecclevel: 'M',
										format: 'html',
										fillcolor: '#FFFFFF',
										textcolor: '#373737',
										margin: 4,
										modulesize: 8
									});
								}
							}

							const uri = pattern.indexOf('data:image') !== -1;
							if (uri) {
								const id = `dataimage${node.getId()}`;
								// to transfer image to server later on
								this._addImageCmds.push(new AddImageCommand(id, pattern));
								JSG.imagePool.set(pattern, id);
								format.setPattern(id);
							} else {
								const parts = pattern.split('?');
								if (parts.length > 1) {
									JSG.imagePool.update(parts[0], parts[1]);
									format.setPattern(parts[0]);
								} else {
									format.setPattern(pattern);
								}
							}
						} catch (e) {}
					}
				}
				break;
			}
			case 'gradient':
				format.setFillStyle(FormatAttributes.FillStyle.GRADIENT);
				if (def.style !== undefined) {
					format.setGradientType(def.style);
				}
				if (def.startcolor) {
					format.setFillColor(def.startcolor);
				}
				if (def.endcolor) {
					format.setGradientColor(def.endcolor);
				}
				switch (def.style) {
					case 0:
						if (def.angle !== undefined) {
							format.setGradientAngle(def.angle);
						}
						break;
					case 1:
						if (def.xOffset !== undefined) {
							format.setGradientOffsetX(def.xOffset);
						}
						if (def.yOffset !== undefined) {
							format.setGradientOffsetY(def.yOffset);
						}
						break;
				}
				break;
			case 'none':
				format.setFillStyle(FormatAttributes.FillStyle.NONE);
				break;
			case 'solid':
			default:
				if (def.color) {
					format.setFillColor(def.color);
				}
				format.setFillStyle(FormatAttributes.FillStyle.SOLID);
				break;
		}
	}

	setFontFormat(node, format, fontJSON) {
		let def = {};

		try {
			def = JSON.parse(fontJSON);
		} catch (e) {}

		format.setRichText(false);

		if (def.fontcolor) {
			format.setFontColor(def.fontcolor);
		} else {
			const path = AttributeUtils.createPath(TextFormatAttributes.NAME, TextFormatAttributes.FONTCOLOR);
			node.removeAttributeAtPath(path);
		}
		if (def.fontname) {
			format.setFontName(def.fontname);
		} else {
			const path = AttributeUtils.createPath(TextFormatAttributes.NAME, TextFormatAttributes.FONTNAME);
			node.removeAttributeAtPath(path);
		}
		if (def.fontsize !== undefined) {
			format.setFontSize(def.fontsize);
		} else {
			const path = AttributeUtils.createPath(TextFormatAttributes.NAME, TextFormatAttributes.FONTSIZE);
			node.removeAttributeAtPath(path);
		}
		if (def.fontstyle !== undefined) {
			format.setFontStyle(def.fontstyle);
		} else {
			const path = AttributeUtils.createPath(TextFormatAttributes.NAME, TextFormatAttributes.FONTSTYLE);
			node.removeAttributeAtPath(path);
		}
		if (def.alignment !== undefined) {
			format.setHorizontalAlignment(def.alignment);
		} else {
			const path = AttributeUtils.createPath(TextFormatAttributes.NAME, TextFormatAttributes.HORIZONTALALIGN);
			node.removeAttributeAtPath(path);
		}
	}

	setShapes(json) {
		if (!json || !json.shapes) {
			return;
		}

		if (this.getCells()._shapeTimeStamp && json.timestamp < this.getCells()._shapeTimeStamp) {
			// to prevent, that old updates are processed
			return;
		}

		const itemMap = {};
		const parentMap = {};

		GraphUtils.traverseItem(this.getCells(), item => {
			itemMap[item.getId()] = item;
		}, false);
		parentMap[this.getCells().getId()] = this.getCells();

		// read and create items
		json.shapes.forEach(shape => {
			let node = itemMap[shape.id];
			if (!node) {
				node = JSG.graphItemFactory.createItemFromString(shape.itemType, true);
				if (!node) {
					return;
				}
				const s = JSG.ShapeFactory.createShapeFromString(shape.shape.type);
				if (s) {
					node.setShapeTo(s);
					s.fromJSON(shape.shape);
				}

				const parent = parentMap[shape.parent];
				if (parent) {
					parent.addItem(node);
				}
			}
			const jsonShape = JSON.stringify(shape);
			if (!node._lastJSON || node._lastJSON !== jsonShape) {
				node.fromJSON(shape);
				if (shape.format && shape.format.pattern && shape.format.pattern.sv) {
					node.getFormat().setPatternFromShape();
					let pattern = shape.format.pattern.sv;
					try {
						const qr = pattern.indexOf('qrcode:');
						if (qr !== -1) {
							if (window) {
								const text = pattern.slice(7);
								pattern = window.QRCode.generatePNG(text, {
									ecclevel: 'M',
									format: 'html',
									fillcolor: '#FFFFFF',
									textcolor: '#373737',
									margin: 4,
									modulesize: 8
								});
							}
						}

						const uri = pattern.indexOf('data:image') !== -1;
						if (uri) {
							const id = `dataimage${node.getId()}`;
							// to transfer image to server later on
							this._addImageCmds.push(new AddImageCommand(id, pattern));
							JSG.imagePool.set(pattern, id);
							node.getFormat().setPatternFromShape(id);
						} else {
							const parts = pattern.split('?');
							if (parts.length > 1) {
								JSG.imagePool.update(parts[0], parts[1]);
								node.getFormat().setPatternFromShape(parts[0]);
							} else {
								node.getFormat().setPatternFromShape(pattern);
							}
						}
					} catch (e) {
					}
				}
			}

			node.evaluate();
			node.setRefreshNeeded(true);
			node._lastJSON = jsonShape;
			parentMap[shape.id] = node;
			itemMap[shape.id] = undefined;
		});

		// remove deleted items
		Object.values(itemMap).forEach(value => {
			if (value !== undefined ) {
				value.getParent().removeItem(value);
			}
		});

		// TODO		container.getStreamSheet()._addImageCmds.forEach(cmd => {
	}

	setGraphItems(graphItems) {
		const graph = this.getGraph();
		if (graph === undefined || true) {
			return;
		}

		Object.values(graphItems).forEach((drawItem) => {
			if (drawItem.sheetname === '') {
				return;
			}
			const id = Number(drawItem.sheetname);
			let node = this.getItemById(id);
			if (node === undefined && drawItem.source === 'cell') {
				if (!JSG.Numbers.isNumber(id)) {
					return;
				}
				// item )formula is on sheet -> create object
				switch (drawItem.type) {
					case 'rectangle':
						node = new Node();
						break;
					case 'button':
						node = new SheetButtonNode();
						break;
					case 'checkbox':
						node = new SheetCheckboxNode();
						break;
					case 'ellipse':
						node = new Node(new EllipseShape());
						break;
					case 'polygon':
						node = new Node(new PolygonShape());
						break;
					case 'bezier':
						node = new Node(new BezierShape());
						break;
					case 'line':
						node = new Edge(new LineShape());
						break;
					case 'label': {
						node = new TextNode('Text');
						const f = node.getTextFormat();
						f.setHorizontalAlignment(TextFormatAttributes.TextAlignment.LEFT);
						f.setVerticalAlignment(TextFormatAttributes.VerticalTextAlignment.TOP);
						f.setRichText(false);
						node.associate(false);
						break;
					}
				}
				if (node) {
					node.evaluate();
					let parent = this.getCells();
					if (drawItem.parent) {
						const validParent = graph.getItemByName(drawItem.parent);
						if (!validParent) {
							return;
						}
						parent = validParent;
					}
					node.getItemAttributes().addAttribute(new StringAttribute('sheetsource', drawItem.source));
					parent.addItem(node);
					node.setName(drawItem.name);
					node.setId(id);
				}
			}
			if (node) {
				if (node.lastDrawItem && JSON.stringify(drawItem) === JSON.stringify(node.lastDrawItem)) {
					return;
				}
				node.lastDrawItem = drawItem;

				switch (drawItem.type) {
					case 'rectangle':
						if (node.getShape().getType() !== RectangleShape.TYPE) {
							node.setShapeTo(new RectangleShape())
						}
						break;
					case 'ellipse':
						if (node.getShape().getType() !== EllipseShape.TYPE) {
							node.setShapeTo(new EllipseShape())
						}
						break;
					case 'polygon':
						if (node.getShape().getType() !== PolygonShape.TYPE) {
							node.setShapeTo(new PolygonShape())
						}
						break;
					case 'bezier':
						if (node.getShape().getType() !== BezierShape.TYPE) {
							node.setShapeTo(new BezierShape())
						}
						break;
				}

				let attr = node.getItemAttributes().getAttribute('sheetsource');
				if (!attr) {
					attr = node.getItemAttributes().addAttribute(new StringAttribute('sheetsource', drawItem.source));
				}
				if (attr.getValue() !== drawItem.source) {
					attr.setExpressionOrValue(drawItem.source);
				}
				attr = node.getItemAttributes().getAttribute('sheetformula');
				if (attr && attr.getExpression()) {
					if (attr.getExpression().getFormula() !== drawItem.formula) {
						return;
					}
				}
				let parent;

				node.setName(drawItem.name);
				if (drawItem.parent && drawItem.parent !== '') {
					parent = graph.getItemByName(drawItem.parent);
				} else {
					parent = this.getCells();
				}

				if (parent !== node.getParent() && id !== parent.getId()) {
					node.changeParent(parent);
				}

				const eventEnabled = node.disableEvents();

				if (drawItem.type === 'line' && (node instanceof Edge)) {
					let pStart = new Point(drawItem.x, drawItem.y);
					pStart = this.convertToChildPos(pStart, node.getParent());
					let pEnd = new Point(drawItem.x2, drawItem.y2);
					pEnd = this.convertToChildPos(pEnd, node.getParent());
					node.setStartPointTo(pStart);
					node.setEndPointTo(pEnd);
				} else {
					const pin = node.getPin();
					const local = pin.getLocalPoint();
					switch (drawItem.rotcenter) {
						default:
						case 0:
							pin.setLocalCoordinate(new NumberExpression(0), new NumberExpression(0));
							pin.evaluate();
							break;
						case 1:
							pin.setLocalCoordinate(
								new NumberExpression(local.x, 'WIDTH * 0.5'),
								new NumberExpression(0)
							);
							break;
						case 2:
							pin.setLocalCoordinate(new NumberExpression(local.x, 'WIDTH'), new NumberExpression(0));
							break;
						case 3:
							pin.setLocalCoordinate(
								new NumberExpression(0),
								new NumberExpression(local.y, 'HEIGHT * 0.5')
							);
							break;
						case 4:
							pin.setLocalCoordinate(
								new NumberExpression(local.x, 'WIDTH * 0.5'),
								new NumberExpression(local.y, 'HEIGHT * 0.5')
							);
							break;
						case 5:
							pin.setLocalCoordinate(
								new NumberExpression(local.x, 'WIDTH'),
								new NumberExpression(local.y, 'HEIGHT * 0.5')
							);
							break;
						case 6:
							pin.setLocalCoordinate(new NumberExpression(0), new NumberExpression(local.y, 'HEIGHT'));
							break;
						case 7:
							pin.setLocalCoordinate(
								new NumberExpression(local.x, 'WIDTH * 0.5'),
								new NumberExpression(local.y, 'HEIGHT')
							);
							break;
						case 8:
							pin.setLocalCoordinate(
								new NumberExpression(local.x, 'WIDTH'),
								new NumberExpression(local.y, 'HEIGHT')
							);
							break;
					}
					pin.evaluate();
					let p = new Point(drawItem.x, drawItem.y);
					p = this.convertToChildPos(p, node.getParent());
					node.setPinPoint(p.x, p.y);
					p.set(drawItem.width, drawItem.height);
					p = this.convertToChildSize(p, node.getParent());
					node.setSize(p.x, p.y);
					node.setAngle(drawItem.angle);

					this.setFillFormat(node, drawItem.fill);
					this.setLineFormat(node, drawItem.line);
					this.setDrawAttributes(node, drawItem.attributes);
					this.setEvents(node, drawItem.events);

					switch (drawItem.type) {
						case 'label': {
							const range = CellRange.parse(drawItem.formula, this, true);
							let text = '';
							if (range) {
								const sourceSheet = range.getSheet();
								const data = sourceSheet.getDataProvider();
								range.shiftFromSheet();
								const cell = data.getRC(range._x1, range._y1);
								if (cell) {
									const textFormat = sourceSheet.getTextFormatAtRC(range._x1, range._y1);
									const result = sourceSheet.getFormattedValue(
										cell.getExpression(),
										cell.getValue(),
										textFormat,
										false
									);
									if (result) {
										text = result.formattedValue;
									}
								}
							} else {
								text = drawItem.text === 'undefined' ? '' : Strings.decodeXML(drawItem.text);
							}
							node.setText(text);
							if (drawItem.parent === '') {
								node.associate(false);
							}
							this.setFontFormat(node, node.getTextFormat(), drawItem.font);
							break;
						}
						case 'bezier':
						case 'polygon':
							if (drawItem.close !== undefined) {
								node.getItemAttributes().setClosed(drawItem.close);
							}
							if (drawItem.range && drawItem.range !== '') {
								const pointRange = CellRange.parse(drawItem.range, this);
								const data = this.getDataProvider();
								if (pointRange === undefined || pointRange.getWidth() !== 2) {
									break;
								}
								pointRange.shiftFromSheet();
								const coors = [];
								const shape = node.getShape();
								let coor;

								for (let i = pointRange._y1; i <= pointRange._y2; i += 1) {
									const pt = new Point(0, 0);
									let cell = data.getRC(pointRange._x1, i);
									if (cell) {
										pt.x = Number(cell.getValue());
										pt.x = Number.isNaN(pt.x) ? 0 : pt.x;
									}
									cell = data.getRC(pointRange._x1 + 1, i);
									if (cell) {
										pt.y = Number(cell.getValue());
										pt.y = Number.isNaN(pt.y) ? 0 : pt.y;
									}
									coor = new Coordinate(
										shape._newExpression(0, `WIDTH * ${pt.x}`),
										shape._newExpression(0, `HEIGHT * ${pt.y}`)
									);
									coors.push(coor);
								}
								shape.setCoordinates(coors);
								node.evaluate();
								if (drawItem.type === 'bezier') {
									shape._cpToCoordinates = [];
									shape._cpFromCoordinates = [];
									shape.getBezierPoints(shape.getPoints());
								}
							}
							break;
						case 'plot':
							break;
						case 'checkbox':
						case 'button':
							this.setFontFormat(node, node.getTextFormat(), drawItem.font);
							node.setAttributeAtPath('title', drawItem.text);
							break;
						case 'slider':
							this.setFontFormat(node, node.getTextFormat(), drawItem.font);
							node.setAttributeAtPath('scalefont', drawItem.scalefont);
							node.setAttributeAtPath('title', drawItem.text);
							node.setAttributeAtPath('min', drawItem.min);
							node.setAttributeAtPath('max', drawItem.max);
							node.setAttributeAtPath('step', drawItem.step);
							node.setAttributeAtPath('marker', drawItem.marker);
							node.setAttributeAtPath('formatrange', drawItem.formatrange ? drawItem.formatrange : '');
							break;
						case 'knob':
							this.setFontFormat(node, node.getTextFormat(), drawItem.font);
							node.setAttributeAtPath('scalefont', drawItem.scalefont);
							node.setAttributeAtPath('title', drawItem.text);
							node.setAttributeAtPath('min', drawItem.min);
							node.setAttributeAtPath('max', drawItem.max);
							node.setAttributeAtPath('step', drawItem.step);
							node.setAttributeAtPath('marker', drawItem.marker);
							node.setAttributeAtPath('start', drawItem.start);
							node.setAttributeAtPath('end', drawItem.end);
							node.setAttributeAtPath('formatrange', drawItem.formatrange ? drawItem.formatrange : '');
							break;
						default:
							break;
					}
				}
				if (node._editBarChange) {
					const attrForm = node.getItemAttributes().getAttribute('sheetformula');
					if (attrForm && attrForm.getExpression()) {
						const oldFormula = attrForm.getExpression().getFormula();
						const formula = this.updateGraphFunction(node);
						if (formula !== oldFormula) {
							attrForm.setExpressionOrValue(new Expression(0, formula));
							node.evaluate();
						}
					}
					node._editBarChange = false;
				}

				node.enableEvents(eventEnabled);
			}
		});

		NotificationCenter.getInstance().send(
			new Notification(WorksheetNode.SELECTION_CHANGED_NOTIFICATION, {
				item: this,
				updateFinal: false
			})
		);
	}

	convertToContainerPos(point, parent) {
		if (parent === undefined) {
			return point;
		}
		switch (
			parent
				.getItemAttributes()
				.getScaleType()
				.getValue()
		) {
			case 'scale': {
				const width = parent.getWidth().getValue();
				point.x = (point.x / width) * 10000;
				const height = parent.getHeight().getValue();
				point.y = (point.y / height) * 10000;
				break;
			}
			case 'bottom': {
				const height = parent.getHeight().getValue();
				point.y = height - point.y;
				break;
			}
			default:
				break;
		}

		return point;
	}

	convertToContainerSize(point, parent) {
		if (parent === undefined) {
			return point;
		}
		switch (
			parent
				.getItemAttributes()
				.getScaleType()
				.getValue()
		) {
			case 'scale': {
				const width = parent.getWidth().getValue();
				point.x = (point.x / width) * 10000;
				const height = parent.getHeight().getValue();
				point.y = (point.y / height) * 10000;
				break;
			}
			default:
				break;
		}

		return point;
	}

	createGraphFunction(item) {
		// TODO raise errors
		let type = item.getShape().getType();
		if (type === undefined) {
			return undefined;
		}

		if (item instanceof JSG.TextNode) {
			type = 'label';
		} else if (item instanceof JSG.SheetButtonNode) {
			type = 'button';
		} else if (item instanceof JSG.SheetCheckboxNode) {
			type = 'checkbox';
		} else if (item instanceof JSG.SheetSliderNode) {
			type = 'slider';
		} else if (item instanceof JSG.SheetKnobNode) {
			type = 'knob';
		} else if (item instanceof JSG.SheetPlotNode) {
			type = 'streamchart';
		}

		let formula = `DRAW.${type.toUpperCase()}("${item.getId()}",`;

		if (item.getParent() instanceof CellsNode) {
			formula += `,"${item.getName().getValue()}",`;
		} else {
			formula += `"${item
				.getParent()
				.getName()
				.getValue()}","${item.getName().getValue()}",`;
		}

		const digits = this.getDigits(item.getParent());

		if (type === JSG.LineShape.TYPE) {
			let pStart = item.getStartPoint();
			pStart = this.convertToContainerPos(pStart, item.getParent());
			let pEnd = item.getEndPoint();
			pEnd = this.convertToContainerPos(pEnd, item.getParent());
			formula += `${MathUtils.roundTo(pStart.x, digits)},${MathUtils.roundTo(pStart.y, digits)},`;
			formula += `${MathUtils.roundTo(pEnd.x, digits)},${MathUtils.roundTo(pEnd.y, digits)}`;
		} else {
			let center = item.getPinPoint();
			center = this.convertToContainerPos(center, item.getParent());
			let size = item.getSizeAsPoint();
			size = this.convertToContainerSize(size, item.getParent());
			formula += `${MathUtils.roundTo(center.x, digits)},${MathUtils.roundTo(center.y, digits)},`;
			formula += `${MathUtils.roundTo(size.x, digits)},${MathUtils.roundTo(size.y, digits)}`;
			const angle = MathUtils.roundTo(item.getAngle().getValue(), 2);
			const containerType = item
				.getItemAttributes()
				.getScaleType()
				.getValue();
			let attributes = '';
			switch (containerType) {
				case 'scale':
				case 'bottom':
					attributes = `ATTRIBUTES(,"${containerType}")`;
					break;
			}
			const lineFormula = this.getLineFormula(item);
			const fillFormula = this.getFillFormula(item);
			switch (type) {
				case 'label':
					formula += `,${lineFormula || ''},,${attributes},,`;
					formula += angle === 0 ? ',,' : `${angle},,`;

					formula += `"${item.getText().getValue()}"`;
					item.getTextFormat().setRichText(false);
					break;
				case 'button':
					formula += `,,,${attributes},EVENTS(ONCLICK()),`;
					formula += angle === 0 ? ',,"Button",,FALSE' : `${angle},,"Button",,FALSE`;
					break;
				case 'checkbox':
					formula += `,,,${attributes},,`;
					formula += angle === 0 ? ',,"Checkbox",,FALSE' : `${angle},,"Checkbox",,FALSE`;
					break;
				case 'slider':
					formula += `,,,${attributes},,`;
					formula += angle === 0 ? ',,"Slider",,50,0,100,10' : `${angle},,"Slider",,50,0,100,10`;
					break;
				case 'knob':
					formula += `,,,${attributes},,`;
					formula += angle === 0 ? ',,"Knob",,50,0,100,10' : `${angle},,"Knob",,50,0,100,10`;
					break;
				default:
					if (angle !== 0 || attributes !== '' || lineFormula !== undefined || fillFormula !== undefined) {
						formula += `,${lineFormula || ''},${fillFormula || ''},${attributes},,${angle}`;
					}
					if ((type === 'polygon' || type === 'bezier') && !item.isClosed()) {
						if (angle !== 0 || attributes !== '' || lineFormula !== undefined || fillFormula !== undefined) {
							formula += ',,,FALSE';
						} else {
							formula += ',,,,,,,,FALSE';
						}
					}
					break;
			}
		}

		formula += ')';

		return formula;
	}

	getLineFormula(item, currentTerm) {
		const format = item.getFormat();
		let color = format.getLineColor().getValue();
		let style = format.getLineStyle().getValue();
		let width = format.getLineWidth().getValue();

		if (currentTerm && !currentTerm.isStatic) {
			if ((currentTerm instanceof FuncTerm) && currentTerm.name === 'LINEFORMAT') {
				if (currentTerm.params.length > 0 && !currentTerm.params[0].isStatic) {
					color = currentTerm.params[0].toString();
				}
				if (currentTerm.params.length > 1 && !currentTerm.params[1].isStatic) {
					style = currentTerm.params[1].toString();
				}
				if (currentTerm.params.length > 2 && !currentTerm.params[2].isStatic) {
					width = currentTerm.params[2].toString();
				}
			} else {
				return currentTerm.toString();
			}
		} else {
			if (color === JSG.theme.color && style === FormatAttributes.LineStyle.SOLID && (width === 1 || width === -1)) {
				return undefined;
			}
			switch (style) {
				case FormatAttributes.LineStyle.SOLID: {
					if (width === -1 || width === 1) {
						if (color === JSG.theme.border) {
							return undefined;
						}
						return `"${color}"`;
					}
					break;
				}
				case FormatAttributes.LineStyle.NONE:
					return `"None"`;
				default:
					break;
			}
		}


		const sep = JSG.getParserLocaleSettings().separators.parameter;

		let formula = 'LINEFORMAT(';
		formula += color === JSG.theme.border ? '' : `${color}`;
		formula += style === FormatAttributes.LineStyle.SOLID ? '' : `${sep}${style}`;
		if (style === FormatAttributes.LineStyle.SOLID && width !== -1) {
			formula += ',';
		}
		formula += width === -1 ? ')' : `${sep}${width})`;

		return formula;
	}

	getLineTerm(item, currentTerm) {
		const formula = this.getLineFormula(item, currentTerm);
		return formula ? this.parseTextToTerm(formula) : new NullTerm();
	}

	getFillFormula(item, currentTerm) {
		const format = item.getFormat();
		const style = format.getFillStyle().getValue();

		if (currentTerm && !currentTerm.isStatic) {
			if (currentTerm instanceof FuncTerm) {
				switch (currentTerm.name) {
					case 'FILLPATTERN': {
						let pattern;
						if (currentTerm.params.length > 0 && !currentTerm.params[0].isStatic) {
							pattern = currentTerm.params[0].toString();
						} else {
							pattern = `"${format.getPattern().getValue()}"`;
						}
						return `FILLPATTERN(${pattern})`;
					}
					case 'FILLLINEARGRADIENT':
					case 'FILLRADIALGRADIENT':
						return currentTerm.toString();
				}
			} else {
				return currentTerm.toString();
			}
		} else {
			switch (style) {
				case FormatAttributes.FillStyle.SOLID: {
					const color = format.getFillColor().getValue();
					if (color.toUpperCase() !== JSG.theme.fill) {
						return `"${color}"`;
					}
					return undefined;
				}
				case FormatAttributes.FillStyle.NONE:
					return `"None"`;
				case FormatAttributes.FillStyle.PATTERN:
					return `FILLPATTERN("${format.getPattern().getValue()}")`;
				case FormatAttributes.FillStyle.GRADIENT: {
					const color = format.getFillColor().getValue();
					const grColor = format.getGradientColor().getValue();
					const sep = JSG.getParserLocaleSettings().separators.parameter;
					switch (format.getGradientType().getValue()) {
						case 0:
							return `FILLLINEARGRADIENT("${color}"${sep}"${grColor}"${sep}${format
								.getGradientAngle()
								.getValue()})`;
						case 1:
							return `FILLRADIALGRADIENT("${color}"${sep}"${grColor}"${sep}${format
								.getGradientOffsetX().getValue()}${sep}${format.getGradientOffsetY().getValue()})`;
						default:
					}
					return undefined;
				}
				default:
					return undefined;
			}
		}
		return undefined;
	}

	getFillTerm(item, currentTerm) {
		const formula = this.getFillFormula(item, currentTerm);
		return formula ? this.parseTextToTerm(formula) : new NullTerm();
	}

	getAttributesFormula(item) {
		const attr = item.getItemAttributes();
		const clip = attr.getClipChildren().getValue();
		const visible = attr.getVisible().getValue();
		const selectable = attr.getSelectionMode().getValue();
		const scale = attr.getScaleType().getValue();
		const container = attr.getContainer().getValue();

		if (clip === false && visible === true && selectable === 4 && scale === 'top' && container === true) {
			return undefined;
		}

		const sep = JSG.getParserLocaleSettings().separators.parameter;

		let formula = 'ATTRIBUTES(';
		formula += visible ? '' : `FALSE`;
		formula += sep;
		if (container) {
			formula += scale === 'top' ? '' : '';
		} else {
			formula += 'none';
		}
		formula += sep;
		formula += clip ? 'TRUE' : '';
		formula += sep;
		formula += selectable === 4 ? '' : String(selectable);
		formula += ')';

		return formula;
	}

	getAttributesTerm(item) {
		const formula = this.getAttributesFormula(item);
		return formula ? this.parseTextToTerm(formula) : new NullTerm();
	}

	getFontFormula(item, currentTerm) {
		const tf = item.getTextFormat();

		let fontName = tf.getFontName().getValue();
		let fontSize = tf.getFontSize().getValue();
		let fontStyle = tf.getFontStyle().getValue();
		let fontColor = tf.getFontColor().getValue();
		let align = tf.getHorizontalAlignment().getValue();

        if (currentTerm && !currentTerm.isStatic) {
            if ((currentTerm instanceof FuncTerm) && currentTerm.name === 'FONTFORMAT') {
                if (currentTerm.params.length > 0 && !currentTerm.params[0].isStatic) {
                    fontName = currentTerm.params[0].toString();
                }
                if (currentTerm.params.length > 1 && !currentTerm.params[1].isStatic) {
                    fontSize = currentTerm.params[1].toString();
                }
                if (currentTerm.params.length > 2 && !currentTerm.params[2].isStatic) {
                    fontStyle = currentTerm.params[2].toString();
                }
                if (currentTerm.params.length > 3 && !currentTerm.params[3].isStatic) {
                    fontColor = currentTerm.params[3].toString();
                }
                if (currentTerm.params.length > 4 && !currentTerm.params[4].isStatic) {
                    align = currentTerm.params[4].toString();
                }
            } else {
                return currentTerm.toString();
            }
        } else if (
            fontName === 'Verdana' &&
            fontSize === 8 &&
            fontStyle === 0 &&
            fontColor === JSG.theme.text &&
            align === 1
        ) {
            return new NullTerm();
        }

		const sep = JSG.getParserLocaleSettings().separators.parameter;

		let formula = 'FONTFORMAT(';
		formula += fontName === 'Verdana' ? '' : `${fontName}`;
		formula += fontSize === 8 ? sep : `${sep}${fontSize}`;
		formula += fontStyle === 0 ? sep : `${sep}${fontStyle}`;
		formula += fontColor === JSG.theme.text ? sep : `${sep}${fontColor}`;
		formula += align === 1 ? '' : `${sep}${align}`;
        formula += ')';

		return formula;
	}

    getFontTerm(item, currentTerm) {
		const formula = this.getFontFormula(item, currentTerm);
        return formula instanceof NullTerm ? formula : this.parseTextToTerm(formula);
    }

    getContainer(item, parent) {
		if (item instanceof StreamSheet) {
			return undefined;
		}

		let ws = parent;
		while (ws && !(ws instanceof StreamSheet)) {
			ws = ws.getParent();
		}

		return ws;
	}

	getGraphItemExpression(item) {
		const attr = item.getItemAttributes().getAttribute('sheetformula');
		return attr ? attr.getExpression() : undefined;
	}

	updateGraphFunction(item) {
		let formula;
		const ws = this.getContainer(item, item.getParent());
		const expr = this.getGraphItemExpression(item);
		if (!ws || !expr) {
			return undefined;
		}

		try {
			expr.evaluate(item);
		} catch (e) {}
		const termFunc = expr.getTerm();
		let type = item.getShape().getType();
		if (type === undefined || termFunc === undefined) {
			return undefined;
		}

		if (item instanceof SheetButtonNode) {
			type = 'button';
		} else if (item instanceof SheetCheckboxNode) {
			type = 'checkbox';
		} else if (item instanceof SheetSliderNode) {
			type = 'slider';
		} else if (item instanceof SheetKnobNode) {
			type = 'knob';
		} else if (item instanceof SheetPlotNode) {
			type = 'streamchart';
		} else if (item instanceof JSG.TextNode) {
			type = 'label';
		}

		// replace static params by new value
		if (termFunc && termFunc instanceof FuncTerm) {
			const angle = MathUtils.roundTo(item.getAngle().getValue(), 2);
			const digits = this.getDigits(item.getParent());
			let pin = item.getPinPoint();
			let size = item.getSizeAsPoint();
			let pStart;
			let pEnd;
			pin = this.convertToContainerPos(pin, item.getParent());
			size = this.convertToContainerSize(size, item.getParent());
			termFunc.iterateParams((param, index) => {
				if (param && param.isStatic) {
					switch (type) {
						case JSG.LineShape.TYPE: {
							switch (index) {
								case 0:
									termFunc.params[0] = Term.fromString(String(item.getId()));
									break;
								case 1:
									if (item.getParent() instanceof CellsNode) {
										termFunc.params[1] = new NullTerm();
									} else {
										termFunc.params[1] = Term.fromString(
											item
												.getParent()
												.getName()
												.getValue()
										);
									}
									break;
								case 2:
									termFunc.params[2] = Term.fromString(item.getName().getValue());
									break;
								case 3:
									pStart = item.getStartPoint();
									pStart = this.convertToContainerPos(pStart, item.getParent());
									param.operand._value = MathUtils.roundTo(pStart.x, digits);
									break;
								case 4:
									pStart = item.getStartPoint();
									pStart = this.convertToContainerPos(pStart, item.getParent());
									param.operand._value = MathUtils.roundTo(pStart.y, digits);
									break;
								case 5:
									pEnd = item.getEndPoint();
									pEnd = this.convertToContainerPos(pEnd, item.getParent());
									param.operand._value = MathUtils.roundTo(pEnd.x, digits);
									break;
								case 6:
									pEnd = item.getEndPoint();
									pEnd = this.convertToContainerPos(pEnd, item.getParent());
									param.operand._value = MathUtils.roundTo(pEnd.y, digits);
									break;
								default:
									break;
							}
							break;
						}
						default:
							switch (index) {
								case 0:
									termFunc.params[0] = Term.fromString(String(item.getId()));
									break;
								case 1:
									if (item.getParent() instanceof CellsNode) {
										termFunc.params[1] = new NullTerm();
									} else {
										termFunc.params[1] = Term.fromString(
											item
												.getParent()
												.getName()
												.getValue()
										);
									}
									break;
								case 2:
									termFunc.params[2] = Term.fromString(item.getName().getValue());
									break;
								case 3:
									termFunc.params[index] = Term.fromNumber(MathUtils.roundTo(pin.x, digits));
									break;
								case 4:
									termFunc.params[index] = Term.fromNumber(MathUtils.roundTo(pin.y, digits));
									break;
								case 5:
									termFunc.params[index] = Term.fromNumber(MathUtils.roundTo(size.x, digits));
									break;
								case 6:
									termFunc.params[index] = Term.fromNumber(MathUtils.roundTo(size.y, digits));
									break;
								default:
									break;
							}
					}
				}
			});
			formula = this.getLineTerm(item, termFunc.params[7]);
			let force =
				termFunc.params.length > 7 &&
				termFunc.params[7] instanceof FuncTerm &&
				termFunc.params[7].name === 'LINEFORMAT';
			this.setGraphFunctionParam(termFunc, 7, formula, force);
			formula = this.getFillTerm(item, termFunc.params[8]);
			force =
				termFunc.params.length > 8 &&
				termFunc.params[8] instanceof FuncTerm &&
				termFunc.params[8].name.indexOf('FILL') !== -1;
			this.setGraphFunctionParam(termFunc, 8, formula, force);
			this.setGraphFunctionParam(termFunc, 11, angle ? Term.fromNumber(angle) : new NullTerm());
			switch (type) {
				case 'knob':
				case 'slider':
				case 'button':
				case 'checkbox': {
					// 13 label
					// 14 font
					// 15 value
					const value = item.getAttributeValueAtPath('value');
					this.setGraphFunctionParam(
						termFunc,
						15,
						value === undefined ? new NullTerm() : Term.fromValue(value)
					);
					break;
				}
				case 'label':
					this.setGraphFunctionParam(
						termFunc,
						13,
						Term.fromString(Strings.encodeXML(item.getText().getValue()))
					);
                    formula = this.getFontTerm(item, termFunc.params[14]);
                    force =
                        termFunc.params.length > 14 &&
                        termFunc.params[14] instanceof FuncTerm &&
                        termFunc.params[14].name === 'FONTFORMAT';
					this.setGraphFunctionParam(termFunc, 14, formula, force);
					break;
				case 'bezier':
				case 'polygon': {
					const closed = item.getItemAttributes().getClosed().getValue();
					this.setGraphFunctionParam(termFunc, 14, closed ? new NullTerm() : Term.fromBoolean(closed));
					break;
				}
			}

			let i = termFunc.params.length - 1;
			for (; i > 5; i -= 1) {
				if (!(termFunc.params[i] instanceof NullTerm)) {
					break;
				}
			}
			termFunc.params.length = i + 1;
		}

		formula = expr.toLocaleString('en', { item: ws, useName: true, forceName: true });
		if (formula.length && formula[0] === '=') {
			formula = formula.substring(1);
		}

		return formula;
	}

	setGraphFunctionParam(termFunc, index, param, force = false) {
		if (param instanceof NullTerm && termFunc.params.length <= index) {
			return;
		}

		for (let i = termFunc.params.length; i < index; i += 1) {
			termFunc.params[i] = new NullTerm();
		}

		const current = termFunc.params[index];
		if (current === undefined || current.isStatic || force) {
			termFunc.params[index] = param;
		}
	}

	getSheetDescriptor() {
		const sheetDescriptor = {};
		const data = this.getDataProvider();

		sheetDescriptor.cells = this.getCellDescriptors();
		sheetDescriptor.names = [];

		data.getNames().forEach((name) => {
			const expr = name.getExpression();
			const cellDescriptor = {
				name: name.getName(),
				formula: expr ? expr.getFormula() : undefined,
				value: name.getValue(),
				type: typeof name.getValue()
			};
			sheetDescriptor.names.push(cellDescriptor);
		});

		sheetDescriptor.graphs = this.getGraphDescriptors();

		return sheetDescriptor;
	}

	updateOrCreateGraphFormulas(undo) {
		const formulas = [];
		let oldFormula;
		let formula;

		const add = (item) => {
			const attrSource = item.getItemAttributes().getAttribute('sheetsource');
			if (!(attrSource && attrSource.getValue() === 'cell')) {
				const attr = item.getItemAttributes().getAttribute('sheetformula');
				oldFormula = undefined;
				if (attr && attr.getExpression()) {
					oldFormula = attr.getExpression().getFormula();
					formula = item._noFormulaUpdate ? oldFormula : this.updateGraphFunction(item);
				} else {
					formula = this.createGraphFunction(item);
				}

				if (formula && (oldFormula !== formula || item._noFormulaUpdate || undo)) {
					formulas.push({
						item,
						formula
					});
				}
				item._noFormulaUpdate = undefined;
			}
		};

		GraphUtils.traverseItem(this.getCells(), (item) => add(item), false);

		return formulas;
	}

	getGraphDescriptors() {
		const graphs = [];

		const add = (item) => {
			const attrFormula = item.getItemAttributes().getAttribute('sheetformula');

			if (attrFormula) {
				const expr = attrFormula.getExpression();
				const cellDescriptor = {
					name: `${item.getId()}`,
					formula: expr ? expr.getFormula() : undefined,
					value: expr.getValue(),
					type: typeof expr.getValue()
				};
				graphs.push(cellDescriptor);
			}
		};

		GraphUtils.traverseItem(this.getCells(), (item) => add(item), false);

		return graphs;
	}

	getCellDescriptors() {
		const data = this.getDataProvider();
		const cellDescriptors = [];
		let expr;
		const range = new CellRange(this, 0, 0, 0, 0);

		data.enumerate((column, row, cell) => {
			const cellAttr = this.getCellAttributesAtRC(column, row);
			range.set(column, row);
			range.shiftToSheet();
			expr = cell.getExpression();
			const cellDescriptor = {
				reference: range.toString(),
				formula: expr ? expr.getFormula() : undefined,
				value: cell.getValue(),
				type: typeof cell.getValue(),
				level: cellAttr ? cellAttr.getLevel().getValue() : undefined
			};
			cellDescriptors.push(cellDescriptor);
		});

		return cellDescriptors;
	}

	replaceTerm(formula, expression, index) {
		const newExpression = this.textToExpression(String(formula));
		const term = expression.getTerm();

		if (term && newExpression) {
			for (let i = term.params.length; i < index; i += 1) {
				term.params[i] = new NullTerm();
			}

			term.params[index] = newExpression.term;
			expression.correctFormula(this, true);
		}
	}
};
