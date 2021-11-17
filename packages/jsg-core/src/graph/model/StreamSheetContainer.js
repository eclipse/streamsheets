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
const StringAttribute = require('../attr/StringAttribute');
const FormatAttributes = require('../attr/FormatAttributes');
const GridLayout = require('../../layout/GridLayout');
const NotificationCenter = require('../notifications/NotificationCenter');
const Notification = require('../notifications/Notification');
const StreamSheet = require('./StreamSheet');
const InboxContainer = require('./InboxContainer');
const CaptionNode = require('./CaptionNode');
const LayoutNode = require('./LayoutNode');
const ButtonNode = require('./ButtonNode');
const SplitterNode = require('./SplitterNode');
const StreamSheetContainerAttributes = require('../attr/StreamSheetContainerAttributes');

/**
 * @class StreamSheetContainer

 * @extends Node
 * @constructor
 */
module.exports = class StreamSheetContainer extends Node {
	constructor() {
		super();

		this.addAttribute(new StreamSheetContainerAttributes());

		// left caption
		this._inboxCaption = new CaptionNode();
		this._inboxCaption.setType('inboxcaption');
		this._inboxCaption.setName(`${JSG.getLocalizedString('Inbox')} - ${JSG.getLocalizedString('None')}`);
		this._inboxCaption.setLayout(GridLayout.TYPE);
		this.addItem(this._inboxCaption);

		// inbox container
		this._inboxContainer = new InboxContainer();
		this._inboxContainer.setWidth(5000);
		this.addItem(this._inboxContainer);

		// splitter
		this._splitter = new SplitterNode();
		this._splitter.setDirection(ItemAttributes.Direction.VERTICAL);
		this.addItem(this._splitter);

		// right caption
		this._sheetCaption = new CaptionNode();
		this._sheetCaption.setType('sheetcaption');
		this._sheetCaption.setName('StreamSheet');
		this._sheetCaption.setLayout(GridLayout.TYPE);

		this.addItem(this._sheetCaption);

		this.createButtons();

		// process sheet
		this._processSheet = new StreamSheet();
		this.addItem(this._processSheet);

		this.getFormat().setLineColor('#CCCCCC');
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		// this.getItemAttributes().setMoveable(ItemAttributes.Moveable.NONE);
		this.getItemAttributes().setRotatable(false);
		this.getItemAttributes().setDeleteable(false);
		this.getItemAttributes().setContainer(false);
		this.getItemAttributes().setClipChildren(true);

		// this._drawEnabled = false;
	}

	get allowSubMarkers() {
		return false;
	}

	addDashboardSettings() {
		const layoutNode = new LayoutNode();
		layoutNode.setSize(20000, 10000);
		layoutNode.getPin().setLocalPoint(0, 0);
		layoutNode.setOrigin(0, 0);
		layoutNode.getItemAttributes().setMoveable(ItemAttributes.Moveable.NONE);
		layoutNode.getItemAttributes().setDeleteable(false);
		this._processSheet.getCells().addItem(layoutNode);
	}

	createButtons() {
		this._inboxCaption._subItems = [];

		const settingsInboxButton = new ButtonNode();
		settingsInboxButton.getItemAttributes().addAttribute(new StringAttribute('LayoutHorizontal', 'right'));
		settingsInboxButton.getItemAttributes().addAttribute(new StringAttribute('LayoutVertical', 'center'));
		settingsInboxButton.getFormat().setFillStyle(FormatAttributes.FillStyle.PATTERN);
		settingsInboxButton.getFormat().setPattern('settings');
		settingsInboxButton.getFormat().setFillColor('#1976d2');
		settingsInboxButton.getFormat().setShadowOffsetX(1);
		settingsInboxButton.onClick = this.onClick;
		settingsInboxButton.setEventScope(this);
		settingsInboxButton.setSize(700, 500);
		settingsInboxButton.setTooltip(JSG.getLocalizedString('Inbox Settings'));
		this._inboxCaption.addItem(settingsInboxButton);
		settingsInboxButton.setName('inboxSettings');

		this._sheetCaption._subItems = [];

		const settingsButton = new ButtonNode();
		settingsButton.getItemAttributes().addAttribute(new StringAttribute('LayoutHorizontal', 'right'));
		settingsButton.getItemAttributes().addAttribute(new StringAttribute('LayoutVertical', 'center'));
		settingsButton.getFormat().setFillStyle(FormatAttributes.FillStyle.PATTERN);
		settingsButton.getFormat().setPattern('settings');
		settingsButton.getFormat().setFillColor('#1976d2');
		settingsButton.getFormat().setShadowOffsetX(1);
		settingsButton.onClick = this.onClick;
		settingsButton.setEventScope(this);
		settingsButton.setSize(700, 500);
		settingsButton.setTooltip(JSG.getLocalizedString('Sheet Settings'));
		this._sheetCaption.addItem(settingsButton);
		settingsButton.setName('settings');

		const minimizeButton = new ButtonNode();
		minimizeButton.getItemAttributes().addAttribute(new StringAttribute('LayoutHorizontal', 'right'));
		minimizeButton.getItemAttributes().addAttribute(new StringAttribute('LayoutVertical', 'center'));
		minimizeButton.getFormat().setFillStyle(FormatAttributes.FillStyle.PATTERN);
		minimizeButton.getFormat().setPattern('minimize');
		minimizeButton.getFormat().setFillColor('#1976d2');
		minimizeButton.getFormat().setShadowOffsetX(1);
		minimizeButton.onClick = this.onClickMinimize;
		minimizeButton.setEventScope(this);
		minimizeButton.setSize(700, 500);
		minimizeButton.setTooltip(JSG.getLocalizedString('Minimize StreamSheet'));
		this._sheetCaption.addItem(minimizeButton);
		minimizeButton.setName('minimize');

		const maximizeButton = new ButtonNode();
		maximizeButton.getItemAttributes().addAttribute(new StringAttribute('LayoutHorizontal', 'right'));
		maximizeButton.getItemAttributes().addAttribute(new StringAttribute('LayoutVertical', 'center'));
		maximizeButton.getFormat().setFillStyle(FormatAttributes.FillStyle.PATTERN);
		maximizeButton.getFormat().setPattern('maximize');
		maximizeButton.getFormat().setFillColor('#1976d2');
		maximizeButton.getFormat().setShadowOffsetX(1);
		maximizeButton.onClick = this.onClickMaximize;
		maximizeButton.setEventScope(this);
		maximizeButton.setSize(700, 500);
		maximizeButton.setTooltip(JSG.getLocalizedString('Maximize StreamSheet'));
		this._sheetCaption.addItem(maximizeButton);
		maximizeButton.setName('maximize');

		const deleteButton = new ButtonNode();
		deleteButton.getItemAttributes().addAttribute(new StringAttribute('LayoutHorizontal', 'right'));
		deleteButton.getItemAttributes().addAttribute(new StringAttribute('LayoutVertical', 'center'));
		deleteButton.getFormat().setFillStyle(FormatAttributes.FillStyle.PATTERN);
		deleteButton.getFormat().setPattern('deletesheet');
		deleteButton.getFormat().setFillColor('#1976d2');
		deleteButton.getFormat().setShadowOffsetX(1);
		deleteButton.onClick = this.onClick;
		deleteButton.setEventScope(this);
		deleteButton.setSize(800, 500);
		deleteButton.setTooltip(JSG.getLocalizedString('Delete StreamSheet'));
		this._sheetCaption.addItem(deleteButton);
		deleteButton.setName('delete');
	}

	onClickMinimize(button) {
		this.getGraph().setViewMode(this, 1);

		NotificationCenter.getInstance().send(
			new Notification(ButtonNode.BUTTON_CLICKED_NOTIFICATION, { button, container: this })
		);
	}

	onClickMaximize(button) {
		const old = this.getItemAttributes()
			.getViewMode()
			.getValue();
		this.getGraph().setViewMode(this, old === 2 ? 0 : 2);

		NotificationCenter.getInstance().send(
			new Notification(ButtonNode.BUTTON_CLICKED_NOTIFICATION, { button, container: this })
		);
	}

	onClick(button) {
		NotificationCenter.getInstance().send(
			new Notification(ButtonNode.BUTTON_CLICKED_NOTIFICATION, { button, container: this })
		);
	}

	newInstance() {
		return new StreamSheetContainer();
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		copy._assignItems();

		return copy;
	}

	_assignName(id) {
		this.setName(`StreamSheetContainer${id}`);
	}

	getStreamSheetContainerAttributes() {
		return this.getModelAttributes().getAttribute(StreamSheetContainerAttributes.NAME);
	}

	getSheetType() {
		const type = this.getStreamSheetContainerAttributes().getSheetType();
		return type ? type.getValue() : 'sheet';
	}

	setStream(source) {
		JSG.propertyEventsDisabled = true;
		this._inboxCaption.setName(`${JSG.getLocalizedString('Inbox')} - ${JSG.getLocalizedString(source)}`);
		this.getGraph().markDirty();
		this.getStreamSheetContainerAttributes().setStream(source);
		JSG.propertyEventsDisabled = false;
	}

	setStatus(status) {
		JSG.propertyEventsDisabled = true;
		this._inboxCaption.setIcon(status);
		this.getStreamSheetContainerAttributes().setStatus(status);
		this.getGraph().markDirty();
		JSG.propertyEventsDisabled = false;
	}

	setLoopIndex(index) {
		JSG.propertyEventsDisabled = true;
		this.getStreamSheetContainerAttributes().setLoopIndex(index);
		JSG.propertyEventsDisabled = false;
	}

	setLoopElement(element, enabled) {
		this.getInboxContainer()
			.getMessageTreeItems()
			.getTreeItemAttributes()
			.setActiveElement(enabled ? element : '');
		this.getGraph().markDirty();
		this.getStreamSheetContainerAttributes().setLoopElement(enabled ? element : '');
	}

	setReplaceKey(key) {
		this.getStreamSheetContainerAttributes().setReplaceKey(key);
	}

	setStep(index) {
		JSG.propertyEventsDisabled = true;
		this.getStreamSheetContainerAttributes().setStep(index);
		// do not trigger event, as chart menu will be hidden while running
		this.getSheetCaption().setName(
			`${this.getStreamSheet()
				.getName()
				.getValue()} - ${JSG.getLocalizedString('Step')} ${index}`
		);
		JSG.propertyEventsDisabled = false;
	}

	setMessage(message) {
		this._message = message;
	}

	getMessageIndex() {
		return this._message.getIndex();
	}

	setMessageIndex(index) {
		this._message.setIndex(index);
	}

	getMessage() {
		return this._message;
	}

	getStreamSheet() {
		return this._processSheet;
	}

	getStreamSheetsContainer() {
		return this.getParent() ? this.getParent().getParent() : undefined;
	}

	getOutboxContainer() {
		return this.getStreamSheetsContainer().getOutboxContainer();
	}

	getSheetCaption() {
		return this._sheetCaption;
	}

	getInboxContainer() {
		return this._inboxContainer;
	}

	getInboxCaption() {
		return this._inboxCaption;
	}

	isAddLabelAllowed() {
		return false;
	}

	_assignItems() {
		this.subItems.forEach((item) => {
			if (item instanceof StreamSheet) {
				this._processSheet = item;
			} else if (item instanceof SplitterNode) {
				this._splitter = item;
			} else if (item instanceof InboxContainer) {
				this._inboxContainer = item;
			} else {
				switch (item.getType().getValue()) {
					case 'inboxcaption':
						this._inboxCaption = item;
						this._inboxCaption.setName(
							`${JSG.getLocalizedString('Inbox')} - ${JSG.getLocalizedString('None')}`
						);
						break;
					case 'sheetcaption':
						this._sheetCaption = item;
						break;
					default:
						break;
				}
			}
		});
	}

	saveCondensed(writer) {
		writer.writeStartElement('graphitem');

		writer.writeAttributeNumber('id', this.getId(), 0);
		writer.writeAttributeNumber('visible', this.getItemAttributes().getVisible().getValue() ? 1 : 0, 0);

		// save StreamSheetContainer Attributes, Pin, Size
		this.getStreamSheetContainerAttributes().saveCondensed(writer, 'attributes');
		this._pin.save('pin', writer, false);
		this._size.save('size', writer);

		// inbox save content
		this._inboxContainer.saveCondensed(writer, 'inbox');
		this._processSheet.saveCondensed(writer);

		writer.writeEndElement('graphitem');
	}

	getItemType() {
		return 'processsheetcontainer';
	}

	_createId() {
		if (this._parent === undefined) {
			return undefined;
		}

		let id = 1000;

		while (this._parent.getItemById(id)) {
			id += 1000;
		}

		return id;
	}

	read(reader, object) {
		if (reader.version >= 1) {
			if (reader.version > 1) {
				let id = reader.getAttribute(object, 'id');
				if (id !== undefined && reader.version > 1) {
					id = Number(id);
				}
				this.setId(id);
				const visible = reader.getAttribute(object, 'visible');
				if (visible !== undefined) {
					this.getItemAttributes().setVisible(!!Number(visible));
				}
			} else {
				this.setId(1);
			}
			reader.iterateObjects(object, (name, child) => {
				switch (name) {
					case 'attributes':
						this.getStreamSheetContainerAttributes().readCondensed(reader, child);
						break;
					case 'pin':
						this._pin.read(reader, child);
						this._pin.setLocalCoordinate(
							new JSG.NumberExpression(0, 'WIDTH * 0.5'),
							new JSG.NumberExpression(0, 'HEIGHT * 0.5')
						);
						// after pin change we update origin cache, so that subsequent call to origin gets correct values...
						this._updateOrigin();
						break;
					case 'size':
						this._size.read(reader, child);
						// after size change we update bbox cache, so that subsequent call to bbox gets correct values...
						this._updateBoundingBox();
						break;
					case 'inbox':
						this._inboxContainer.readCondensed(reader, child);
						break;
					case 'processsheet':
						this._processSheet.read(reader, child);
						break;
				}
			});
		} else {
			this._subItems = [];

			super.read(reader, object);
			this._assignItems();

			this.createButtons();

			this.getItemAttributes().setClipChildren(true);
			this.getItemAttributes().setDeleteable(false);
			this.getFormat().setLineColor('#777777');
		}
	}

	layout() {
		const box = JSG.boxCache.get();
		const size = this.getSize().toPoint();
		const sizeInbox = this._inboxContainer.getSize().toPoint();
		let heightCaption = 650;
		let left = 0;
		let inbox;
		let hideButtons = false;
		let captions = true;
		const layoutNode = this._processSheet.getLayoutNode();

		const settings = this.viewSettings;
		if (settings.active === true) {
			hideButtons = true;
			captions = settings.showInbox;
			heightCaption = captions ? 650 : 0;
			inbox = settings.showInbox;
		} else {
			inbox = this.getStreamSheetContainerAttributes().getInboxVisible().getValue();
		}

		this.getInboxContainer()
			.getMessageListItems()
			.setHideEnabledItems(
				this.getStreamSheetContainerAttributes()
					.getHideMessages()
					.getValue()
			);

		this._inboxCaption.getItemAttributes().setVisible(inbox);
		this._inboxContainer.getItemAttributes().setVisible(inbox);
		this._inboxContainer.updateSubAttributes();
		this._splitter.getItemAttributes().setVisible(inbox);

		if (captions) {
			this._sheetCaption.getItemAttributes().setVisible(true);
			this._sheetCaption.subItems.forEach((subItem) => {
				subItem.getItemAttributes().setVisible(hideButtons === false);
			});

			this._inboxCaption.subItems.forEach((subItem) => {
				subItem.getItemAttributes().setVisible(hideButtons === false);
			});
		} else {
			this._sheetCaption.getItemAttributes().setVisible(false);
		}

		if (inbox) {
			box.setLeft(0);
			box.setTop(0);
			box.setWidth(sizeInbox.x + SplitterNode.DEFAULT_SIZE);
			box.setHeight(heightCaption);

			this._inboxCaption.setBoundingBoxTo(box);

			box.setLeft(0);
			box.setTop(heightCaption);
			box.setWidth(sizeInbox.x);
			box.setHeight(size.y - heightCaption);

			this._inboxContainer.setBoundingBoxTo(box);

			box.setLeft(sizeInbox.x);
			box.setWidth(SplitterNode.DEFAULT_SIZE);

			this._splitter.setBoundingBoxTo(box);

			left = sizeInbox.x + SplitterNode.DEFAULT_SIZE;
		} else {
			box.setLeft(0);
			box.setTop(heightCaption);
			box.setWidth(sizeInbox.x);
			box.setHeight(size.y - heightCaption);

			this._inboxContainer.setBoundingBoxTo(box);

			box.setLeft(sizeInbox.x);
			box.setWidth(SplitterNode.DEFAULT_SIZE);

			this._splitter.setBoundingBoxTo(box);
		}

		box.setLeft(left);
		box.setWidth(size.x - left);
		box.setHeight(size.y - heightCaption);

		this._processSheet.setBoundingBoxTo(box);

		if (layoutNode) {
			const layoutMode = layoutNode.getAttributeValueAtPath('layoutmode');
			const minWidth = layoutNode.getAttributeValueAtPath('minwidth');
			const maxWidth = layoutNode.getAttributeValueAtPath('maxwidth');
			let sheetSize = size.x - left;
			const layoutSize = layoutNode.getSizeAsPoint();
			switch (layoutMode) {
			case 'center':
				layoutNode.setOrigin(Math.max(0, (sheetSize - layoutSize.x) / 2), 0);
				break;
			case 'resize': {
				layoutNode.setOrigin(0, 0);
				sheetSize = Math.max(sheetSize, minWidth)
				sheetSize = Math.min(sheetSize, maxWidth)
				const scroll = (size.y - heightCaption) < layoutSize.y && sheetSize > layoutSize.x;
				if (scroll) {
					sheetSize -= JSG.ScrollBar.SIZE;
				}
				if (sheetSize !== layoutSize.x) {
					layoutNode.setWidth(sheetSize);
					layoutNode.layout();
				}
				const space = size.x - left - (scroll ? JSG.ScrollBar.SIZE : 0);
				if (space > layoutSize.x) {
					layoutNode.setOrigin(Math.max(0, (space - layoutSize.x) / 2), 0);
				}
				break;
			}
			case 'left':
				layoutNode.setOrigin(0, 0);
				break;
			}
		}

		const event = new JSG.Event(JSG.Event.BBOX, box);
		event.source = this;
		this.sendPostEvent(event);

		if (captions) {
			box.setTop(0);
			box.setHeight(heightCaption);

			this._sheetCaption.setBoundingBoxTo(box);

			this._sheetCaption.layout();
			this._inboxCaption.layout();
		}

		this._inboxContainer.layout();

		JSG.boxCache.release(box);

		super.layout();
	}
};
