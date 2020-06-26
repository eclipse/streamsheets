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
import { RequestContext, Scope, ID } from '../streamsheets';
import { Machine, Graph } from './types';
import { LoggerFactory } from '@cedalo/logger';
const logger = LoggerFactory.createLogger('MachineApi', process.env.STREAMSHEETS_LOG_LEVEL || 'info');

export interface MachineApi {
	findMachine(scope: Scope, machineId: ID): Promise<Machine | null>;
	findMachines(scope: Scope): Promise<Machine[]>;
	findMachinesByName(scope: Scope, name: string): Promise<Machine[]>;
	delete(scope: Scope, id: ID): Promise<any>;
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
			const query = scope ? { 'scope.id': scope.id } : null;
			const machine: Machine | null = await machineRepo.findMachine(machineId, query);
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
		{ machineRepo, repositories }: RequestContext,
		scope: Scope,
		machine: Machine,
		graph?: Graph
	) => {
		await machineRepo.saveOrUpdateMachine(machine.id, { ...machine, scope });
		if (graph) {
			await repositories.graphRepository.saveOrUpdateGraph(graph.id, graph);
		}
	},
	delete: async ({ api, machineRepo, repositories }: RequestContext, scope: Scope, id: ID) => {
		const machine = await api.machine.findMachine(scope, id);
		if (machine) {
			return Promise.all([machineRepo.deleteMachine(id), repositories.graphRepository.deleteGraphByMachineId(id)]);
		}
	},
	unload: async ({ machineServiceProxy, api }: RequestContext, scope: Scope, machineId: ID) => {
		const machine = await api.machine.findMachine(scope, machineId);
		if (!machine) {
			return { unloaded: true };
		}
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
	start: async ({ machineServiceProxy, api }: RequestContext, scope: Scope, machineId: ID) => {
		const machine = await api.machine.findMachine(scope, machineId);
		if (machine) {
			const result = await machineServiceProxy.start(machineId);
			return result;
		}
	},
	pause: async ({ machineServiceProxy, api }: RequestContext, scope: Scope, machineId: ID) => {
		const machine = await api.machine.findMachine(scope, machineId);
		if (machine) {
			const result = await machineServiceProxy.pause(machineId);
			return result;
		}
	}
};
