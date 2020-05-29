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
import * as ActionTypes from '../constants/ActionTypes';
import * as WsMessageTypes from '../constants/WebsocketMessageTypes';
import EventCountingMap from '../performance/EventCountingMap';
import { graphManager } from '../GraphManager';

const defState = {
	// TODO: refactoring reducer naming / responsibility
	selectedMessage: null,
	messages: [],
	connectingIn: 0,
	error: {},
	isConnected: false,
	isDeleted: false,
	isDeleting: false,
	isLoading: true,
	loadingState: null,
	machine: {
		id: undefined,
		state: 'stopped',
		mode: 'uncontrolled',
	},
	machineNameSaved: true,
	originalStateWhenLoaded: null,
	loadingFailed: false,
	requestFailed: false,
	performance: {
		events: new EventCountingMap(),
	},
};

function copy(state) {
	const cp = {};
	cp.selectedMessage = state.selectedMessage;
	cp.messages = state.messages.slice(0);
	cp.isConnected = state.isConnected;
	cp.connectingIn = state.connectingIn;
	cp.error = Object.assign({}, state.error);
	const streamsheets = state.machine.streamsheets ? state.machine.streamsheets.slice() : [];
	cp.machine = Object.assign({}, state.machine);
	cp.machine.streamsheets = streamsheets;
	cp.machineNameSaved = state.machineNameSaved;
	cp.originalStateWhenLoaded = state.originalStateWhenLoaded;
	cp.isDeleted = state.isDeleted;
	cp.isDeleting = state.isDeleting;
	cp.isLoading = state.isLoading;
	cp.loadingState = state.loadingState;
	cp.loadingFailed = state.loadingFailed;
	cp.requestFailed = state.requestFailed;
	cp.performance = Object.assign({}, state.performance);
	cp.cycletime = state.cycletime;
	return cp;
}

function handleRequestFailed(reqaction, newstate) {
	newstate.error = reqaction;
	// TODO this is not correct => request may was successful! => ? mark state as stale and sync with next request... ?
	switch (reqaction.request) {
		case WsMessageTypes.MACHINE_LOAD:
			newstate.loadingFailed = true;
			newstate.requestFailed = true;
			break;
		case WsMessageTypes.MACHINE_RENAME:
			newstate.machineNameSaved = false;
			break;
		default:
	}
}

const applyNewLocale = (newlocale, oldlocale) => {
	newlocale = newlocale || oldlocale;
	if (newlocale && newlocale !== oldlocale) {
		graphManager.setMachineLanguage(newlocale);
		graphManager.redraw();
	}
	return newlocale;
};

