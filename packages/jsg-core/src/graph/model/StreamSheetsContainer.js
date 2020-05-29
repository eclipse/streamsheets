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
const ContentNode = require('./ContentNode');
const ItemAttributes = require('../attr/ItemAttributes');
const FormatAttributes = require('../attr/FormatAttributes');
const Point = require('../../geometry/Point');
const StreamSheetContainer = require('./StreamSheetContainer');
const StreamSheet = require('./StreamSheet');

/**
 * Class to define a process container. The process container contains all ProcessSheetContainers
 * @type {module.StreamSheetsContainer}
 */
module.exports = class StreamSheetsContainer extends ContentNode {
	constructor() {
		super();

		this.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
		this.getItemAttributes().setSelectionMode(ItemAttributes.SelectionMode.NONE);
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setClipChildren(true);

		this._allowMaximize = true;
	}

	newInstance() {
		return new StreamSheetsContainer();
	}

	init() {
		const node = this.addItem(new StreamSheetContainer());
		node.getPin().setCoordinate(11000, 7000);
		node.setSize(21000, 13000);
	}

	_assignId(force) {
		super._assignId(force);

		this.reassignIds();
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		copy.reassignIds();

		return copy;
	}

	addItem(item, atIndex) {
		const ret = super.addItem(item, atIndex);
		this.reassignIds();

		return ret;
	}

	removeItem(item) {
		super.removeItem(item);
		this.reassignIds();
	}

	reassignIds() {
		if (this.getGraph()) {
			this.getGraph().reassignIds();
		}
	}

	enumerateProcessSheets(callback) {
		const pane = this.getContentPane();

		pane.getItems().forEach((sheet) => {
			if (sheet instanceof StreamSheetContainer) {
				callback(sheet.getStreamSheet());
			}
		});
	}

	enumerateStreamSheetContainers(callback) {
		const pane = this.getContentPane();

		pane.getItems().forEach((sheet) => {
			if (sheet instanceof StreamSheetContainer) {
				callback(sheet);
			}
		});
	}

	getFirstStreamSheetContainer() {
		const pane = this.getContentPane();
		const result = pane.getItems().find((sheet) => {
			if (sheet instanceof StreamSheetContainer) {
				return sheet;
			}
			return undefined;
		});
		return result;
	}

	getOutboxContainer() {
		return this.getParent().getOutboxContainer();
	}

	isAddLabelAllowed() {
		return false;
	}

	saveCondensed(writer) {
		// only save containers
		writer.writeStartArray('graphitem');
		this.enumerateStreamSheetContainers((item) => {
			item.saveCondensed(writer);
			// item.save(writer);
		});
		writer.writeEndArray('graphitem');
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);

		file.writeAttributeString('type', 'processcontainer');
	}

	_assignName(id) {
		this.setName(`StreamSheetsContainer${id}`);
	}

	assignIdsToChildren(item, lid) {
		this._contentPane.getItems().forEach((subItem) => {
			if (subItem instanceof StreamSheetContainer) {
				// continue from this persisted id
				lid = subItem.getId() + 1;
			} else {
				subItem._id = lid;
				lid += 1;
			}
			lid = subItem.assignIdsToChildren(subItem, lid);
		});

		return lid;
	}

	onReadSubItem(subitem, parent, reader) {
		if (reader.version < 2) {
			subitem.setId(subitem._createId());
		}
	}

	read(reader, object) {
		if (reader.version >= 1) {
			// deregister notifications
			this._contentPane._subItems.forEach((item) => {
				item.dispose();
			});
			this._contentPane._subItems = [];
			reader.iterateObjects(object, (name, subnode) => {
				switch (name) {
					case 'graphitem':
					case 'gi': {
						const graphItem = new StreamSheetContainer();
						if (graphItem) {
							graphItem.read(reader, subnode);
							graphItem._reading = true;
							this.addItem(graphItem);
							graphItem._reading = false;
							this.onReadSubItem(graphItem, this, reader);
						}
						break;
					}
					default:
						break;
				}
			});
		} else {
			super.read(reader, object);
		}

		const pos = new Point(0, 0);

		this.enumerateStreamSheetContainers((item) => {
			const org = item.getOrigin();
			pos.x = Math.min(pos.x, org.x);
			pos.y = Math.min(pos.y, org.y);
		});

		pos.x = pos.x < 0 ? -pos.x + 1000 : 0;
		pos.y = pos.y < 0 ? -pos.y + 1000 : 0;

		this._contentPane.setPinPointTo(pos);
		this._changed = true;
	}

	layout() {
		const graph = this.getGraph();

		if (graph !== undefined) {
			const view = graph.getViewParams();
			if (view) {
				switch (view.viewMode) {
					case 'streamsheet':
					case 'sheet':
					case 'name':
					case 'range':
					case 'drawing':
						if (view.view) {
							let name = view.view;
							const index = name.indexOf('!');
							if (index !== -1) {
								name = name.substring(0, index);
							}

							const container = graph.getItemByName(name);
							if (container instanceof StreamSheet) {
								graph.setViewMode(container.getParent(), 2);
							}
						}
						break;
					default:
						break;
				}
			}
		}

		super.layout();
	}
};
