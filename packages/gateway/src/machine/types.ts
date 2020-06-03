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
import { ID, Scope } from '../streamsheets';

export interface Machine {
	id: ID;
	state: 'running' | 'stopped' | 'paused';
	isTemplate?: boolean;
	scope?: Scope;
	name: string;
	streamsheets: StreamSheet[];
}

export interface Cell {
	formula?: string;
	references?: string[];
}

export interface Graph {
	id: ID;
	machineId: ID;
	graphdef: any;
}

export interface StreamSheet {
	id: ID;
	inbox: {
		id: ID;
		stream: {
			id: ID;
			name: string;
		};
	};
	sheet: {
		cells: { [key: string]: Cell };
	};
}
