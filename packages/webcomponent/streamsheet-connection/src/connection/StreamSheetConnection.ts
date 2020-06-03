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
import Credentials from '../Credentials';
import GatewayClient from './GatewayClient';
import IMachineJSON from '../IMachineJSON';


const TAG = 'streamsheet-connection';

const DEF_ENDPOINTS = {
	REST: 'http://localhost:8081/api/v1.0',
	SOCKET: 'ws://localhost:8081/machineserver-proxy',
	REST_LOCAL: 'http://localhost:8080/api/v1.0',
	SOCKET_LOCAL: 'ws://localhost:8080/machineserver-proxy'
};

type PendingPromise = {
	resolve: (value?: unknown) => void;
	reject: (reason?: any) => void;
};

const machineIdFromResponse = (response: [any]) => {
	// response is an array of machines => simply return first one...
	if (response.length) return response[0].id;
	throw new Error(`Unknown machine "${name}"`);
};

const subscribe = (name: string, gateway: StreamSheetConnection) => {
	if (!gateway.isReady) return Promise.reject(new Error('Component not ready yet!'));
	const gwclient = gateway.client;
	return name
		? gwclient.gatewayClient
				.graphql(
					`
				query MachinesWithName($name: String) {
					machines(name: $name) {
					  id
					}
				  }
				  `,
					{ name }
				)
				.then((response: any) => machineIdFromResponse(response.machines))
				.then((machineId: String) => gwclient.loadSubscribeMachine(machineId))
				.then((response: any) => {
					const { graphserver = {}, machineserver = {} } = response;
					const graphdef = graphserver.graph ? graphserver.graph.graphdef : undefined;
					if (graphdef) graphdef.id = graphserver.graph.id;
					return { machine: machineserver.machine, graph: graphdef, client: gwclient };
				})
		: Promise.resolve();
};

const processPendingPromises = (promises: PendingPromise[], result: any, error?: Error) => {
	promises.forEach((promise) => (error ? promise.reject(error) : promise.resolve(result)));
	return [];
};

const disconnect = (gateway: StreamSheetConnection) =>
	gateway.isConnected ? gateway.client.disconnect() : Promise.resolve();

// const validateLogin2 = ({ response = {} }) => {
// 	if (response.error) throw response.error;
// };
const validateLogin = (result: any = {}) => {
	const { response = {} } = result;
	if (response.error) throw response.error;
	return result;
};

const resolveAfter = (ms: number, result: any) => new Promise((resolve) => setTimeout(() => resolve(result), ms));


class StreamSheetConnection extends HTMLElement {

	public static readonly TAG = TAG;


	private _isReady = false;
	private _isConnected = false;
	private _resturl = DEF_ENDPOINTS.REST;
	private _socketurl = DEF_ENDPOINTS.SOCKET;
	private _gwclient = GatewayClient.of();
	private _pendingPromises: PendingPromise[] = [];
	private _subscriptions = new Set<string>();

	connectedCallback() {
		const username = this.getAttribute('user');
		const token = this.getAttribute('token');
		const password = this.getAttribute('password');
		// changed gateway urls:
		this.resturl = this.getAttribute('resturl');
		this.socketurl = this.getAttribute('socketurl');

		// login if token or user & password is provided...
		if (token || (username && password)) this.login({ username, password, token });
	}

	disconnectedCallback() {
		// console.log('***DISCONNECTED***');
	}

	// ====================================================================================================================
	// PUBLIC API
	// ====================================================================================================================
	get client() {
		// TODO: really expose this?
		return this._gwclient;
	}

	get isConnected() {
		return this._isConnected;
	}

	get isReady() {
		return this._isReady;
	}

	set resturl(url: string | null) {
		this._resturl = url || this._resturl;
	}

	set socketurl(url: string | null) {
		this._socketurl = url || this._socketurl;
	}

	login(credentials: Credentials): Promise<any> {
		const gwclient = this.client;
		const { token } = credentials;
		const config = { restEndpointURL: this._resturl, socketEndpointURL: this._socketurl, token };
		return (
			disconnect(this)
				.then(() => gwclient.connect(config))
				.then(() => (token ? {} : gwclient.authenticate(credentials)))
				.then((result: any) => validateLogin(result))
				// TODO remove wait timeout!!
				.then((result: any) => resolveAfter(500, result))
				.then((result: any) => {
					this._isReady = true;
					this._isConnected = true;
					this._pendingPromises = processPendingPromises(this._pendingPromises, result);
					this.dispatchEvent(new CustomEvent('ready'));
					return result;
				})
				.catch((err: Error) => {
					this._pendingPromises = processPendingPromises(this._pendingPromises, undefined, err);
					this.dispatchEvent(new CustomEvent('error', { detail: err }));
					return Promise.reject(err);
				})
		);
	}

	// gwclient requires token for logout...
	logout(token: string): Promise<any> {
		return Promise.all(Array.from(this._subscriptions).map((id) => this.unsubscribe(id))).then(() =>
			this.client.logout(token)
		);
	}

	whenReady() {
		return this._isReady
			? Promise.resolve()
			: new Promise((resolve, reject) => {
					this._pendingPromises.push({ resolve, reject });
			  });
	}

	async subscribe(machineName: string | null) {
		if (machineName) {
			const res = await subscribe(machineName, this);
			if (res.machine) this._subscriptions.add(res.machine.id);
			return res;
		}
		throw new Error(`Unknown machine "${machineName}"!`);
	}

	async unsubscribe(machineId: string) {
		let res;
		if (machineId && this._isReady) {
			res = await this.client.unsubscribeMachine(machineId);
			this._subscriptions.delete(machineId);
		}
		return res;
		// return machineId && this._isReady ? this.client.unsubscribeMachine(machineId) : Promise.resolve();
	}
}

if (!customElements.get(TAG)) customElements.define(TAG, StreamSheetConnection);

export default StreamSheetConnection;
