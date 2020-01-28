type ID = string;

interface User {
	id: ID;
	username: string;
	firstName?: string;
	lastName?: string;
}

interface Session {
	id: string;
	user: {
		id: string;
		roles: string[];
		displayName: string;
	};
}

type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];

interface IWSRequest {
	sender?: { id: string };
	requestId?: number
	session?: Session
}

interface IWSEvent {
	type: 'event';
	event: EventData;
}

interface EventData {
	type: string;
	server: string;
	data: any;
}

// interface IServiceRequest {
// 	sender?: { id: string };
// 	requestId?: number
// 	type: string;
// }

interface IWSResponse {
	type: 'response';
	requestType: string;
	requestId: number;
	machineserver?: any;
	graphserver?: any;
}

interface IServiceResponse {
	type: 'response';
	requestId: number;
	response: any;
}

interface SubscribeGraphResponse extends IServiceResponse {
	requestType: 'graph_subscribe';
	response: SubscribeGraphResponseData;
}

interface LoadSubscribeGraphResponse extends IServiceResponse {
	requestType: 'graph_load_subscribe';
	response: SubscribeGraphResponseData;
}

interface CommandResponse extends IServiceResponse {
	requestType: 'command';
	response: any;
}

interface SubscribeGraphResponseData {
	graph: { machineId: string };
}

interface UnsubscribeGraphRequest extends IWSRequest {
	type: 'graph_unsubscribe';
	machineId: string;
}

interface SubscribeMachineResponse extends IServiceResponse {
	requestType: 'machine_subscribe';
	response: SubscribeMachineResponseData;
}

interface LoadSubscribeMachineResponse extends IServiceResponse {
	requestType: 'machine_load_subscribe';
	response: SubscribeMachineResponseData;
}

interface SubscribeMachineResponseData {
	machine: { id: string };
}

interface UnsubscribeMachineRequest extends IWSRequest {
	type: 'machine_unsubscribe';
	machineId: string;
}

type WSRequest = UnsubscribeMachineRequest | UnsubscribeGraphRequest;

type ServiceResponse =
	| SubscribeMachineResponse
	| SubscribeGraphResponse
	| LoadSubscribeMachineResponse
	| LoadSubscribeGraphResponse
	| CommandResponse;

type WSResponse = IWSResponse;

// type ServiceRequest = IServiceRequest;