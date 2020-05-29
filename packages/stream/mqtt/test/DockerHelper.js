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
const path = require('path');
const compose = require('docker-compose');

const COMPOSE_OPTIONS = { cwd: path.join(__dirname), log: true };
const startService = async (service) => {
	const { out, err } = await compose.upOne(service, COMPOSE_OPTIONS);
	if(err) {
		console.error(err);
	}
	console.log(out);
};

const stopServices = () => compose.stop(COMPOSE_OPTIONS);

module.exports = {
	startService,
	stopServices
};
