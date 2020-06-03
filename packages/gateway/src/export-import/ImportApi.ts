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
import { RequestContext, ID, Scope } from '../streamsheets';
import { ExportImportData, MachineWithGraph } from './types';
import IdGenerator from '@cedalo/id-generator';
import { Stream } from '../stream';
import { Cell } from '../machine';
import { LoggerFactory } from '@cedalo/logger';
const logger = LoggerFactory.createLogger('ImportApi', process.env.STREAMSHEETS_LOG_LEVEL || 'info');

export interface ImportInfo {
	machines: MachineImportInfo[];
	streams: StreamImportInfo[];
}

export interface MachineImportInfo {
	id: ID;
	name: string;
}

export interface StreamImportInfo {
	id: ID;
	name: string;
}

export type ImportSelection = {	
	id: ID;
	connectorId?: ID;
	newName: string;
};

const fixName = (name: string, existingNames: Set<string>, delimiter = ' ', count = 1): string => {
	const newName = `${name}${delimiter}${count}`;
	return existingNames.has(newName) ? fixName(name, existingNames, delimiter, count + 1) : newName;
};

// const fixName2 = (name: string, existingNames: Set<string>, countDelimiter = ' ', count = 1): string => {
// 	if (!existingNames.has(name)) {
// 		return name;
// 	}
// 	const newName = `${name}${countDelimiter}${count}`;
// 	return existingNames.has(newName) ? fixName2(name, existingNames, countDelimiter, count + 1) : newName;
// };

// const fixStreamName = (name: string) => name.replace(' ', '_').replace(/[^a-zA-Z0-9_]/, '');

const fixStreamRefs = (cells: { [key: string]: Cell }, streamRenames: Map<string, string>) => {
	Object.values(cells).forEach((cell: any) => {
		const { references } = cell;
		if (references) {
			for (let i = 0; i < references.length; i += 1) {
				const oldRef = references[i];
				const oldName = oldRef.replace('|', '');
				const newName = streamRenames.get(oldName);
				if (newName) {
					const newRef = `|${newName}`;
					references[i] = newRef;
					cell.formula = cell.formula.replace(oldRef, newRef);
				}
				// Update namedCells?
			}
		}
	});
};

function mapBy<T extends object, X extends keyof T>(array: T[], key: X) {
	return new Map(array.map((e) => [e[key], e]));
}

const createConnectorImport = (connector: Stream, existing: Stream | null, name: string, oldNewIdMap: Map<ID, ID>) => {
	if (existing && existing.className !== 'ConnectorConfiguration') {
		return null;
	}
	const oldId = connector.id;
	const newId = existing ? existing.id : IdGenerator.generate();
	oldNewIdMap.set(oldId, newId);
	return { ...connector, id: newId, _id: newId, name: name };
};

const createStreamImport = ({
	stream,
	existing,
	name,
	connectorId,
	oldNewConnectorId,
	oldNewStreamId,
	oldNewStreamName
}: {
	stream: Stream;
	existing: Stream | null;
	name: string;
	connectorId: string | undefined;
	oldNewConnectorId: Map<ID, ID>;
	oldNewStreamId: Map<ID, ID>;
	oldNewStreamName: Map<string, string>;
}) => {
	if (existing && existing.className === 'ConnectorConfiguration') {
		return null;
	}
	const newConnectorId = connectorId ? connectorId : oldNewConnectorId.get(stream.connector!.id);
	if (!newConnectorId) {
		return null;
	}
	const oldId = stream.id;
	const newId = existing ? existing.id : IdGenerator.generate();
	oldNewStreamId.set(oldId, newId);
	oldNewStreamName.set(stream.name, name);
	return {
		...stream,
		id: newId,
		_id: newId,
		name,
		connector: { ...stream.connector, id: newConnectorId, _id: newConnectorId }
	};
};

