/* eslint-disable no-unused-vars */
import { RequestContext } from '../streamsheets';
import { User } from '../user';

export type UserAction = 'create' | 'delete' | 'view' | 'update';

const isAdmin = (context: RequestContext, user: User) => user.id === '00000000000000';
const isSelf = ({ actor }: RequestContext, user: User) => actor.id === user.id;
const rights = ({ actor, auth }: RequestContext) =>
	auth.isAdmin(actor)
		? ['machine.view', 'machine.edit', 'stream', 'user.edit', 'user.view', 'database']
		: ['machine.view', 'machine.edit', 'stream'];
const userCan = ({ actor, auth }: RequestContext, action: UserAction, user: User): boolean => {
	switch (action) {
		case 'create':
			return auth.isAdmin(actor);
		case 'view':
			return auth.isAdmin(actor) || auth.isSelf(user);
		case 'update':
			return auth.isAdmin(actor) || auth.isSelf(user);
		case 'delete':
			return !auth.isAdmin(user) && (auth.isAdmin(actor) || auth.isSelf(user));
		default:
			return false;
	}
};

export const UserAuth = {
	isAdmin,
	isSelf,
	rights,
	userCan
};
