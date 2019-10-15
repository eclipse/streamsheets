const { GraphQLServer } = require('./src/GraphQLServer');
const { resolvers } = require('./src/resolvers');
const { createUserRepository } = require('./src/UserRepository');

module.exports = {
	GraphQLServer,
	createUserRepository,
	resolvers
};
