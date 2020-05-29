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

const defaultMachineState = {
	isFetching: false,
	data: {},
	receivedAt: 0,
};

export default function machineReducer(state = defaultMachineState, action) {
	switch (action.type) {
	case Actions.SEND_MACHINE_LOAD:
		return {
			...state,
			isFetching: true,
		};
	case Actions.RECEIVE_MACHINE_LOAD:
		return {
			...state,
			isFetching: false,
			// minToolbarPix: 800,
			data: action.data,
			id: action.response.machineserver.machine.id,
			isOPCUA: action.response.machineserver.machine.settings.isOPCUA,
			locale: action.response.machineserver.machine.settings.locale,
			receivedAt: action.receivedAt,
		};
	case Actions.RECEIVE_MACHINE_LOCALE:
		return {
			...state,
			locale: action.locale,
		};
	case Actions.RECEIVE_MACHINE_UPDATE_SETTINGS:
		return {
			...state,
			locale: action.settings.locale,
			isOPCUA: action.settings.isOPCUA,
		};
	default:
		return state;
	}
}
