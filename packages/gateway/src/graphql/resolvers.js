const path = require('path');
const { InternalError } = require('../errors');
const { ArrayUtil } = require('@cedalo/util');
const graphqlFields = require('graphql-fields');
const { GraphQLJSONObject } = require('graphql-type-json');
const fs = require('fs').promises;

const MACHINE_DATA_DIR = process.env.MACHINE_DATA_DIR || './machinedata';

const INTERNAL_ERROR_PAYLOAD = {
	success: false,
	code: 'INTERNAL_ERROR',
	message: 'An internal server error occured'
};

const Payload = {
	createFailure: (error) => {
		if (InternalError.isInternal(error)) {
			return INTERNAL_ERROR_PAYLOAD;
		}
		return { ...error, success: false };
	},
	createSuccess: (payload) => ({ ...payload, success: true })
};

const streamClassNameToType = {
	ProducerConfiguration: 'producer',
	ConsumerConfiguration: 'consumer'
};

const filterRejected = (promises) =>
	promises.reduce(async (pResults, p) => {
		const results = await pResults;
		try {
			const result = await p;
			return [...results, result];
		} catch (e) {
			return results;
		}
	}, Promise.resolve([]));

const findMissingConnectors = (streamIds, streamsToExport) =>
	Array.from(
		new Set(
			streamsToExport
				.map((stream) => stream.connector && stream.connector.id)
				.filter((id) => !!id)
				.filter((id) => !streamIds.includes(id))
		)
	);

const mapConnector = (c) => ({
	id: c.id,
	name: c.name,
	provider: c.provider.id,
	type: 'connector'
});

