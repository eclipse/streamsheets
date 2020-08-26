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
import Protocols from '@cedalo/protocols';
import qs from 'query-string';
import { goBack, push } from 'react-router-redux';
import * as ActionTypes from '../constants/ActionTypes';
import * as messageTypes from '../constants/WebsocketMessageTypes';
import { graphManager } from '../GraphManager';
import { accessManager } from '../helper/AccessManager';
import ConfigManager from '../helper/ConfigManager';
import gatewayClient from '../helper/GatewayClient';
import { intl } from '../helper/IntlGlobalProvider';
import MachineHelper from '../helper/MachineHelper';
import { Path } from '../helper/Path';
import { functionStrings } from '../languages/FunctionStrings';
import SheetParserContext from '../SheetParserContext';
import store from '../store';
import * as BackupRestoreActions from './BackupRestoreActions';
import * as ImportExportActions from './ImportExportActions';
import * as MachineActions from './MachineActions';
import * as StreamActions from './StreamActions';
import * as UserActions from './UserActions';

const { EVENTS } = Protocols.GatewayMessagingProtocol;
const CONFIG = ConfigManager.config.gatewayClientConfig;

const removeSelection = () => {
	const user = JSON.parse(localStorage.getItem('user'));
	const sessionId = sessionStorage.getItem('sessionId');
	if (user) {
		const id = `${sessionId};${user.id};${user.displayName}`;
		graphManager.removeSelection(id);
	}
};

window.onbeforeunload = () => {
	removeSelection();
};

export const {
	saveConfiguration,
	reloadAllStreams,
	deleteActiveConfiguration,
	setDeleteDialogOpen,
	executeStreamCommand,
} = StreamActions;

export const {
	setUserSettings,
	saveUserSettings,
	login,
	logout,
} = UserActions;

export const {
	notifyExportFailed,
	showImportDialog,
	closeImportDialog,
	showStartImportDialog,
} = ImportExportActions;

export const { restore, backup } = BackupRestoreActions;

export const { updateMachines, getMachines } = MachineActions;

export function pushPage(page) {
	return (dispatch) => dispatch(push(page));
}

export function goBackPage() {
	return (dispatch) => dispatch(goBack());
}

const putAppState = (newState) => ({
	type: ActionTypes.SET_APP_STATE,
	newState,
});
export function setAppState(newState) {
	return store.dispatch(putAppState(newState));
}

const putJsgState = (data) => ({
	type: 'SET_JSG_STATE',
	data
});
export function setJsgState(data) {
	return store.dispatch(putJsgState(data));
}

const putFormFeedback = (notification) => ({
	type: ActionTypes.FORM_INPUT_FEEDBACK,
	notification,
});
const removeNotifications = () => ({ type: ActionTypes.NOTIFICATIONS_CLEAR });
const putMachine = (machine) => ({ type: ActionTypes.SET_MACHINE, machine });

