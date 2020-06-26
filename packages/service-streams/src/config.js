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
const { requireFile } = require('@cedalo/commons');
const CONFIG = require('../config');

const customConfig = () => (process.env.CONFIG && requireFile(process.env.CONFIG)) || {};

module.exports = Object.freeze({ ...CONFIG, ...customConfig() });