const createMachineImport = ({
	mwg,
	existing,
	name,
	oldNewStreamId,
	oldNewStreamName
}: {
	mwg: MachineWithGraph;
	existing: MachineWithGraph | null;
	name: string;
	oldNewStreamId: Map<ID, ID>;
	oldNewStreamName: Map<string, string>;
}): MachineWithGraph => {
	const machineId = existing ? existing.machine.id : IdGenerator.generate();
	const graphId = existing ? existing.graph.id : IdGenerator.generate();
	const machine = {
		...mwg.machine,
		name,
		id: machineId,
		streamsheets: mwg.machine.streamsheets.map((s) => {
			const newId = s.inbox.stream && (oldNewStreamId.get(s.inbox.stream.id) || s.inbox.stream.id);
			const newName = s.inbox.stream && (oldNewStreamName.get(s.inbox.stream.name) || s.inbox.stream.name);
			const stream = newId && newName ? { id: newId, name: newName } : null;
			fixStreamRefs(s.sheet.cells, oldNewStreamName);
			return {
				...s,
				inbox: {
					...s.inbox,
					id: IdGenerator.generate(),
					stream
				}
			};
		})
	};
	const graph = {
		...mwg.graph,
		machineId,
		id: graphId
	};
	const toImport = { machine, graph } as MachineWithGraph;
	return toImport;
};

const doImport = async (
	{ repositories, api }: RequestContext,
	scope: Scope,
	importData: ExportImportData,
	machineSelection: ImportSelection[] = [],
	streamSelection: ImportSelection[] = []
) => {
	// Keep track of renames and re-ids
	const oldNewConnectorId = new Map<ID, ID>();
	const oldNewStreamId = new Map<ID, ID>();
	const oldNewStreamName = new Map<string, string>();

	// Pick the selected machines/streams/connectors from the importData
	const streamsConnetorsToImportById = mapBy(importData.streams, 'id');
	const machinesToImportById = new Map(importData.machines.map((mg) => [mg.machine.id, mg]));

	const streamsConnectorsToImport = streamSelection
		.map((s) => ({ ...s, stream: streamsConnetorsToImportById.get(s.id) }))
		.filter(({ stream }) => !!stream) as Array<ImportSelection & { stream: Stream }>;
	const machinesToImport = machineSelection
		.map((s) => ({ ...s, mwg: machinesToImportById.get(s.id) }))
		.filter(({ mwg }) => !!mwg) as Array<ImportSelection & { mwg: MachineWithGraph }>;

	const connnectorsToImport = streamsConnectorsToImport.filter(
		(s) => s.stream.className === 'ConnectorConfiguration'
	);
	const streamsToImport = streamsConnectorsToImport.filter((s) => s.stream.className !== 'ConnectorConfiguration');

	// Prepare imports.
	// Failures are ignored.
	const newConnectors = (await Promise.all(
		connnectorsToImport.map(async (selection) => {
			try {
				const existing = await api.stream.findByName(scope, selection.newName);
				return createConnectorImport(selection.stream, existing, selection.newName, oldNewConnectorId);
			} catch (error) {
				logger.info(`Failed to prepare import! Connector#${selection.id}(${selection.newName})`, error.message);
				return null;
			}
		})
	).then((connectors) => connectors.filter((c) => c !== null))) as Stream[];

	const newStreams = (await Promise.all(
		streamsToImport.map(async (selection) => {
			try {
				const existing = await api.stream.findByName(scope, selection.newName);
				const stream = createStreamImport({
					stream: selection.stream,
					existing,
					name: selection.newName,
					connectorId: selection.connectorId,
					oldNewConnectorId,
					oldNewStreamId,
					oldNewStreamName
				});
				if (stream && !stream.providerId) {
					const connectorId = stream.connector.id;
					const connector =
						newConnectors.find((c) => c.id === connectorId) ||
						(await api.stream.findById(scope, connectorId));
					if (!connector) {
						return null;
					}
					return { ...stream, providerId: connector.provider!.id };
				}
				return stream;
			} catch (error) {
				logger.info(`Failed to prepare import! Stream#${selection.id}(${selection.newName})`, error.message);
				return null;
			}
		})
	).then((streams) => streams.filter((s) => s !== null))) as Stream[];

	const newMachines = (await Promise.all(
		machinesToImport.map(async (selection) => {
			try {
				const [existingMachine] = await api.machine.findMachinesByName(scope, selection.newName);
				const existing = existingMachine
					? {
							machine: existingMachine,
							graph: await repositories.graphRepository.findGraphByMachineId(existingMachine.id)
					  }
					: null;
				return createMachineImport({
					mwg: selection.mwg,
					existing,
					name: selection.newName,
					oldNewStreamId,
					oldNewStreamName
				});
			} catch (error) {
				logger.info(`Failed to prepare import! Machine#${selection.id}(${selection.newName})`, error.message);
				return null;
			}
		})
	).then((mwgs) => mwgs.filter((mwg) => mwg !== null))) as MachineWithGraph[];

	const successfulStreamImports: string[] = [];
	const successfulMachineImports: string[] = [];

	// Do the import!
	await Promise.all(
		newConnectors.map(async (c) => {
			try {
				logger.info(`Importing Connector#${c.id}(${c.name})`);
				await api.stream.saveStream(scope, c);
				successfulStreamImports.push(c.name);
			} catch (error) {
				logger.info(`Connector import failed! Connector#${c.id}`, error.message);
			}
		})
	);
	await Promise.all(
		newStreams.map(async (s) => {
			try {
				logger.info(`Importing Stream#${s.id}(${s.name})`);
				await api.stream.saveStream(scope, s);
				successfulStreamImports.push(s.name);
			} catch (error) {
				logger.info(`Stream import failed! Stream#${s.id}`, error.message);
			}
		})
	);
	await Promise.all(
		newMachines.map(async ({ machine, graph }) => {
			try {
				const { state } = await api.machine.unload(scope, machine.id);
				logger.info(`Importing Machine#${machine.id}(${machine.name}) Graph#${graph.id}`);
				await api.machine.saveOrUpdate(scope, machine, graph);
				successfulMachineImports.push(machine.name);
				try {
					// Load and Start/Pause machines that were running before import
					if (state === 'running') {
						await api.machine.load(scope, machine.id);
						await api.machine.start(scope, machine.id);
					} else if (state === 'paused') {
						await api.machine.load(scope, machine.id);
						await api.machine.pause(scope, machine.id);
					}
				} catch (error) {
					logger.info(`Start/Pause after Machine import failed! Machine#${machine.id}`, error.message);
				}
			} catch (error) {
				logger.info(`Machine import failed! Machine#${machine.id} Graph#${graph.id}`, error.message);
			}
		})
	);
	return {
		machines: successfulMachineImports,
		streams: successfulStreamImports
	};
};

