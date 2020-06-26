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
import IMachineJSON from './IMachineJSON';

interface IMachineElement extends HTMLElement {

	readonly machineId: string;
	 
	// definition is machine-json
	setMachine<T extends IMachineJSON>(definition: T): void;

	// error is optional and only defined if subscribing failed...
	subscribedCallback(element: HTMLElement, error?: Error): void;

	unsubscribedCallback(element: HTMLElement): void;
}

export default IMachineElement;
