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
const { ApolloServer, gql } = require('apollo-server-express');
const { resolvers } = require('./resolvers');

const typeDefs = gql`
	interface MutationResponse {
		success: Boolean!
		code: String!
		message: String!
	}

	enum Locale {
		en
		de
	}

	enum StreamType {
		consumer
		producer
	}

	scalar ImportExportData

	scalar JSON

	type StreamLegacy {
		id: ID!
		name: String!
		state: String!
		disabled: Boolean!
		className: String!
		lastModified: Float!
		owner: String
	}

	type StreamSheet {
		id: ID!
		name: String!
		inbox: Inbox!
		sheet: Sheet!
	}

	type Sheet {
		cells: [Cell!]!
	}

	type Cell {
		formula: String
		level: Int
		referenes: [String!]
	}

	type Inbox {
		id: ID!
		stream: Stream
	}

	type Machine {
		id: ID!
		name: String!
		previewImage: String
		titleImage: String
		state: String!
		metadata: MachineMetadata!
		streamsheets: [StreamSheet!]!
		referencedStreams: [ID!]!
		canEdit: Boolean
		files: [String!]!
		file(name: String!): String
		scope: Scope!
	}

	type Stream {
		id: ID!
		name: String!
		provider: ID!
		connector: Connector!
		type: StreamType!
	}

	type Connector {
		id: ID!
		name: String!
		provider: ID!
		type: String!
	}

	type MachineMetadata {
		lastModified: Float!
		owner: String
	}

	type UserSettings {
		locale: Locale!
	}

	type Scope {
		id: ID!
	}

	type UserScope {
		id: ID!
		rights: [String!]!
		name: String!
	}

	type User {
		id: ID!
		scope: UserScope
		scopes: [UserScope!]!
		username: String!
		displayName: String!
		lastModified: String!
		admin: Boolean!
		settings: UserSettings!
		canDelete: Boolean!
		rights: [String!]!
	}

	input UserSettingsInput {
		locale: Locale
	}

	type UserSettingsFieldErrors {
		locale: String
	}

	type UpdateUserSettingsPayload implements MutationResponse {
		success: Boolean!
		code: String!
		message: String!
		user: User
		fieldErrors: UserSettingsFieldErrors
	}

	type PasswordFieldErrors {
		password: String
	}

	input UserInput {
		username: String!
		password: String!
	}

	type UserFieldErrors {
		username: String
		password: String
	}

	type CreateUserPayload implements MutationResponse {
		success: Boolean!
		code: String!
		message: String!
		user: User
		fieldErrors: UserFieldErrors
	}

	type UpdateUserPasswordPayload implements MutationResponse {
		success: Boolean!
		code: String!
		message: String!
		fieldErrors: PasswordFieldErrors
	}

	type DeleteUserPayload implements MutationResponse {
		success: Boolean!
		code: String!
		message: String!
	}

	type ExportResult {
		data: ImportExportData
		success: Boolean!
		code: String!
		message: String!
	}

	type ImportInfo {
		machines: [ImportInfoEntry!]!
		streams: [ImportInfoEntry!]!
	}

	type ImportInfoEntry {
		id: ID!
		nameInUse: Boolean!
	}

	input ScopeInput {
		id: ID!
	}

	input ImportInfoInput {
		machines: [MachineImportInfoInput!]!
		streams: [StreamImportInfoInput!]!
	}

	input MachineImportInfoInput {
		id: ID!
		name: String!
	}

	input StreamImportInfoInput {
		id: ID!
		name: String!
	}

	input ImportInput {
		machines: [ImportSelection!]!
		streams: [ImportSelection!]!
	}

	input ImportSelection {
		id: ID!
		# replace: Boolean!
		connectorId: ID
		newName: String!
	}

	type StreamValidationResult {
		valid: Boolean!
		fieldErrors: JSON!
		fieldUpdates: JSON!
	}

	type ImportResult implements MutationResponse {
		success: Boolean!
		code: String!
		message: String!
	}

	type CloneResult implements MutationResponse {
		success: Boolean!
		code: String!
		message: String!
		clonedMachine: Machine
	}

	type RenameMachineFilePayload implements MutationResponse {
		success: Boolean!
		code: String!
		message: String!
		name: String
		oldName: String
	}

	type DeleteMachineFilePayload implements MutationResponse {
		success: Boolean!
		code: String!
		message: String!
		name: String
	}

	type ScopedQuery {
		machine(id: ID!): Machine
		machines(name: String): [Machine!]!
		streams: [Stream!]!
		connectors: [Connector!]!
		streamsLegacy: [StreamLegacy!]!
		export(machines: [ID!]!, streams: [ID!]!): ExportResult!
		getImportInfo(input: ImportInfoInput!): ImportInfo!
		providers: [String!]!
	}

	type ScopedMutation {
		import(input: ImportInput!, file: Upload!): ImportResult!
		cloneMachine(machineId: ID!, newName: String): CloneResult!
	}

	type Query {
		me: User!
		user(id: ID!): User
		users: [User!]!
		scoped(scope: ScopeInput!): ScopedQuery!
		scopedByMachine(machineId: ID!): ScopedQuery!
		validateStream(provider: String!, type: String!, streamConfig: JSON!): StreamValidationResult
	}

	type Mutation {
		createUser(user: UserInput!): CreateUserPayload!
		deleteUser(id: ID!): DeleteUserPayload!
		updateUserSettings(id: ID!, settings: UserSettingsInput!): UpdateUserSettingsPayload!
		updateUserPassword(id: ID!, newPassword: String!): UpdateUserPasswordPayload!
		scoped(scope: ScopeInput): ScopedMutation!
		scopedByMachine(machineId: ID!): ScopedMutation!
		renameMachineFile(machineId: ID!, oldName: String!, newName: String!): RenameMachineFilePayload!
		deleteMachineFile(machineId: ID!, name: String!): DeleteMachineFilePayload!
	}
`;

class GraphQLServer {
	static init(app, path, getContext, extension = {}) {
		const server = new ApolloServer({
			typeDefs: [typeDefs, ...Object.values(extension).map((e) => e.typeDefs)].filter((x) => !!x),
			resolvers: [resolvers, ...Object.values(extension).map((e) => e.resolvers)].filter((x) => !!x),
			context: async ({ req }) => getContext(req)
		});
		server.applyMiddleware({ app, path });
		return server;
	}
}

module.exports = {
	GraphQLServer,
	typeDefs,
	resolvers
};
