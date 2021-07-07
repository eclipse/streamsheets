/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const logger = require('../logger').create({ name: 'AutoExit' });
const State = require('../State');

const AUTO_EXIT_TIMEOUT = parseInt(process.env.AUTO_EXIT_TIMEOUT, 10) || 60 * 1000;

let timeoutId;
const cancel = (mname) => {
	if (timeoutId) {
		logger.info(`clear exit timer for machine${mname}`);
		clearTimeout(timeoutId);
		timeoutId = undefined;
	}
};
const update = (machine) => {
	const mname = `[${machine.id}]: ${machine.name}`;
	cancel(mname);
	if (machine.state === State.STOPPED && machine.getClientCount() === 0) {
		logger.info(`start exit timer for machine${mname}`);
		timeoutId = setTimeout(() => {
			logger.info(`exit machine: ${mname}`);
			process.exit(1);
		}, AUTO_EXIT_TIMEOUT);
	}
};

module.exports = {
	update
};
