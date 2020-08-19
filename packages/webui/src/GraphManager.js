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
import JSG from '@cedalo/jsg-ui';
import { NumberFormatter } from '@cedalo/number-format';
import { Locale } from '@cedalo/parser';

// import * as Actions from './actions/actions';
import SheetParserContext from './SheetParserContext';
import CommandStack from './helper/synchronization/CommandStack';
import GraphSynchronizationInteractionHandler from './helper/synchronization/GraphSynchronizationInteractionHandler';
import store from './store';
import StreamHelper from './helper/StreamHelper';
import { intl } from './helper/IntlGlobalProvider';
// import { Path } from './helper/Path';


const {
	AddTreeItemCommand,
	CompoundCommand,
	DeleteTreeItemCommand,
	UpdateTreeItemCommand,
	TreeItemsNode,
	GraphSettings,
	MachineGraph,
	GraphEditor,
	SheetGraphItemEventActivator,
	SheetPlotActivator,
	// CreateEdgeActivator,
	EditTextActivator,
	JSONReader,
	MarqueeActivator,
	ImageDropActivator,
	MachineContainerAttributes,
	PanActivator,
	MoveActivator,
	NotificationCenter,
	Notification,
	PinchActivator,
	ReshapeActivator,
	ResizeActivator,
	RotateActivator,
	SheetActivator,
	LinkActivator,
	StreamSheet,
	Rectangle,
	CaptionActivator,
	ButtonActivator,
	StreamSheetContainerResizeActivator,
	SetSelectionCommand,
	SetTreeItemDisabledCommand,
	RemoveSelectionCommand,
	LoadMachineCommand,
	SetMachineCommand,
	SetSheetCellsCommand,
	SheetCommandFactory,
	SplitterActivator,
	TooltipActivator,
	TreeActivator,
	TreeItem,
	MathUtils,
	ViewActivator,
	WorksheetNode,
} = JSG;


export default class GraphManager {
	constructor(path) {
		JSG.init(path);
		JSG.setDrawingDisabled(true);
		JSG.imagePool.add('resources/maximize.png', 'maximize');
		JSG.imagePool.add('resources/minimize.png', 'minimize');
		JSG.imagePool.add('resources/settings.png', 'settings');
		JSG.imagePool.add('resources/deletesheet.png', 'deletesheet');
		JSG.imagePool.add('resources/loop.png', 'loop');
		JSG.imagePool.add('resources/t1.png', 't1');
		JSG.imagePool.add('resources/t2.png', 't2');
		JSG.imagePool.add('resources/t3.png', 't3');
		JSG.imagePool.add('resources/t4.png', 't4');
		JSG.imagePool.add('resources/statusok.png', 'statusok');
		JSG.imagePool.add('resources/statuserror.png', 'statuserror');
		JSG.imagePool.add('resources/statuswarning.png', 'statuswarning');
		JSG.SelectionStyle.MARKER_FILL_COLOR = '#90B5EE';
		JSG.SelectionStyle.FILL = true;
		this.graphWrapper = {
			graphdef: null,
			id: null,
			machineId: null,
		};
		this._streamsStatusMap = [];
		this._machine = null;
		// register for command stack changes to update controls and layout app...
		NotificationCenter.getInstance().register(this, CommandStack.STACK_CHANGED_NOTIFICATION, 'onCommandStackChanged');
	}

	set streamsStatusMap(streamsStatusMap) {
		this._streamsStatusMap = streamsStatusMap;
		if(this._machine) {
			let dirty = false;
			this._machine.streamsheets.forEach(t => {
				const {stream} = t.inbox;
				if(stream && this._streamsStatusMap[stream.id]) {
					this.updateStream(t.id, stream);
					dirty = true;
				}
			});
			if(dirty) {
				this.redraw();
			}
		}
	}

	getStreamStatus(stream) {
		if(stream && stream.id
		) {
			return StreamHelper.getStreamState(stream);
		}
		return undefined;
	}

