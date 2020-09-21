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
/* global window */


import JSG from '@cedalo/jsg-ui';
import MachineElement from './MachineElement';
import SheetParserContext from './SheetParserContext';
import GraphSynchronizationInteractionHandler from './synchronization/GraphSynchronizationInteractionHandler';
import { StreamSheet } from './api/StreamSheets';

const {
	MachineGraph,
	GraphEditor,
	SheetGraphItemEventActivator,
	SheetPlotActivator,
	EditTextActivator,
	TreeItemsNode,
	Expression,
	JSONReader,
	BoundingBox,
	MarqueeActivator,
	ImageDropActivator,
	MoveActivator,
	PanActivator,
	NotificationCenter,
	PinchActivator,
	ReshapeActivator,
	ResizeActivator,
	RotateActivator,
	SheetActivator,
	LinkActivator,
	CellRange,
	Point,
	CaptionActivator,
	ButtonActivator,
	StreamSheetContainerResizeActivator,
	SplitterActivator,
	TooltipActivator,
	TreeActivator,
	TreeItem,
	ViewActivator,
	StreamSheetContainer,
	GraphSettings
} = JSG;
let canvasId = 0;

const cellFactory = (factory, onEach) => ([name, value]) => {
	const containerCell = factory(name);
	if (containerCell) {
		const expr = new Expression(value.value, value.formula);
		containerCell.setExpression(expr);
		containerCell.setValue(value.value);
		if (onEach) onEach(containerCell);
	}
};
const setNamedCells = (namedCells, container, onEach) => {
	const factory = cellFactory(container.getOrCreateName.bind(container), onEach);
	Object.entries(namedCells).forEach(factory);
};
const setGraphCells = (graphCells, container, onEach) => {
	const factory = cellFactory(container.getOrCreateGraph.bind(container), onEach);
	Object.entries(graphCells).forEach(factory);
};

const applyProperties = (properties, processSheet) => {
	const dataProvider = processSheet.getDataProvider();
	if (properties && processSheet && dataProvider) {
		const { cols, rows, cells } = properties;
		// set column and row info
		if (cols) processSheet.getColumns().assignProperties(cols);
		if (rows) processSheet.getRows().assignProperties(rows);
		// and cells attributes
		if (cells) {
			Object.entries(cells).forEach(([ref, property]) => {
				const res = CellRange.refToRC(ref, processSheet);
				if (res != null) {
					const pos = new Point(
						res.column - processSheet.getColumns().getInitialSection(),
						res.row
					);
					const cell = dataProvider.create(pos);
					cell.properties = property;
				}
			});
		}
	}
};

const keyregex = new RegExp('\\[([^\\]]*)\\]', 'g');
const path2array = (path) => {
	const res = [];
	path.replace(keyregex, (g0, g1) => res.push(g1));
	return res;
};

// TODO review => instead of subclassing StreamMachine from MachineElement it might be better to compose
export default class StreamMachine extends MachineElement { // HTMLElement {
	constructor() {
		super(); // always call super() first in the ctor.
		this._viewMode = 'machine';
		this._viewPort = '';
		this._grid = 'visible';
		this._header = 'visible';
		this._src = '';
		this._state = 'stopped';
	}

