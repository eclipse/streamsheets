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
import { accessManager } from '../helper/AccessManager';

const { host, hostname, protocol } = window.location;
const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';

const gatewayHost = host === 'localhost:3000' ? `localhost:8080` : host;
const GATEWAY_SOCKET_ENDPOINT =
	process.env.REACT_APP_GATEWAY_SOCKET_ENDPOINT || `${wsProtocol}//${gatewayHost}/machineserver-proxy`;

const GATEWAY_REST_ENDPOINT = process.env.REACT_APP_GATEWAY_REST_ENDPOINT || `${protocol}//${gatewayHost}/api/v1.0`;
const CONFIG_URL = `${GATEWAY_REST_ENDPOINT}/config/get`;

const CONFIG = {
	socketEndpointURL: localStorage.getItem('socketEndpointURL') || GATEWAY_SOCKET_ENDPOINT,
	restEndpointURL: localStorage.getItem('restEndpointURL') || GATEWAY_REST_ENDPOINT,
	token: accessManager.authToken
};

const DEF_CONFIG = {
	hostname,
	gatewayClientConfig: CONFIG,
	authProviders: []
};

class ConfigManager {
	constructor(config = DEF_CONFIG) {
		this._config = config;
	}

	async loadConfig() {
		return new Promise((resolve) => {
			fetch(CONFIG_URL)
				.then((response) => response.json())
				.then((conf) => {
					this._config = {
						...this._config,
						...conf
					};
					return resolve(this._config);
				});
		});
	}

	get config() {
		return this._config;
	}
}
const manager = new ConfigManager();
export default manager;
