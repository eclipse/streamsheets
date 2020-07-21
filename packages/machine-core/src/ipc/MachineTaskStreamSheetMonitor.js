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
const MachineEvents = require('@cedalo/protocols').MachineServerMessagingProtocol.EVENTS;
const MachineTaskMessagingClient = require('./MachineTaskMessagingClient');
const RedisInboxAdapter = require('./RedisInboxAdapter');
const {
	cellDescriptor,
	cellDescriptorAsObject,
	getSheetCellsAsList,
	isNotRunning,
	publishIf,
	reduceSheetCells
} = require('./utils');

class MachineTaskStreamSheetMonitor {
	constructor(streamsheet) {
		this.streamsheet = streamsheet;
		this.inboxAdapter = new RedisInboxAdapter(streamsheet.inbox, this.streamsheet.machine.scope.id);
		// update interval:
		this.stepUpdateInterval = -1;
		this._steps = 0;

		// event callbacks:
		this.onClear = this.onClear.bind(this);
		this.onEvent = this.onEvent.bind(this);
		this.onMessagePut = this.onMessagePut.bind(this);
		this.onMessagePop = this.onMessagePop.bind(this);
		this.onMessageAttached = this.onMessageAttached.bind(this);
		this.onMessageDetached = this.onMessageDetached.bind(this);
		this.onStreamSheetStep = this.onStreamSheetStep.bind(this);
		this.onSheetUpdate = this.onSheetUpdate.bind(this);
		this.onSheetCellRangeChange = this.onSheetCellRangeChange.bind(this);
		this.onSettingsUpdate = this.onSettingsUpdate.bind(this);
		this.onSheetCellsUpdate = this.onSheetCellsUpdate.bind(this);
		this.streamsheet.inbox.on('clear', this.onClear);
		this.streamsheet.inbox.on('message_put', this.onMessagePut);
		this.streamsheet.inbox.on('message_pop', this.onMessagePop);
		this.streamsheet.on('event', this.onEvent);
		this.streamsheet.on('sheet_update', this.onSheetUpdate);
		this.streamsheet.on('sheet_cellrange_change', this.onSheetCellRangeChange);
		this.streamsheet.on('sheet_cells_update', this.onSheetCellsUpdate);
		this.streamsheet.on('settings_update', this.onSettingsUpdate);
		this.streamsheet.on('message_attached', this.onMessageAttached);
		this.streamsheet.on('message_detached', this.onMessageDetached);
		this.streamsheet.inbox.on('subscribe', this.inboxAdapter.subscribe);
		this.streamsheet.inbox.on('unsubscribe', this.inboxAdapter.unsubscribe);
		this.streamsheet.inbox.on('clear', this.inboxAdapter.clear);
		this.streamsheet.inbox.on('message_put', this.inboxAdapter.put);
		this.streamsheet.inbox.on('message_pop', this.inboxAdapter.pop);
		// DL-2293: only publish if machine is stopped or paused...
		this.publishEvent = publishIf(isNotRunning(streamsheet.machine));
	}

	dispose() {
		const { streamsheet, inboxAdapter } = this;
		this.streamsheet.inbox.off('subscribe', this.inboxAdapter.subscribe);
		this.streamsheet.inbox.off('unsubscribe', this.inboxAdapter.unsubscribe);
		this.streamsheet.inbox.off('clear', this.inboxAdapter.clear);
		this.streamsheet.inbox.off('message_put', this.inboxAdapter.put);
		this.streamsheet.inbox.off('message_pop', this.inboxAdapter.pop);
		inboxAdapter.dispose();
		streamsheet.inbox.off('clear', this.onClear);
		streamsheet.inbox.off('message_put', this.onMessagePut);
		streamsheet.inbox.off('message_pop', this.onMessagePop);
		streamsheet.off('event', this.onEvent);
		streamsheet.off('sheet_update', this.onSheetUpdate);
		streamsheet.off('sheet_cellrange_change', this.onSheetCellRangeChange);
		streamsheet.off('sheet_cells_update', this.onSheetCellsUpdate);
		streamsheet.off('settings_update', this.onSettingsUpdate);
		streamsheet.off('message_attached', this.onMessageAttached);
		streamsheet.off('message_detached', this.onMessageDetached);
	}

