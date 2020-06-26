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
const { resolveFile } = require('@cedalo/commons').moduleResolver;
const { resolveAdditionalFunctions } = require('@cedalo/service-machines-extensions');

const CORE_FUNCTIONS = '@cedalo/functions';
const RESOLVED_MODULES = [];

const traverse = async () => {
	RESOLVED_MODULES.length = 0;
	const corefn = resolveFile(CORE_FUNCTIONS);
	if (corefn) RESOLVED_MODULES.push(corefn);
	const additionalFunctions = await resolveAdditionalFunctions();
	RESOLVED_MODULES.push(...additionalFunctions);
	return RESOLVED_MODULES;
};

module.exports = {
	resolve: traverse,
	getModules: () => RESOLVED_MODULES
};
