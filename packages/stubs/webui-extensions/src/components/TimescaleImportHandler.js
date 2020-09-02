import gatewayClient from '@cedalo/webui/src/helper/GatewayClient';
import { readDroppedFile } from './helper';

const sendAction = async (machineId, type, data) => {
	const response = await gatewayClient.sendMachineAction(machineId, {
		// action unique type
		type,
		// action dependent data
		data
		// : {
		// 	table: 'table123',
		// 	data: ev.target.result
		// }
	});
	return response.machineserver.result;
}

const sendListTables = (machineId) => sendAction(machineId, 'timescale.action.listtables');
const sendImport = (machineId, data) => sendAction(machineId, 'timescale.action.import', data);

class TimescaleImportHandler {
	static async handleDrop(action = {}) {
		// machineId, sheetId, file) {
		try {
			const { machineId, sheetId, file } = action;
			// TODO: have to use useEffect and useState to encapsulate server request and redraw on response!
			const tables = await sendListTables(machineId);
			if (tables && tables.length) {
				// present tables TODO:
				const filedata = await readDroppedFile(file);
				const data = {
					sheetId,
					table: tables[0],
					data: filedata
				};
				const importdata = await sendImport(machineId, data);
				console.log('success', importdata);
			}
		} catch (err) {
			// TODO: present failure
			console.error(err);
		}
	}
}

export default TimescaleImportHandler;
