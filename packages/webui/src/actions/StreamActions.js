import StreamHelper from '../helper/StreamHelper';
import * as ActionTypes from '../constants/ActionTypes';
import * as messageTypes from '../constants/WebsocketMessageTypes';

const requestFailed = (type, error) => ({ type: messageTypes.REQUEST_FAILED, request: type, error });

export async function executeStreamCommand(cmd) {
	return async (dispatch) => {
		dispatch({ type: 'STREAM_COMMAND_REQUEST', configType: type });
		return StreamHelper.executeStreamCommand(cmd);
	};
}

export function fetchAllConfigurationsByType(type) {
	return (dispatch) => {
		dispatch({ type: `FETCH_${type}S_FETCHING`, configType: type });
		return StreamHelper.findAllByType(type)
			.then((configs) => {
				dispatch({ type: `FETCH_${type}S_FULFILLED`, configType: type, payload: configs.slice(0) });
			})
			.catch((err) => {
				dispatch({ type: `FETCH_${type}S_REJECTED`, configType: type, payload: err });
			});
	};
}

export function setConfigurationSaved() {
	return (dispatch) => {
		dispatch({
			type: 'SAVING_FULFILLED',
		});
	};
}
export function saveConfiguration(configuration) {
	return async (dispatch) => {
		dispatch({
			type: 'SAVING_PENDING',
		});
		try {
			const resp = await StreamHelper.save(configuration);
			const { result } = resp.response;
			if (!result.error) {
				dispatch({
					type: 'SAVING_FULFILLED',
					configType: configuration.className,
					payload: resp,
				});
			} else {
				dispatch({
					type: ActionTypes.STREAM_SAVING_ERROR,
					configType: configuration.className,
					payload: {
						config: configuration,
						result
					},
				});
			}
			return resp;
		} catch(error) {
			dispatch({
				type: ActionTypes.STREAM_SAVING_ERROR,
				configType: configuration.className,
				payload: error,
			});
			return {error};
		}
	};
}
export function reloadAllStreams(sources) {
	return (dispatch) => {
		dispatch({ type: ActionTypes.STREAMS_RELOAD_REQUEST, sources });
		StreamHelper.reloadAllOnMachineServer(sources)
			.then((res) => {
				dispatch({ type:  ActionTypes.STREAMS_RELOAD_RESPONSE, response: res });
			})
			.catch((error) => {
				dispatch(requestFailed(messageTypes.STREAMS_RELOAD, error));
				dispatch({type:  ActionTypes.STREAMS_RELOAD_ERROR, error, sources})
			});
	};
}
export function undoStream() {
	return (dispatch) => {
		dispatch({ type: 'UNDO', payload: {} });
	};
}

export function setConfiguration(config) {
	return (dispatch) => {
		dispatch({ type: ActionTypes.STREAM_SET_CONFIG, configuration: config });
	};
}

export function setInitialConfiguration(config) {
	return (dispatch) => {
		dispatch({ type: ActionTypes.STREAM_INITIAL_SET, config });
	};
}

export function toggleStreamProgress(stream) {
	return (dispatch) => {
		dispatch({ type: ActionTypes.DS_TOGGLE_PROGRESS, stream });
	};
}
export function createNewConfiguration(newConfiguration, configType) {
	return (dispatch) => {
		dispatch({ type: `${configType}_NEW_CONFIG`, configType, payload: newConfiguration });
	};
}
export function updateConfiguration(model, type) {
	return (dispatch) => {
		dispatch({ type: `${type}_UPDATE`, configType: type, payload: Object.assign({}, model) });
	};
}
export function setConfigurationActive(id, type) {
	return (dispatch) => {
		dispatch({
			type: `${type}_SET_ACTIVE`,
			configType: type,
			payload: {
				id,
				type,
			},
		});
	};
}
export function setPageSelected(id) {
	return (dispatch) => {
		dispatch({
			type: 'SELECT_PAGE',
			payload: id,
		});
	};
}

export function toggleDialogAddConfiguration(event) {
	return (dispatch) => {
		dispatch({ type: 'TOGGLE_ADD_CONFIG_DIALOG', payload: event });
	};
}

export function setDeleteDialogOpen(val) {
	return (dispatch) => {
		dispatch({ type: 'SET_DELETE_DIALOG_OPEN', payload: val });
	};
}

export function controlEventsReset() {
	return (dispatch) => {
		dispatch({ type: ActionTypes.STREAM_CONTROL_CLEAN });
	};
}

export function deleteActiveConfiguration(id) {
	return (dispatch) =>
		new Promise(async (resolve, reject) => {
			try {
				const response = await StreamHelper.remove(id);
				dispatch({
					type: 'DS_DELETE_ACTIVE',
					payload: {
						id,
						response
					},
				});
				return resolve(response);
			} catch (e) {
				dispatch({ type: 'DELETING_ERROR', id, payload: e });
				return reject(e);
			}
		})
}

