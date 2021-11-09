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
const logger = require('../utils/logger').create({ name: 'HealthCheck' });

const HEALTH_CHECK_INTERVAL = 5000;
const HEALTH_CHECK_TIMEOUT = 1000;

const scheduleHealthCheck = (machineServer, emitHealthCheckFailure) => {
	const healthCheck = () => {
		machineServer.machinerunners.forEach(async (runner) => {
			let timedout = false;
			const timeoutId = setTimeout(() => {
				timedout = true;
				emitHealthCheckFailure(runner.id, runner.lastSuccessfulHealthCheck);
			}, HEALTH_CHECK_TIMEOUT);
			await runner.healthCheck();
			if (timedout) {
				logger.warn(`Machine ${runner.id} failed to reply to healthcheck message!`);
				return;
			}
			runner.lastSuccessfulHealthCheck = Date.now();
			clearTimeout(timeoutId);
		});
	};
	setInterval(healthCheck, HEALTH_CHECK_INTERVAL);
};

const buildHealthCheckFailureMessage = (machineId, lastSuccessfulHealthCheck) => ({
	type: 'healthcheck_failure',
	machineId,
	lastSuccessfulHealthCheck
});

module.exports = {
	scheduleHealthCheck,
	buildHealthCheckFailureMessage
};