const sendRenameMachine = (machineId, newName) => ({
	type: ActionTypes.SEND_RENAME_MACHINE,
	machineId,
	newName,
});
const receiveRenameMachine = (newName) => ({
	type: ActionTypes.RECEIVE_RENAME_MACHINE,
	newName,
});
const sendCycleTime = (cycletime) => ({
	type: ActionTypes.SEND_CYCLE_TIME,
	cycletime,
});
const receiveCycleTime = (cycletime) => ({
	type: ActionTypes.RECEIVE_CYCLE_TIME,
	cycletime,
});
const receiveCycleTimeFromMachine = (cycletime) => ({
	type: ActionTypes.RECEIVE_CYCLE_TIME_FROM_MACHINE,
	cycletime,
});
const sendMachineLocale = (locale) => ({
	type: ActionTypes.SEND_MACHINE_LOCALE,
	locale,
});
const receiveMachineLocale = (locale) => ({
	type: ActionTypes.RECEIVE_MACHINE_LOCALE,
	locale,
});
const sendMachineUpdateSettings = (settings) => ({
	type: ActionTypes.SEND_MACHINE_UPDATE_SETTINGS,
	settings,
});
const receiveMachineUpdateSettings = (settings) => ({
	type: ActionTypes.RECEIVE_MACHINE_UPDATE_SETTINGS,
	settings,
});
const sendStartMachine = (machineId) => ({
	type: ActionTypes.SEND_START_MACHINE,
	machineId,
});
const receiveStartMachine = (state) => ({
	type: ActionTypes.RECEIVE_START_MACHINE,
	state,
});
const sendStopMachine = (machineId) => ({
	type: ActionTypes.SEND_STOP_MACHINE,
	machineId,
});
const receiveStopMachine = (state) => ({
	type: ActionTypes.RECEIVE_STOP_MACHINE,
	state,
});
const sendPauseMachine = (machineId) => ({
	type: ActionTypes.SEND_PAUSE_MACHINE,
	machineId,
});
const receivePauseMachine = (state) => ({
	type: ActionTypes.RECEIVE_PAUSE_MACHINE,
	state,
});
const sendStepMachine = (machineId) => ({
	type: ActionTypes.SEND_STEP_MACHINE,
	machineId,
});
const receiveStepMachine = (state) => ({
	type: ActionTypes.RECEIVE_STEP_MACHINE,
	state,
});
const sendRedo = (machineId) => ({ type: ActionTypes.SEND_REDO, machineId });
const receiveRedo = (response) => ({
	type: ActionTypes.RECEIVE_REDO,
	data: response,
});
const sendUndo = (machineId) => ({ type: ActionTypes.SEND_UNDO, machineId });
const receiveUndo = (response) => ({
	type: ActionTypes.RECEIVE_UNDO,
	data: response,
});
const sendDeleteMachine = (machineId) => ({
	type: ActionTypes.SEND_DELETE_MACHINE,
	machineId,
});
const receiveDeleteMachine = (machineId) => ({
	type: ActionTypes.RECEIVE_DELETE_MACHINE,
	machineId,
});
const sendCreateStreamSheet = (machineId) => ({
	type: ActionTypes.SEND_CREATE_STREAMSHEET,
	machineId,
});
const receiveCreateStreamSheet = (response) => ({
	type: ActionTypes.RECEIVE_CREATE_STREAMSHEET,
	data: response,
});
const sendDeleteStreamSheet = (machineId, streamsheetId) => ({
	type: ActionTypes.SEND_DELETE_STREAMSHEET,
	machineId,
	streamsheetId,
});
const receiveDeleteTranscator = () => ({
	type: ActionTypes.RECEIVE_DELETE_STREAMSHEET,
});
const receiveMachineStateChange = (state) => ({
	type: ActionTypes.RECEIVE_MACHINE_STATE_CHANGE,
	state,
});
const sendMachineLoad = (machineId) => ({
	type: ActionTypes.SEND_MACHINE_LOAD,
	machineId,
});
const receiveMachineLoad = (response) => ({
	type: ActionTypes.RECEIVE_MACHINE_LOAD,
	response,
});
const requestFailed = (type, error) => ({
	type: messageTypes.REQUEST_FAILED,
	request: type,
	error,
});

const receiveMetaInformation = (metaInformation) => ({
	type: ActionTypes.RECEIVE_META_INFORMATION,
	metaInformation,
});
const receiveMachineStep = (event) => ({
	type: ActionTypes.RECEIVE_MACHINE_STEP,
	event,
});
// const startProcessingMachineStep = () => ({ type: ActionTypes.START_PROCESSING_MACHINE_STEP });
// const finishedProcessingMachineStep = () => ({ type: ActionTypes.FINISHED_PROCESSING_MACHINE_STEP });
const receiveUserJoined = (event) => ({
	type: ActionTypes.RECEIVE_USER_JOINED,
	event,
});
const receiveUserLeft = (event) => ({
	type: ActionTypes.RECEIVE_USER_LEFT,
	event,
});
const clientConnected = () => ({ type: ActionTypes.CONNECT });
const clientDisconnected = () => ({ type: ActionTypes.DISCONNECT });
const connectedService = () => ({ type: ActionTypes.SERVICE_CONNECTED });
const disconnectedService = () => ({ type: ActionTypes.SERVICE_DISCONNECTED });

export const setScope = (data) => ({ type: ActionTypes.USER_SET_SCOPE, data });

export const receiveStreams = (data) => ({
	type: ActionTypes.RECEIVE_STREAMS,
	data: data || {},
});
const putProcessSettings = (settings) => ({
	type: ActionTypes.SAVE_PROCESS_SETTINGS,
	settings,
});
// const receiveMachineSaveAs = machine => ({ type: ActionTypes.RECEIVE_MACHINE_SAVE_AS, machine });
// const receiveMachineReset = machine => ({ type: ActionTypes.RECEIVE_MACHINE_RESET, machine });

function handleUserJoinedEvent(/* event */) {}

function handleUserLeftEvent(event) {
	const { sessionId, user } = event;
	const id = `${sessionId};${user.id};${user.displayName}`;
	if (event.user) {
		graphManager.removeSelection(id);
	}
}

