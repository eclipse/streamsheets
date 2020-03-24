import { FunctionObject, PartialApply1All } from '../common';
import { ID, RequestContext, Scope } from '../streamsheets';
import { User, UserSettings } from './types';

export interface UserApi extends FunctionObject {
	findUser(context: RequestContext, id: ID): Promise<User | null>;
	findAllUsers(context: RequestContext): Promise<User[]>;
	findByScope(context: RequestContext, scope: Scope): Promise<User[]>;
	countByScope(context: RequestContext, scope: Scope): Promise<number>;
	createUser(context: RequestContext, user: User): Promise<User>;
	updateUser(context: RequestContext, id: ID, userUpdate: Partial<User>): Promise<User>;
	updateSettings(context: RequestContext, id: ID, settingsUpdate: Partial<UserSettings>): Promise<User>;
	updatePassword(context: RequestContext, id: ID, password: string): Promise<boolean>;
	deleteUser(context: RequestContext, id: ID): Promise<boolean>;
}
export type UserApiApplied = PartialApply1All<UserApi>;

export const UserApi: UserApi = {
	findUser: async ({ auth, userRepo }, id) => {
		const user = await userRepo.findUser(id);
		if (user) {
			auth.verifyUser('view', user);
		}
		return user;
	},
	findAllUsers: async ({ userRepo, auth, actor }) => {
		if (auth.rights().includes('user.view')) {
			return userRepo.findAllUsers();
		}
		const self = await userRepo.findUser(actor.id);
		return self ? [self] : [];
	},
	findByScope: async ({ userRepo, auth, actor }: RequestContext, scope) => {
		if (auth.rights().includes('user.view')) {
			return userRepo.findByScope(scope);
		}
		if (auth.isValidScope(scope)) {
			const self = await userRepo.findUser(actor.id);
			if (self && auth.isInScope(scope, self)) {
				return [self];
			}
		}
		return [];
	},
	countByScope: async ({ userRepo, auth, actor }: RequestContext, scope) => {
		if (auth.rights().includes('user.view')) {
			return userRepo.countByScope(scope);
		}
		return 0;
	},
	createUser: async ({ userRepo, auth }, user) => userRepo.createUser(user, () => auth.verifyUser('create', user)),
	updateUser: async ({ userRepo, auth }, id, userUpdate) =>
		userRepo.updateUser(id, userUpdate, (user: User) => auth.verifyUser('update', user)),
	updateSettings: async ({ userRepo, auth }, id, settingsUpdate) =>
		userRepo.updateSettings(id, settingsUpdate, (user: User) => auth.verifyUser('update', user)),
	updatePassword: async ({ userRepo, auth }, id, password) =>
		userRepo.updatePassword(id, password, (user: User) => auth.verifyUser('update', user)),
	deleteUser: async ({ userRepo, auth }, id) =>
		userRepo.deleteUser(id, (user: User) => auth.verifyUser('delete', user))
};
