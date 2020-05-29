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
import store from '../store';

export const closeImportDialog = () => ({ type: ActionTypes.HIDE_IMPORT_DIALOG });
export const showStartImportDialog = () => ({ type: ActionTypes.SHOW_START_IMPORT });
export const showImport = (data) => ({ type: ActionTypes.SHOW_IMPORT, data });
export const notifyExportFailed = (data) => ({ type: ActionTypes.SEND_EXPORT_ERROR, data });

export function showImportDialog(importData) {
	const rights = store.getState().user.rights;
	const allowedImportData = {
		machines: rights.includes('machine.edit') ? importData.machines : [],
		streams: rights.includes('stream') ? importData.streams : []
	};

	store.dispatch(showImport(allowedImportData));
}