	connectedCallback() {
		const id = this.createId();
		this.innerHTML = `
			<div style="width:100%; height: 100%">
				<canvas id=jsg${id} width="200" height="200" style="outline: none; width: inherit; height:inherit"></canvas>
			</div>`;

		if (!this.hasAttribute('viewmode')) {
			this.setAttribute('viewmode', this.viewmode);
		}
		if (!this.hasAttribute('grid') && this.grid) {
			this.setAttribute('grid', 'visible');
		}
		if (!this.hasAttribute('header') && this.header) {
			this.setAttribute('header', 'visible');
		}

		this._machineId = undefined;

		const canvas = this.querySelector(`#jsg${id}`);

		// NumberFormatter.setCulture(store.getState().locales.locale);

		this.graphEditor = new GraphEditor(canvas);
		this.canvas = canvas;

		this.graph = new MachineGraph();
		this.graphEditor.setGraph(this.graph);
		const viewer = this.graphEditor.getGraphViewer();
		const interactionHandler = new GraphSynchronizationInteractionHandler(viewer, this.graph, this);
		this.graphEditor.setInteractionHandler(interactionHandler);

		this.graph.setViewParams({
			viewMode: this.viewmode,
			view: this.viewport,
			hideheader: !this.grid,
			hidegrid: !this.header,
			zoomdisabled: false
		});

		// config graph as needed for machine app
		// viewer.setControllerFactory(SheetControllerFactory.getInstance());
		viewer
			.getScrollPanel()
			.getViewPanel()
			.setBoundsMargin(0);
		viewer
			.getScrollPanel()
			.setScrollBarsMode(JSG.ScrollBarMode.HIDDEN);

		this.graphEditor.setDisplayMode(GraphSettings.DisplayMode.ENDLESS);
		this.graphEditor.setScrollPosition(0, 0);
		this.graphEditor.setZoom(1);

		const defInteraction = this.graphEditor
			.getGraphViewer()
			.getDefaultInteraction();

		defInteraction.removeAllActivators();
		defInteraction.addActivator(
			TooltipActivator.KEY,
			new TooltipActivator()
		);
		defInteraction.addActivator(ButtonActivator.KEY, new ButtonActivator());
		defInteraction.addActivator(
			CaptionActivator.KEY,
			new CaptionActivator()
		);
		defInteraction.addActivator(
			ViewActivator.KEY,
			new ViewActivator()
		);
		defInteraction.addActivator(
			StreamSheetContainerResizeActivator.KEY,
			new StreamSheetContainerResizeActivator()
		);
		defInteraction.addActivator(ResizeActivator.KEY, new ResizeActivator());
		defInteraction.addActivator(
			ReshapeActivator.KEY,
			new ReshapeActivator()
		);
		defInteraction.addActivator(RotateActivator.KEY, new RotateActivator());
		defInteraction.addActivator(
			SheetGraphItemEventActivator.KEY,
			new SheetGraphItemEventActivator()
		);
		defInteraction.addActivator(SheetPlotActivator.KEY, new SheetPlotActivator());
		defInteraction.addActivator(SheetActivator.KEY, new SheetActivator());
		defInteraction.addActivator(
			EditTextActivator.KEY,
			new EditTextActivator()
		);
		defInteraction.addActivator(MoveActivator.KEY, new MoveActivator());
		defInteraction.addActivator(
			MarqueeActivator.KEY,
			new MarqueeActivator()
		);
		defInteraction.addActivator(
			PinchActivator.KEY,
			new PinchActivator()
		);
		defInteraction.addActivator(
			PanActivator.KEY,
			new PanActivator()
		);
		defInteraction.addActivator(
			SplitterActivator.KEY,
			new SplitterActivator()
		);
		defInteraction.addActivator(TreeActivator.KEY, new TreeActivator());
		defInteraction.addActivator(
			ImageDropActivator.KEY,
			new ImageDropActivator()
		);
		defInteraction.addActivator(LinkActivator.KEY, new LinkActivator());

		this.graph.init();

		this.doRescale = false;

		// JSG.FormulaParser.context = new SheetParserContext();

		window.addEventListener('resize', () => this.rescaleCanvas());

		NotificationCenter.getInstance().register(this, NotificationCenter.ZOOM_NOTIFICATION, 'onZoom');

		this.triggerRescale();
	}

	disconnectedCallback() {
		NotificationCenter.getInstance().unregister(this, NotificationCenter.ZOOM_NOTIFICATION);
		if (this.graphEditor) {
			this.graphEditor.destroy();
			this.graphEditor = undefined;
		}
	}

	onZoom() {
		if (!this.canvas) {
			return;
		}
		const { width, height } = this.canvas;
		const cs = this.graphEditor.getCoordinateSystem();
		// force layout
		this.graph._arrange(cs.deviceToLogX(width) / cs.getDeviceRatio(), cs.deviceToLogY(height) / cs.getDeviceRatio());
		const viewer = this.graphEditor.getGraphViewer();
		viewer.layout(cs.deviceToLogX(width) / cs.getDeviceRatio(), cs.deviceToLogY(height) / cs.getDeviceRatio());
		this.graphEditor.setScrollPosition(0, 0);
		this.graphEditor.resizeContent(width, height);
	}

