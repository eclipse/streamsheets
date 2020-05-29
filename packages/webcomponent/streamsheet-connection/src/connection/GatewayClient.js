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
import { WebGatewayClient } from '@cedalo/gateway-client';
import { WebWorkerGatewayClientProxy } from '@cedalo/gateway-client-proxy';

class GatewayClient {

	static of() {
		return window.Worker ? new WebWorkerGatewayClientProxy({ timeout: 10000 }) : new WebGatewayClient();
	}
}

export default GatewayClient;
