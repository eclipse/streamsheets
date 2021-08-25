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

import * as Actions from '../../actions/actions';
import CommandStack from './CommandStack';


const {
	DeleteTreeItemCommand,
	InteractionHandler,
	OutboxContainer,
	StreamSheet,
	SetSelectionCommand,
	TreeItemsNode,
	MachineGraph,
	SetGraphItemsCommand,
} = JSG;

const SELECTION_TYPE_PROCESS_SHEET = 'process_sheet';
const SELECTION_TYPE_INBOX_MESSAGE_LIST = 'inbox_message_list';
const SELECTION_TYPE_INBOX_MESSAGE_ELEMENTS = 'inbox_message_elements';
const SELECTION_TYPE_OUTBOX_MESSAGE_LIST = 'outbox_message_list';
const SELECTION_TYPE_OUTBOX_MESSAGE_ELEMENTS = 'outbox_message_elements';

export default class GraphSynchronizationInteractionHandler extends InteractionHandler {
	constructor(viewer, graph, graphWrapper) {
		super(viewer);
		this.graph = graph;
		this.graph.context = {};
		this.graphWrapper = graphWrapper;
		this.commandStack = new CommandStack();
		this._doRepaint = true;
	}

	execute(command, completionFunction, updateGraphItems = true) {
		this.handleCustomFields(command);

		const isShapeCommand = this.isShapeCommand(command);

		super.execute(command, completionFunction);

		const commandJSON = command.toObject('execute');

		// send only commands, that do not affect graph items (for now)
		if (isShapeCommand && commandJSON.name !== 'command.SetGraphItemsCommand') {
			if (commandJSON.name !== 'command.RemoveSelectionCommand' &&
				commandJSON.name !== 'command.SetSelectionCommand') {
				this.updateGraphItems();
			}
			return;
		} else if (this.isShapeChangingCommand(command)) {
			// shape changed by cell change (paste, delete, insert)
			this.updateGraphItems();
		}


		if (!this.isSelectionInOutbox(command._graphItem)) {
			const streamsheetId = this.getStreamSheetId(command);
			if (streamsheetId) {
				commandJSON.streamsheetId = streamsheetId;
			}
		}

		Actions.sendCommand(this.graphWrapper.id, commandJSON, this.graphWrapper.machineId)
			.then((response) => {
				if (command.handleResponse) command.handleResponse(response);
				if (commandJSON.name !== 'command.RemoveSelectionCommand' &&
					commandJSON.name !== 'command.SetSelectionCommand' &&
					commandJSON.name !== 'command.SetGraphItemsCommand' &&
					commandJSON.name !== 'command.ChangeItemOrderCommand' &&
					updateGraphItems) {
					this.updateGraphItems();
				}
			})
			.catch((err) => {
				if (command.handleResponse) command.handleResponse(undefined, err);
			});

	}

	updateGraphItems(/* undo */) {
		// filter commands that do not affect graph (SetCellData ...)
		const graphs = new Map();
		this.graph.getStreamSheetsContainer().enumerateStreamSheetContainers((container) => {
			const sheetId = container.getStreamSheetContainerAttributes().getSheetId().getValue();
			const descriptors = sheetId && container.getStreamSheet().getCells().subItemsToJSON();
			if (descriptors) graphs.set(sheetId, descriptors);
		});
		if (graphs.size) {
			this.execute(new SetGraphItemsCommand(Array.from(graphs.keys()), Array.from(graphs.values())), undefined, false);
		}
	}

	isSelectionInOutbox(graphItem) {
		let parent = graphItem && !(graphItem instanceof MachineGraph) ? graphItem.getParent() : undefined;
		while (parent) {
			if (parent instanceof OutboxContainer) break;
			parent = parent.getParent();
		}
		return !!parent;
	}

