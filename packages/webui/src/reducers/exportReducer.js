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
import { LOCATION_CHANGE } from 'react-router-redux';
import * as ActionTypes from '../constants/ActionTypes';
import * as SetHelper from '../helper/SetHelper';

const defaultState = {
	selectedMachines: new Set(),
};

export default function exportReducer(state = defaultState, action) {
	switch (action.type) {
		case LOCATION_CHANGE: {
			const { pathname } = action.payload;
			if (pathname.startsWith('/export')) {
				const [, , machineId] = pathname.split('/');
				return {
					...state,
					selectedMachines: new Set(machineId ? [machineId] : []),
				};
			}
			return state;
		}
		case ActionTypes.EXPORT_SELECT_MACHINES:
			return {
				...state,
				selectedMachines: SetHelper.addAll(state.selectedMachines, action.data),
			};
		case ActionTypes.EXPORT_DESELECT_MACHINES:
			return {
				...state,
				selectedMachines: SetHelper.deleteAll(state.selectedMachines, action.data),
			};
		case ActionTypes.EXPORT_TOGGLE_MACHINE:
			return {
				...state,
				selectedMachines: SetHelper.toggle(state.selectedMachines, action.data),
			};
		case ActionTypes.EXPORT_RESET:
			return defaultState;
		default:
			return state;
	}
}