function handleSheetUpdateEvent(event) {
	const streamsheetId = event.srcId;
	const { sheet } = event;
	const { cells, drawings, graphItems, graphCells, namedCells } = sheet;
	graphManager.updateCellValues(streamsheetId, cells, drawings, graphItems, graphCells, namedCells);
	graphManager.redraw();
}

function handleCommandEvent(event) {
	// This method handles commands that are received from the graph server.
	// Therefore ignore SetCellDataCommand because all process sheet data is
	// coming from the machine server.
	if ((event.options && event.options.undo) || (event.data && event.data.name !== 'command.SetCellDataCommand')) {
		try {
			graphManager.executeCommands(event.data, event.options);
			graphManager.redraw();
		} catch (e) {
			console.warn(e);
		}
	}
}

function handleMessageBoxClear(event) {
	if (event.src === 'inbox') {
		graphManager.clearInbox(event.streamsheetId);
		graphManager.redraw();
	} else if (event.src === 'outbox') {
		graphManager.clearOutbox();
		graphManager.redraw();
	}
}
function handleMessagePutEvent(event) {
	if (event.src === 'inbox') {
		const { message, streamsheetId, totalSize } = event;
		if (message) {
			graphManager.addInboxMessage(streamsheetId, message, totalSize);
			graphManager.redraw();
		}
	}
	// else if (event.src === 'outbox') {
	// 	graphManager.addOutboxMessage(event.message);
	// }
}

function handleMessagePopEvent(event) {
	if (event.src === 'inbox') {
		const { message, streamsheetId, totalSize } = event;
		graphManager.removeInboxMessage(streamsheetId, message, totalSize);
		graphManager.redraw();
	} else if (event.src === 'outbox') {
		graphManager.removeOutboxMessage(event.message);
		graphManager.redraw();
	}
}

function updateStreamSheetCellValues(streamsheets) {
	streamsheets.forEach((streamsheet) => {
		const { id, sheet } = streamsheet;
		graphManager.updateCellValues(
			id,
			sheet.cells,
			sheet.drawings,
			sheet.graphItems,
			sheet.graphCells,
			sheet.namedCells,
		);
	});
	graphManager.redraw();
}

function handleMachineLocaleChanged(event) {
	const streamsheets = event.streamsheets || [];
	streamsheets.forEach((streamsheet) =>
		graphManager.updateCellValues(streamsheet.id, streamsheet.cells, streamsheet.drawings, streamsheet.graphItems),
	);
	graphManager.redraw();
}

function handleMachineCycleTime(event) {
	store.dispatch(receiveCycleTimeFromMachine(event.cycletime));
}

function handleMessageChangedEvent(/* event */) {
	// if (event.src === 'outbox') {
	// 	graphManager.addOutboxMessage(event.message);
	// }
}

function handleStreamUpdatedEvent(/* event */) {
	/*
	graphManager.updateStream(event.settings.streamsheetId, event.settings.inbox.stream.name);
	try {
		graphManager.updateLoopElement(settings.streamsheetId, settings.loop.path);
	} catch (e) {
		console.warn(`failed updateLoopElement${e}`);
	}
	graphManager.getGraphEditor().invalidate();
	*/
}

function handleStreamsReloaded(event) {
	store.dispatch(receiveStreams(event.streams));
}

function handleStreamControlEvent(event) {
	const user = store.getState().user.user;
	try {
		if (user && event.data.stream && (!event.data.stream.scope || user.scope.id === event.data.stream.scope.id)) {
			store.dispatch({
				type: ActionTypes.STREAM_CONTROL_EVENT,
				event
			});
		}
	} catch (error) {
		console.error('Failed to handle stream event', event, error);
	}
}

function _getDataStores(dispatch) {
	const scope = store.getState().user.user.scope;
	return gatewayClient.loadAllDSConfigurations(scope).then((response) => {
		// const { session } = response;
		// localStorage.setItem('user', JSON.stringify(session.user));
		// sessionStorage.setItem('sessionId', session ? session.id : '');
		dispatch(receiveStreams(response.response));
	});
}

export function openPage(page) {
	return (dispatch) => dispatch(push(page));
}

