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
import StreamHelper from '../helper/StreamHelper';
import * as messageTypes from '../constants/WebsocketMessageTypes';
import store from '../store';

const requestFailed = (type, error) => ({ type: messageTypes.REQUEST_FAILED, request: type, error });

export function executeStreamCommand(cmd) {
	return () => {
		const scope = store.getState().user.user.scope;
		return StreamHelper.executeStreamCommand(scope, cmd);
	};
}

export function saveConfiguration(configuration) {
	return async () => {
		try {
			const scope = store.getState().user.user.scope;
			const resp = await StreamHelper.save(scope, configuration);
			return resp;
		} catch (error) {
			return { error };
		}
	};
}
export function reloadAllStreams(sources) {
	return (dispatch) => {
		const scope = store.getState().user.user.scope;
		StreamHelper.reloadAllOnMachineServer(scope, sources)
			.catch((error) => {
				dispatch(requestFailed(messageTypes.STREAMS_RELOAD, error));
			});
	};
}

export function setDeleteDialogOpen(open, configId) {
	return (dispatch) => {
		dispatch({ type: 'SET_DELETE_DIALOG_OPEN', payload: {open, configId} });
	};
}

export function deleteActiveConfiguration(id) {
	return (dispatch) =>
		new Promise(async (resolve, reject) => {
			try {
				const scope = store.getState().user.user.scope;
				const response = await StreamHelper.remove(scope, id);
				dispatch({
					type: 'DS_DELETE_ACTIVE',
					payload: {
						id,
						response
					}
				});
				return resolve(response);
			} catch (e) {
				dispatch({ type: 'DELETING_ERROR', id, payload: e });
				return reject(e);
			}
		});
}