	handleCustomFields(command) {
		if (command instanceof SetSelectionCommand) {
			const graphItem = command._graphItem;
			const messageId = command._data;
			const jsonPath = command._content;
			const selectionType = this.getSelectionType(graphItem);
			const processSheet = this.getStreamSheet(graphItem);
			const streamsheetId = processSheet ? this.getStreamSheetIdFromProcessSheet(processSheet) : undefined;
			const custom = {
				streamsheetId,
				selectionType,
			};
			switch (selectionType) {
			case SELECTION_TYPE_INBOX_MESSAGE_LIST:
				custom.messageId = messageId;
				this.graph.context.currentSelectedInboxMessage = messageId;
				break;
			case SELECTION_TYPE_INBOX_MESSAGE_ELEMENTS:
				custom.messageId = this.graph.context.currentSelectedInboxMessage;
				custom.jsonPath = jsonPath;
				break;
			case SELECTION_TYPE_OUTBOX_MESSAGE_LIST:
				custom.messageId = messageId;
				this.graph.context.currentSelectedOutboxMessage = messageId;
				break;
			case SELECTION_TYPE_OUTBOX_MESSAGE_ELEMENTS:
				custom.messageId = this.graph.context.currentSelectedOutboxMessage;
				custom.jsonPath = jsonPath;
				break;
			default:
				break;
			}
			command.custom = custom;
		} else if (command instanceof DeleteTreeItemCommand) {
			const graphItem = command._graphItem;
			const selectionType = this.getSelectionType(graphItem);
			const processSheet = this.getStreamSheet(graphItem);
			const streamsheetId = processSheet ? this.getStreamSheetIdFromProcessSheet(processSheet) : undefined;
			const custom = {
				streamsheetId,
			};
			switch (selectionType) {
			case SELECTION_TYPE_INBOX_MESSAGE_LIST:
				custom.messageId = this.graph.context.currentSelectedInboxMessage;
				custom.messageBox = 'inbox';
				break;
			case SELECTION_TYPE_OUTBOX_MESSAGE_LIST:
				custom.messageId = this.graph.context.currentSelectedOutboxMessage;
				custom.messageBox = 'outbox';
				break;
			default:
				break;
			}
			command.custom = custom;
		}
	}

	getSelectionType(graphItem) {
		let selectionType = null;
		if (graphItem instanceof StreamSheet) {
			selectionType = SELECTION_TYPE_PROCESS_SHEET;
		} else if (graphItem instanceof TreeItemsNode) {
			const isOutbox = graphItem.getParent().getParent().getParent() instanceof OutboxContainer;
			const type = graphItem.getParent().getParent().getType().getValue();
			if (isOutbox) {
				if (type === 'ml') {
					selectionType = SELECTION_TYPE_OUTBOX_MESSAGE_LIST;
				} else if (type === 'me') {
					selectionType = SELECTION_TYPE_OUTBOX_MESSAGE_ELEMENTS;
				}
			} else {
				// eslint-disable-next-line
				if (type === 'ml') {
					selectionType = SELECTION_TYPE_INBOX_MESSAGE_LIST;
				} else if (type === 'me') {
					selectionType = SELECTION_TYPE_INBOX_MESSAGE_ELEMENTS;
 				}
			}
		}
		return selectionType;
	}

	getStreamSheetId(command) {
		const processSheet = this.getProcessSheetFromCommand(command);
		const streamsheetId = this.getStreamSheetIdFromProcessSheet(processSheet);
		return streamsheetId;
	}

	getProcessSheetFromCommand(command) {
		return this.getStreamSheet(command._graphItem)
			|| command.sheet
			|| (command.commands ? command.commands.reduce((sheet, cmd) => sheet || cmd.sheet, null) : undefined);
	}

	isShapeChangingCommand(command) {
		return (command instanceof JSG.PasteCellsFromClipboardCommand) ||
			((command instanceof JSG.CompoundCommand) && command.hasCommands() && (command.commands[0] instanceof JSG.SetNameCommand)) ||
			(command instanceof JSG.DeleteCellsCommand) ||
			(command instanceof JSG.InsertCellsCommand);
	}

	isShapeCommand(command) {
		const isShape = (item) => {
			while (item && !(item instanceof JSG.CellsNode)) {
				item = item.getParent();
			}
			return item;
		}

		if (command instanceof JSG.ZoomChartCommand ||
			command instanceof JSG.SetCellsCommand) {
			return false;
		}
		if ((command instanceof JSG.PasteItemsCommand) ||
			(command instanceof JSG.SetTextCommand) ||
			(command instanceof JSG.SetLayoutSectionCommand) ||
			(command instanceof JSG.SetPlotDataCommand)) {
			return true;
		}
		if (command instanceof JSG.AddItemCommand) {
			return isShape(command._parent);
		}
		if (command instanceof JSG.CompoundCommand) {
			return this.isShapeCommand(command.commands[0]);
		}

		const selection = this.viewer.getSelection();

		return isShape(selection.length ? selection[0].getModel() : undefined);
	}

	getStreamSheet(graphItem) {
		let processSheet = null;
		if (graphItem instanceof StreamSheet) {
			processSheet = graphItem;
		} else if (graphItem instanceof TreeItemsNode) {
			const parent = graphItem.getParent().getParent().getParent();
			if (!(parent instanceof OutboxContainer)) {
				processSheet = parent.getParent().getStreamSheet();
			}
		}
		return processSheet;
	}

