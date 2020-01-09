const { ApolloServer, gql } = require('apollo-server-express');
const { resolvers } = require('./resolvers');
const { createApis } = require('./apis');

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

	type StreamStatus {
		streamEventType: String
	}

	type StreamLegacy {
		id: ID!
		name: String!
		status: StreamStatus
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
		files: [String!]!
		file(name: String!): String
		metadata: MachineMetadata!
		streamsheets: [StreamSheet!]!
		referencedStreams: [ID!]!
	}

	type Stream {
		id: ID!
		name: String!
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

	type User {
		id: ID!
		username: String!
		email: String!
		firstName: String
		lastName: String
		lastModified: String!
		admin: Boolean!
		settings: UserSettings!
		canDelete: Boolean!
		rights: [String!]!
	}

	input UserInput {
		username: String!
		password: String!
		email: String!
		firstName: String
		lastName: String
	}

	input UpdateUserInput {
		username: String
		email: String
		firstName: String
		lastName: String
	}

	input UserSettingsInput {
		locale: Locale
	}

	type UserFieldErrors {
		username: String
		email: String
		password: String
	}

	type CreateUserPayload implements MutationResponse {
		success: Boolean!
		code: String!
		message: String!
		user: User
		fieldErrors: UserFieldErrors
	}

	type UpdateUserPayload implements MutationResponse {
		success: Boolean!
		code: String!
		message: String!
		user: User
		fieldErrors: UserFieldErrors
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

	type Query {
		machine(id: ID!): Machine
		machines(name: String): [Machine!]!
		me: User!
		user(id: ID!): User
		users: [User!]!
		streams: [Stream!]!
		connectors: [Connector!]!
		streamsLegacy: [StreamLegacy!]!
		export(machines: [ID!]!, streams:[ID!]!): ExportResult!
	}

	type Mutation {
		createUser(user: UserInput!): CreateUserPayload!
		updateUser(id: ID!, user: UpdateUserInput!): UpdateUserPayload!
		updateUserSettings(id: ID!, settings: UserSettingsInput!): UpdateUserSettingsPayload!
		updateUserPassword(id: ID!, newPassword: String!): UpdateUserPasswordPayload!
		deleteUser(id: ID!): DeleteUserPayload!
	}
`;

class GraphQLServer {
	static init(app, path, getSession, config) {
		const repositories = config.RepositoryManager;

		const server = new ApolloServer({
			typeDefs,
			resolvers,
			context: async ({ req }) => {
				const session = getSession(req);
				const actor = await repositories.userRepository.findUser(session.user.id);
				const apis = createApis(repositories, actor);
				return {
					actor,
					apis,
					encryption: config.encryption,
					repositories,
					session
				};
			}
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
