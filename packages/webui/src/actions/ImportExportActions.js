import * as ActionTypes from '../constants/ActionTypes';
import store from '../store';

export const closeImportDialog = () => ({ type: ActionTypes.HIDE_IMPORT_DIALOG });
export const showStartImportDialog = () => ({ type: ActionTypes.SHOW_START_IMPORT });
export const showImport = (data) => ({ type: ActionTypes.SHOW_IMPORT, data });
export const notifyExportFailed = (data) => ({ type: ActionTypes.SEND_EXPORT_ERROR, data });

export function showImportDialog(importData) {
	const user = store.getState().user.user;
	const rights = user ? user.rights : [];
	const allowedImportData = {
		machines: rights.includes('machine.edit') ? importData.machines : [],
		streams: rights.includes('stream') ? importData.streams : []
	};

	store.dispatch(showImport(allowedImportData));
}