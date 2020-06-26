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
import * as Actions from '../constants/ActionTypes';
import {accessManager} from '../helper/AccessManager';

const defaulUserState = {
	rights: [],
	user: undefined,
	fetching: false,
};

export default function userReducer(state = defaulUserState, action) {
	switch (action.type) {
		case Actions.RECEIVE_USER_LEFT: {
			const { user, logout } = action.event;
			let localUser = null;
			try {
				localUser = JSON.parse(localStorage.getItem('user'));
			} catch (e) {
				localUser = state.user;
			}
			if((!user && logout) || (!localUser && logout) || (user.id === localUser.id && logout)) {
				accessManager.logoutUI(true);
			}
			return {
				...state,
			};
		}
	case Actions.RECEIVE_MACHINE_LOAD:
		return {
			...state,
		};
	case Actions.USER_FETCH: {
		return {
			...state,
			fetching: true,
		};
	}
	case Actions.USER_LOGIN_RESPONSE: {
		const loginResponse = action.response;
		return {
			...state,
			user: (loginResponse && loginResponse.user && loginResponse.user.username) ?
				{ ...loginResponse.user } : { ...state.user },
		};
	}
	case Actions.USER_FETCHED: {
		const user = (Array.isArray(action.user)) ? action.user[0] : action.user;
		const scope = user.scopes.find(s => s.id === user.scope.id);
		return {
			...state,
			rights: scope ? scope.rights : [],
			user: { ...user },
			fetching: false,
		};
	}
	case Actions.USER_SET_SCOPE: {
		const scope = state.user.scopes.find(s => s.id === action.data);
		return {
			...state,
			rights: scope ? scope.rights : [],
			user: {
				...state.user,
				scope: { id: action.data }
			}
		};
	}
	case Actions.USER_SETTING_SET: {
		const settings = Object.assign({}, action.settings);
		settings.locale = action.settings.locale || state.user.settings.locale;
		settings.debug = typeof action.settings.debug === 'undefined' || action.settings.debug === null ?
			state.user.settings.debug : action.settings.debug;
		return {
			...state,
			user: {
				...state.user,
				settings,
			},
		};
	}
	default:
		return state;
	}
}