export function getMe() {
	return async (dispatch) => {
		dispatch({ type: ActionTypes.USER_FETCH });
		const result = await gatewayClient.graphql(
			`{
				me {
					id
					scope {
						id
					}
					scopes {
						id
						rights
						name
					}
					username
					displayName
					admin
					settings {
						locale
					}
					rights
				}
			}`
		);
		const user = result.me;
		const { id, displayName, settings  } = user;
		const urlHash = qs.parse(window.location.hash);
		const currentScope = urlHash.scope;
		localStorage.setItem('user', JSON.stringify({ id, displayName, settings }));
		dispatch({
			type: ActionTypes.USER_FETCHED,
			user: { ...user, scope: { id: currentScope || user.scope.id } }
		});
		return user;
	};
}

export function reconnect(time = 5) {
	return (dispatch) => {
		dispatch({
			type: ActionTypes.INIT_RECONNECT,
		});
		const intervalId = setInterval(() => {
			time -= 1;
			dispatch({
				type: ActionTypes.DECREMENT_RECONNECT_TIMER,
			});

			// TODO: revise reloading to reload machine without reloading window
			if (time === 0) {
				clearInterval(intervalId);
				gatewayClient
					.connect(CONFIG)
					.then(() => dispatch(clientConnected()))
					.then(() => {
						window.location.reload(true);
					});
			}
		}, 1000);
	};
}

function saveProcessSettingsAndDispatch(settings, dispatch) {
	return gatewayClient
		.updateStreamSheetStreams(settings.machineId, settings.streamsheetId, settings)
		.then((response) => {
			const streamsheet = response
				? response.machineserver.machine.streamsheets.find((t) => t.id === settings.streamsheetId)
				: null;
			if (settings.inbox && settings.inbox.stream) {
				try {
					graphManager.updateStream(settings.streamsheetId, settings.inbox.stream);
				} catch (e) {
					console.error(e);
				}
			}
			if (settings.loop) {
				try {
					graphManager.updateLoopElement(settings.streamsheetId, settings.loop);
					graphManager.getGraphEditor().invalidate();
				} catch (e) {
					console.warn(e);
				}
			}
			// redraw title
			return Promise.resolve(streamsheet);
		})
		.then((streamsheet) => dispatch(putProcessSettings(streamsheet)))
		.catch((error) => {
			console.error(error);
			return dispatch(requestFailed(messageTypes.STREAMSHEET_STREAM_UPDATE_TYPE, error));
		});
}

export function setFormFeedback(notification) {
	store.dispatch(putFormFeedback(notification));
}

export function clearNotifications() {
	store.dispatch(removeNotifications());
}

export function loadSubscribeMachine(machineId, options = {}) {
	return async (dispatch) => {
		dispatch(sendMachineLoad(machineId));
		const { settings, stream, scope } = options || {};
		try {
			const response = await gatewayClient.loadSubscribeMachine(machineId, settings, scope);
			if (response.machineserver.error) {
				dispatch(requestFailed(messageTypes.MACHINE_LOAD, response.machineserver.error));
				return null;
			}
			functionStrings.addFunctionsHelp(response.machineserver.machine.functionsHelp);
			JSG.FormulaParser.context = new SheetParserContext(
				response.machineserver.machine.functionDefinitions.map((def) => def.name),
			);
			const selectionId = response.user ? response.user.id : response.session.id;
			graphManager.loadGraph(
				response.graphserver.graph,
				response.machineserver.machine,
				// TODO: remove when user id is available on client side through login
				selectionId,
			);
			if (stream && stream.id && stream.name) {
				const firstStreamSheet = response.machineserver.machine.streamsheets[0];
				firstStreamSheet.inbox.stream = { id: stream.id, name: stream.name };
				firstStreamSheet.trigger = { type: 'arrival', repeat: 'once' };
				const streamsheetSettings = {
					...firstStreamSheet,
					machineId: response.machineserver.machine.id,
					streamsheetId: firstStreamSheet.id,
				};
				saveProcessSettingsAndDispatch(streamsheetSettings, store.dispatch);
			}
			updateStreamSheetCellValues(response.machineserver.machine.streamsheets);
			if(!response.machineserver.templateId){
				dispatch(receiveMachineLoad(response));
			}
			return response;
		} catch (error) {
			dispatch(requestFailed(messageTypes.MACHINE_LOAD, error));
			return null;
		}
	};
}

function reloadCurrentMachine() {
	const currentMachine = store.getState().monitor.machine;
	const currentMachineId = currentMachine && currentMachine.id;
	if (currentMachineId) {
		store.dispatch(loadSubscribeMachine(currentMachineId, null));
	}
}

