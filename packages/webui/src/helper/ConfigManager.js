import { accessManager } from '../helper/AccessManager';
import * as wsHelper from './websocket';

const { host, hostname, protocol } = window.location;

const gatewaySocketHost = host === 'localhost:3000' ? `localhost:8088` : host;
const GATEWAY_SOCKET_ENDPOINT =
	process.env.REACT_APP_GATEWAY_SOCKET_ENDPOINT || wsHelper.getUrl('/machineserver-proxy', gatewaySocketHost);

const gatewayRestHost = host === 'localhost:3000' ? `localhost:8080` : host;
const GATEWAY_REST_ENDPOINT = process.env.REACT_APP_GATEWAY_REST_ENDPOINT || `${protocol}//${gatewayRestHost}/api/v1.0`;
const CONFIG_URL = `${GATEWAY_REST_ENDPOINT}/config/get`;

const CONFIG = {
	socketEndpointURL: localStorage.getItem('socketEndpointURL') || GATEWAY_SOCKET_ENDPOINT,
	restEndpointURL: localStorage.getItem('restEndpointURL') || GATEWAY_REST_ENDPOINT,
	token: accessManager.authToken,
	clientId: accessManager.clientId,
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
		return new Promise((resolve)=> {
			fetch(CONFIG_URL)
			.then((response) => response.json())
			.then((conf) => {
				this._config = {
					...this._config,
					...conf
				};
				return resolve(this._config);
			});
		})

	}

	get config() {
		return this._config;
	}
}
const manager = new ConfigManager();
export default manager;
