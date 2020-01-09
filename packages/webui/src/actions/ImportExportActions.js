import * as ActionTypes from '../constants/ActionTypes';
import gatewayClient from '../helper/GatewayClient';
import store from '../store';
import { updateMachines } from './MachineActions';
import { accessManager, RESOURCE_ACTIONS, RESOURCE_TYPES } from '../helper/AccessManager';

const fetchExistingEntities = (data) => ({ type: ActionTypes.FETCH_EXISTING, data });
const receiveExistingEntities = (data) => ({ type: ActionTypes.RECEIVE_EXISTING, data });

const sendExportError = (data) => ({ type: ActionTypes.SEND_EXPORT_ERROR, data });

const sendImport = () => ({ type: ActionTypes.SEND_IMPORT });
const sendImportMachineSuccess = (data) => ({
	type: ActionTypes.SEND_IMPORT_MACHINE_SUCCESS,
	data,
});
const sendImportMachineError = (data) => ({ type: ActionTypes.SEND_IMPORT_MACHINE_ERROR, data });
const sendImportSuccess = (data) => ({ type: ActionTypes.SEND_IMPORT_SUCCESS, data });
const sendImportError = (data) => ({ type: ActionTypes.SEND_IMPORT_ERROR, data });
const hideImportDialog = () => ({ type: ActionTypes.HIDE_IMPORT_DIALOG });
const showStartImport = () => ({ type: ActionTypes.SHOW_START_IMPORT });
const importUpdateMachineSelection = (machineId, value) => ({
	type: ActionTypes.IMPORT_UPDATE_MACHINE_SELECTION,
	data: { machineId, value },
});
const importUpdateStreamSelection = (streamId, value) => ({
	type: ActionTypes.IMPORT_UPDATE_STREAM_SELECTION,
	data: { streamId, value },
});

export function notifyExportFailed() {
	store.dispatch(sendExportError());
}

export function showImportDialog(importData) {
	return async (dispatch) => {
		const allowedImportData = {
			machines: accessManager.can(RESOURCE_TYPES.MACHINE, RESOURCE_ACTIONS.CREATE) ? importData.machines : [],
			streams: accessManager.can(RESOURCE_TYPES.STREAM, RESOURCE_ACTIONS.CREATE)
				? importData.streams
				: [],
		};

		dispatch(fetchExistingEntities(allowedImportData));
		const { machines } = await gatewayClient.graphql(
			`{
				machines {
					  name
					  id
				}
			}`,
		);
		const result = await gatewayClient.loadAllDSConfigurations();
		dispatch(
			receiveExistingEntities({
				existingMachines: machines,
				existingStreams: result.response.streams,
			}),
		);
	};
}

export function closeImportDialog() {
	store.dispatch(hideImportDialog());
}

export function showStartImportDialog() {
	store.dispatch(showStartImport());
}

export function updateMachineSelection(machineId, value) {
	store.dispatch(importUpdateMachineSelection(machineId, value));
}

export function updateStreamSelection(streamId, value) {
	store.dispatch(importUpdateStreamSelection(streamId, value));
}

export function importMachinesAndStreams() {
	return async (dispatch, getState) => {
		const {
			importData: { machines, streams },
			upgradedMachines,
			machineSelection,
			streamSelection,
		} = getState().import;

		dispatch(sendImport());

		const importMachineDefinition = async (definition, importAsNew) => {
			const machineId = definition.machine.id;
			const isUpgrade = upgradedMachines.includes(machineId) && !importAsNew;
			if (isUpgrade) {
				await gatewayClient.unloadMachine(machineId);
			}
			try {
				const result = await gatewayClient.importMachineDefinition(definition, importAsNew);
				if (!result.imported) {
					dispatch(sendImportMachineError({ id: machineId }));
				} else {
					dispatch(
						sendImportMachineSuccess({
							id: machineId,
							newId: result.id,
							name: result.name,
						}),
					);
				}
			} catch (error) {
				console.error(error);
				dispatch(sendImportMachineError({ id: machineId, error }));
			}
		};

		try {
			const pendingMachines = machines
				.filter((d) => !!machineSelection[d.machine.id])
				.map((d) => importMachineDefinition(d, machineSelection[d.machine.id] === 2));

			const producersConsumers = [];
			const connectors = [];
			streams
				.filter((stream) => !!streamSelection[stream.id])
				.forEach((stream) => {
					if (stream.connector) {
						producersConsumers.push(stream);
					} else {
						connectors.push(stream);
					}
				});
			const allStreams = [...connectors, ...producersConsumers];
			await gatewayClient.saveDSConfiguration(allStreams);
			await Promise.all([...pendingMachines]);
			dispatch(sendImportSuccess());
		} catch (error) {
			console.error(error);
			dispatch(sendImportError(error));
		}
		updateMachines();
	};
}
