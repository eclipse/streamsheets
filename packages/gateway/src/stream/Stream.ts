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
import { Stream } from './types';

export const isConnector = (stream: Stream) => stream.className === 'ConnectorConfiguration';
export const isProducer = (stream: Stream) => stream.className === 'ProducerConfiguration';
export const isConsumer = (stream: Stream) => stream.className === 'ConsumerConfiguration';

export const isSameType = (stream1: Stream, stream2: Stream) => stream1.className === stream2.className;

export const setConnector = (stream: Stream, connectorId: string) => ({
	...stream,
	connector: { ...stream.connector, id: connectorId, _id: connectorId }
});


