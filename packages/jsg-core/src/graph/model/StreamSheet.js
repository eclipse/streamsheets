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

const { NullTerm } = require('@cedalo/parser');
const qrjs2 = require('qrjs2');

const JSG = require('../../JSG');
const Graph = require('./Graph');
const ItemAttributes = require('../attr/ItemAttributes');
const JSONReader = require('../../commons/JSONReader');
const JSONWriter = require('../../commons/JSONWriter');
const Expression = require('../expr/Expression');
const WorksheetNode = require('./WorksheetNode');
const CellsNode = require('./CellsNode');
const CellRange = require('./CellRange');
const NotificationCenter = require('../notifications/NotificationCenter');
const Notification = require('../notifications/Notification');
const GraphUtils = require('../GraphUtils');
const AddImageCommand = require('../command/AddImageCommand');

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

		this.getWorksheetAttributes().setCalcOnDemand(true);
		if (typeof sessionStorage !== 'undefined') {
			const sessionId = sessionStorage.getItem('sessionId');
			const user = JSON.parse(localStorage.getItem('user'));
			if (user && sessionId) {
				const id = `${sessionId};${user.id};${user.displayName}`;
				this.setSelectionId(id);
			}
		}

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

		if (!undo) {
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
		this.setName(newName);
		setSheetCaption(newName, this.getStreamSheetContainer());
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

	setShapes(json) {
		if (!json || !json.shapes) {
			return;
		}

		const changed = this.getCells()._shapesChanged;
		if (changed !== undefined && json.changed !== changed) {
			// to prevent, that old updates are processed
			return;
		}

		this.getCells()._shapesChanged = undefined;
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
			} else if (shape.parent !== node.getParent().getId()) {
				const parent = this.getCells().getItemById(shape.parent);
				if (parent) {
					node.changeParent(parent);
				}
			}
			const jsonShape = JSON.stringify(shape);
			if (!node._lastJSON || node._lastJSON !== jsonShape) {
				const eventEnabled = node.disableEvents();
				node.fromJSON(shape);
				node.enableEvents(eventEnabled);
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
                node.evaluate();
                node.setRefreshNeeded(true);
			}

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

		NotificationCenter.getInstance().send(
			new Notification(WorksheetNode.SELECTION_CHANGED_NOTIFICATION, {
				item: this,
				updateFinal: false
			})
		);
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

		return sheetDescriptor;
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
