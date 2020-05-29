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
const { create } = require('@cedalo/logger');

const argvalue = (key, argv) => {
	const value = argv.find(el => `${el}`.startsWith(key));
	return value ? value.split(' ')[1] : undefined;
};
const level = argvalue('--log', process.argv) || 'info';


module.exports = {
	level,
	create: ({ name = 'Logger', prefix = '(MachineTask) ' } = {}) => create({ name: `${prefix}${name}`, level })
};
