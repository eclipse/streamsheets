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
import { Stream } from '../stream';
import { ExportImportData } from './types';

const filterRejected = (promises: Promise<any>[]) =>
	promises.reduce(async (pResults, p) => {
		const results = await pResults;
		try {
			const result = await p;
			return [...results, result];
		} catch (e) {
			return results;
		}
	}, Promise.resolve([]));

const findMissingConnectors = (streamIds: ID[], streamsToExport: Stream[]): ID[] =>
	Array.from(
		new Set(
			streamsToExport
				.map((stream) => stream.connector && stream.connector.id)
				.filter((id) => id && !streamIds.includes(id))
		)
	) as ID[];

const doExport = async (
	{ repositories, api }: RequestContext,
	scope: Scope,
	machines: ID[],
	streams: ID[]
): Promise<ExportImportData> => {
	const { graphRepository } = repositories;
	const exportData: ExportImportData = {
		version: 2,
		machines: [],
		streams: []
	};

	if (Array.isArray(machines) && machines.length > 0) {
		const pendingMachines = machines.map(async (machineId) => {
			const result = await Promise.all([
				api.machine.findMachine(scope, machineId),
				graphRepository.findGraphByMachineId(machineId)
			]);
			return {
				machine: { ...result[0], state: 'stopped' },
				graph: result[1]
			};
		});
		exportData.machines = await filterRejected(pendingMachines);
	}

	if (Array.isArray(streams) && streams.length > 0) {
		const allStreams = await api.stream.findAllStreams(scope);
		const streamsToExport = allStreams.filter((s) => streams.includes(s.id));
		const missingConnectorIds = findMissingConnectors(streams, streamsToExport);
		const allStreamsToExport = [...streams, ...missingConnectorIds];
		exportData.streams = allStreams.filter((s) => allStreamsToExport.includes(s.id));
		exportData.streams.forEach((stream) => {
			// TODO: Should not be part of the result.
			delete stream.status;
		});
	}
	return exportData;
};

export const ExportApi = {
	doExport
};
