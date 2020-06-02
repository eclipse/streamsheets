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
import { createAuthorization } from './authorization';
import { FunctionObject, FunctionObjectObject, MappedFunctionObjectObject, PartialApply1All } from './common';
import { InternalError } from './errors';
import { ExportApi, ImportApi } from './export-import';
import { BaseMachineApi, MachineApi } from './machine';
import { BaseStreamApi, StreamApi } from './stream';
import { GenericGlobalContext, GenericRequestContext } from './streamsheets';
import { Actor, BaseUserApi, UserApi } from './user';

export const createApi = <APIS extends FunctionObjectObject, AUTH extends FunctionObject, API extends FunctionObject>(
	context: GenericRequestContext<APIS, AUTH>,
	rawApi: API
): PartialApply1All<API> =>
	Object.entries(rawApi).reduce(
		(obj, [name, func]) => ({
			...obj,
			[name]: InternalError.catchUnexpected((...args: any[]) => func(context, ...args))
		}),
		{}
	) as PartialApply1All<API>;

const createApis = <APIS extends FunctionObjectObject, AUTH extends FunctionObject>(
	rawApi: APIS,
	context: GenericRequestContext<APIS, AUTH>
): MappedFunctionObjectObject<APIS> =>
	Object.entries(rawApi).reduce(
		(acc, [key, value]) => ({ ...acc, [key]: createApi(context, value) }),
		{}
	) as MappedFunctionObjectObject<APIS>;

export interface Api {
	user: UserApi;
	machine: MachineApi;
	stream: StreamApi;
	export: PartialApply1All<typeof ExportApi>;
	import: PartialApply1All<typeof ImportApi>;
}
export interface RawAPI extends FunctionObjectObject {
	user: BaseUserApi;
	machine: typeof BaseMachineApi;
	stream: BaseStreamApi;
	export: typeof ExportApi;
	import: typeof ImportApi;
}

export const RawAPI = {
	user: BaseUserApi,
	machine: BaseMachineApi,
	stream: BaseStreamApi,
	export: ExportApi,
	import: ImportApi
};

export const glue = <
	AUTH extends FunctionObject,
	APIS extends FunctionObjectObject,
	T extends GenericGlobalContext<APIS, AUTH>
>(
	globalContext: T,
	actor: Actor
): GenericRequestContext<APIS, AUTH> => {
	const rawApi = globalContext.rawApi;
	const rawAuth = globalContext.rawAuth;
	const context = {
		...globalContext,
		actor
	} as Omit<GenericRequestContext<APIS, AUTH>, 'api' | 'auth'> &
		Partial<Pick<GenericRequestContext<APIS, AUTH>, 'api' | 'auth'>>;
	context.api = createApis(rawApi, context as GenericRequestContext<APIS, AUTH>);
	context.auth = createAuthorization(rawAuth, context as GenericRequestContext<APIS, AUTH>);
	return context as GenericRequestContext<APIS, AUTH>;
};