const resolvers = {
	ScopedQuery: {
		machine: async (obj, args, { api }) => {
			return api.machine.findMachine(args.id);
		},
		machines: async (obj, args, { repositories, api }) => {
			const { machineRepository } = repositories;
			return args.name ? machineRepository.findMachinesByName(args.name) : api.machine.findMachines(obj.scope);
		},
		streamsLegacy: async (obj, args, { api }) => api.stream.findAllStreams(obj.scope),
		streams: async (obj, args, { api }) => {
			const allConfigs = await api.stream.findAllStreams(obj.scope);
			const connectors = allConfigs
				.filter((c) => c.className === 'ConnectorConfiguration')
				.reduce((map, c) => ({ ...map, [c.id]: mapConnector(c) }), {});
			const streams = allConfigs
				.filter((s) => ['ConsumerConfiguration', 'ProducerConfiguration'].includes(s.className))
				.map((s) => ({
					id: s.id,
					name: s.name,
					connector: connectors[s.connector.id],
					type: streamClassNameToType[s.className]
				}));
			return streams;
		},
		connectors: async (obj, args, { api }) => {
			const allConfigs = await api.stream.findAllStreams(obj.scope);
			const connectors = allConfigs.filter((c) => c.className === 'ConnectorConfiguration').map(mapConnector);
			return connectors;
		},
		export: async (obj, args, { repositories, api }) => {
			const { machineRepository, graphRepository } = repositories;
			const { streams, machines } = args;
			const exportData = {
				machines: [],
				streams: []
			};
			
			if (Array.isArray(machines) && machines.length > 0) {
				const pendingMachines = machines.map(async (machineId) => {
					const result = await Promise.all([
						machineRepository.findMachine(machineId),
						graphRepository.findGraphByMachineId(machineId)
					]);
					return {
						machine: { ...result[0], state: 'stopped' },
						graph: result[1]
					};
				});
				exportData.machines = await filterRejected(pendingMachines);
				if (exportData.machines.length === 0) {
					return {
						data: null,
						success: false,
						code: 'MACHINE_NOT_FOUND',
						message: 'Could not export the specified machine'
					};
				}
			}

			if (Array.isArray(streams) && streams.length > 0) {
				const allStreams = await api.stream.findAllStreams(obj.scope);
				const streamsToExport = allStreams.filter((s) => streams.includes(s.id));
				const missingConnectorIds = findMissingConnectors(streams, streamsToExport);
				const allStreamsToExport = [...streams, ...missingConnectorIds];
				exportData.streams = allStreams.filter((s) => allStreamsToExport.includes(s.id));
				exportData.streams.forEach((stream) => {
					// TODO: Should not be part of the result.
					delete stream.status;
				});
			}

			return {
				data: exportData,
				success: true,
				code: 'EXPORT_SUCCESS',
				message: 'Export succeded'
			};
		}
	},
	Query: {
		me: async (obj, args, { actor }) => actor,
		user: async (obj, { id }, { api }) => {
			try {
				return api.user.findUser(id);
			} catch (error) {
				return null;
			}
		},
		users: async (obj, args, { api }) => api.user.findAllUsers(),
		scoped: async (obj, args, { auth }) => {
			if (!auth.isValidScope(args.scope)) {
				throw new Error('NOT_ALLOWED');
			}
			return { scope: args.scope };
		},
		scopedByMachine: async (obj, args, { machineRepo, auth }) => {
			const { scope } = await machineRepo.findMachine(args.machineId);
			if (!auth.isValidScope(scope)) {
				throw new Error('NOT_ALLOWED');
			}
			return { scope };
		}
	},
	Mutation: {
		createUser: async (obj, { user }, { api, encryption }) => {
			try {
				const hashedPassword = await encryption.hash(user.password);
				const createdUser = await api.user.createUser({ ...user, password: hashedPassword });
				return Payload.createSuccess({
					code: 'USER_CREATED',
					message: 'User created successfully',
					user: createdUser
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		},
		updateUser: async (obj, { id, user }, { api }) => {
			try {
				const updatedUser = await api.user.updateUser(id, user);
				return Payload.createSuccess({
					code: 'USER_UPDATED',
					message: 'User updated successfully',
					user: updatedUser
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		},
		updateUserPassword: async (obj, { id, newPassword }, { api, encryption }) => {
			try {
				const hashedPassword = await encryption.hash(newPassword);
				await api.user.updatePassword(id, hashedPassword);
				return Payload.createSuccess({
					code: 'PASSWORD_UPDATED',
					message: 'Password updated successfully'
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		},
		updateUserSettings: async (obj, { id, settings }, { api }) => {
			try {
				const updatedUser = await api.user.updateSettings(id, settings);
				return Payload.createSuccess({
					code: 'SETTINGS_UPDATED',
					message: 'Settings updated successfully',
					user: updatedUser
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		},
		deleteUser: async (obj, { id }, { api }) => {
			try {
				await api.user.deleteUser(id);
				return Payload.createSuccess({
					code: 'USER_DELETED',
					message: 'User deleted successfully'
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		}
	},
	User: {
		admin: async (obj, args, { auth }) => auth.isAdmin(obj),
		canDelete: async (obj, args, { auth }) => auth.userCan('delete', obj),
		rights: async (obj, args, { auth }) => auth.rights()
	},
	Inbox: {
		stream: async (obj, args, context, info) => {
			const additionalFields =
				Object.keys(graphqlFields(info)).filter((fieldName) => !['name', 'id'].includes(fieldName)).length > 0;
			const stream =
				obj.stream && additionalFields ? await context.api.stream.findById(info.variableValues.scope, obj.stream.id) : obj.stream;
			return stream !== null
				? {
						id: stream.id,
						name: stream.name,
						disabled: stream.dislabed || false,
						lastModified: stream.lastModified,
						owner: stream.owner,
						className: stream.className
				  }
				: null;
		}
	},
	Machine: {
		file: async (obj, args) => {
			const { id } = obj;
			const { name } = args;
			const machineFile = path.join(MACHINE_DATA_DIR, id, path.basename(name));
			try {
				const file = await fs.readFile(machineFile);
				return file.toString();
			} catch (error) {
				return null;
			}
		},
		files: async (obj) => {
			const { id } = obj;
			if (!id) {
				return [];
			}
			const machineFileDirectory = path.join(MACHINE_DATA_DIR, id);
			try {
				const files = await fs.readdir(machineFileDirectory);
				return files;
			} catch (error) {
				return [];
			}
		},
		referencedStreams: async (obj) => {
			const machine = obj;
			const referencedStreams = [].concat(
				...machine.streamsheets.map((t) => {
					const cells = Object.values(t.sheet.cells);
					const cellStreamRefs = ArrayUtil.flatten(
						cells.filter((c) => !!c.references).map((c) => c.references)
					)
						.filter((ref) => ref.startsWith('|'))
						.map((ref) => machine.namedCells[ref])
						.filter((stream) => stream !== undefined)
						.map((stream) => stream.value && stream.value.id);

					const inboxStream = t.inbox.stream;
					const inboxStreamRef = inboxStream && inboxStream.id ? [inboxStream.id] : [];
					return [...cellStreamRefs, ...inboxStreamRef];
				})
			);
			return ArrayUtil.unique(referencedStreams);
		},
		canEdit: async (obj, args, { auth }) => {
			return auth.machineCan('edit', obj);
		}
	},
	MachineMetadata: {
		lastModified: (obj) => new Date(obj.lastModified).getTime()
	},
	ImportExportData: GraphQLJSONObject
};

module.exports = { resolvers };
