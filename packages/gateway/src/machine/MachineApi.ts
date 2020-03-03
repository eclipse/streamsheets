import { RequestContext, Scope, ID } from '../streamsheets';
import { Machine, Graph } from './types';
import { LoggerFactory } from '@cedalo/logger';
const logger = LoggerFactory.createLogger('MachineApi', process.env.STREAMSHEETS_LOG_LEVEL || 'info');

export interface MachineApi {
	findMachine(scope: Scope, machineId: ID): Promise<Machine | null>;
	findMachines(scope: Scope): Promise<Machine[]>;
	findMachinesByName(scope: Scope, name: string): Promise<Machine[]>;
	load(scope: Scope, id: ID): Promise<any>;
	unload(scope: Scope, id: ID): Promise<any>;
	start(scope: Scope, id: ID): Promise<any>;
	pause(scope: Scope, id: ID): Promise<any>;
	saveOrUpdate(scope: Scope, machine: Machine, graph?: Graph): Promise<any>;
}

export const BaseMachineApi = {
	findMachine: async ({ machineRepo, auth }: RequestContext, scope: Scope, machineId: string) => {
		const validScope = auth.isValidScope(scope);
		if (!validScope) {
			return null;
		}
		try {
			const machine: Machine | null = await machineRepo.findMachine(machineId);
			if (machine) {
				if (!auth.isInScope(scope, machine)) {
					return null;
				}
				await auth.verifyMachine('view', machine);
			}
			return machine;
		} catch (error) {
			if (error.code === 'MACHINE_NOT_FOUND') {
				return null;
			}
			throw error;
		}
	},
	findMachines: async ({ machineRepo, auth }: RequestContext, scope: Scope): Promise<Machine[]> => {
		const validScope = auth.isValidScope(scope);
		if (!validScope) {
			return [];
		}
		const query = scope ? { 'scope.id': scope.id } : null;
		const machines = await machineRepo.findMachines(query);
		return machines;
	},
	findMachinesByName: async (
		{ machineRepo, auth }: RequestContext,
		scope: Scope,
		name: string
	): Promise<Machine[]> => {
		const validScope = auth.isValidScope(scope);
		if (!validScope) {
			return [];
		}
		const query = scope ? { 'scope.id': scope.id, name } : null;
		const machines = await machineRepo.findMachines(query);
		return machines;
	},
	saveOrUpdate: async (
		{ auth, api, machineRepo, repositories }: RequestContext,
		scope: Scope,
		machine: Machine,
		graph?: Graph
	) => {
		const existingMachine = await api.machine.findMachine(scope, machine.id);
		if (existingMachine) {
			await auth.verifyMachine('edit', machine);
		}
		await machineRepo.saveOrUpdateMachine(machine.id, machine);
		if (graph) {
			await repositories.graphRepository.saveOrUpdateGraph(graph.id, graph);
		}
	},
	unload: async ({ auth, machineServiceProxy, api }: RequestContext, scope: Scope, machineId: ID) => {
		const machine = await api.machine.findMachine(scope, machineId);
		if (!machine) {
			return { unloaded: true };
		}
		await auth.verifyMachine('unload', machine);
		const result = await machineServiceProxy.unload(machineId);
		return { unloaded: result.unloaded, state: machine.state };
	},
	load: async ({ machineServiceProxy, api }: RequestContext, scope: Scope, machineId: ID) => {
		const machine = await api.machine.findMachine(scope, machineId);
		if (machine) {

			const result = await machineServiceProxy.load(machineId);
			return result;
		}
	},
	start: async ({ auth, machineServiceProxy, api }: RequestContext, scope: Scope, machineId: ID) => {
		const machine = await api.machine.findMachine(scope, machineId);
		if (machine) {
			await auth.verifyMachine('start', machine);
			const result = await machineServiceProxy.start(machineId);
			return result;
		}
	},
	pause: async ({ auth, machineServiceProxy, api }: RequestContext, scope: Scope, machineId: ID) => {
		const machine = await api.machine.findMachine(scope, machineId);
		if (machine) {
			await auth.verifyMachine('pause', machine);
			const result = await machineServiceProxy.pause(machineId);
			return result;
		}
	}
};
