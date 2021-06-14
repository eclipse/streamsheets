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

module.exports = class MetricsManager {
	static getMetrics() {
		const { pid, title, versions } = process;
		const memory = process.memoryUsage();
		const cpu = process.cpuUsage();
		const resource = process.resourceUsage();
		const report = process.report.getReport();

		const result = {
			title,
			pid,
			versions,
			memory,
			cpu,
			resource,
			report,
			os: {
				freemem: os.freemem(),
				totalmem: os.totalmem()
			}
		}
		return result;
	}
};