export async function getMetaInformationAndDispatch(dispatch = store.dispatch) {
	dispatch({ type: ActionTypes.FETCH_META_INFORMATION });
	try {
		const metaInformation = await gatewayClient.getMetaInformation();
		dispatch(receiveMetaInformation(metaInformation));
	} catch (error) {
		if (error.status === 401) {
			// TODO: This is currently the first request that is executed, so only checking here for now works
			console.log('Invalid session. Redirecting to /logout');
			dispatch(openPage('/logout'));
		} else {
			console.error(error);
		}
	}
}

function handleMessageAttached(event) {
	graphManager.selectInboxMessage(event.srcId, event.messageId);
}

function handleMessageDetached(event) {
	graphManager.selectInboxMessage(event.srcId, event.messageId, true);
	// graphManager.selectInboxMessage(event.srcId, null);
}

export function connect() {
	gatewayClient.on('service', (/* event */) => {
		getMetaInformationAndDispatch();
	});
	gatewayClient.on('redirect', () => {
		accessManager.logoutUI(true);
	});
	const config = {
		...CONFIG,
		pathname: store.getState().router.location.pathname,
		token: accessManager.authToken
	};
	return (dispatch) =>
		gatewayClient
			.connect(config)
			.then(() => {
				getMetaInformationAndDispatch();
				gatewayClient.on(EVENTS.SESSION_INIT_EVENT, (event) => {
					sessionStorage.setItem('sessionId', event.session.id);
				});
				gatewayClient.on(EVENTS.GATEWAY_DISCONNECTED_EVENT, (event) => {
					getMetaInformationAndDispatch();
					dispatch(clientDisconnected(event));
					dispatch(reconnect());
				});
				gatewayClient.on(EVENTS.SERVICE_DISCONNECTED_EVENT, (event) => {
					getMetaInformationAndDispatch();
					return dispatch(disconnectedService(event));
				});
				gatewayClient.on(EVENTS.SERVICE_CONNECTED_EVENT, (event) => {
					getMetaInformationAndDispatch();
					reloadCurrentMachine();
					return dispatch(connectedService(event));
				});
				gatewayClient.on(EVENTS.USER_JOINED_EVENT, (event) => {
					handleUserJoinedEvent(event);
					dispatch(receiveUserJoined(event));
				});
				gatewayClient.on(EVENTS.USER_LEFT_EVENT, (event) => {
					handleUserLeftEvent(event);
					dispatch(receiveUserLeft(event));
				});
				gatewayClient.on(EVENTS.LICENSE_INFO_EVENT, (event) => {
					const { licenseInfo = {}} = event;
					dispatch({type: ActionTypes.LICENSE_INFORMATION, licenseInfo });
				});
				gatewayClient.on(EVENTS.MACHINE_STEP_EVENT, (event) => {
					try {
						// const startProcessingMachineStepEvent = document.createEvent('Event');
						// startProcessingMachineStepEvent.initEvent('start_processing_machine_step', true, true);
						// document.dispatchEvent(startProcessingMachineStepEvent);
						dispatch(receiveMachineStep(event));
						// dispatch(startProcessingMachineStep());
						graphManager.setDrawingDisabled(true);
						event.streamsheets.forEach((streamsheet) => {
							try {
								const {
									id,
									cells,
									graphCells,
									namedCells,
									drawings,
									graphItems,
									inbox,
									loop,
									stats
								} = streamsheet;
								graphManager.handleStreamSheetStep(
									id,
									loop.currentPath,
									cells,
									namedCells,
									graphCells,
									drawings,
									graphItems,
									// TODO: improve, outbox does not need to be updated for each streamsheet
									event.outbox,
									stats,
									inbox,
									inbox.currentMessage,
								);
							} catch (error) {
								// this can happen if the machine step event comes
								// before the machine is loaded on the client side,
								// usually when the machine is running very fast
							}
						});
						// dispatch(finishedProcessingMachineStep());
						// const finishedProcessingMachineStepEvent = document.createEvent('Event');
						// finishedProcessingMachineStepEvent.initEvent('finished_processing_machine_step', true, true);
						// document.dispatchEvent(finishedProcessingMachineStepEvent);
						graphManager.setDrawingDisabled(false);
						// finally confirm:
						gatewayClient.confirmProcessedMachineStep(event.machineId || event.srcId);
					} catch (error) {
						console.error(error);
					}
				});
				gatewayClient.on(EVENTS.MACHINE_RENAME_EVENT, (event) => dispatch(receiveRenameMachine(event.name)));
				gatewayClient.on(EVENTS.MACHINE_FUNCTIONS_EVENT, (event) => {
					JSG.FormulaParser.context = new SheetParserContext(
						event.functionDefinitions.map((def) => def.name),
					);
				});
				gatewayClient.on(EVENTS.MACHINE_STATE_EVENT, (event) =>
					dispatch(receiveMachineStateChange(event.state)),
				);
				gatewayClient.on(EVENTS.COMMAND_EVENT, (event) => handleCommandEvent(event));
				gatewayClient.on(EVENTS.MESSAGE_BOX_CLEAR, (event) => handleMessageBoxClear(event));
				gatewayClient.on(EVENTS.MESSAGE_PUT, (event) => handleMessagePutEvent(event));
				gatewayClient.on(EVENTS.MESSAGE_POP, (event) => handleMessagePopEvent(event));
				gatewayClient.on(EVENTS.MESSAGE_CHANGED, (event) => handleMessageChangedEvent(event));
				gatewayClient.on(EVENTS.STREAMSHEET_STREAM_UPDATED, (event) => handleStreamUpdatedEvent(event));
				gatewayClient.on(EVENTS.STREAMS_RELOAD_EVENT, (event) => handleStreamsReloaded(event));
				gatewayClient.on(EVENTS.SHEET_UPDATE_EVENT, (event) => handleSheetUpdateEvent(event));
				gatewayClient.on(EVENTS.STREAM_CONTROL_EVENT, (event) => handleStreamControlEvent(event));
				// TODO: replace with inbox select event when available from machine server
				gatewayClient.on(EVENTS.STREAMSHEET_MESSAGE_ATTACHED, (event) => handleMessageAttached(event));
				gatewayClient.on(EVENTS.STREAMSHEET_MESSAGE_DETACHED, (event) => handleMessageDetached(event));
				gatewayClient.on(EVENTS.MACHINE_LOCALE_EVENT, (event) => handleMachineLocaleChanged(event));
				gatewayClient.on(EVENTS.MACHINE_CYCLETIME_EVENT, (event) => handleMachineCycleTime(event));
			})
			.then(() => dispatch({ type: ActionTypes.CONNECT }))
			// .then(() => gatewayClient.waitUntilAllServersAreConnected(20000))
			.then(() => dispatch(clientConnected()));
}