	createEditor(canvas) {
		// NumberFormatter.setCulture(store.getState().locales.locale);

		this._graphEditor = new GraphEditor(canvas);
		this._canvas = canvas;
		// this.rescaleCanvas(this._canvas);

		const graph = new MachineGraph();
		this._graphEditor.setGraph(graph);

		// config graph as needed for machine app
		const viewer = this._graphEditor.getGraphViewer();

		this._graphEditor.setDisplayMode(GraphSettings.DisplayMode.ENDLESS);
		this._graphEditor.setScrollPosition(0, 0);
		viewer.getScrollPanel().getViewPanel().setBoundsMargin(0);
		viewer.getScrollPanel().setScrollBarsMode(JSG.ScrollBarMode.HIDDEN);
		this._graphEditor.setZoom(1);

		const defInteraction = this._graphEditor.getGraphViewer().getDefaultInteraction();

		defInteraction.removeAllActivators();
		defInteraction.addActivator(TooltipActivator.KEY, new TooltipActivator());
		defInteraction.addActivator(ButtonActivator.KEY, new ButtonActivator());
		defInteraction.addActivator(CaptionActivator.KEY, new CaptionActivator());
		defInteraction.addActivator(ViewActivator.KEY, new ViewActivator());
		defInteraction.addActivator(
			StreamSheetContainerResizeActivator.KEY,
			new StreamSheetContainerResizeActivator()
		);
		defInteraction.addActivator(ResizeActivator.KEY, new ResizeActivator());
		defInteraction.addActivator(ReshapeActivator.KEY, new ReshapeActivator());
		defInteraction.addActivator(RotateActivator.KEY, new RotateActivator());
		defInteraction.addActivator(SheetGraphItemEventActivator.KEY, new SheetGraphItemEventActivator());
		defInteraction.addActivator(SheetActivator.KEY, new SheetActivator());
		defInteraction.addActivator(EditTextActivator.KEY, new EditTextActivator());
		defInteraction.addActivator(MoveActivator.KEY, new MoveActivator());
		defInteraction.addActivator(MarqueeActivator.KEY, new MarqueeActivator());
		defInteraction.addActivator(SheetPlotActivator.KEY, new SheetPlotActivator());
		defInteraction.addActivator(PinchActivator.KEY, new PinchActivator());
		defInteraction.addActivator(PanActivator.KEY, new PanActivator());
		defInteraction.addActivator(SplitterActivator.KEY, new SplitterActivator());
		defInteraction.addActivator(TreeActivator.KEY, new TreeActivator());
		defInteraction.addActivator(ImageDropActivator.KEY, new ImageDropActivator());
		defInteraction.addActivator(LinkActivator.KEY, new LinkActivator());

		JSG.FormulaParser.context = new SheetParserContext();
		const menuHandler = this._graphEditor.getItemMenuHandler();
		menuHandler.setMenuProvider(new JSG.DefaultMenuProvider());

		// this.setMachineLanguage();

		return this._graphEditor;
	}

	setMachineLanguage(locale) {
		locale = locale || store.getState().machine.locale;

		NumberFormatter.setCulture(locale);
		JSG.setParserLocale(locale);

		const sheetView = this.getActiveSheetView();
		if (sheetView === undefined) {
			return;
		}

		sheetView.notify();
	}

	getCanvas() {
		return this._canvas;
	}

	getGraph() {
		return this._graphEditor ? this._graphEditor.getGraph() : undefined;
	}

	getMachineContainer() {
		const graph = this.getGraph();
		return graph ? graph.getMachineContainer() : undefined;
	}

	setUILanguage(locale) {
		JSG.setLocale(locale, () => this.redraw());
	}

	getLocaleSettings() {
		const { locale } = store.getState().machine;

		switch (locale) {
		case 'de':
			return Locale.DE;
		case 'en':
		default:
			return Locale.EN;
		}
	}

	updateGraph(machineDescriptor) {
		const command = new LoadMachineCommand(this.getGraph(), machineDescriptor);
		command.execute();
	}