const getImportInfo = async ({ repositories }: RequestContext, scope: Scope, importInfo: ImportInfo) => {
	const machineNameList: Array<string> = await repositories.machineRepository.getNames(scope);
	const streamNamesList: Array<string> = await repositories.streamRepositoryLegacy.getNames(scope);
	const machineNames = new Set(machineNameList);
	const streamNames = new Set(streamNamesList);

	const machineInfos = importInfo.machines.map((m) => ({
		id: m.id,
		nameInUse: machineNames.has(m.name),
		proposedName: m.name
	}));
	machineInfos.filter((info) => !info.nameInUse).forEach((info) => machineNames.add(info.proposedName));
	for (const info of machineInfos) {
		if (info.nameInUse) {
			info.proposedName = fixName(info.proposedName, machineNames);
			machineNames.add(info.proposedName);
		}
	}
	const streamInfos = importInfo.streams.map((m) => ({
		id: m.id,
		nameInUse: streamNames.has(m.name),
		proposedName: m.name
	}));
	streamInfos.filter((info) => !info.nameInUse).forEach((info) => streamNames.add(info.proposedName));
	for (const info of streamInfos) {
		if (info.nameInUse) {
			info.proposedName = fixName(info.proposedName, streamNames, '_');
			streamNames.add(info.proposedName);
		}
	}

	return {
		machines: machineInfos,
		streams: streamInfos
	};
};

export const ImportApi = {
	getImportInfo,
	doImport
};
