const { InternalError } = require('../errors');
const Auth = require('./UserAuth');

const UserApi = {
	findUser: async (userRepo, actor, id) => {
		const user = await userRepo.findUser(id);
		if (user) {
			Auth.verifyView(actor, user);
		}
		return user;
	},
	findAllUsers: async (userRepo, actor) => {
		if (Auth.isAdmin(actor)) {
			return userRepo.findAllUsers();
		}
		return [await userRepo.findUser(actor.id)];
	},
	createUser: async (userRepo, actor, user) =>
		userRepo.createUser(user, () => {
			Auth.verifyCreate(actor, user);
		}),
	updateUser: async (userRepo, actor, id, userUpdate) =>
		userRepo.updateUser(id, userUpdate, (existingUser) => {
			Auth.verifyUpdate(actor, existingUser);
		}),
	updateSettings: async (userRepo, actor, id, settingsUpdate) =>
		userRepo.updateSettings(id, settingsUpdate, (existingUser) => {
			Auth.verifyUpdate(actor, existingUser);
		}),
	updatePassword: async (userRepo, actor, id, password) =>
		userRepo.updatePassword(id, password, (existingUser) => {
			Auth.verifyUpdate(actor, existingUser);
		}),
	deleteUser: async (userRepo, actor, id) =>
		userRepo.deleteUser(id, (existingUser) => {
			Auth.verifyDelete(actor, existingUser);
		})
};

const create = (userRepo, actor) =>
	Object.entries(UserApi).reduce(
		(obj, [name, func]) => ({
			...obj,
			[name]: InternalError.catchUnexpected((...args) => func(userRepo, actor, ...args))
		}),
		{}
	);

module.exports = {
	create
};
