import { PartialApply1All } from '../common';
import { ID, RequestContext, Session } from '../streamsheets';
import { User, UserSettings } from './types';
import { InputError, AuthError } from '../..';
import Auth from '../Auth';

export type UserApiApplied = PartialApply1All<UserApi>;

export type UserApi = typeof UserApi;

export const UserApi = {
	findUserBySession: async ({ userRepo }: RequestContext, session: Session) => {
		return userRepo.findUser(session.user.id);
	},
	findUser: async ({ userRepo }: RequestContext, id: ID) => {
		return userRepo.findUser(id);
	},
	findAllUsers: async ({ userRepo }: RequestContext) => {
		return userRepo.findAllUsers();
	},
	createUser: async ({ userRepo }: RequestContext, user: User & { password: string }) => userRepo.createUser(user),
	updateSettings: async ({ userRepo }: RequestContext, id: ID, settingsUpdate: Partial<UserSettings>) =>
		userRepo.updateSettings(id, settingsUpdate),
	updatePassword: async ({ userRepo }: RequestContext, id: ID, password: string) =>
		userRepo.updatePassword(id, password),
	deleteUser: async ({ userRepo }: RequestContext, id: ID) => {
		if (id === '00000000000000') {
			throw AuthError.notAllowed('Cannot delete admin!');
		}
		userRepo.deleteUser(id);
	}
};
