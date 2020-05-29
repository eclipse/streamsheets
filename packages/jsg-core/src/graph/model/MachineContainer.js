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
const Node = require('./Node');
const ItemAttributes = require('../attr/ItemAttributes');
const StreamSheetsContainer = require('./StreamSheetsContainer');
const OutboxContainer = require('./OutboxContainer');
const SplitterNode = require('./SplitterNode');
const MachineContainerAttributes = require('../attr/MachineContainerAttributes');

/**
 * @class MachineContainer

 * @extends Node
 * @constructor
 */
module.exports = class MachineContainer extends Node {
	constructor() {
		super();

		this.addAttribute(new MachineContainerAttributes());

		// process container
		this._processContainer = new StreamSheetsContainer();
		this.addItem(this._processContainer);

		// splitter
		this._splitter = new SplitterNode();
		this._splitter.setDirection(ItemAttributes.Direction.VERTICAL);
		this.addItem(this._splitter);

		this._outboxContainer = new OutboxContainer();
		this._outboxContainer.setWidth(5000);
		this.addItem(this._outboxContainer);

		this.getItemAttributes().setSelectionMode(ItemAttributes.SelectionMode.NONE);
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setContainer(false);

		this._splitter.setItemToResize(this._outboxContainer);

		this._drawEnabled = false;
	}

	newInstance() {
		return new MachineContainer();
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		copy._assignItems();

		return copy;
	}

	_assignName(id) {
		this.setName(`MachineContainer${id}`);
	}

	getMachineContainerAttributes() {
		return this.getModelAttributes().getAttribute(MachineContainerAttributes.NAME);
	}

	getMachineState(state) {
		return this.getMachineContainerAttributes().getMachineState();
	}

	setMachineState(state) {
		this.getMachineContainerAttributes().setMachineState(state);
	}

	isAddLabelAllowed() {
		return false;
	}

	getStreamSheetsContainer() {
		return this._processContainer;
	}

	getSplitter() {
		return this._splitter;
	}

	getOutboxContainer() {
		return this._outboxContainer;
	}

	_assignItems() {
		this.getItems().forEach((item) => {
			if (item instanceof StreamSheetsContainer) {
				this._processContainer = item;
			} else if (item instanceof SplitterNode) {
				this._splitter = item;
			} else if (item instanceof OutboxContainer) {
				this._outboxContainer = item;
			}
		});

		this._splitter.setItemToResize(this._outboxContainer);
	}

	saveCondensed(writer) {
		this.getMachineContainerAttributes().saveCondensed(writer, 'attributes');
		this._outboxContainer.saveCondensed(writer, 'outbox');
		this._processContainer.saveCondensed(writer);
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);
		file.writeAttributeString('type', 'machinecontainer');
	}

	read(reader, object) {
		if (reader.version >= 1) {
			reader.iterateObjects(object, (name, child) => {
				switch (name) {
					case 'attributes':
						this.getMachineContainerAttributes().readCondensed(reader, child);
						break;
					case 'outbox':
						this._outboxContainer.readCondensed(reader, child);
						break;
				}
			});

			const container = this.getStreamSheetsContainer();
			container.read(reader, object);
		} else {
			this._subItems = [];
			super.read(reader, object);
		}

		this._assignItems();
	}

	layout() {
		const box = JSG.boxCache.get();
		const size = this.getSize().toPoint();
		const sizeOutbox = this._outboxContainer.getSize().toPoint();
		let outbox = this.getMachineContainerAttributes()
			.getOutboxVisible()
			.getValue();
		if (!this.getGraph().isOutboxVisible()) {
			outbox = false;
		}

		this._outboxContainer.getItemAttributes().setVisible(outbox);
		this._outboxContainer.updateSubAttributes();
		this._splitter.getItemAttributes().setVisible(outbox);

		box.setLeft(0);
		box.setTop(0);
		box.setWidth(size.x - (outbox ? SplitterNode.DEFAULT_SIZE + sizeOutbox.x : 0));
		box.setHeight(size.y);

		this._processContainer.setBoundingBoxTo(box);

		if (outbox) {
			box.setLeft(size.x - sizeOutbox.x - SplitterNode.DEFAULT_SIZE);
			box.setWidth(SplitterNode.DEFAULT_SIZE);

			this._splitter.setBoundingBoxTo(box);

			box.setLeft(size.x - sizeOutbox.x);
			box.setWidth(sizeOutbox.x);

			this._outboxContainer.setBoundingBoxTo(box);
			this._outboxContainer.layout();
		} else {
			this._outboxContainer.getBoundingBox(box);
			box.setLeft(box.getWidth() / 2);
			box.setTop(0);
			box.setHeight(0);
			this._outboxContainer.setBoundingBoxTo(box);
		}

		JSG.boxCache.release(box);

		super.layout();
	}
};