export function setLocaleSetup(locale) {
	return (dispatch) => dispatch({ type: ActionTypes.SETUP_LOCALE, locale });
}

export function saveSetup(setup) {
	return (dispatch) =>
		fetch(`${CONFIG.restEndpointURL}/system/setup`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(setup),
		}).then(() => dispatch({ type: ActionTypes.SETUP_COMPLETED }));
}

export function sendCommand(graphId, command, machineId, undo, redo) {
	return gatewayClient.sendCommand(machineId, graphId, command, undo, redo).then((response) => {
		graphManager.handleCommandResponse(response);
		return response;
	});
}

export function sendSelection(selection) {
	gatewayClient.sendSelection(selection);
}

export function setTitleImage(machine, image) {
	gatewayClient.updateMachineTitleImage(machine.id, image);
}

export function setMachineActive(machine) {
	return (dispatch) => {
		dispatch(putMachine(machine));
	};
}

export function reloadDashboard() {
	document.title = intl.formatMessage({ id: 'TitleDashboard' }, {});
	updateMachines();
}

export function createStreamSheet(machineId, activeItemId, position) {
	return (dispatch) => {
		dispatch(sendCreateStreamSheet());
		return gatewayClient
			.createStreamSheet(machineId, activeItemId, position)
			.then((response) => dispatch(receiveCreateStreamSheet(response)))
			.catch((error) => dispatch(requestFailed(messageTypes.STREAMSHEET_CREATE, error)));
	};
}

export function deleteStreamSheet(machineId, streamsheetId) {
	return (dispatch) => {
		dispatch(sendDeleteStreamSheet());
		return gatewayClient
			.deleteStreamSheet(machineId, streamsheetId)
			.then((response) => dispatch(receiveDeleteTranscator(response)))
			.catch((error) => dispatch(requestFailed(messageTypes.STREAMSHEET_DELETE, error)));
	};
}

export function unsubscribe(machineId) {
	return async (dispatch) => {
		removeSelection();
		const previewImage = graphManager.getMachineImage(245, 100);
		try {
			await gatewayClient.unsubscribeMachine(machineId);
			await gatewayClient.updateMachineImage(machineId, previewImage);
		} catch (error) {
			dispatch(requestFailed(messageTypes.MACHINE_UNSUBSCRIBE, error));
		}
	};
}

