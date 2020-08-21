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
const path = require('path');
const { ArrayUtil } = require('@cedalo/util');
const graphqlFields = require('graphql-fields');
const { GraphQLJSONObject } = require('graphql-type-json');
const fs = require('fs').promises;
const { Payload } = require('./Payload');

const MACHINE_DATA_DIR = process.env.MACHINE_DATA_DIR || './machinedata';

const rights = ['machine.view', 'machine.edit', 'stream', 'database', 'user.view'];
const rootScope = { id: 'root', name: 'Root', rights };

const streamToBuffer = async (stream) => {
	return new Promise((resolve) => {
		const chunks = [];
		stream.on('data', (chunk) => chunks.push(chunk));
		stream.on('end', () => {
			const buffer = Buffer.concat(chunks);
			resolve(buffer);
		});
	});
};

const streamClassNameToType = {
	ProducerConfiguration: 'producer',
	ConsumerConfiguration: 'consumer'
};

const mapConnector = (c) => ({
	id: c.id,
	name: c.name,
	provider: c.provider.id,
	type: 'connector'
});

const resolvers = {
	ScopedQuery: {
		machine: async (obj, args, { api }) => {
			return api.machine.findMachine(obj.scope, args.id);
		},
		machines: async (obj, args, { api }) => {
			return args.name
				? api.machine.findMachinesByName(obj.scope, args.name)
				: api.machine.findMachines(obj.scope);
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
					type: streamClassNameToType[s.className],
					provider: s.providerId
				}));
			return streams;
		},
		connectors: async (obj, args, { api }) => {
			const allConfigs = await api.stream.findAllStreams(obj.scope);
			const connectors = allConfigs.filter((c) => c.className === 'ConnectorConfiguration').map(mapConnector);
			return connectors;
		},
		export: async (obj, args, { api }) => {
			const exportData = await api.export.doExport(obj.scope, args.machines, args.streams);

			if (args.machines.length > 0 && exportData.machines.length === 0) {
				return {
					data: null,
					success: false,
					code: 'MACHINE_NOT_FOUND',
					message: 'Could not export the specified machine'
				};
			}

			return {
				data: exportData,
				success: true,
				code: 'EXPORT_SUCCESS',
				message: 'Export succeded'
			};
		},
		getImportInfo: async ({ scope }, { input }, { api }) => {
			return api.import.getImportInfo(scope, input);
		},
		providers: async ({ scope }, args, { api }) => api.stream.providers(scope)
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
		},
		validateStream: async (obj, args, { api }) =>
			api.stream.validateStream(args.provider, args.type, args.streamConfig)
	},
	Mutation: {
		createUser: async (obj, { user }, { api, encryption }) => {
			try {
				const hashedPassword = await encryption.hash(user.password);
				const createdUser = await api.user.createUser({
					...user,
					password: hashedPassword
				});
				return Payload.createSuccess({
					code: 'USER_CREATED',
					message: 'User created successfully',
					user: createdUser
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
		},
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
		},
		renameMachineFile: async (obj, args, { machineRepo, auth }) => {
			const { machineId, oldName, newName } = args;
			const { scope } = await machineRepo.findMachine(machineId);
			if (!auth.isValidScope(scope)) {
				throw new Error('NOT_ALLOWED');
			}
			const oldMachineFile = path.join(MACHINE_DATA_DIR, machineId, path.basename(oldName));
			const newMachineFile = path.join(MACHINE_DATA_DIR, machineId, path.basename(newName));
			try {
				await fs.rename(oldMachineFile, newMachineFile);
				return Payload.createSuccess({
					code: 'FILE_RENAMED',
					message: 'File renamed successfully',
					name: newName,
					oldName
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		},
		deleteMachineFile: async (obj, args, { machineRepo, auth }) => {
			const { machineId, name } = args;
			const { scope } = await machineRepo.findMachine(machineId);
			if (!auth.isValidScope(scope)) {
				throw new Error('NOT_ALLOWED');
			}
			const machineFile = path.join(MACHINE_DATA_DIR, machineId, path.basename(name));
			try {
				await fs.unlink(machineFile);
				return Payload.createSuccess({
					code: 'FILE_DELETED',
					message: 'File deleted successfully',
					name
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		}
	},
	ScopedMutation: {
		import: async ({ scope }, { input, file }, { api }) => {
			try {
				const stream = (await file).createReadStream();
				const buffer = await streamToBuffer(stream);
				const importData = JSON.parse(buffer.toString());
				await api.import.doImport(scope, importData, input.machines, input.streams);
				return Payload.createSuccess({
					code: 'IMPORT_SUCCESS',
					message: 'Import machines and streams successfully'
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		},
		cloneMachine: async ({ scope }, { machineId, newName }, { api }) => {
			try {
				const suffix = 'Copy';
				const exportData = await api.export.doExport(scope, [machineId], []);
				const machine = exportData.machines[0].machine;
				const importInfo = await api.import.getImportInfo(scope, {
					machines: [{ id: machineId, name: newName || `${machine.name} ${suffix}` }],
					streams: []
				});
				const proposedName = importInfo.machines[0].proposedName;
				const result = await api.import.doImport(scope, exportData, [{ id: machineId, newName: proposedName }]);
				const machines = await api.machine.findMachinesByName(scope, result.machines[0]);
				return Payload.createSuccess({
					code: 'CLONE_SUCCESS',
					message: 'Machine cloned successfully',
					clonedMachine: machines[0]
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		}
	},
	Inbox: {
		stream: async (obj, args, context, info) => {
			const additionalFields =
				Object.keys(graphqlFields(info)).filter((fieldName) => !['name', 'id'].includes(fieldName)).length > 0;
			const stream =
				obj.stream && additionalFields
					? await context.api.stream.findById(info.variableValues.scope, obj.stream.id)
					: obj.stream;
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
	User: {
		scope: () => rootScope,
		scopes: () => [rootScope],
		rights: () => rights,
		displayName: (user) => user.username,
		admin: () => true,
		canDelete: (user) => user.id !== '00000000000000'
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
		canEdit: async () => true
	},
	MachineMetadata: {
		lastModified: (obj) => new Date(obj.lastModified).getTime()
	},
	ImportExportData: GraphQLJSONObject,
	JSON: GraphQLJSONObject,
};

module.exports = { resolvers };
