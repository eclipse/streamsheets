import GatewayClientProxy from '@cedalo/gateway-client-proxy';
import GatewayClient from '@cedalo/gateway-client';

const { WebGatewayClient } = GatewayClient;
const { WebWorkerGatewayClientProxy } = GatewayClientProxy;

console.log('Init GatwayClient', new Date().toISOString());

const gatewayClient = window.Worker
	? new WebWorkerGatewayClientProxy()
	: new WebGatewayClient();

export default gatewayClient;
