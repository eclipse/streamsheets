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

const os = require('os');
const v8 = require('v8');
const system = require('systeminformation');

module.exports = class MetricsManager {
	static async getMetrics() {
		const systeminformation = {
			currentLoad: await system.currentLoad(),
			cpuCurrentSpeed: await system.cpuCurrentSpeed(),
			memory: await system.mem(),
			fullLoad: await system.fullLoad(),
			processes: await system.processes(),
			// processLoad: await system.processLoad(),
			// dockerInfo: await system.dockerInfo(),
		}

		systeminformation.process = systeminformation.processes.list.find(processObject => processObject.pid === process.pid);
		delete systeminformation.processes;
		
		const { pid, title, versions } = process;
		const memory = process.memoryUsage();
		const cpu = process.cpuUsage();
		const cpus = os.cpus();
		const resource = process.resourceUsage();
		const report = process.report.getReport();

		const heapStatistics = v8.getHeapStatistics();
		const heapCodeStatistics = v8.getHeapCodeStatistics();
		const heapSpaceStatistics = v8.getHeapSpaceStatistics();

		const result = {
			systeminformation,
			title,
			pid,
			versions,
			memory,
			cpu,
			cpus,
			resource,
			report,
			os: {
				freemem: os.freemem(),
				totalmem: os.totalmem()
			},
			v8: {
				heapStatistics,
				heapCodeStatistics,
				heapSpaceStatistics
			}
		}
		return result;
	}
};