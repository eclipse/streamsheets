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
const defaultState = {
	cellSelected: false,
	graphSelected: false,
	canUndo: false,
	canRedo: false,
};

export default function appReducer(state = defaultState, action) {
	switch (action.type) {
		case 'SET_JSG_STATE':
			return {
				...state,
				...action.data
			};
		default:
			return state;
	}
}
