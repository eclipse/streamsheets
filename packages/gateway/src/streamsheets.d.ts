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
import { Authorization, BaseAuth } from './authorization';
import { Api, RawAPI } from './glue';
import { Actor, User } from './user';
import { StreamRepositoryProxy } from './stream/StreamRepositoryProxy';
import { IResolvers } from 'apollo-server-express';
import { MachineServiceProxy } from './machine';
import { MongoClient } from 'mongodb';
import { DocumentNode } from 'graphql';
import { FunctionObject, MappedFunctionObjectObject, PartialApply1All, FunctionObjectObject } from './common';
import { Interceptor } from './ws/ProxyConnection';
import { UserRepository } from './user/UserRepository';
import { Strategy } from 'passport';

export interface GenericGlobalContext<APIS extends { [key: string]: FunctionObject }, AUTH extends FunctionObject> {
	mongoClient: MongoClient;
	rawApi: APIS;
	rawAuth: AUTH;
	encryption: any;
	authStrategies: { [key: string]: Strategy };
	middleware: { [key: string]: any };
	repositories: any;
	interceptors: {
		[key: string]: Interceptor;
	};
	login: (globalContext: GlobalContext, username: string, password: string) => Promise<User>;
	graphql?: {
		[key: string]: {
			typeDefs?: DocumentNode;
			resolvers?: IResolvers;
		};
	};
	machineRepo: any;
	userRepo: UserRepository;
	streamRepo: StreamRepositoryProxy;
	machineServiceProxy: MachineServiceProxy;
	getRequestContext(globalContext: GlobalContext, session: Session): Promise<RequestContext>;
	getActor(globalContext: GlobalContext, session: Session): Promise<User>;
}

export interface GlobalContext extends GenericGlobalContext<RawAPI, BaseAuth> {}

export interface GenericRequestContext<APIS extends FunctionObjectObject, AUTH extends FunctionObject>
	extends GenericGlobalContext<APIS, AUTH> {
	api: MappedFunctionObjectObject<APIS>;
	auth: PartialApply1All<AUTH>;
	actor: Actor;
}
export interface RequestContext extends GlobalContext {
	api: Api;
	auth: Authorization;
	actor: Actor;
	// session: Session;
}

export interface Scope {
	id: string;
}

export interface Session {
	id: string;
	user: {
		id: string;
		username: string;
		displayName: string;
		machineId?: string;
	};
}

export interface IWSRequest {
	sender?: { id: string };
	requestId?: number;
	session?: Session;
	machineId?: string;
}

export interface IWSEvent {
	type: 'event';
	event: EventData;
}

export interface EventData {
	type: string;
	server: string;
	data: any;
}

// export interface IServiceRequest {
// 	sender?: { id: string };
// 	requestId?: number
// 	type: string;
// }

export interface IWSResponse {
	type: 'response';
	requestType: string;
	requestId: number;
	machineserver?: any;
	graphserver?: any;
}

export interface IServiceResponse {
	type: 'response';
	requestId: number;
	response: any;
}

export interface SubscribeGraphResponse extends IServiceResponse {
	requestType: 'graph_subscribe';
	response: SubscribeGraphResponseData;
}

export interface LoadSubscribeGraphResponse extends IServiceResponse {
	requestType: 'graph_load_subscribe';
	response: SubscribeGraphResponseData;
}

export interface CommandResponse extends IServiceResponse {
	requestType: 'command';
	response: any;
}

export interface SubscribeGraphResponseData {
	graph: { machineId: string };
}

export interface UnsubscribeGraphRequest extends IWSRequest {
	type: 'graph_unsubscribe';
	machineId: string;
}

export interface SubscribeMachineResponse extends IServiceResponse {
	requestType: 'machine_subscribe';
	response: SubscribeMachineResponseData;
}

export interface LoadSubscribeMachineResponse extends IServiceResponse {
	requestType: 'machine_load_subscribe';
	response: SubscribeMachineResponseData;
}

export interface SubscribeMachineResponseData {
	machine: { id: string };
}

export interface UnsubscribeMachineRequest extends IWSRequest {
	type: 'machine_unsubscribe';
	machineId: string;
}

export interface CommandRequest extends IWSRequest {
	type: 'command';
	command: Command;
	machineId: string;
}