	static get observedAttributes() {
		return ['viewmode', 'src', 'viewport', 'grid', 'header', 'state'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		this[name] = newValue;
	}

	get state() {
		return this._state;
	}
	set state(val) {
		if (val && this._state !== val) {
			this._state = val;
			// this.dispatchEvent(new CustomEvent('state', { detail: { machineId: this.machineId, state: val } }));
		}
	}

	get viewmode() {
		return this._viewMode;
	}

	set viewmode(val) {
		this._viewMode = val;

		this.triggerRescale();
	}

	get viewport() {
		return this._viewPort;
	}

	set viewport(val) {
		this._viewPort = val;

		this.triggerRescale();
	}

	get header() {
		return this._header;
	}

	set header(val) {
		this._header = val;

		this.triggerRescale();
	}

	get grid() {
		return this._grid;
	}

	set grid(val) {
		this._grid = val;

		this.triggerRescale();
	}

	set src(val) {
		this._src = val;
	}

	get src() {
		return this._src;
	}

	triggerRescale() {
		if (this._update) {
			this.rescaleCanvas();
		} else {
			this.doRescale = true;
		}
	}

	set update(flag) {
		if (this._update === false && flag) {
			this._update = flag;
			if (this.doRescale) {
				this.rescaleCanvas();
				this.doRescale = false;
			} else {
				this.graphEditor.invalidate();
			}
		}
		this._update = flag;
	}

	get update() {
		return this._update;
	}

	streamsheets(name) {
		const sheet = this.graph.getItemByName(name);
		sheet._graphEditor = this.graphEditor;
		return sheet ? new StreamSheet(sheet) : undefined;
	}

	// eslint-disable-next-line no-empty-function,getter-return
	get machine() {}

	set machine(data) {
		this._machineId = data.id;
		this.graphId = data.graphId;
		this.graphEditor.clear();
		this.graph.init();

		if (!data.streamsheets || !data.streamsheets.length) {
			return;
		}

		const container = this.graph.getStreamSheetsContainer();
		const box = new BoundingBox(0, 0);

		this.state = data.state || 'stopped';
		this.graph.getMachineContainer().setMachineState(this.state === 'running' ? 0 : 1);

		// functions:
		JSG.FormulaParser.context = new SheetParserContext(data.functions);
		// set global named cells:
		setNamedCells(data.namedCells || {}, this.graph, (namedCell) =>
			namedCell.evaluate(this.graph)
		);

		data.streamsheets.forEach((sheet, index) => {
			let node;
			if (index) {
				node = container.addItem(new StreamSheetContainer());
			} else {
				node = container.getFirstStreamSheetContainer();
			}
			if (sheet.layout &&
				sheet.layout.position &&
				sheet.layout.position.right - sheet.layout.position.left > 0 &&
				sheet.layout.position.bottom - sheet.layout.position.top > 0) {
				box.setTopLeft(sheet.layout.position.left, sheet.layout.position.top);
				box.setBottomRight(sheet.layout.position.right, sheet.layout.position.bottom);
				node.setBoundingBoxTo(box);
			} else {
				node.getPin().setCoordinate(11000, 7000);
				node.setSize(21000, 13000);
			}
			if (sheet.name) {
				node.getStreamSheet().setName(sheet.name);
			}
			if (sheet.id) {
				node.getStreamSheetContainerAttributes().setSheetId(sheet.id);
			}
			if (sheet.inbox) {
				if (sheet.inbox.visible !== undefined) {
					node.getStreamSheetContainerAttributes().setInboxVisible(sheet.inbox.visible);
				}
				if (sheet.inbox.split !== undefined) {
					node.getInboxContainer().getMessageList().setHeight(sheet.inbox.split);
				}
				if (sheet.inbox.width !== undefined) {
					node.getInboxContainer().setWidth(sheet.inbox.width);
				}
			}

			const processSheet = node.getStreamSheet();
			const dataProvider = processSheet.getDataProvider();

			applyProperties(sheet.properties, processSheet);

			// set cell data
			sheet.cells.forEach((cellData) => {
				const res = CellRange.refToRC(cellData.reference, processSheet);
				if (res === undefined) {
					return;
				}
				const pos = new Point(
					res.column - processSheet.getColumns().getInitialSection(),
					res.row
				);

				const cell = dataProvider.create(pos);
				const expr = new Expression(cellData.value, cellData.formula);

				cell.setExpression(expr);
				cell.setValue(cellData.value);
				cell.setInfo(cellData.info);
			});

			setNamedCells(sheet.namedCells || {}, dataProvider);
			setGraphCells(sheet.graphCells || {}, dataProvider);

			if (sheet.drawings) {
				const reader = new JSONReader();
				const cells = processSheet.getCells();
				reader.version = 2;
				reader.setRoot(sheet.drawings);
				// const root = reader.getObject(reader.getRoot(), 'processsheet');

				Object.values(sheet.drawings).forEach((value) => {
					const type = reader.getAttribute(value, 'type');
					const graphItem = JSG.graphItemFactory.createItemFromString(type, true);
					if (graphItem) {
						graphItem.read(reader, value);
						graphItem._reading = true;
						cells.addItem(graphItem);
						graphItem._reading = false;
						cells.onReadSubItem(graphItem, this, reader);
					}
				});
				cells.evaluate();
			}

			if (sheet.graphItems) processSheet.setGraphItems(sheet.graphItems);

			this.updateInbox(sheet.id, sheet.inbox);

			dataProvider.evaluate(processSheet);
		});

		if (data.outbox) {
			if (data.outbox.visible !== undefined) {
				this.graph.getMachineContainer().getMachineContainerAttributes().setOutboxVisible(data.outbox.visible);
			}
			if (data.outbox.width !== undefined) {
				this.graph.getOutboxContainer().setWidth(data.outbox.width);
			}
			if (data.outbox.split !== undefined) {
				this.graph.getOutboxContainer().getMessageList().setHeight(data.outbox.split);
			}
			// content, if any...
			this.updateOutbox(data.outbox);
		}

		this.triggerRescale();
	}

	set value(data) {
		this.graph.getMachineContainer().setMachineState(this.state === 'running' ? 0 : 1);
		data.streamsheets.forEach((sheet) => {
			const processSheetContainer = this.graph.getStreamSheetContainerById(sheet.id);
			if (processSheetContainer) {
				const processSheet = processSheetContainer.getStreamSheet();
				const psDataProvider = processSheet.getDataProvider();
				psDataProvider.clearContent();

				if (sheet.stats && sheet.stats.steps !== undefined) {
					processSheet.getStreamSheetContainer().setStep(sheet.stats.steps);
				}

				applyProperties(sheet.properties, processSheet);

				this.updateInbox(sheet.id, sheet.inbox, sheet.loop);

				sheet.cells.forEach((cellData) => {
					const res = CellRange.refToRC(cellData.reference, processSheet);
					if (res === undefined) {
						return;
					}
					const pos = new Point(
						res.column - processSheet.getColumns().getInitialSection(),
						res.row
					);

					const cell = psDataProvider.create(pos);
					const expr = new Expression(cellData.value, cellData.formula);

					cell.setExpression(expr);
					cell.setValue(cellData.value);
					cell.setInfo(cellData.info);
				});

				setNamedCells(sheet.namedCells || {}, psDataProvider);
				setGraphCells(sheet.graphCells || {}, psDataProvider);
				if (sheet.graphItems) processSheet.setGraphItems(sheet.graphItems);

				psDataProvider.evaluate(processSheet);
			}
		});

		this.updateOutbox(data.outbox);
	}

	// eslint-disable-next-line no-empty-function,getter-return
	get value() {
	}

	updateInbox(sheetId, inboxData = {}, loop = {}) {
		// we may ignore updating if inbox is not visible => what if visibility is toggled?
		this.clearInbox(sheetId);
		const inbox = this.getInbox(sheetId);
		const { currentMessage, messages = [] } = inboxData;
		messages.forEach((msg) => this.addMessage(inbox, msg, msg.Metadata));
		if (currentMessage) {
			this.selectInboxMessage(sheetId, currentMessage.id, currentMessage.isProcessed);
			this.selectLoopPath(inbox, currentMessage.id, loop.currentPath);
		}
	}

	updateOutbox(outboxData = {}) {
		// we may ignore updating if outbox is not visible => what if visibility is toggled?
		const outbox = this.getOutbox();
		const { messages = [] } = outboxData;
		messages.forEach((msg) => this.addMessage(outbox, { ...msg.Data }, msg.Metadata));
		if (this.update) this.graphEditor.invalidate();
	}

	getOutbox() {
		return this.graph.getOutboxContainer();
	}

	getInbox(sheetId) {
		const processSheetContainer = this.graph.getStreamSheetContainerById(sheetId);
		if (!processSheetContainer) {
			// console.error(`No process sheet container found for streamsheet '${sheetId}'.`);
		}
		return processSheetContainer
			? processSheetContainer.getInboxContainer()
			: null;
	}

	addOutboxMessage(message) {
		const messageToAdd = Object.assign({}, message.Data);
		this.addMessage(this.getOutbox(), messageToAdd, message.Metadata);
		if (this.update) {
			this.graphEditor.invalidate();
		}
	}

	removeOutboxMessage(message) {
		return this.removeMessage(this.getOutbox(), message);
	}

	addInboxMessage(sheetId, message) {
		return this.addMessage(this.getInbox(sheetId), message, message.Metadata);
	}

	removeInboxMessage(sheetId, message) {
		return this.removeMessage(this.getInbox(sheetId), message);
	}

	selectInboxMessage(sheetId, messageId, markAsDisabled) {
		// this.setCurrentSelectedMessage( sheetId, messageId);
		return this.selectMessage(this.getInbox(sheetId), messageId, markAsDisabled);
	}
	selectLoopPath(inbox, msgId, loopPath) {
		if (loopPath) {
			const messageItems = inbox.getMessageListItems();
			const selectedMessage = messageItems && messageItems.getTreeItemById(msgId);
			// how to select loop element from current message...
			if (selectedMessage && selectedMessage.getItemByPath) {
				const path = path2array(loopPath);
				const item = selectedMessage.getItemByPath(path);
				if (item != null && item.id != null) {
					item.setSelection('global', new Expression(item.id.toString()));
				}
			}
		}
	}

	removeMessage(messageBox, message = {}) {
		const messageId = message.Metadata && message.Metadata.id;
		if (messageBox && messageId) {
			const treeItemsNode = messageBox.getMessageListItems();
			const selectedItem = treeItemsNode.getTreeItemById(messageId);
			if (selectedItem !== undefined) {
				const model = treeItemsNode.getJsonTree();
				const oldItems = model.splice(selectedItem.level, 1);
				treeItemsNode.updateLevels();
				treeItemsNode.sendCustomDelete(oldItems);
				if (this.update) {
					this.graphEditor.invalidate();
				}
			}
		}
	}

	addMessage(messageBox, message, metadata) {
		if (messageBox) {
			const itemsNode = messageBox.getMessageListItems();
			const selectedItem = itemsNode.getTreeItemById(metadata.id);
			if (selectedItem === undefined) {
				this.addNewMessage(messageBox, message, metadata);
			} else {
				this.updateMessage(messageBox, message, metadata);
			}
		}
		return !!messageBox;
	}

	addNewMessage(messageBox, message, metadata) {
		const treeItemsNode = messageBox.getMessageListItems();
		metadata = metadata || {};

		const item = new TreeItem(
			(metadata.id && metadata.id.length > 0) ? metadata.id : message.id,
			(metadata.label && metadata.label.length > 0) ? metadata.label : 'Message',
			(metadata.id && metadata.id.length > 0) ? metadata.id : message.id,
			0,
			null,
		);

		item.type = TreeItemsNode.DataType.STRING;
		item.parent = -1;
		item._json = JSON.stringify(message);

		treeItemsNode.getJsonTree().push(item);
		treeItemsNode.updateLevels();
		treeItemsNode.sendCustomAdd(item);

		if (this.update) {
			this.graphEditor.invalidate();
		}
	}

	updateMessage(messageBox, message, metadata) {
		const treeItemsNode = messageBox.getMessageListItems();
		const selectedItem = treeItemsNode.getTreeItemById(metadata.id);
		if (selectedItem !== undefined) {
			selectedItem._json = JSON.stringify(message);
			if (this.update) {
				this.graphEditor.invalidate();
			}
		}
	}

	selectMessage(messageBox, messageId, markAsDisabled) {
		if (messageBox) {
			const treeItemsNode = messageBox.getMessageListItems();
			if (messageId) {
				const selectedItem = treeItemsNode.getTreeItemById(messageId);
				if (selectedItem !== undefined) {
					treeItemsNode.setSelection('global', new Expression(selectedItem.id));
					if (markAsDisabled) {
						selectedItem.disabled = markAsDisabled;
					}
				}
			} else {
				treeItemsNode.removeSelection('global');
			}
			if (this.update) {
				this.graphEditor.invalidate();
			}
		}
	}

	clearInbox(sheetId) {
		this.clearMessageBox(this.getInbox(sheetId));
	}

	clearOutbox() {
		this.clearMessageBox(this.getOutbox());
	}

	clearMessageBox(messageBox) {
		if (messageBox) {
			messageBox.clearListItems();
			messageBox.clearTreeItems();
			if (this.update) {
				this.graphEditor.invalidate();
			}
		}
	}

	createId() {
		canvasId += 1;
		return canvasId;
	}

	rescaleCanvas() {
		if (this.update === false || !this.canvas) {
			return false;
		}

		const canvas = this.canvas;
		const ctx = canvas.getContext('2d');
		const devicePixelRatio = window.devicePixelRatio || 1;
		const backingStoreRatio =
			ctx.webkitBackingStorePixelRatio ||
			ctx.mozBackingStorePixelRatio ||
			ctx.msBackingStorePixelRatio ||
			ctx.oBackingStorePixelRatio ||
			ctx.backingStorePixelRatio ||
			1;
		const ratio = devicePixelRatio / backingStoreRatio;

		this.graphEditor.getCoordinateSystem().setDeviceRatio(ratio);
		JSG.graphics.getCoordinateSystem().setDeviceRatio(ratio);

		const newWidth = Math.round(canvas.clientWidth * ratio);
		const newHeight = Math.round(canvas.clientHeight * ratio);

		// if (!force && canvas.width === newWidth && canvas.height === newHeight) {
		// 	return false;
		// }

		canvas.width = newWidth;
		canvas.height = newHeight;

		const cs = this.graphEditor.getCoordinateSystem();
		const width = cs.deviceToLogX(canvas.width) / cs.getDeviceRatio();
		const height = cs.deviceToLogY(canvas.height) / cs.getDeviceRatio();

		const attr = this.graph.getMachineContainer().getMachineContainerAttributes();
		if (attr) {
			attr.setHideToolbars(true);
		}

		const viewMode = {
			viewMode: this._viewMode,
			view: this._viewPort,
			hideheader: this._header === 'hidden' ? true : null,
			hidegrid: this._grid === 'hidden' ? true : null,
			zoomdisabled: false
		};

		this.graph.setViewParams(viewMode);

		const getSheetInfo = (param) => {
			const names = param.split('!');
			if (names.length !== 2) {
				return undefined;
			}
			return {
				sheet: names[0],
				range: names[1]
			};
		}

		switch (viewMode.viewMode) {
		case 'drawing':
			if (viewMode.view) {
				const info = getSheetInfo(viewMode.view);
				if (info !== undefined) {
					const node = this.graph.getItemById(Number(info.range));
					const sheet = this.graph.getItemByName(info.sheet);
					if (node && sheet) {
						const graphController = this.graphEditor.getGraphViewer().getGraphController();
						const controller = graphController.getControllerByModelId(sheet.getId());
						const view = controller.getView();
						const rect = node.getBoundingBox().getBoundingRectangle();
						view.getItem().setHorizontalScrollbarMode(JSG.ScrollBarMode.HIDDEN);
						view.getItem().setVerticalScrollbarMode(JSG.ScrollBarMode.HIDDEN);
						view.getScrollView().setScrollBarsMode(
							JSG.ScrollBarMode.HIDDEN,
							JSG.ScrollBarMode.HIDDEN
						);
						if (rect.width) {
							const viewport = view.getViewPort();

							let model = viewport.getHorizontalRangeModel();
							viewport
								.getHorizontalRangeModel()
								.setValue(model._min + rect.x);
							model = viewport.getVerticalRangeModel();
							viewport
								.getVerticalRangeModel()
								.setValue(model._min + rect.y);

							const zoom = canvas.clientWidth / cs.logToDeviceX(rect.width, false);
							this.graphEditor.setZoom(zoom);
						}
					}
				}
			}
			break;
		case 'range': {
			if (viewMode.view) {
				const info = getSheetInfo(viewMode.view);
				if (info !== undefined) {
					const sheet = this.graph.getItemByName(info.sheet);
					if (sheet) {
						const range = JSG.CellRange.parse(info.range, sheet);
						if (range) {
							range.shiftFromSheet();
							const graphController = this.graphEditor.getGraphViewer().getGraphController();
							const controller = graphController.getControllerByModelId(range.getSheet().getId());
							if (controller) {
								const view = controller.getView();
								const rect = view.getRangeRect(range);
								const zoom = rect.width ? canvas.clientWidth / cs.logToDeviceX(rect.width, false) : 1;
								this.graphEditor.setZoom(zoom);
								view.scrollToRange(range);
								view.getItem().setHorizontalScrollbarMode(JSG.ScrollBarMode.HIDDEN);
								view.getItem().setVerticalScrollbarMode(JSG.ScrollBarMode.HIDDEN);
								view.getScrollView().setScrollBarsMode(
									JSG.ScrollBarMode.HIDDEN,
									JSG.ScrollBarMode.HIDDEN
								);
							}
						}
					}
				}
			}
			break;
		}
		default:
			break;
		}

		this.graph._arrange(width, height);
		this.graphEditor.resizeContent(canvas.width, canvas.height);

		return true;
	}

	sendCommand(command, undo, redo) {
		return this.gwclient
			.sendCommand(this.machineId, this.graphId, command, undo, redo)
			.then((response) => this.handleCommandResponse(response));
	}

	// eslint-disable-next-line no-unused-vars
	handleCommandResponse(response) {
		// const commandName = response.machineserver && response.machineserver.command;
		// const machineDescriptor = response.machineserver && response.machineserver.machineDescriptor;
		// if (commandName) {
		// 	if (commandName === 'command.PasteCellsFromClipboardCommand') {
		// 		const {
		// 			streamsheetId,
		// 			cells,
		// 			drawings,
		// 			graphItems,
		// 		} = response.machineserver;
		// 		this.updateCellValues(streamsheetId, cells, drawings, graphItems);
		// 		this.redraw();
		// 	}
		// }
		// if (machineDescriptor) {
		// 	const command = new SetMachineCommand(this.getGraph(), machineDescriptor);
		// 	command.execute();
		// }
	}
}

// TODO get or set language
JSG.init('.', 'de');
JSG.webComponent = true;
JSG.imagePool.add('res/images/maximize.png', 'maximize');
JSG.imagePool.add('res/images/minimize.png', 'minimize');
JSG.imagePool.add('res/images/settings.png', 'settings');
JSG.imagePool.add('res/images/deletesheet.png', 'deletesheet');
JSG.imagePool.add('res/images/loop.png', 'loop');
JSG.imagePool.add('res/images/t1.png', 't1');
JSG.imagePool.add('res/images/t2.png', 't2');
JSG.imagePool.add('res/images/t3.png', 't3');
JSG.imagePool.add('res/images/t4.png', 't4');
JSG.imagePool.add('res/images/statusok.png', 'statusok');
JSG.imagePool.add('res/images/statuserror.png', 'statuserror');
JSG.imagePool.add('res/images/statuswarning.png', 'statuswarning');

// register html type
window.customElements.define('stream-machine', StreamMachine);