	update(props = {}) {
		this.stepUpdateInterval = props.stepUpdateInterval || this.stepUpdateInterval;
	}

	onClear() {
		const { streamsheet } = this;
		const event = {
			type: MachineEvents.MESSAGE_BOX_CLEAR,
			src: 'inbox',
			srcId: streamsheet.inbox.id,
			machineId: streamsheet.machine.id,
			streamsheetId: streamsheet.id
		};
		this.publishEvent(event);
	}

	onEvent(ev) {
		const { streamsheet } = this;
		const event = {
			...ev,
			type: ev.type,
			src: 'streamsheet',
			srcId: streamsheet.id,
			srcName: streamsheet.name,
			machineId: streamsheet.machine.id
		};
		MachineTaskMessagingClient.publishEvent(event);
	}

	onMessagePut(message) {
		const { streamsheet } = this;
		const messageInInbox = message && streamsheet.inbox.messages.filter((m) => message.id === m.id)[0];
		const event = {
			type: MachineEvents.MESSAGE_PUT,
			src: 'inbox',
			srcId: streamsheet.inbox.id,
			machineId: streamsheet.machine.id,
			machineState: streamsheet.machine.state,
			streamsheetId: streamsheet.id,
			totalSize: this.inboxAdapter.totalSize,
			message: messageInInbox
		};
		this.publishEvent(event);
	}

	onMessagePop(message) {
		const { streamsheet } = this;
		const event = {
			type: MachineEvents.MESSAGE_POP,
			src: 'inbox',
			srcId: streamsheet.inbox.id,
			machineId: streamsheet.machine.id,
			machineState: streamsheet.machine.state,
			streamsheetId: streamsheet.id,
			totalSize: this.inboxAdapter.totalSize,
			message
		};
		this.publishEvent(event);
	}

	onMessageAttached(messageId) {
		const { streamsheet } = this;
		const event = {
			type: MachineEvents.STREAMSHEET_MESSAGE_ATTACHED,
			src: 'streamsheet',
			srcId: streamsheet.id,
			machineId: streamsheet.machine.id,
			machineState: streamsheet.machine.state,
			messageId
		};
		this.publishEvent(event);
	}

	onMessageDetached(messageId) {
		const { streamsheet } = this;
		const event = {
			type: MachineEvents.STREAMSHEET_MESSAGE_DETACHED,
			src: 'streamsheet',
			srcId: streamsheet.id,
			machineId: streamsheet.machine.id,
			machineState: streamsheet.machine.state,
			messageId
		};
		this.publishEvent(event);
	}

	onSheetCellsUpdate(cells) {
		const { streamsheet } = this;

		const event = {
			type: MachineEvents.SHEET_CELLS_UPDATE_EVENT,
			src: 'streamsheet',
			srcId: streamsheet.id,
			machineId: streamsheet.machine.id,
			cells: cells
				.map(({ cell, col, row }) => cellDescriptorAsObject(cell, row, col))
				.reduce((acc, descrObj) => ({ ...acc, ...descrObj }))
		};
		MachineTaskMessagingClient.publishEvent(event);
	}

	onSheetUpdate(cell, index) {
		const { streamsheet } = this;
		const { sheet } = streamsheet;
		const event = {
			name: streamsheet.name,
			type: MachineEvents.SHEET_UPDATE_EVENT,
			src: 'streamsheet',
			srcId: streamsheet.id,
			machineId: streamsheet.machine.id,
			cell: cell && index ? cellDescriptor(cell, index) : undefined,
			sheet: {
				cells: getSheetCellsAsList(sheet),
				// include editable-web-component:
				// properties: sheet.properties.toJSON(),
				namedCells: sheet.namedCells.getDescriptors(),
				graphCells: sheet.graphCells.getDescriptors(),
				drawings: sheet.getDrawings().toJSON(),
				graphItems: sheet.getDrawings().toGraphItemsJSON()
			}
		};
		MachineTaskMessagingClient.publishEvent(event);
	}

