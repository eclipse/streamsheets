const { WebGatewayClient } = require('@cedalo/gateway-client');

const defaultListener = (event) => {
	const eventMessage = {
		type: 'event',
		event
	};
	postMessage(eventMessage);
};
const gatewayClient = new WebGatewayClient({
	name: 'Web Worker Gateway Client',
	defaultListener
});
// eslint-disable-next-line
onmessage = async (event) => {
	const { method, args = [], requestId } = event.data;
	let response = null;
	try {
		const result = await gatewayClient[method](...args);
		response = {
			type: 'response',
			requestId,
			result
		};
	} catch (error) {
		response = {
			type: 'error',
			requestId,
			error
		};
	}
	postMessage(response);
};
