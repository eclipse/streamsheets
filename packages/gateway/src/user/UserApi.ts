import { InternalError } from '../errors';

export const UserApi: IUserApi = {
	findUser: async (userRepo: UserRepository, auth: Auth, actor: Actor, id: ID) => {
		const user = await userRepo.findUser(id);
		if (user) {
			auth.verifyViewUser(actor, user);
		}
		return user;
	},
	findAllUsers: async (userRepo: UserRepository, auth: Auth, actor: Actor) => {
		if (auth.isAdmin(actor)) {
			return userRepo.findAllUsers();
		}
		const self = await userRepo.findUser(actor.id);
		return self ? [self] : [];
	},
	createUser: async (userRepo: UserRepository, auth: Auth, actor: Actor, user: User) =>
		userRepo.createUser(user, () => {
			auth.verifyCreateUser(actor, user);
		}),
	updateUser: async (userRepo: UserRepository, auth: Auth, actor: Actor, id: ID, userUpdate: Partial<User>) =>
		userRepo.updateUser(id, userUpdate, (user: User) => {
			auth.verifyUpdateUser(actor, user);
		}),
	updateSettings: async (
		userRepo: UserRepository,
		auth: Auth,
		actor: Actor,
		id: ID,
		settingsUpdate: Partial<UserSettings>
	) =>
		userRepo.updateSettings(id, settingsUpdate, (user: User) => {
			auth.verifyUpdateUser(actor, user);
		}),
	updatePassword: async (userRepo: UserRepository, auth: Auth, actor: Actor, id: ID, password: string) =>
		userRepo.updatePassword(id, password, (user: User) => {
			auth.verifyUpdateUser(actor, user);
		}),
	deleteUser: async (userRepo: UserRepository, auth: Auth, actor: Actor, id: ID) =>
		userRepo.deleteUser(id, (user: User) => {
			auth.verifyDeleteUser(actor, user);
		})
};

export const create = (userRepo: UserRepository, getAuth: () => Auth, actor: Actor): UserApiApplied =>
	<UserApiApplied>Object.entries(UserApi).reduce(
		(obj, [name, func]) => ({
			...obj,
			[name]: InternalError.catchUnexpected((...args: any[]) =>
				func(userRepo, getAuth(), actor, args[0], args[1])
			)
		}),
		{}
	);

module.exports = {
	create,
	UserApi
};