	onSheetCellRangeChange() {
		const { streamsheet } = this;
		const cells = reduceSheetCells(streamsheet.sheet, (allCells, cell) => {
			const { value, formula, type } = cell;
			allCells[cell.reference] = { value, type, formula };
			return allCells;
		},{});
		const event = {
			type: MachineEvents.SHEET_CELLRANGE_CHANGE_EVENT,
			src: 'streamsheet',
			srcId: streamsheet.id,
			machineId: streamsheet.machine.id,
			cells,
			drawings: streamsheet.sheet.getDrawings().toJSON(),
			graphItems: streamsheet.sheet.getDrawings().toGraphItemsJSON()
		};
		MachineTaskMessagingClient.publishEvent(event);
	}

	onSettingsUpdate(settings) {
		const { streamsheet } = this;
		const event = {
			type: MachineEvents.STREAMSHEET_STREAM_UPDATED,
			src: 'streamsheet',
			srcId: streamsheet.id,
			machineId: streamsheet.machine.id,
			settings
		};
		MachineTaskMessagingClient.publishEvent(event);
	}

	onStreamSheetStep() {
		this._steps += 1;
		if (this.stepUpdateInterval < 0 || this._steps >= this.stepUpdateInterval) {
			const { streamsheet } = this;
			const event = {
				type: MachineEvents.STREAMSHEET_STEP,
				src: 'streamsheet',
				srcId: streamsheet.id,
				machineId: streamsheet.machine.id,
				stats: streamsheet.stats,
				result: getSheetCellsAsList(streamsheet.sheet),
				// jsonpath: streamsheet.getCurrentLoopPath(),
				loop: {
					// index: streamsheet.getLoopIndexKey(),
					currentPath: streamsheet.getCurrentLoopPath()
				},
				inbox: {
					totalSize: this.inboxAdapter.totalSize,
					messages: streamsheet.inbox.messages.slice(0)
				},
				outbox: {
					totalSize: streamsheet.machine.outbox.size,
					messages: streamsheet.machine.outbox.getFirstMessages()
				},
				drawings: streamsheet.sheet.getDrawings().toJSON(),
				graphItems: streamsheet.sheet.getDrawings().toGraphItemsJSON()
			};
			this._steps = 0;
			MachineTaskMessagingClient.publishEvent(event);
		}
	}

	getStreamSheetStepData() {
		const { streamsheet } = this;
		const currmsg = streamsheet.getMessage();
		return {
			id: streamsheet.id,
			name: streamsheet.name,
			cells: getSheetCellsAsList(streamsheet.sheet),
			namedCells: streamsheet.sheet.namedCells.getDescriptors(),
			graphCells: streamsheet.sheet.graphCells.getDescriptors(),
			drawings: streamsheet.sheet.getDrawings().toJSON(),
			graphItems: streamsheet.sheet.getDrawings().toGraphItemsJSON(),
			// currentMessage: {
			// 	id: currmsg ? currmsg.id : null,
			// 	isProcessed: streamsheet.isMessageProcessed(currmsg)
			// },
			// inbox: {
			// 	totalSize: this.inboxAdapter.totalSize,
			// 	messages: streamsheet.inbox.messages.slice(0)
			// },
			// jsonpath: streamsheet.getCurrentLoopPath(),
			// loopIndex: streamsheet.getLoopIndexKey(),
			inbox: {
				totalSize: this.inboxAdapter.totalSize,
				messages: streamsheet.inbox.messages.slice(0),
				currentMessage: {
					id: currmsg ? currmsg.id : null,
					isProcessed: streamsheet.isMessageProcessed(currmsg)
				}
			},
			loop: {
				// index: streamsheet.getLoopIndexKey(),
				currentPath: streamsheet.getCurrentLoopPath()
			},
			stats: streamsheet.stats
		};
	}
}

module.exports = MachineTaskStreamSheetMonitor;
