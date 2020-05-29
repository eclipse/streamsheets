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
import GatewayClientProxy from '@cedalo/gateway-client-proxy';
import GatewayClient from '@cedalo/gateway-client';

const { WebGatewayClient } = GatewayClient;
const { WebWorkerGatewayClientProxy } = GatewayClientProxy;

console.log('Init GatwayClient', new Date().toISOString());

const gatewayClient = window.Worker
	? new WebWorkerGatewayClientProxy()
	: new WebGatewayClient();

export default gatewayClient;
