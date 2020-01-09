import * as ActionTypes from '../constants/ActionTypes';

const defaultImportDataState = {
	showStartImportDialog: false,
	open: false,
	isFetching: false,
	importData: {
		streams: [],
		machines: [],
	},
	machineRenames: new Map(),
	streamRenames: new Map(),
	upgradedMachines: [],
	upgradedstreams: [],
	successfulMachineImports: {},
	failedMachineImports: {},
	isImporting: false,
	importDone: false,
	machineSelection: {}, // 0: Don't import, 1: Import, 2: Import and assign new ID
	streamSelection: {},
};

const fixName = (name, existingNames, countDelimiter = ' ', count = 1) => {
	if (!existingNames.has(name)) {
		return name;
	}
	const newName = `${name}${countDelimiter}${count}`;
	return existingNames.has(newName) ? fixName(name, existingNames, countDelimiter, count + 1) : newName;
};

const isNameConflict = ({ name, id }, existing) => {
	const idOfExisting = existing[name];
	return !!(idOfExisting && idOfExisting !== id);
};

const fixStreamName = (name) => name.replace(' ', '_').replace(/[^a-zA-Z0-9_]/, '');

const isOldStreamName = ({ name, className }) =>
	className && className !== 'Machine' && fixStreamName(name) !== name;

const resolveNameConflicts = (data, existing, countDelimiter) => {
	const nameIdMap = existing.reduce((obj, { name, id }) => ({ ...obj, [name]: id }), {});
	const otherNames = data.map(({ name }) => name);
	const renames = new Map();
	data.forEach((entity) => {
		const oldStreamName = isOldStreamName(entity);
		if (isNameConflict(entity, nameIdMap) || oldStreamName) {
			const oldName = entity.name;
			const newName_ = isOldStreamName ? fixStreamName(oldName) : oldName;
			const newName = fixName(newName_, new Set([...otherNames, ...Object.keys(nameIdMap)]), countDelimiter);
			entity.name = newName;
			renames.set(entity.id, { old: oldName, new: newName, id: entity.id });
		}
		nameIdMap[entity.name] = entity.id;
	});
	return renames;
};

const findVersionUpgrades = (data, existing) =>
	data.reduce((acc, { id }) => {
		const withSameId = existing.find((e) => e.id === id);
		return withSameId ? [...acc, withSameId.id] : acc;
	}, []);

const fixReference = (streamRef, streamRenames) => {
	const rename = streamRef && streamRef.id && streamRenames.get(streamRef.id);
	if (rename) {
		streamRef.name = rename.new;
		return rename;
	}
	return undefined;
};

const fixstreamReferences = (machinesImportData, streamRenames) => {
	machinesImportData
		.map(({ machine }) => machine)
		.forEach((machine) => {
			machine.streamsheets.forEach((streamsheet) => {
				fixReference(streamsheet.inbox.stream, streamRenames);
				Object.values(streamsheet.sheet.cells).forEach((cell) => {
					const rename = cell.stream && fixReference(cell.stream, streamRenames);
					if (rename) {
						cell.formula = cell.formula.replace(`"${rename.old}"`, `|${rename.new}`);
						delete cell.stream;
						machine.namedCells = machine.namedCells || {};
						machine.namedCells[`|${rename.new}`] = {
							value: {
								id: rename.id,
								name: rename.new,
								type: 'stream',
							},
							type: 'object',
							level: 0,
						};
					}
				});
			});
		});
};

