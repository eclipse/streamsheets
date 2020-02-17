import { baseAuth, createAuthorization } from './authorization';
import { GlobalContext, ID, Machine, RequestContext, Scope } from './streamsheets';
import { Actor, UserApi, BaseUserApi } from './user';
import { FunctionObject, PartialApply1All } from './common';
import { InternalError } from './errors';
import { BaseStreamApi, StreamApi } from './stream';

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
	machine: createApi(context, rawApi.machine),
	stream: createApi(context, rawApi.stream)
});

export interface RawAPI {
	user: BaseUserApi;
	machine: {
		findMachine(context: RequestContext, machineId: ID): Promise<Machine | null>;
		findMachines(context: RequestContext, scope: Scope): Promise<Machine[]>;
	};
	stream: BaseStreamApi;
}

export interface API {
	user: UserApi;
	machine: {
		findMachine(machineId: ID): Promise<Machine | null>;
		findMachines(scope: Scope): Promise<Machine[]>;
	};
	stream: StreamApi;
}

export const RawAPI = {
	user: BaseUserApi,
	machine: {
		findMachine: async ({ machineRepo, auth }: RequestContext, machineId: string) => {
			const machine: Machine | null = await machineRepo.findMachine(machineId);
			if (machine) {
				await auth.verifyMachine('view', machine);
			}
			return machine;
		},
		findMachines: async ({ machineRepo, auth }: RequestContext, scope: Scope): Promise<Machine[]> => {
			const validScope = auth.isValidScope(scope);
			if (!validScope) {
				return [];
			}
			const query = scope ? { 'scope.id': scope.id } : null;
			const machines = await machineRepo.findMachines(query);
			return machines;
		}
	},
	stream: BaseStreamApi
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
