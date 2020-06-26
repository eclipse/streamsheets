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
/* eslint-disable import/prefer-default-export */
import * as ActionTypes from '../constants/ActionTypes';
import ConfigManager from '../helper/ConfigManager';
import gatewayClient from '../helper/GatewayClient';
import { accessManager } from '../helper/AccessManager';

const CONFIG = ConfigManager.config.gatewayClientConfig;

export function saveUserSettings(settings) {
	return async (dispatch, getState) => {
		dispatch({
			type: ActionTypes.USER_SETTINGS_SAVE
		});
		const { id } = getState().user.user;
		const mutation = `
		mutation UpdateUserSettings($id: ID!, $settings: UserSettingsInput!) {
			updateUserSettings(id: $id, settings: $settings) {
				success
				code
				fieldErrors {
					locale
				}
			}
		}
		`;

		try {
			await gatewayClient.graphql(mutation, { id, settings });
			dispatch({ type: ActionTypes.USER_SETTINGS_SAVED });
		} catch (error) {
			dispatch({ type: ActionTypes.ERROR, error });
		}
	};
}

export function setUserSettings(settings) {
	return (dispatch) => {
		dispatch({ type: ActionTypes.USER_SETTING_SET, settings });
	};
}

const doLogin = async (request, dispatch) => {
	dispatch({ type: ActionTypes.USER_LOGIN });
	try {
		await gatewayClient.connect(CONFIG);
		const resp = await gatewayClient.authenticate(request);
		dispatch({ type: ActionTypes.USER_LOGIN_RESPONSE, response: resp });
		return resp.response || resp;
	} catch (error) {
		dispatch({ type: ActionTypes.ERROR });
		return { error: error.error };
	}
};

export function login(credentials, redirect) {
	return (dispatch) =>
		doLogin(credentials, dispatch).then((response) => {
			if (!response.error && response.token) {
				accessManager.loginUI(response.token, redirect);
				return true;
			}
			return response;
		});
}
export function pathLogin(pathname) {
	return (dispatch) => doLogin({ pathname }, dispatch);
}

const doLogout = async (token, dispatch) => {
	dispatch({ type: ActionTypes.USER_LOGOUT, token });
	try {
		await gatewayClient.connect({ ...CONFIG });
		gatewayClient.logout(token);
	} catch (err) {
		dispatch({ type: ActionTypes.ERROR, err });
		throw err;
	}
};

export function logout(token) {
	return async (dispatch) => {
		await doLogout(token, dispatch);
		accessManager.logoutUI();
	};
}
export function pathLogout(token) {
	return (dispatch) => doLogout(token, dispatch).catch((/* ignore */) => null);
}
