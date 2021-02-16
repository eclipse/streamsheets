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
	experimental: false,
	deviceRatio: true,
	drawerOpen: false,
	showStreamChartProperties: false,
	showImportDialog: false,
	showNewDialog: false,
	showOpenDialog: false,
	showInboxSettings: false,
	showSaveAsDialog: false,
	showMachineDataDialog: false,
	showFormatCellsDialog: false,
	showDeleteCellContentDialog: false,
	showInsertCellContentDialog: false,
	showPasteFunctionsDialog: false,
	functionWizard: { show: false },
	showTools: true,
	viewMode: {
		hidegrid: null,
		hideheader: null,
		view: null,
		viewMode: null,
		zoomdisabled: null
	},
	showEditNamesDialog: false,
	formatOpen: false,
	formulaOpen: false,
	notificationsOpen: false,
	openMoreSettingMenu: false,
	openHelp: false,
	openSettings: false,
	openPreferences: false,
	debug: false,
	page: '/',
	addStreamDialogOpen: false,
	popupMenuE: null,
	streamDeleteDialog: { open: false },
	showDeleteMachineDialog: false,
	showDeleteSheetDialog: false,
	adminSelectedPage: 'connectors',
	lastDefinedJSONRange: null,
	errorDialog: { open: false }
};

export default function appReducer(state = defaultState, action) {
	switch (action.type) {
		case ActionTypes.SET_APP_STATE:
			return {
				...state,
				...action.newState
			};
		case 'SET_DELETE_DIALOG_OPEN': {
			return { ...state, streamDeleteDialog: action.payload };
		}
		case 'DS_DELETE_ACTIVE': {
			return { ...state, streamDeleteDialog: { open: false} };
		}
		case 'ERROR': {
			return { ...state, error: action.payload };
		}
		default:
			return state;
	}
}
