import { saveAs } from 'file-saver';
import * as ActionTypes from '../constants/ActionTypes';
import gatewayClient from '../helper/GatewayClient';

const sendRestoreSuccess = () => ({
	type: ActionTypes.SEND_RESTORE_SUCCESS
});
const sendRestoreError = (data) => ({ type: ActionTypes.SEND_RESTORE_ERROR, data });

const backupFileName = () => {
	const now = new Date();
	return `streamsheets_backup_${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}.json`;
};

export function backup() {
	return async () => {
		const response = await gatewayClient.backup();
		const blob = new Blob([JSON.stringify(response)], {
			type: 'text/plain;charset=utf8;'
		});
		saveAs(blob, backupFileName());
	};
}

export function restore(file) {
	return async (dispatch) => {
		try {
			const { restored, message = '' } = await gatewayClient.restore(file);
			if (restored) {
				dispatch(sendRestoreSuccess());
			} else {
				dispatch(sendRestoreError(message));
				throw message;
			}
		} catch (error) {
			dispatch(sendRestoreError(error));
			throw error;
		}
	};
}