export function openExport(machineId) {
	return (dispatch) => {
		const path = Path.export(machineId);
		if(MachineHelper.isMachineDetailsPage()){
			window.open(path);
		} else {
			dispatch(push(path))
		}
	}
}

export function openDashboard(currentMachineId) {
	removeSelection();
	if (currentMachineId) {
		return (dispatch) => {
			const previewImage = graphManager.getMachineImage(245, 100);
			if (previewImage) {
				return gatewayClient
					.updateMachineImage(currentMachineId, previewImage)
					.then(() => dispatch(push(Path.dashboard())))
					.then(() => {
						reloadDashboard();
					});
			}
			return Promise.resolve()
				.then(() => dispatch(push(Path.dashboard())))
				.then(() => {
					reloadDashboard();
				});
		};
		// eslint-disable-next-line
	} else {
		return (dispatch) =>
			Promise.resolve()
				.then(() => dispatch(push(Path.dashboard())))
				.then(() => {
					reloadDashboard();
				});
	}
}

export function openStream(stream) {
	return (dispatch) => dispatch(push(Path.stream(stream.id)));
}

export function openUser(user) {
	return (dispatch) => dispatch(push(Path.user(user.id)));
}

export async function machineWithSameNameExists(machineId, name) {
	const { scopedByMachine } = await gatewayClient.graphql(
		`
		query MachinesWithName($name: String, $machineId: ID!) {
			scopedByMachine(machineId: $machineId) {
				machines(name: $name) {
					id
					name
				}
			}
		}
	  `,
		{ name, machineId }
	);
	const otherWithSameName = scopedByMachine.machines.filter(({ id }) => id !== machineId);
	return otherWithSameName.length > 0;
}

export function rename(machineId, newName) {
	return (dispatch) =>
		machineWithSameNameExists(machineId, newName).then((exists) => {
			if (exists) {
				return dispatch(requestFailed(messageTypes.MACHINE_RENAME, new Error('Machine with same name exists')));
			}
			dispatch(sendRenameMachine(machineId, newName));
			return gatewayClient
				.renameMachine(machineId, newName)
				.then((response) => dispatch(receiveRenameMachine(response.machineserver.machine.name)))
				.catch((error) => dispatch(requestFailed(messageTypes.MACHINE_RENAME, error)));
		});
}

export function setStreamSheetStepInterval(machineId, streamSheetStepInterval) {
	localStorage.setItem('streamSheetStepInterval', streamSheetStepInterval);
	return async () => /* dispatch */ gatewayClient.setStreamSheetStepInterval(machineId, streamSheetStepInterval);
}

export function setCycleTime(machineId, cycleTime) {
	return async (dispatch) => {
		dispatch(sendCycleTime(cycleTime));
		await gatewayClient.setCycleTime(machineId, cycleTime);
		return dispatch(receiveCycleTime(cycleTime));
	};
}

export function setMachineLocale(machineId, locale) {
	return async (dispatch) => {
		dispatch(sendMachineLocale(locale));
		return gatewayClient.setMachineLocale(machineId, locale).then(() => dispatch(receiveMachineLocale(locale)));
	};
}

export function updateMachineSettings(machineId, settings) {
	return async (dispatch) => {
		dispatch(sendMachineUpdateSettings(settings));
		return gatewayClient
			.updateMachineSettings(machineId, settings)
			.then(() => dispatch(receiveMachineUpdateSettings(settings)))
			.catch((error) => dispatch(requestFailed(messageTypes.MACHINE_UPDATE_SETTINGS, error)));
	};
}

export function start(machineId) {
	return async (dispatch) => {
		dispatch(sendStartMachine(machineId));
		try {
			await gatewayClient.loadMachine(machineId);
			const response = await gatewayClient.startMachine(machineId);
			dispatch(receiveStartMachine(response.machineserver.machine.state));
			graphManager.setRunMode(true);
		} catch (error) {
			dispatch(requestFailed(messageTypes.MACHINE_START, error));
		}
	};
}

export function stop(machineId) {
	return (dispatch) => {
		dispatch(sendStopMachine(machineId));
		return gatewayClient
			.stopMachine(machineId)
			.then((response) => dispatch(receiveStopMachine(response.machineserver.machine.state)))
			.then(() => graphManager.setRunMode(false))
			.catch((error) => dispatch(requestFailed(messageTypes.MACHINE_STOP, error)));
	};
}

