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
import StreamMachine from '@cedalo/streammachine';
import { StreamSheetConnection } from '@cedalo/streamsheet-connection';
import LoginPanel from './loginpanel/LoginPanel';
import MachineMonitor from './dashboard/MachineMonitor';

export default {
	StreamMachine,
	StreamSheetConnection,
	LoginPanel,
	MachineMonitor
}