export default function doRequest(state = defState, reqaction) {
	const newstate = copy(state);
	switch (reqaction.type) {
		case WsMessageTypes.REQUEST_FAILED: {
			handleRequestFailed(reqaction, newstate);
			break;
		}
		case ActionTypes.SET_MACHINE: {
			newstate.machine = reqaction.machine;
			break;
		}
		case ActionTypes.STREAM_CONTROL_EVENT: {
			const { machine } = state;
			const { event } = reqaction;
			if (event.streamEventType === 'UPDATE' && machine && machine.streamsheets) {
				machine.streamsheets.forEach((t) => {
					const machineStream = t.inbox.stream;
					const { stream } = event.data;
					if (machineStream && event && stream && stream.id === machineStream.id) {
						graphManager.updateStream(t.id, stream);
						graphManager.redraw();
					}
				});
			}
			break;
		}
		case ActionTypes.SEND_MACHINE_LOAD: {
			newstate.machine = {};
			newstate.isLoading = true;
			newstate.loadingFailed = false;
			newstate.requestFailed = false;
			newstate.isDeleting = false;
			newstate.isDeleted = false;
			newstate.error = {};
			newstate.loadingState = 'Loading';
			break;
		}
		case ActionTypes.RECEIVE_MACHINE_LOAD: {
			const { machine } = reqaction.response.machineserver;
			newstate.machine = machine;
			newstate.selectedMessage = null;
			newstate.messages = [];
			newstate.originalStateWhenLoaded = reqaction.response.machineserver.machine.state;
			newstate.isLoading = false;
			newstate.cycletime = machine.settings.cycletime;
			newstate.performance.cyclesPerSecond = 0;
			newstate.loadingState = 'Loaded';
			break;
		}
		// Set cycle time without waiting for server
		// response to have a fluent user experience
		case ActionTypes.SEND_CYCLE_TIME: {
			const { cycletime } = reqaction;
			newstate.cycletime = cycletime;
			break;
		}
		case ActionTypes.RECEIVE_CYCLE_TIME: {
			// if we would enable this, the slider
			// of the cycle speed reacts double
			// const { cycletime } = reqaction;
			// newstate.cycletime = cycletime;
			break;
		}
		case ActionTypes.RECEIVE_CYCLE_TIME_FROM_MACHINE: {
			const { cycletime } = reqaction;
			newstate.cycletime = cycletime;
			break;
		}
		case ActionTypes.RECEIVE_START_MACHINE:
		case ActionTypes.RECEIVE_STOP_MACHINE:
		case ActionTypes.RECEIVE_PAUSE_MACHINE:
		case ActionTypes.RECEIVE_MACHINE_STATE_CHANGE: {
			newstate.machine.state = reqaction.state;
			// DL 1023: pass machine state update to graph...
			graphManager.updateMachineState(newstate.machine.state);
			break;
		}
		case ActionTypes.RECEIVE_RENAME_MACHINE: {
			newstate.machine.name = reqaction.newName;
			newstate.machineNameSaved = true;
			break;
		}
		case ActionTypes.SEND_DELETE_MACHINE:
			newstate.isDeleting = true;
			break;
		case ActionTypes.RECEIVE_DELETE_MACHINE:
			newstate.isDeleting = false;
			newstate.isDeleted = true;
			break;
		case ActionTypes.DISCONNECT:
			newstate.isConnected = false;
			break;
		case ActionTypes.CONNECT:
			newstate.isConnected = true;
			break;
		case ActionTypes.INIT_RECONNECT:
			newstate.connectingIn = 5;
			break;
		case ActionTypes.DECREMENT_RECONNECT_TIMER:
			newstate.connectingIn -= 1;
			break;
		case ActionTypes.FETCH_META_INFORMATION:
			newstate.loadingState = 'FetchingMetaInformation';
			break;
		case ActionTypes.FETCH_MACHINES:
			newstate.loadingState = 'FetchingMachines';
			break;
		case ActionTypes.FETCH_STREAMS:
			newstate.loadingState = 'FetchingStreams';
			break;
		case ActionTypes.USERS_FETCH:
			newstate.loadingState = 'FetchingUsers';
			break;
		case ActionTypes.USER_FETCH:
			newstate.loadingState = 'FetchingUser';
			break;
		case ActionTypes.RECEIVE_CREATE_STREAMSHEET:
			newstate.machine.streamsheets.push({ ...reqaction.data.machineserver.streamsheet });
			break;
		case ActionTypes.SAVE_PROCESS_SETTINGS:
			newstate.machine.streamsheets.map((streamsheet) => {
				if (streamsheet.id === reqaction.settings.id) {
					Object.assign(streamsheet, reqaction.settings);
				}
				return streamsheet;
			});
			break;
		case ActionTypes.RECEIVE_MACHINE_STEP:
			newstate.performance.cyclesPerSecond = reqaction.event.stats.cyclesPerSecond;
			newstate.performance.events.add({});
			break;
		case ActionTypes.RECEIVE_MACHINE_LOCALE:
			newstate.machine.locale = applyNewLocale(reqaction.locale, newstate.machine.locale);
			break;
		case ActionTypes.RECEIVE_MACHINE_UPDATE_SETTINGS: {
			newstate.machine.isOPCUA = reqaction.settings.isOPCUA;
			newstate.machine.locale = applyNewLocale(reqaction.locale, newstate.machine.locale);
			break;
		}
		default:
			return state;
	}
	return newstate;
}
