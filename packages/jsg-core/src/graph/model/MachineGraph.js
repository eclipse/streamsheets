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
const JSG = require('../../JSG');
const FormatAttributes = require('../attr/FormatAttributes');
const ItemAttributes = require('../attr/ItemAttributes');
const Arrays = require('../../commons/Arrays');
const Graph = require('./Graph');
const MachineContainer = require('./MachineContainer');
const SheetName = require('./SheetName');
const StreamSheet = require('./StreamSheet');
const GraphUtils = require('../GraphUtils');
const CellRange = require('./CellRange');

const getStreamSheet = (item) => {
	let sheet = item;
	while (sheet && !(sheet instanceof StreamSheet)) {
		sheet = sheet.getParent();
	}
	return sheet;
};

module.exports = class MachineGraph extends Graph {
	constructor() {
		super();

		const settings = this.getSettings();
		settings.setPortHighlightsVisible(false);
		settings.setGridVisible(false);
		settings.setScaleVisible(false);
		settings.setDisplayMode(0); // ENDLESS
		settings.setPanningEnabled(false);
		settings.setPortHighlightsVisible(false);

		this.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
		this.getFormat().setFillColor('#EEEEEE');

		this.getItemAttributes().setSelectionMode(ItemAttributes.SelectionMode.NONE);
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setClipChildren(true);
		this.getItemAttributes().setContainer(false);

		// for global names
		this._names = [];
		this._drawEnabled = false;
	}

	newInstance() {
		return new MachineGraph();
	}

	init() {
		this._machineContainer = this.addItem(new MachineContainer());
		this._machineContainer.getStreamSheetsContainer().init();
	}

	getOrCreateName(name) {
		const nameObj = this._names.find((lname) => lname.getName() === name);
		return nameObj || this.addSheetName(new SheetName(name));
	}

	getSheetNames() {
		return this._names;
	}

	getSheetName(name) {
		return this._names.find((lname) => lname.getName() === name);
	}

	addSheetName(name) {
		const index = this._names.findIndex((lname) => lname.getName() === name._name);

		if (index === -1) {
			this._names.push(name);
		} else {
			this._names[index] = name;
		}
		name.evaluate(this);
		return name;
	}

	deleteSheetName(name) {
		Arrays.remove(this._names, name);
	}

	evaluate(item) {
		this._names.forEach((name) => {
			name.evaluate(item);
		});
		super.evaluate(item);
	}

	invalidateTerms() {
		this._names.forEach((name) => {
			name.invalidateTerm();
		});

		super.invalidateTerms();
	}

	getMachineContainer() {
		return this._machineContainer;
	}

	getStreamSheetsContainer() {
		return this._machineContainer ? this._machineContainer.getStreamSheetsContainer() : undefined;
	}

	setProtected(protect) {
		const container = this.getStreamSheetsContainer();
		if (container === undefined) {
			return;
		}

		this.getMachineContainer()
			.getMachineContainerAttributes()
			.setProtected(protect);

		container.enumerateStreamSheetContainers((sheet) => {
			sheet
				.getStreamSheet()
				.getWorksheetAttributes()
				.setProtected(protect);
		});
	}

	getProtected() {
		this.getMachineContainer()
			.getMachineContainerAttributes()
			.getProtected()
			.getValue();
	}

	getStreamSheetContainerById(id) {
		const container = this.getStreamSheetsContainer();
		let result;

		container.enumerateStreamSheetContainers((sheet) => {
			if (
				id ===
				sheet
					.getStreamSheetContainerAttributes()
					.getSheetId()
					.getValue()
			) {
				result = sheet;
			}
		});

		return result;
	}

	getStreamSheetContainerCount() {
		const container = this.getStreamSheetsContainer();
		if (!container) {
			return 0;
		}

		let result = 0;

		container.enumerateStreamSheetContainers((sheet) => {
			result += 1;
		});

		return result;
	}

	getVisibleStreamSheetContainerCount() {
		const container = this.getStreamSheetsContainer();
		let result = 0;

		container.enumerateStreamSheetContainers((sheet) => {
			if (sheet.isVisible()) {
				result += 1;
			}
		});

		return result;
	}

	getDashboardContainer() {
		const container = this.getStreamSheetsContainer();
		let result;

		container.enumerateStreamSheetContainers((sheet) => {
			if (sheet.getSheetType() === 'dashboard') {
				result = sheet;
			}
		});

		return result;
	}

	getStreamSheetById(id) {
		const container = this.getStreamSheetsContainer();
		let result;
		container.enumerateStreamSheetContainers((sheet) => {
			if (id === sheet.getStreamSheet().getId()) {
				result = sheet.getStreamSheet();
			}
		});
		return result;
	}

	getStreamSheetContainerByStreamSheetName(name) {
		const container = this.getStreamSheetsContainer();
		let result;
		container.enumerateStreamSheetContainers((sheet) => {
			if (
				name ===
				sheet
					.getStreamSheet()
					.getName()
					.getValue()
			) {
				result = sheet;
			}
		});

		return result;
	}

	removeAllSheetSelections() {
		const container = this.getStreamSheetsContainer();
		let result;
		container.enumerateStreamSheetContainers((sheet) => {
			const list = sheet
				.getStreamSheet()
				.getModelAttributes()
				.getAttribute('selection');
			if (list) {
				sheet
					.getStreamSheet()
					.getModelAttributes()
					.removeAttribute(list);
			}
		});

		return result;
	}

	getSheetSelection() {
		const container = this.getStreamSheetsContainer();
		let result;

		container.enumerateStreamSheetContainers((sheet) => {
			if (
				sheet
					.getStreamSheet()
					.getOwnSelection()
					.hasSelection()
			) {
				result = sheet.getStreamSheet().getOwnSelection();
			}
		});

		return result;
	}

	getInboxContainerById(id) {
		const container = this.getStreamSheetsContainer();
		let result;

		container.enumerateStreamSheetContainers((sheet) => {
			if (
				id ===
				sheet
					.getStreamSheetContainerAttributes()
					.getInboxId()
					.getValue()
			) {
				result = sheet.getInboxContainer();
			}
		});

		return result;
	}

	getOutboxContainer() {
		return this.getMachineContainer() ? this.getMachineContainer().getOutboxContainer() : undefined;
	}

	_arrange(width, height) {
		if (this._machineContainer === undefined) {
			return;
		}

		const box = JSG.boxCache.get();

		box.setLeft(0);
		box.setTop(0);
		box.setWidth(width);
		box.setHeight(height);

		this._machineContainer.setBoundingBoxTo(box);

		JSG.boxCache.release(box);
	}

	_assignItems() {
		this.subItems.forEach((item) => {
			if (item instanceof MachineContainer) {
				this._machineContainer = item;
			}
		});
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		copy.reassignIds();
		copy._assignItems();

		return copy;
	}

	isAddLabelAllowed() {
		return false;
	}

	getItemType() {
		return 'machinegraph';
	}

	save(file, absolute) {
		file.writeStartElement('graphitem');

		file.writeAttributeNumber('version', 3);
		file.writeAttributeString('uniqueid', this._uniqueId);
		if (this.getId() !== undefined) {
			file.writeAttributeString('id', this.getId());
		}

		// reminder: define transient attributes -> step, ...

		this._machineContainer.saveCondensed(file);

		file.writeStartElement('images');

		GraphUtils.traverseItem(this, (item) => {
			const pattern = item
				.getFormat()
				.getPattern()
				.getValue();
			if (String(pattern).indexOf('dataimage') !== -1) {
				file.writeStartElement(pattern);
				const image = JSG.imagePool.get(pattern);
				if (image !== undefined) {
					file.writeStartElement('data');
					file.writeString(image.src);
					file.writeEndElement();
				}
				file.writeEndElement();
			}
		});

		file.writeEndElement();
		file.writeEndElement();
	}

	_assignName(id) {
		this.setName(`MachineGraph${id}`);
	}

	read(reader, object) {
		this._reading = true;

		const version = reader.getAttribute(object, 'version');
		reader.version = version ? Number(version) : 0;

		if (reader.version >= 1) {
			this._machineContainer = this.addItem(new MachineContainer());
			this._machineContainer.read(reader, object);
		} else {
			this._subItems = [];
			super.read(reader, object);
		}

		const images = reader.getObject(object, 'images');
		if (images !== undefined) {
			reader.iterateObjects(images, (name, child) => {
				const image = reader.getObject(child, 'data');
				if (image !== undefined) {
					const dataURI = reader.getString(image);
					if (dataURI) {
						JSG.imagePool.add(dataURI, name);
					}
				}
			});
		}

		this._assignItems();

		this._reading = false;

		this.reassignIds();

		let sheet;
		GraphUtils.traverseItem(
			this,
			(item) => {
				if (item.isStreamSheet) {
					sheet = item;
				}
				if (sheet) {
					const attrFormula = item.getItemAttributes().getAttribute('sheetformula');
					if (attrFormula) {
						const expr = attrFormula.getExpression();
						if (expr !== undefined && expr.hasFormula()) {
							expr.evaluate(item);
							item.oldTermToProperties(sheet, expr.getTerm());
						}
					}
				}
			},
			false
		);

		this._restoreConnections(this);
		this.invalidateTerms();
		this.evaluate();
		this.refresh();
	}

	reassignIds() {
		const id = 1;

		if (this._reading) {
			return;
		}

		this.assignIdsToChildren(this, id);
	}

	getUniqueName(base, id) {
		let name;
		let cnt = 1;
		let found = false;
		const search = (item) => {
			name = `${base}${cnt}`;
			if (name === item.getName().getValue()) {
				found = true;
				cnt += 1;
			}
		};

		do {
			found = false;
			GraphUtils.traverseItem(this, (item) => search(item));
		} while (found);

		return name;
	}

	setViewMode(item, mode) {
		const container = this.getStreamSheetsContainer();

		switch (mode) {
			case 0: {
				// normal
				if (item) {
					item.getItemAttributes().setViewMode(0);
					item.getItemAttributes().setVisible(true);
				}
				container.enumerateStreamSheetContainers((sheet) => {
					const sheetMode = sheet
						.getItemAttributes()
						.getViewMode()
						.getValue();
					if (sheetMode === 2) {
						sheet.getItemAttributes().setViewMode(0);
					}
					if (sheet.getSheetType() !== 'cellsheet') {
						sheet.getItemAttributes().setVisible(sheetMode !== 1);
					}
				});
				break;
			}
			case 1:
				// minimize
				if (
					item
						.getItemAttributes()
						.getViewMode()
						.getValue() === 2
				) {
					this.setViewMode(item, 0);
				}
				item.getItemAttributes().setViewMode(1);
				item.getItemAttributes().setVisible(false);
				break;
			case 2:
				// maximize
				item.getItemAttributes().setViewMode(2);
				container.enumerateStreamSheetContainers((sheet) => {
					sheet.getItemAttributes().setVisible(sheet === item);
				});
				break;
		}

		this.markDirty();
	}

	getStreamSheetNames() {
		const container = this.getStreamSheetsContainer();
		const sheetNames = [];
		container.enumerateStreamSheetContainers((sheet) => {
			sheetNames.push({
				name: sheet.getStreamSheet().getName().getValue(), id: sheet.getStreamSheetContainerAttributes().getSheetId().getValue()
			});
		});
		return sheetNames;
	}

	clearViewSettings() {
		const container = this.getStreamSheetsContainer();
		if (!container) {
			return;
		}
		container.enumerateStreamSheetContainers((sheet) => {
			sheet.viewSettings = {};
			sheet.getStreamSheet().setHorizontalScrollbarMode(JSG.ScrollBarMode.AUTO);
			sheet.getStreamSheet().setVerticalScrollbarMode(JSG.ScrollBarMode.AUTO);

		});
	}

	getMachineDescriptor() {
		const container = this.getStreamSheetsContainer();
		const result = {
			sheets: {}
		};

		result.names = this._names.map((name) => {
			const expr = name.getExpression();
			return {
				name: name.getName(),
				formula: expr ? expr.getFormula() : undefined,
				value: name.getValue(),
				type: typeof name.getValue()
			};
		});

		container.enumerateStreamSheetContainers((sheet) => {
			const processSheet = sheet.getStreamSheet();

			result.sheets[processSheet.getName().getValue()] = processSheet.getSheetDescriptor();
		});

		return result;
	}

	clearSearchResult(key) {
		this.searchResult = undefined;
		this.activeSearchIndex = -1;
	}

	collectSearchResult(key, options) {
		const cont = this.getStreamSheetsContainer();

		this.searchResult = undefined;

		if (key === '') {
			return;
		}

		if (!options.matchCase) {
			key = key.toUpperCase();
		}

		cont.enumerateStreamSheetContainers((container) => {
			const sheet = container.getStreamSheet();
			if (!options.activeSheet || sheet === options.sheet) {
				const data = sheet.getDataProvider();
				// const shift = sheet.getColumns().getInitialSection()

				data.enumerate((column, row, cell) => {
					let val = cell.getValue();
					if (val !== undefined) {
						val = String(val);
						if (!options.matchCase) {
							val = val.toUpperCase();
						}
						if (val.indexOf(key) !== -1) {
							if (!this.searchResult) {
								this.searchResult = [];
							}
							this.searchResult.push(new CellRange(sheet, column, row));
						} else if (options.formulas) {
							const formula = cell.getFormula();
							if (formula) {
								if (formula.indexOf(key) !== -1) {
									if (!this.searchResult) {
										this.searchResult = [];
									}
									this.searchResult.push(new CellRange(sheet, column, row));
								}
							}
						}
					}
				});
			}
		});

		this.activeSearchIndex = -1
		this.getNextSearchResult();
	}

	getNextSearchResult() {
		if (!this.searchResult) {
			return;
		}

		const selection = this.getSheetSelection();
		const getSheetIndex = (sheet) => {
			return sheet.getParent().getIndex()
		};

		if (!selection) {
			return;
		}

		if (this.activeSearchIndex === -1) {
			this.activeSearchIndex = 0;
			for (let i = 0; i < this.searchResult.length; i += 1) {
				const range = this.searchResult[i];
				// cell behind in this sheet
				if (range.getSheet() === selection.getWorksheet() &&
					((range.getX1() >= selection.getActiveCell().x && range.getY1() === selection.getActiveCell().y) ||
						range.getY1() > selection.getActiveCell().y)) {
					this.activeSearchIndex = i;
					break;
				}
				// next sheet
				if (getSheetIndex(range.getSheet()) > getSheetIndex(selection.getWorksheet())) {
					this.activeSearchIndex = i;
					break;
				}
			}
		} else if (this.activeSearchIndex === this.searchResult.length - 1) {
			this.activeSearchIndex = 0;
		} else {
			this.activeSearchIndex += 1;
		}
	}

	getPreviousSearchResult() {

		if (this.activeSearchIndex > 0) {
			this.activeSearchIndex -= 1;
		} else {
			this.activeSearchIndex = this.searchResult.length - 1;
		}
	}

	resolveCustomReference(item, property) {
		let sheet = item;

		while (sheet && !(sheet instanceof StreamSheet)) {
			sheet = sheet.getParent();
		}

		return sheet ? sheet.getCustomReference(property) : undefined;
	}
};
