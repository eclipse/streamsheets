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
/**
 * NOTE: 
 *  - used to run a single test-file with cli option: --config
 *  - to run ALL tests use $>npm t
 */
module.exports = {
	bail: true,
	collectCoverage: false,
	verbose: true,
	setupFiles: ['./setup.js']
};
