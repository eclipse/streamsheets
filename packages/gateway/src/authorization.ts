/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
import { FunctionObject, PartialApply1All, FunctionObjectObject } from './common';
import { GenericRequestContext, RequestContext, Scope } from './streamsheets';
import { User } from './user';

export interface BaseAuth extends FunctionObject, UserAuth {}
export interface Authorization {
	isAdmin(user: User): boolean;
	isValidScope(scope: Scope): boolean;
	isInScope(scope: Scope, withScope: { scope?: Scope }): boolean;
}

export const createAuthorization = <APIS extends FunctionObjectObject, AUTH extends FunctionObject>(
	rawAuth: AUTH,
	context: GenericRequestContext<APIS, AUTH>
) =>
	Object.entries(rawAuth).reduce(
		(obj, [name, func]) => ({
			...obj,
			[name]: (...args: any[]) => func(context, ...args)
		}),
		{}
	) as PartialApply1All<AUTH>;

const isAdmin = (context: RequestContext, user: User) => true;
const isValidScope = ({ actor, auth }: RequestContext, scope: Scope) => {
	if (!scope) {
		throw new Error('MISSING_SCOPE');
	}
	return true;
};

const isInScope = (context: RequestContext, scope: Scope, withScope: { scope?: Scope }) =>
	scope.id === withScope.scope?.id;

export const UserAuth = {
	isAdmin,
	isValidScope,
	isInScope,
};

export const baseAuth: BaseAuth = Object.assign({}, UserAuth) as BaseAuth;

export type UserAuth = typeof UserAuth;
