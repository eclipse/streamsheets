import { ID } from '../streamsheets';
import { Stream } from '../stream';
import { Machine } from '../machine';

export type MachineWithGraph = {
	machine: Machine;
	graph: {
		id: ID;
		machineId: ID;
		graphdef: any;
	};
};

export type ExportImportData = {
	version: 2;
	machines: Array<MachineWithGraph>;
	streams: Array<Stream>;
};
