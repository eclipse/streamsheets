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