	getStreamSheetIdFromProcessSheet(processSheet) {
		if (processSheet && processSheet.sourceSheet) {
			processSheet = processSheet.sourceSheet;
		}
		const processSheetContainer = processSheet && processSheet.getStreamSheetContainer();
		return (processSheetContainer) ?
			processSheetContainer.getStreamSheetContainerAttributes().getSheetId().getValue() : undefined;
	}

	baseExecute(cmd, graphWrapper, completionfunc) {
		this.graphWrapper = graphWrapper;
		const state = JSG.drawingDisabled;
		JSG.setDrawingDisabled(true);
		this.commandStack.execute(cmd);
		cmd.sendNotification();
		if (completionfunc !== undefined) {
			completionfunc.call(this, cmd, this.viewer);
		}
		// mark interaction context:
		cmd._interaction = this.getActiveInteraction();
		if (cmd._keepFeedback !== true) {
			this.viewer.getGraphView().clearFeedback();
		}
		this.viewer.getGraph().setChanged(true);
		JSG.setDrawingDisabled(state);
	}

	/**
	 * Method to perform a synchronized undo.
	 *
	 */
	undo() {
		const command = this.commandStack.undo();
		this.baseUndo(command);
		if (command !== undefined) {
			if (!this.isSelectionInOutbox(command._graphItem)) {
				const streamsheetId = this.getStreamSheetId(command);
				const commandJSON = command.toObject('undo');
				if (streamsheetId) {
					commandJSON.streamsheetId = streamsheetId;
				}
				// serverside-formats: do not send request command again => already done by CommandStack!!
				if (!command.isRequest) {
					Actions.sendCommand(this.graphWrapper.id, commandJSON, this.graphWrapper.machineId, true, false);
				}
				if (this.isShapeChangingCommand(command)) {
					this.updateGraphItems(true);
				}
			}
		}

		return command;
	}

	/**
	 * Method to perform an unsynchronized undo.
	 *
	 * @param {Command} command
	 */
	baseUndo(command) {
		JSG.setDrawingDisabled(true);
		if (command !== undefined) {
			command.undo();
			command.sendNotification();
			const selection = [];
			command.doAfterUndo(selection, this.viewer);
			if (selection.length > 0) {
				command.selectAll(selection, this.viewer);
			}
			if (command._interaction !== this.getActiveInteraction()) {
				command._interaction = undefined;
				this.setActiveInteraction(this.viewer.getDefaultInteraction());
			}
		}
		this.viewer.getGraph().setChanged(true);
		JSG.setDrawingDisabled(false);
		this.repaint();
	}

	/**
	 * Method to perform a synchronized redo.
	 *
	 */
	redo() {
		const command = this.commandStack.redo();
		this.baseRedo(command);
		if (command !== undefined) {
			if (!this.isSelectionInOutbox(command._graphItem)) {
				const streamsheetId = this.getStreamSheetId(command);
				const commandJSON = command.toObject('redo');
				if (streamsheetId) {
					commandJSON.streamsheetId = streamsheetId;
				}
				// serverside-formats: do not send request command again => already done by CommandStack!!
				if (!command.isRequest) {
					Actions.sendCommand(this.graphWrapper.id, commandJSON, this.graphWrapper.machineId, false, true);
				}
				if (this.isShapeChangingCommand(command)) {
					this.updateGraphItems(false);
				}
			}
		}


		return command;
	}

	/**
	 * Method to perform an unsynchronized redo.
	 *
	 * @param {Command} command
	 */
	baseRedo(command) {
		JSG.setDrawingDisabled(true);
		if (command !== undefined) {
			command.redo();
			command.sendNotification();
			const selection = [];
			command.doAfterRedo(selection, this.viewer);
			if (selection.length > 0) {
				command.selectAll(selection, this.viewer);
			}
			if (command._interaction !== this.getActiveInteraction()) {
				command._interaction = undefined;
				this.setActiveInteraction(this.viewer.getDefaultInteraction());
			}
		}
		this.viewer.getGraph().setChanged(true);
		JSG.setDrawingDisabled(false);
		this.repaint();
	}

	onSelectionChanged() {
		const selection = this.viewer.getSelection();
		const message = {};
		// TODO: include id of client in message
		message.client = 'client123456';
		message.graphId = this.graph.getType().getValue();
		message.selections = [];
		selection.forEach((controller) => {
			message.selections.push(controller.getModel().getId());
		});
		Actions.sendSelection(message);
	}
}