	loadGraph(graphDefinition, machine) {
		const graph = this.getGraph();
		this._machine = machine;
		this.graphWrapper.id = graphDefinition.id;
		this.graphWrapper.machineId = machine.id;
		this.graphWrapper.machine = machine;
		this.setMachineLanguage(machine.settings.locale);

		JSG.setDrawingDisabled(true);
		// TODO: revise
		graph.getSettings().getSnapStep = () => (this._graphEditor.getCoordinateSystem().deviceToLogX(1));

		this._graphEditor.clear();
		const interactionHandler =
			new GraphSynchronizationInteractionHandler(this._graphEditor.getGraphViewer(), graph, this.graphWrapper);
		this._graphEditor
			.setInteractionHandler(interactionHandler);
		this._graphEditor.setDisplayMode(GraphSettings.DisplayMode.ENDLESS);
		this._graphEditor.setScrollPosition(0, 0);
		this._graphEditor.getGraphViewer().getScrollPanel().getViewPanel().setBoundsMargin(0);
		const reader = new JSONReader();
		reader.setRoot(graphDefinition.graphdef);
		graph.read(reader, graphDefinition.graphdef);

		// // for testing purposes, a user, client it and selection color is provided
		const streamsheetId = machine.streamsheets[0].id;
		const sheet = this.getStreamSheet(streamsheetId);

		this.updateMachine(machine);
		// DL-1023 init machine state attribute:
		this.updateMachineState(machine.state);
		this.updateDimensions();
		this.updateControls();

		this.updateGraph(machine);

		if (graph.getStreamSheetContainerCount() === 1) {
			const container = this.getGraph().getStreamSheetsContainer().getFirstStreamSheetContainer();
			graph.setViewMode(container, 2);
			graph.markDirty();
		} else {
			const container = graph.getMachineContainer();
			const maxSheet = container.getMachineContainerAttributes().getMaximizeSheet().getValue();
			if (maxSheet !== 'none') {
				const processContainer = graph.getStreamSheetContainerByStreamSheetName(maxSheet);
				if (processContainer !== undefined) {
					graph.setViewMode(processContainer, 2);
					graph.markDirty();
				}
			}
		}

		JSG.setDrawingDisabled(false);
		this.redraw();

		if (sheet) {
			NotificationCenter.getInstance()
				.send(new Notification(WorksheetNode.SELECTION_CHANGED_NOTIFICATION, { item: sheet, updateFinal: true }));
		}
	}

	undo() {
		// const command = this.commandStack.undo();
		this.redraw();	// TODO: why redraw()??
		this.getGraphEditor().getInteractionHandler().undo(); // command);

		// to update toolbar
		const sheetView = this.getActiveSheetView();
		if (sheetView !== undefined) {
			sheetView.notify();
		}
	}

	redo() {
		// const command = this.commandStack.redo();
		this.redraw(); // TODO: why redraw()??
		this.getGraphEditor().getInteractionHandler().redo(); // command)

		// to update toolbar
		const sheetView = this.getActiveSheetView();
		if (sheetView !== undefined) {
			sheetView.notify();
		}
	}

	removeSelection(userId) {
		const { machine } = this.graphWrapper;
		if (machine) {
			machine.streamsheets.forEach((streamsheet) => {
				const sheet = this.getStreamSheet(streamsheet.id);
				if (sheet) {
					const command = new RemoveSelectionCommand(sheet, userId);
					this.synchronizedExecute(command);
				}
			});
		}
	}

	getActiveSheetView() {
		let view;

		if (this._graphEditor === undefined || this._graphEditor.getGraphViewer() === undefined) {
			return undefined;
		}

		this._graphEditor.getGraphViewer().getGraphController().findControllerByCondition((controller) => {
			const item = controller.getModel();
			if (item instanceof StreamSheet) {
				if (item.getOwnSelection().hasSelection()) {
					view = controller.getView();
					return true;
				}
			}
			return false;
		});
		return view;
	}

	getInboxMessageTreeItems(streamsheetId) {
		const processSheetContainer = this.getStreamSheetContainer(streamsheetId);
		return processSheetContainer
			? processSheetContainer.getInboxContainer().getMessageTreeItems()
			: null;
	}

	getStreamSheet(streamsheetId) {
		const processSheetContainer = this.getStreamSheetContainer(streamsheetId);
		return processSheetContainer ? processSheetContainer.getStreamSheet() : null;
	}

	handleStreamSheetStep(
		streamsheetId,
		jsonpath,
		cells,
		namedCells,
		graphCells,
		drawings,
		graphItems,
		outbox,
		stats,
		inbox,
		currentMessage,
	) {
		this.updateStreamSheetId(streamsheetId);
		const updatePathCommand = this.updatePath(streamsheetId, jsonpath);
		this.updateLoopIndex(streamsheetId, jsonpath);
		const updateCellsCommand = this.updateCells(streamsheetId, cells, drawings, graphItems, graphCells, namedCells);
		const command = new CompoundCommand();
		if (updatePathCommand) {
			command.add(updatePathCommand);
		}
		if (updateCellsCommand) {
			command.add(updateCellsCommand);
		}
		command.execute();
		// this is because baseExecute set drawing disabled to false
		if (stats.steps === 0) {
			this.getInbox(streamsheetId).resetViewports();
			this.getOutbox(streamsheetId).resetViewports();
			const itemsNode = this.getOutbox().getMessageListItems();
			this.execute(new RemoveSelectionCommand(itemsNode, 'global'));

		}
		this.setDrawingDisabled(true);
		this.updateOutbox(outbox);
		this.clearInbox(streamsheetId);
		this.updateInbox(streamsheetId, inbox);
		if (currentMessage) {
			this.selectInboxMessage(streamsheetId, currentMessage.id, currentMessage.isProcessed);
		}

		this.updateStats(streamsheetId, stats);
	}