export function pause(machineId) {
	return (dispatch) => {
		dispatch(sendPauseMachine(machineId));
		return gatewayClient
			.loadMachine(machineId)
			.then(() => gatewayClient.pauseMachine(machineId))
			.then((response) => dispatch(receivePauseMachine(response.machineserver.machine.state)))
			.catch((error) => dispatch(requestFailed(messageTypes.MACHINE_PAUSE, error)));
	};
}

export function updateMachineImage(machineId) {
	return (/* dispatch */) => {
		const dataURL = graphManager.getMachineImage(245, 100);
		return gatewayClient.updateMachineImage(machineId, dataURL);
	};
}

export function step(machineId) {
	return (dispatch) => {
		dispatch(sendStepMachine(machineId));
		return gatewayClient
			.stepMachine(machineId)
			.then((response) => dispatch(receiveStepMachine(response.machineserver.machine.state)))
			.catch((error) => dispatch(requestFailed(messageTypes.MACHINE_STEP, error)));
	};
}

// deprecated
export function undoCommand(machineId) {
	return (dispatch) => {
		dispatch(sendUndo(machineId));
		return gatewayClient
			.undo(machineId)
			.then((response) => dispatch(receiveUndo(response)))
			.catch((error) => dispatch(requestFailed(messageTypes.UNDO, error)));
	};
}

// deprecated
export function redoCommand(machineId) {
	return (dispatch) => {
		dispatch(sendRedo(machineId));
		return gatewayClient
			.redo(machineId)
			.then((response) => dispatch(receiveRedo(response)))
			.catch((error) => dispatch(requestFailed(messageTypes.REDO, error)));
	};
}

export function deleteMachine(machineId) {
	return (dispatch) => {
		dispatch(sendDeleteMachine(machineId));
		return gatewayClient
			.deleteMachine(machineId)
			.then(() => dispatch(receiveDeleteMachine(machineId)))
			.catch((error) => dispatch(requestFailed(messageTypes.MACHINE_DELETE, error)));
	};
}

export function saveProcessSettings(settings) {
	return (dispatch) => saveProcessSettingsAndDispatch(settings, dispatch);
}

export function getDataStores() {
	return (dispatch) => {
		dispatch({
			type: ActionTypes.FETCH_STREAMS,
		});
		const scope = store.getState().user.user.scope;
		return gatewayClient.loadAllDSConfigurations(scope).then((response) => {
			// const { session } = response;
			// localStorage.setItem('user', JSON.stringify(session.user));
			// sessionStorage.setItem('sessionId', session ? session.id : '');
			dispatch(receiveStreams(response.response));
		});
	};
}

export function hideFunctionWizard() {
	return (dispatch) => {
		dispatch(putAppState({ functionWizard: { show: false } }));
	};
}

export function showFunctionWizard(options = {}) {
	return (dispatch) => {
		_getDataStores(dispatch).then(() => dispatch(putAppState({ functionWizard: { show: true, ...options } })));
	};
}

export function getMetaInformation() {
	return (dispatch) => getMetaInformationAndDispatch(dispatch);
}

export function saveMachineAs(originalMachineId, newMachineName) {
	return (dispatch) => {
		dispatch({ type: ActionTypes.SEND_MACHINE_SAVE_AS });
		return gatewayClient.saveMachineAs(originalMachineId, newMachineName).then((response) => {
			if (response.success) {
				dispatch({
					type: ActionTypes.RECEIVE_MACHINE_SAVE_AS,
					newMachineName: response.clonedMachine.name,
				});
			} else {
				dispatch(requestFailed(messageTypes.MACHINE_SAVE_AS, response));
			}
		});
	};
}

export function cloneMachine(originalMachineId) {
	return async (dispatch) => {
		dispatch({ type: ActionTypes.SEND_MACHINE_CLONE });
		const response = await gatewayClient.cloneMachine(originalMachineId);
		dispatch({ type: ActionTypes.RECEIVE_MACHINE_CLONE, response });
		return response;
	};
}

// export function saveMachineCopy(originalMachineId, newName) {
// 	return (dispatch) => {
// 		dispatch({ type: ActionTypes.SEND_MACHINE_SAVE_COPY });
// 		return gatewayClient.saveMachineCopy(originalMachineId, newName)
// 			.then(() => dispatch({ type: ActionTypes.RECEIVE_MACHINE_SAVE_COPY }));
// 	};
// }

export function showErrorDialog(titleId, messageId) {
	return (dispatch) => {
		dispatch(putAppState({ errorDialog: { open: true, titleId, messageId } }));
	};
}

export function subscribeNewsletter(user) {
	return () =>
		fetch(`${CONFIG.restEndpointURL}/newsletter/subscribe`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(user),
		});
}
