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
'use strict';
const path = require('path');
const concat = require('concat');

concat(
	[
		path.join(__dirname, '..', 'src', 'ui', 'events', 'hammer.js'),
		path.join(__dirname, '..', 'dist', 'jsg-3.0.0.nolibs.js')
	],
	path.join(__dirname, '..', 'dist', 'jsg-3.0.0.js')
);