	handleCommandResponse(response) {
		const commandName = response.machineserver && response.machineserver.command;
		const machineDescriptor = response.machineserver && response.machineserver.machineDescriptor;
		if (commandName) {
			if (commandName === 'command.PasteCellsFromClipboardCommand') {
				const {
					streamsheetId,
					cells,
					drawings,
					graphItems,
				} = response.machineserver;
				this.updateCellValues(streamsheetId, cells, drawings, graphItems);
				this.redraw();
			}
		}
		if (machineDescriptor) {
			const command = new SetMachineCommand(this.getGraph(), machineDescriptor);
			command.execute();
		}
	}

	updateCellValues(streamsheetId, cells, drawings, graphItems, graphCells, namedCells) {
		const updateCellsCommand = this.updateCells(streamsheetId, cells, drawings, graphItems, graphCells, namedCells);
		if (updateCellsCommand) {
			updateCellsCommand.execute();
			// to update editbar
			const processSheet = this.getStreamSheet(streamsheetId);
			if (processSheet.getOwnSelection().getActiveCell()) {
				NotificationCenter.getInstance()
					.send(new Notification(WorksheetNode.SELECTION_CHANGED_NOTIFICATION,
						{item: processSheet, updateFinal: true}));
			}
		}
	}

	updateStats(streamsheetId, stats) {
		const processSheet = this.getStreamSheet(streamsheetId);
		if (processSheet) {
			processSheet.getStreamSheetContainer().setStep(stats.steps);
		}
	}

	updateCells(streamsheetId, data, drawings, graphItems, graphCells, namedCells) {
		const processSheet = this.getStreamSheet(streamsheetId);
		if (processSheet) {
			const command = new SetSheetCellsCommand(processSheet, data, drawings, graphItems, graphCells, namedCells);
			// this.redraw();
			return command;
		}
		return null;
	}

	rescaleCanvas(canvas) {
		const ctx = canvas.getContext('2d');
		const devicePixelRatio = window.devicePixelRatio || 1;
		const backingStoreRatio = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio ||
			ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;
		const ratio = devicePixelRatio / backingStoreRatio;

		this._graphEditor.getCoordinateSystem().setDeviceRatio(ratio);
		JSG.graphics.getCoordinateSystem().setDeviceRatio(ratio);
		const oldWidth = canvas.clientWidth;
		const oldHeight = canvas.clientHeight;
		canvas.width = oldWidth * ratio;
		canvas.height = oldHeight * ratio;
	}

