import { Stream } from './types';

export const isConnector = (stream: Stream) => stream.className === 'ConnectorConfiguration';
export const isProducer = (stream: Stream) => stream.className === 'ProducerConfiguration';
export const isConsumer = (stream: Stream) => stream.className === 'ConsumerConfiguration';

export const isSameType = (stream1: Stream, stream2: Stream) => stream1.className === stream2.className;

export const setConnector = (stream: Stream, connectorId: string) => ({
	...stream,
	connector: { ...stream.connector, id: connectorId, _id: connectorId }
});


