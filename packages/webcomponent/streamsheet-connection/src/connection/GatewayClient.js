import { WebGatewayClient } from '@cedalo/gateway-client';
import { WebWorkerGatewayClientProxy } from '@cedalo/gateway-client-proxy';

class GatewayClient {

	static of() {
		return window.Worker ? new WebWorkerGatewayClientProxy({ timeout: 10000 }) : new WebGatewayClient();
	}
}

export default GatewayClient;