	updateCanvas(tools, viewMode) {
		const canvas = document.getElementById('canvas');
		const graph = this.getGraph();
		if (canvas && graph) {
			graph.setViewParams(viewMode);
			const container = graph.getMachineContainer();
			if (container) {
				const attr = container.getMachineContainerAttributes();
				if (attr) {
					attr.setHideToolbars(tools === false);
				}
			}
			if (viewMode) {
				switch (viewMode.viewMode) {
				case 'drawing':
					if (viewMode.view) {
						let name = viewMode.view;
						const index = name.indexOf('!');
						if (index !== -1) {
							const sheetName = name.substring(0, index);
							name = name.substring(index + 1);
							const node = graph.getItemById(Number(name));
							const sheet = graph.getItemByName(sheetName);
							if (node && sheet) {
								const graphController = this._graphEditor.getGraphViewer().getGraphController();
								const controller = graphController.getControllerByModelId(sheet.getId());
								const view = controller.getView();
								const rect = node.getBoundingBox().getBoundingRectangle();
								view.getItem().setHorizontalScrollbarMode(JSG.ScrollBarMode.HIDDEN);
								view.getItem().setVerticalScrollbarMode(JSG.ScrollBarMode.HIDDEN);
								const scrollview = view.getScrollView();
								scrollview.setScrollBarsMode(
									JSG.ScrollBarMode.HIDDEN,
									JSG.ScrollBarMode.HIDDEN
								);
								const cs = this._graphEditor.getCoordinateSystem();
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
									this._graphEditor.setZoom(zoom);
								}
							}
						}
					}
					break;
				case 'range': {
					const range = JSG.CellRange.parse(viewMode.view, this);
					if (range) {
						range.shiftFromSheet();
						const graphController = this._graphEditor.getGraphViewer().getGraphController();
						const controller = graphController.getControllerByModelId(range.getSheet().getId());
						if (controller) {
							const view = controller.getView();
							view.scrollToRange(range);
							// range._x2 -= 1;
							// range._y2 -= 1;
							view.getItem().setHorizontalScrollbarMode(JSG.ScrollBarMode.HIDDEN);
							view.getItem().setVerticalScrollbarMode(JSG.ScrollBarMode.HIDDEN);
							const rect = view.getRangeRect(range);
							const scrollview = view.getScrollView();
							scrollview.setScrollBarsMode(
								JSG.ScrollBarMode.HIDDEN,
								JSG.ScrollBarMode.HIDDEN
							);
							const cs = this._graphEditor.getCoordinateSystem();
							if (rect.width) {
								const zoom = canvas.clientWidth / cs.logToDeviceX(rect.width, false);
								this._graphEditor.setZoom(zoom);
							}
						}
					}
					break;
				}
				default:
					break;
				}
			}

			if (canvas.height !== canvas.clientHeight || canvas.width !== canvas.clientWidth) {
				this.updateDimensions();
			}
		}
	}

	updateDimensions() {
		const canvas = document.getElementById('canvas');
		if (!canvas) {
			return;
		}

		this.rescaleCanvas(canvas);

		const cs = this._graphEditor.getCoordinateSystem();
		const width = cs.deviceToLogX(canvas.width) / cs.getDeviceRatio();
		const height = cs.deviceToLogY(canvas.height) / cs.getDeviceRatio();

		this.getGraph()._arrange(width, height);

		this._graphEditor.resizeContent(canvas.width, canvas.height);
	}

	redraw() {
		if (this.getGraphEditor() && this.getGraphEditor().getGraph()) {
			this.getGraphEditor().invalidate();
		}
	}

	getGraphEditor() {
		return this._graphEditor;
	}

	getGraphViewer() {
		return this._graphEditor ? this._graphEditor.getGraphViewer() : undefined;
	}

	synchronizedExecute(command) {
		this.getGraphEditor().getInteractionHandler().execute(command);
	}

	execute(command, repaint) {
		this.getGraphEditor().getInteractionHandler().baseExecute(command, this.graphWrapper, undefined, repaint);
	}

	executeCommands(command, options) {
		if (command && command.type === 'message_add') {
			return this.addInboxMessage(command.container, command.message);
		// } else if (command.commands) {
		// 	command.commands.forEach((subcommand) => {
		// 		this.executeCommands(subcommand, options);
				// });
		}
		const cmd = SheetCommandFactory.createCommand(this.getGraph(), command, this.getGraphEditor().getGraphViewer());
		if (cmd) {
			// commands received from graph-service are volatile:
			cmd.isVolatile = true;
			if (options && options.undo) {
				this.getGraphEditor().getInteractionHandler().baseUndo(cmd);
			} else if (options && options.redo) {
				this.getGraphEditor().getInteractionHandler().baseRedo(cmd);
			} else {
				this.getGraphEditor().getInteractionHandler().baseExecute(cmd, this.graphWrapper);
			}
		}
		return !!cmd;
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

	// eslint-disable-next-line
	updateMessage(messageBox, message, metadata, execute = true) {
		const itemsNode = messageBox.getMessageListItems();
		const selectedItem = itemsNode.getTreeItemById(metadata.id);
		if (selectedItem !== undefined) {
			const item = this.getMessageTreeItem(message, metadata, messageBox.getType().getValue());
			const command = new UpdateTreeItemCommand(itemsNode, selectedItem.level, item);

			if (execute) {
				this.execute(command);
				NotificationCenter.getInstance()
					.send(new Notification(TreeItemsNode.SELECTION_CHANGED_NOTIFICATION, itemsNode));
			} else {
				return command;
			}
		}
	}

	createUpdateMessageCommand(messageBox, message, metadata) {
		return this.updateMessage(messageBox, message, metadata, false);
	}

	getMessageTreeItem(message, metadata, target) {
		let key;

		if (target === 'outboxcontainer') {
			key = metadata.id;
		} else if (metadata.label && metadata.label.length > 0) {
			key = metadata.label;
		} else if (metadata.consumer && metadata.consumer.length > 0) {
			key = metadata.consumer;
		} else if (metadata.source && metadata.source.length > 0) {
			key = metadata.source;
		} else {
			key = 'Message';
		}

		let value = metadata.id;
		if (metadata.arrivalTime) {
			const date = MathUtils.excelDateToJSDate(metadata.arrivalTime);
			value = `${date.toLocaleTimeString()} ${date.getMilliseconds()}`;
		} else {
			value = metadata.id;
		}

		const item = new TreeItem(
			(metadata.id && metadata.id.length > 0) ? metadata.id : message.id,
			key,
			value,
			0,
			null,
		);

		item.type = TreeItemsNode.DataType.STRING;
		item.parent = -1;
		item._json = JSON.stringify(message);

		return item;
	}


	// eslint-disable-next-line
	addNewMessage(messageBox, message, metadata, execute = true) {
		const itemsNode = messageBox.getMessageListItems();
		metadata = metadata || {};

		const item = this.getMessageTreeItem(message, metadata, messageBox.getType().getValue());

		const command = new AddTreeItemCommand(itemsNode, -1, item);
		command.isVolatile = true;

		// TODO value: message.time,
		if (execute) {
			this.execute(command, false);
		} else {
			return command;
		}
	}

	createAddNewMessageCommand(messageBox, message, metadata) {
		return this.addNewMessage(messageBox, message, metadata, false);
	}

	clearInbox(streamsheetId) {
		this.clearMessageBox(this.getInbox(streamsheetId));
	}

	clearOutbox() {
		this.clearMessageBox(this.getOutbox());
	}

	clearMessageBox(messageBox) {
		if (messageBox) {
			messageBox.clearListItems();
			messageBox.clearTreeItems();
		}
	}

	removeMessage(messageBox, message, metadata) {
		if (messageBox) {
			// messageBox.clearTreeItems();
			const itemsNode = messageBox.getMessageListItems();
			const selectedItem = itemsNode.getTreeItemById(metadata.id);
			if (selectedItem !== undefined) {
				const command = new DeleteTreeItemCommand(itemsNode, selectedItem.level);
				command.isVolatile = true;
				this.execute(command);
			}
		}
	}

	selectMessage(messageBox, messageId, markAsDisabled) {
		if (messageBox) {
			const itemsNode = messageBox.getMessageListItems();
			if (messageId) {
				const selectedItem = itemsNode.getTreeItemById(messageId);
				if (selectedItem !== undefined) {
					const command = new SetSelectionCommand(itemsNode, 'global', selectedItem.id);
					this.execute(command);
					if (markAsDisabled) {
						const treeItemCommand = new SetTreeItemDisabledCommand(
							itemsNode,
							selectedItem.level,
							markAsDisabled,
						);
						treeItemCommand.isVolatile = true;
						this.execute(treeItemCommand);
					}
				}
			} else {
				// id of item to disable ???
				// const command = new SetTreeItemDisabledCommand(itemsNode, selectedItem.level, true);
				const command = new RemoveSelectionCommand(itemsNode, 'global');
				this.execute(command);
			}
		}
	}

	updateStreamSheetId(streamsheetId) {
		// TODO: revise
		const processSheetContainer = this.getStreamSheetContainer(streamsheetId);
		if (processSheetContainer) {
			processSheetContainer.getStreamSheetContainerAttributes().setSheetId(streamsheetId);
		}
	}

	updatePath(streamsheetId, path) {
		const treeNode = this.getInboxMessageTreeItems(streamsheetId);
		if (treeNode) {
			// const newPath = path.replace(/(\[)(\d)(\])/g, '.$2');
			const item = treeNode.getItemByPath(TreeItemsNode.splitPath(path));
			// const item = treeNode.getItemByPath(newPath);
			if (item === undefined || item.id === undefined) {
				return null;
			}
			const command = new SetSelectionCommand(treeNode, 'global', item.id.toString());
			return command;
		}
		return null;
	}

	updateMachine({streamsheets, outbox}) {
		// streamsheets.forEach(streamsheet => {
		// 	streamsheet.messages = streamsheet.inbox.messages;
		// });
		this.updateOutbox(outbox);
		this.updateStreamSheets(streamsheets);
	}

	updateMachineState(newstate) {
		const graph = this.getGraph();
		if (graph) {
			const newvalue = newstate === 'running'
				? MachineContainerAttributes.MachineState.RUN
				: MachineContainerAttributes.MachineState.EDIT;
			graph.getMachineContainer().setMachineState(newvalue);
		}
	}

	updateOutbox(outbox) {
		let id;
		const outboxContainer = this.getOutbox();
		const selection = outboxContainer.getMessageListItems().getSelectedItem();
		const tooltip = intl.formatMessage({ id: 'MessageBox.messageCount' }, {messageCount: outbox.totalSize});
		outboxContainer._outboxCaption.setTooltip(tooltip);
		if (selection) {
			id = selection.id;
		}
		this.clearOutbox();
		this.addBoxMessages(outboxContainer, outbox.messages);
		if (id) {
			this.selectMessage(outboxContainer, id, false);
		}
	}

	updateInbox(streamsheetId, inbox) {
		if (inbox) {
			if (Array.isArray(inbox.messages)) {
				this.addInboxMessages(streamsheetId, inbox.messages);
			}
			this.updateInboxTooltip(streamsheetId, inbox.totalSize);
		}
	}
	updateInboxTooltip(streamsheetId, totalSize) {
		const processSheetContainer = this.getStreamSheetContainer(streamsheetId);
		if (processSheetContainer) {
			const tip = intl.formatMessage({ id: 'MessageBox.messageCount' }, {messageCount: totalSize});
			processSheetContainer.getInboxCaption().setTooltip(tip);
		}
	}

	addBoxMessages(messageBox, messages) {
		const commands = messages.map((message) => {
			const metadata = message.Metadata;
			const itemsNode = messageBox.getMessageListItems();
			const selectedItem = itemsNode.getTreeItemById(metadata.id);
			if (selectedItem === undefined) {
				return this.createAddNewMessageCommand(messageBox, message, metadata);
			}
			return this.createUpdateMessageCommand(messageBox, message, metadata);
		});
		const compoundCommand = new CompoundCommand();
		commands.forEach(command => compoundCommand.add(command));
		compoundCommand.execute();
	}

	updateStreamSheets(streamsheets) {
		streamsheets.forEach(streamsheet => this.updateStreamSheet(streamsheet));
	}

	addInboxMessages(streamsheetId, messages) {
		this.addBoxMessages(this.getInbox(streamsheetId), messages);
	}

	updateStreamSheet(streamsheet) {
		const { id, inbox, loop, stats } = streamsheet;
		if (inbox) {
			const { currentMessage, messages, stream } = inbox;
			this.addInboxMessages(id, messages)
			if (currentMessage) this.selectInboxMessage(id, currentMessage.id, currentMessage.isProcessed);
			if (stream) this.updateStream(id, stream);
		}
		if (loop) {
			if (loop.path) this.updateLoopElement(id, loop);
			if (loop.currentPath) this.updatePath(id, loop.currentPath);
		}
		if (stats) {
			this.updateStats(id, stats);
		}
	}

	updateLoopIndex(streamsheetId, path) {
		// const result = (new RegExp(/(\w*)\[(\d*)\]/g)).exec(path);
		const result = TreeItemsNode.splitPath(path);
		if (result.length > 1) {
			const index = result[result.length - 1];
			const processSheetContainer = this.getStreamSheetContainer(streamsheetId);
			if (processSheetContainer) {
				processSheetContainer.setLoopIndex(index);
			}
		}
	}

	updateLoopElement(streamsheetId, loop) {
		const processSheetContainer = this.getStreamSheetContainer(streamsheetId);
		if (processSheetContainer) {
			processSheetContainer.setLoopElement(loop.path, loop.enabled);
		}
	}

	updateReplaceKey(streamsheetId, key) {
		const processSheetContainer = this.getStreamSheetContainer(streamsheetId);
		if (processSheetContainer) {
			processSheetContainer.setReplaceKey(key);
		}
	}

	updateStream(streamsheetId, stream) {
		const processSheetContainer = this.getStreamSheetContainer(streamsheetId);
		if (processSheetContainer) {
			const display = `${stream.name || 'None'}`;
			processSheetContainer.setStream(display);
			processSheetContainer.setStatus(display === 'None' ? '' : this._streamsStatusMap[stream.id]);
			// processSheetContainer.getInboxCaption().setIconLink(`${window.location.origin}${Path.stream(stream.id)}`);
		}
	}

	addInboxMessage(streamsheetId, message, totalSize) {
		const res = this.addMessage(this.getInbox(streamsheetId), message, message.Metadata);
		this.updateInboxTooltip(streamsheetId, totalSize);
		return res;
	}

	removeInboxMessage(streamsheetId, message, totalSize) {
		const res = this.removeMessage(this.getInbox(streamsheetId), message, message.Metadata);
		this.updateInboxTooltip(streamsheetId, totalSize);
		return res;
	}

	removeOutboxMessage(message) {
		this.removeMessage(this.getOutbox(), message, message.Metadata);
	}

	selectInboxMessage(streamsheetId, messageId, markAsDisabled) {
		this.setCurrentSelectedMessage(streamsheetId, messageId);
		return this.selectMessage(this.getInbox(streamsheetId), messageId, markAsDisabled);
	}

	setCurrentSelectedMessage(streamsheetId, messageId) {
		const processSheet = this.getStreamSheet(streamsheetId);
		if (processSheet) {
			this.getGraph().context.currentSelectedInboxMessage = messageId;
		}
	}

	getInbox(streamsheetId) {
		const processSheetContainer = this.getStreamSheetContainer(streamsheetId);
		if (!processSheetContainer) {
			console.error(`No process sheet container found for streamsheet '${streamsheetId}'.`);
		}
		return processSheetContainer
			? processSheetContainer.getInboxContainer()
			: null;
	}

	getStreamSheetContainer(streamsheetId) {
		const graph = this.getGraph();
		return graph ? graph.getStreamSheetContainerById(streamsheetId) : undefined;
	}

	getOutbox() {
		return this.getGraph().getOutboxContainer();
	}

	setMachineProtected(protect) {
		return this.getGraph().setProtected(protect);
	}

	setRunMode(runMode) {
		const machineState = runMode
			? MachineContainerAttributes.MachineState.RUN
			: MachineContainerAttributes.MachineState.EDIT;
		this.getGraph().getMachineContainer().setMachineState(machineState);
		if (!runMode) {
			this.redraw();
		}
	}

	setDrawingDisabled(state) {
		JSG.setDrawingDisabled(state);
		if (state === false) {
			this.redraw();
		}
	}

	getMachineImage(width, height) {
		let image;
		let graphEditor;
		const canvas = document.createElement('canvas');
		canvas.id = 'generatorcanvas';
		canvas.width = width;
		canvas.height = height;

		if (this.getGraph() === undefined || this.getGraph().getMachineContainer() === undefined) {
			return undefined;
		}

		try {
			graphEditor = new GraphEditor(canvas);
			const graph = new MachineGraph();

			graphEditor.setGraph(graph);

			const viewer = graphEditor.getGraphViewer();
			viewer.getScrollPanel().getViewPanel().setBoundsMargin(0);
			viewer.getScrollPanel().setScrollBarsMode(JSG.ScrollBarMode.HIDDEN);

			graphEditor.setDisplayMode(GraphSettings.DisplayMode.ENDLESS);
			graphEditor.setScrollPosition(0, 0);
			graphEditor.setZoom(0.4);

			const container = this.getGraph().getStreamSheetsContainer().getFirstStreamSheetContainer();
			const sheet = container.getStreamSheet();
			if (sheet === undefined) {
				return undefined;
			}

			const graphics = graphEditor.getGraphicSystem().getGraphics();
			const cs = this._graphEditor.getCoordinateSystem();
			const sheetCopy = sheet.copy();

			graph.addItem(sheetCopy);
			// subtract scrollbars
			sheetCopy.setSize(cs.deviceToLogX(width * 3) + 500, cs.deviceToLogX(height * 3) + 500);
			sheetCopy.setOrigin(0, 0);
			sheetCopy.getWorksheetAttributes().setShowHeader(false);
			sheetCopy._drawings = sheet.getDrawings();
			sheetCopy.layout();

			const view = graphEditor.getGraphViewer().getGraphView();

			graph.getItemAttributes().setClipChildren(false);
			graphEditor.resizeContent(width, height);

			// draw all graphitems
			view.drawSubViews(graphics, new Rectangle(0, 0, width * 100, height * 100));

			image = canvas.toDataURL();
		} catch (e) {
			console.error('Error during image creation');
		}

		if (graphEditor) {
			graphEditor.destroy();
		}

		return image;
	}

	getZoom() {
		if (this.getGraphEditor() && this.getGraphEditor().getGraph()) {
			return this.getGraphEditor().getZoom();
		}

		return 1;
	}

	updateControls() {
		const elem = document.getElementById('addSheet');
		const graph = this.getGraph();
		if (graph && elem) {
			const container = this.getGraph().getMachineContainer();
			if (container === undefined) {
				return;
			}
			const attr = container.getMachineContainerAttributes();
			if (attr.getOutboxVisible().getValue()) {
				const outbox = graph.getOutboxContainer();
				if (outbox) {
					const cs = this.getGraphEditor().getCoordinateSystem();
					elem.style.right = `${cs.logToDeviceX(outbox.getWidth().getValue(), false) + 30}px`;
				}
			} else {
				elem.style.right = '30px';
			}
		}
	}

	onCommandStackChanged( /* notification */ ) {
		// layout app:
		const container = this.getGraph().getMachineContainer();
		if (container) {
			container.layout();
			container.setRefreshNeeded(true);
			this.redraw();
		}
		this.updateControls();
	};

}

export const graphManager = new GraphManager('/lib');
