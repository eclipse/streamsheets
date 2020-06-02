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
import { ID } from '../streamsheets';
import { Stream } from '../stream';
import { Machine } from '../machine';

export type MachineWithGraph = {
	machine: Machine;
	graph: {
		id: ID;
		machineId: ID;
		graphdef: any;
	};
};

export type ExportImportData = {
	version: 2;
	machines: Array<MachineWithGraph>;
	streams: Array<Stream>;
};
