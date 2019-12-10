const UserApi = require('./UserApi');
const UserAuth = require('./UserAuth');

const createApis = (repositories, actor) => ({
	user: UserApi.create(repositories.userRepository, actor)
});

module.exports = {
	UserApi,
	UserAuth,
	createApis
};
