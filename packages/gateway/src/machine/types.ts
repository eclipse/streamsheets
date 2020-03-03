import { ID, Scope } from '../streamsheets';

export interface Machine {
	id: ID;
	state: 'running' | 'stopped' | 'paused';
	isTemplate?: boolean;
	scope?: Scope;
	name: string;
	streamsheets: StreamSheet[];
}

export interface Cell {
	formula?: string;
	references?: string[];
}

export interface Graph {
	id: ID;
	machineId: ID;
	graphdef: any;
}

export interface StreamSheet {
	id: ID;
	inbox: {
		id: ID;
		stream: {
			id: ID;
			name: string;
		};
	};
	sheet: {
		cells: { [key: string]: Cell };
	};
}
