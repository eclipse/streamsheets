/* eslint-disable no-unused-vars */
// import { Machine, RequestContext } from '../streamsheets';

export type MachineAction =
	| 'create'
	| 'delete'
	| 'view'
	| 'start'
	| 'pause'
	| 'stop'
	| 'step'
	| 'set_cycle_time'
	| 'set_cell'
	| 'set_cell_level'
	| 'set_locale'
	| 'set_sheet_order'
	| 'add_inbox_message'
	| 'clear_inbox'
	| 'clear_outbox'
	| 'add_sheet'
	| 'set_update_interval'
	| 'delete_sheet'
	| 'set_sheet_settings'
	| 'set_machine_settings'
	| 'rename'
	| 'edit_graph'
	| 'edit'
	| 'unload';

const machineCan = (/* context: RequestContext, action: MachineAction, machine: Machine */): boolean => true;

export const MachineAuth = {
	machineCan
};
