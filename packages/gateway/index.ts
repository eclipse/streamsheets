// import { IResolvers } from 'apollo-server-express';
// import { DocumentNode } from 'graphql';
// import { MongoClient } from 'mongodb';
// import { UserAuth as UserAuthObject } from './src/authorization';
// import { FunctionObject, FunctionObjectObject, MappedFunctionObjectObject, PartialApply1All } from './src/common';
import { AuthError, ErrorCodes, InputError, InternalError, MongoError } from './src/errors';
// import { ExportApi, ImportApi } from './src/export-import';
// import { BaseMachineApi, MachineApi, MachineServiceProxy } from './src/machine';
// import { BaseStreamApi } from './src/stream';
// import { StreamApiApplied } from './src/stream/StreamApi';
// import { StreamRepositoryProxy } from './src/stream/StreamRepositoryProxy';
// import { Actor, BaseUserApi, User, UserApi } from './src/user';
// import { Interceptor } from './src/ws/ProxyConnection';

export * from './src/authorization';
export * from './src/common';
export * from './src/context';
export * from './src/glue';
export * from './src/graphql/Payload';
export * from './src/machine';
export * from './src/stream';
export * from './src/streamsheets';
export * from './src/user';
export * from './src/user/Document';
export * from './src/user/Functional';
export { Interceptor, MessageContext } from './src/ws/ProxyConnection';
export { AuthError, ErrorCodes, InputError, InternalError, MongoError };

// export type UserAuth = typeof UserAuthObject;
// export interface BaseAuth extends FunctionObject, UserAuth {}
// export interface Authorization {
// 	isAdmin(user: User): boolean;
// 	isValidScope(scope: Scope): boolean;
// 	isInScope(scope: Scope, entity: { scope?: Scope }): boolean;
// }

// export interface Api {
// 	user: UserApi;
// 	machine: MachineApi;
// 	stream: StreamApiApplied;
// 	export: PartialApply1All<typeof ExportApi>;
// 	import: PartialApply1All<typeof ImportApi>;
// }

// export interface RawAPI extends FunctionObjectObject {
// 	user: typeof BaseUserApi;
// 	stream: BaseStreamApi;
// 	machine: typeof BaseMachineApi;
// 	export: typeof ExportApi;
// 	import: typeof ImportApi;
// }

// export interface GenericGlobalContext<APIS extends { [key: string]: FunctionObject }, AUTH extends FunctionObject> {
// 	mongoClient: MongoClient;
// 	rawApi: APIS;
// 	rawAuth: AUTH;
// 	encryption: any;
// 	repositories: any;
// 	interceptors: {
// 		[key: string]: Interceptor;
// 	};
// 	login: (username: string, password: string) => Promise<User>;
// 	graphql?: {
// 		[key: string]: {
// 			typeDefs?: DocumentNode;
// 			resolvers?: IResolvers;
// 		};
// 	};
// 	machineRepo: any;
// 	streamRepo: StreamRepositoryProxy;
// 	machineServiceProxy: MachineServiceProxy;
// 	getRequestContext(globalContext: GlobalContext, session: Session): Promise<RequestContext>;
// }

// export interface GlobalContext extends GenericGlobalContext<RawAPI, BaseAuth> {}

// export interface GenericRequestContext<APIS extends FunctionObjectObject, AUTH extends FunctionObject>
// 	extends GenericGlobalContext<APIS, AUTH> {
// 	api: MappedFunctionObjectObject<APIS>;
// 	auth: PartialApply1All<AUTH>;
// 	actor: Actor;
// }
// export interface RequestContext extends GlobalContext {
// 	api: Api;
// 	auth: Authorization;
// 	actor: Actor;
// 	// session: Session;
// }

// export interface Scope {
// 	id: string;
// }

// export interface Session {
// 	id: string;
// 	user: {
// 		id: string;
// 		displayName: string;
// 		machineId?: string;
// 	};
// }
