import { baseAuth, createAuthorization } from './authorization';
import { GlobalContext, ID, Machine, RequestContext } from './streamsheets';
import { Actor, UserApi, BaseUserApi } from './user';
import { FunctionObject, PartialApply1All } from './common';
import { InternalError } from './errors';

export const createApi = <T extends FunctionObject>(context: RequestContext, rawApi: T): PartialApply1All<T> =>
	Object.entries(rawApi).reduce(
		(obj, [name, func]) => ({
			...obj,
			[name]: InternalError.catchUnexpected((...args: any[]) => func(context, ...args))
		}),
		{}
	) as PartialApply1All<T>;

const createApis = (rawApi: RawAPI, context: RequestContext) => ({
	user: createApi(context, rawApi.user),
	machine: createApi(context, rawApi.machine)
});

export interface RawAPI {
	user: BaseUserApi;
	machine: {
		findMachine(context: RequestContext, machineId: ID): Promise<Machine>;
	};
}

export interface API {
	machine: {
		findMachine(machineId: ID): Promise<Machine>;
	};
	user: UserApi;
}

export const RawAPI = {
	user: BaseUserApi,
	machine: {
		findMachine: async ({ machineRepo, auth }: RequestContext, machineId: string) => {
			const machine: Machine = await machineRepo.findMachine(machineId);
			await auth.verifyMachine('view', machine);
			return machine;
		}
	}
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