export default function importDataReducer(state = defaultImportDataState, action) {
	switch (action.type) {
		case ActionTypes.SHOW_START_IMPORT:
			return {
				...state,
				showStartImportDialog: true,
			};
		case ActionTypes.FETCH_EXISTING:
			return {
				...state,
				importData: action.data,
				isFetching: true,
			};
		case ActionTypes.RECEIVE_EXISTING: {
			if (!state.isFetching) {
				return state;
			}
			const { existingMachines, existingStreams } = action.data;

			const machineRenames = resolveNameConflicts(
				state.importData.machines.map((importDataMachine) => importDataMachine.machine),
				existingMachines,
			);
			const streamRenames = resolveNameConflicts(state.importData.streams, existingStreams, '_');

			fixstreamReferences(state.importData.machines, streamRenames);

			const upgradedMachines = findVersionUpgrades(
				state.importData.machines.map((importDataMachine) => importDataMachine.machine),
				existingMachines,
			);

			const upgradedStreams = findVersionUpgrades(state.importData.streams, existingStreams);

			const { machines, streams } = state.importData;

			const machineSelection = machines.map((importDataMachine) => importDataMachine.machine).reduce((obj, m) => ({ ...obj, [m.id]: 1 }), {});

			const streamSelection = streams.reduce((obj, s) => ({ ...obj, [s.id]: 1 }), {});

			return {
				...state,
				open: true,
				showStartImportDialog: false,
				isFetching: false,
				upgradedMachines,
				upgradedStreams,
				machineRenames,
				streamRenames,
				machineSelection,
				streamSelection,
			};
		}

		case ActionTypes.IMPORT_UPDATE_STREAM_SELECTION: {
			const { streamId, value } = action.data;
			const stream = state.importData.streams.find((s) => s.id === streamId);
			const isConnector = stream && !!stream.provider;
			const alsoUnselectConsumersProducers = isConnector && value === 0;
			const dependentConsumersProducersSelection = alsoUnselectConsumersProducers
				? state.importData.streams.reduce(
						(obj, s) =>
							s.connector && s.connector.id === streamId ? { ...obj, [s.id]: value } : obj,
						{},
				  )
				: {};
			const isConsumerProducer = stream && !!stream.connector;
			const alsoUnselectConnector = isConsumerProducer && value !== 0;
			const dependentConnector =
				alsoUnselectConnector && state.importData.streams.find((s) => s.id === stream.connector.id);
			const dependentConnectorSelection = dependentConnector ? { [dependentConnector.id]: 1 } : {};

			return {
				...state,
				streamSelection: {
					...state.streamSelection,
					...dependentConnectorSelection,
					...dependentConsumersProducersSelection,
					[streamId]: value,
				},
			};
		}
		case ActionTypes.IMPORT_UPDATE_MACHINE_SELECTION:
			return {
				...state,
				machineSelection: {
					...state.machineSelection,
					[action.data.machineId]: action.data.value,
				},
			};
		case ActionTypes.SEND_IMPORT:
			return { ...state, isImporting: true };
		case ActionTypes.SEND_IMPORT_SUCCESS:
			return { ...state, isImporting: false, importDone: true };
		case ActionTypes.SEND_IMPORT_ERROR:
			return { ...state, isImporting: false, importDone: true };
		case ActionTypes.HIDE_IMPORT_DIALOG:
			return defaultImportDataState;
		case ActionTypes.SEND_IMPORT_MACHINE_SUCCESS: {
			const { name, id, newId } = action.data;
			const importedMachine = state.importData.machines.find((d) => d.machine.id === id);
			const machineRenames =
				importedMachine.machine.name !== name
					? new Map([
							...state.machineRenames.entries(),
							[action.data.id, { old: importedMachine.machine.name, new: name }, action.data.name],
					  ])
					: state.machineRenames;
			state.importData.machines = state.importData.machines.map((d) => {
				if (d.machine.id === id) {
					return { ...d, machine: { ...d.machine, name } };
				}
				return d;
			});
			return {
				...state,
				machineRenames,
				successfulMachineImports: {
					...state.successfulMachineImports,
					[id]: newId,
				},
			};
		}
		case ActionTypes.SEND_IMPORT_MACHINE_ERROR:
			return {
				...state,
				failedMachineImports: {
					...state.failedMachineImports,
					[action.data.id]: action.data.id,
				},
			};

		default:
			return state;
	}
}
