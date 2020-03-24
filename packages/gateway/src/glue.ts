import { baseAuth, createAuthorization } from './authorization';
import { FunctionObject, PartialApply1All } from './common';
import { InternalError } from './errors';
import { ExportApi, ImportApi } from './export-import';
import { BaseMachineApi, MachineApi } from './machine';
import { BaseStreamApi, StreamApi } from './stream';
import { GlobalContext, RequestContext } from './streamsheets';
import { Actor, BaseUserApi, UserApi } from './user';

export const createApi = <T extends FunctionObject>(context: RequestContext, rawApi: T): PartialApply1All<T> =>
	Object.entries(rawApi).reduce(
		(obj, [name, func]) => ({
			...obj,
			[name]: InternalError.catchUnexpected((...args: any[]) => func(context, ...args))
		}),
		{}
	) as PartialApply1All<T>;

const createApis = (rawApi: typeof RawAPI, context: RequestContext): API =>
	Object.entries(rawApi).reduce((acc, [key, value]) => ({ ...acc, [key]: createApi(context, value) }), {}) as API;

export interface API {
	user: UserApi;
	machine: MachineApi;
	stream: StreamApi;
	export: PartialApply1All<typeof ExportApi>;
	import: PartialApply1All<typeof ImportApi>;
}

export const RawAPI = {
	user: BaseUserApi,
	machine: BaseMachineApi,
	stream: BaseStreamApi,
	export: ExportApi,
	import: ImportApi
};

export default (globalContext: GlobalContext, actor: Actor): RequestContext => {
	const rawApi = globalContext.rawApi || RawAPI;
	const rawAuth = globalContext.rawAuth || baseAuth;
	const context = {
		...globalContext,
		actor
	} as RequestContext;
	context.api = createApis(rawApi, context);
	context.auth = createAuthorization(rawAuth, context);
	return context;
};
