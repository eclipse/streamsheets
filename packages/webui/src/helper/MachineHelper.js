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
import { accessManager } from './AccessManager';

export default class MachineHelper {
	static isMachineEngineConnected(monitor, meta) {
		return monitor.isConnected && meta.allServicesConnected;
	}

	static currentMachineCan(action) {
		const machine = MachineHelper.getMachineResourceInfo();
		return accessManager.can(machine, action);
	}

	static getMachineIdFromUrl() {
		const parts = window.location.pathname.split('/');
		return parts[parts.length-1];
	}

	static getMachineResourceInfo() {
		return {
			id: this.getMachineIdFromUrl(),
			className: 'Machine'
		}
	}

	static isMachineDetailsPage() {
		return window.location.href.indexOf('/machines/') > 0;
	}
	
	static showMachine(props) {
		return !props.monitor.isLoading && !props.monitor.loadingFailed;
	}

	static isViewMode() {
		return window.location.search.indexOf('viewmode') !== -1;
	}
}
