import * as ActionTypes from '../constants/ActionTypes';

const defaultState = {
	permissions: ['All'],
};

export default (state = defaultState, action) => {
	switch (action.type) {
		case ActionTypes.PERMISSIONS_SET: {
			return { ...state, permissions: action.permissions.slice() };
		}
		default: {
			return state;
		}
	}
};
