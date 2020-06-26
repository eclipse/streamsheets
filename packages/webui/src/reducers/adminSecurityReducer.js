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
