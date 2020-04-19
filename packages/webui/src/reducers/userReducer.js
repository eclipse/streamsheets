import * as Actions from '../constants/ActionTypes';
import {accessManager} from '../helper/AccessManager';

const defaulUserState = {
	user: undefined,
	fetching: false,
	saving: false,
	loginPending: false,
	loginResponse: undefined,
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
	case Actions.USER_LOGIN: {
		return {
			...state,
			loginPending: true,
		};
	}
	case Actions.USER_LOGIN_RESPONSE: {
		const loginResponse = action.response;
		return {
			...state,
			loginPending: false,
			loginResponse,
			user: (loginResponse && loginResponse.user && loginResponse.user.username) ?
				{ ...loginResponse.user } : { ...state.user },
		};
	}
	case Actions.USER_LOGOUT: {
		return {
			...state,
			loginPending: false,
			// loginResponse: action.response,
		};
	}
	case Actions.USER_SAVE: {
		return {
			...state,
			saving: true,
		};
	}
	case Actions.USER_FETCHED: {
		const user = (Array.isArray(action.user)) ? action.user[0] : action.user;
		return {
			...state,
			user: { ...user },
			fetching: false,
		};
	}
	case Actions.USER_SAVED: {
		const user = Object.assign({}, action.user);
		return {
			...state,
			user,
			saving: false,
		};
	}
	case Actions.USER_SET: {
		const user = Object.assign({}, action.user);
		user.settings.locale = action.user.locale;
		user.settings.debug = action.user.debug;
		return {
			...state,
			user,
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
