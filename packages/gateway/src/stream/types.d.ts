import { ID, Scope } from '../streamsheets';

export interface Stream {
	id: ID;
	name: string;
	className: string;
	scope?: Scope;
	status?: string;
	connector?: {
		id: ID;
	};
}