export interface AddInboxMessageRequest extends IWSRequest {
	type: 'add_inbox_message';
	machineId: string;
}
export interface GetMachineRequest extends IWSRequest {
	type: 'machine_get';
	machineId: string;
}
export interface GetMachinesRequest extends IWSRequest {
	type: 'machineserver_machines';
	machineId: string;
}
export interface DeleteMachineRequest extends IWSRequest {
	type: 'machine_delete';
	machineId: string;
}
export interface DeleteStreamsheetRequest extends IWSRequest {
	type: 'streamsheet_delete';
	machineId: string;
}
export interface LoadMachineRequest extends IWSRequest {
	type: 'machine_load';
	machineId: string;
	scope?: Scope;
}
export interface UnloadMachineRequest extends IWSRequest {
	type: 'machine_unload';
	machineId: string;
}
export interface LoadSheetCellsRequest extends IWSRequest {
	type: 'load_sheet_cells';
	machineId: string;
}
export interface MachineUpdateRequest extends IWSRequest {
	type: 'machine_update_settings';
	machineId: string;
}
export interface MetaInformationRequest extends IWSRequest {
	type: 'meta_information';
}
export interface OpenMachineRequest extends IWSRequest {
	type: 'machine_open';
	machineId: string;
}
export interface PauseMachineRequest extends IWSRequest {
	type: 'machine_pause';
	machineId: string;
}
export interface RenameMachineRequest extends IWSRequest {
	type: 'machine_rename';
	machineId: string;
}
export interface SaveMachineAsRequest extends IWSRequest {
	type: 'machine_save_as';
}
export interface SaveMachineCopyRequest extends IWSRequest {
	type: 'machine_save_copy';
}
export interface SetMachineCycleTimeRequest extends IWSRequest {
	type: 'machine_set_cycle_time';
	machineId: string;
}
export interface SetMachineLocaleRequest extends IWSRequest {
	type: 'machine_set_locale';
	machineId: string;
}
export interface SetMachineUpdateIntervalRequest extends IWSRequest {
	type: 'machine_set_update_interval';
	machineId: string;
}
export interface SetNamedCellsRequest extends IWSRequest {
	type: 'set_named_cells';
	machineId: string;
}
export interface SetGraphCellsRequest extends IWSRequest {
	type: 'set_graph_cells';
	machineId: string;
}
export interface SetSheetCellsRequest extends IWSRequest {
	type: 'set_sheet_cells';
	machineId: string;
}
export interface StartMachineRequest extends IWSRequest {
	type: 'machine_start';
	machineId: string;
}
export interface StepMachineRequest extends IWSRequest {
	type: 'machine_step';
	machineId: string;
}
export interface StopMachineRequest extends IWSRequest {
	type: 'machine_stop';
	machineId: string;
}
export interface StreamsheetsOrderRequest extends IWSRequest {
	type: 'streamsheets_order';
	machineId: string;
}
export interface SubscribeMachineRequest extends IWSRequest {
	type: 'machine_subscribe';
	machineId: string;
}
export interface UpdateMachineImageRequest extends IWSRequest {
	type: 'update_machine_image';
	machineId: string;
}
export interface LoadSubscribeMachineRequest extends IWSRequest {
	type: 'machine_load_subscribe';
	machineId: string;
	scope: Scope;
}

export interface CreateStreamsheetRequest extends IWSRequest {
	type: 'streamsheet_create';
	machineId: string;
}
export interface StreamsheetStreamUpdateRequest extends IWSRequest {
	type: 'streamsheet_stream_update';
	machineId: string;
}

export interface Command {
	name: string;
}

export type WSRequest =
	| UnsubscribeMachineRequest
	| UnsubscribeGraphRequest
	| SetSheetCellsRequest
	| CreateStreamsheetRequest
	| StreamsheetStreamUpdateRequest
	| StartMachineRequest
	| CommandRequest
	| StopMachineRequest
	| StepMachineRequest
	| UpdateMachineImageRequest
	| SubscribeMachineRequest
	| StreamsheetsOrderRequest
	| SetGraphCellsRequest
	| SetNamedCellsRequest
	| SetMachineUpdateIntervalRequest
	| SetMachineLocaleRequest
	| SetMachineCycleTimeRequest
	| SaveMachineCopyRequest
	| SaveMachineAsRequest
	| RenameMachineRequest
	| PauseMachineRequest
	| OpenMachineRequest
	| MachineUpdateRequest
	| MetaInformationRequest
	| LoadSheetCellsRequest
	| UnloadMachineRequest
	| LoadMachineRequest
	| DeleteStreamsheetRequest
	| DeleteMachineRequest
	| GetMachinesRequest
	| GetMachineRequest
	| AddInboxMessageRequest
	| LoadSubscribeMachineRequest;

export type ServiceResponse =
	| SubscribeMachineResponse
	| SubscribeGraphResponse
	| LoadSubscribeMachineResponse
	| LoadSubscribeGraphResponse
	| CommandResponse;

export type WSResponse = IWSResponse;

export type ID = string;

export type Authorizer<T> = (entity: T) => void;
