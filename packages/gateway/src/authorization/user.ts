/* eslint-disable no-unused-vars */
import { RequestContext, Scope } from '../streamsheets';
import { User } from '../user';

export type UserAction = 'create' | 'delete' | 'view' | 'update';

const isAdmin = (context: RequestContext, user: User) => user.id === '00000000000000';
const isSelf = ({ actor }: RequestContext, user: User) => actor.id === user.id;
const isValidScope = ({ actor, auth }: RequestContext, scope: Scope) => {
	if (!scope) {
		throw new Error('MISSING_SCOPE');
	} else {
		return auth.isAdmin(actor) || actor.scope?.id === scope.id;
	}
};

const isInScope = (context: RequestContext, scope: Scope, withScope: { scope?: Scope }) =>
	scope.id === withScope.scope?.id;

const rights = ({ actor, auth }: RequestContext, user?: User) => {
	const target = user || actor;
	return auth.isAdmin(target)
		? ['machine.view', 'machine.edit', 'stream', 'user.edit', 'user.view', 'database']
		: ['machine.view', 'machine.edit', 'stream'];
};
const roles = ({ actor, auth }: RequestContext) => (auth.rights().includes('roles') ? ['developer'] : []);
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
	roles,
	isValidScope,
	userCan,
	isInScope
};
