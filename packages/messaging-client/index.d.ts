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
declare module '@cedalo/messaging-client' {
	class MessagingClient {
		connect(url: string, configuration?: any): Promise<any>;

		publish(topic: string, message: object | string): Promise<any>;

		subscribe(topic: string, options?: any): Promise<any>;

		unsubscribe(topic: string): Promise<any>;

		on(event: string, callback: (topic: string, message: string) => void): Promise<any>;

		end(): Promise<any>;
	}
}