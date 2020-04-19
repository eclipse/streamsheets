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

	type StreamStatus {
		streamEventType: String
	}

	type Stream {
		id: ID!
		name: String!
		status: StreamStatus
		disabled: Boolean!
		className: String!
	}

	type StreamSheet {
		id: String!
		name: String!
	}

	type Machine {
		id: String!
		name: String!
		previewImage: String
		state: String!
		streamSheets: [StreamSheet!]!
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

	type Query {
		machines: [Machine!]!
		me: User!
		user(id: ID!): User
		users: [User!]!
		streams: [Stream]!
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
