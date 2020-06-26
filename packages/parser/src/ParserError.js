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
const create = (conf = {}) => {
	const err = Object.assign({}, conf);
	err.toString = () => `${err.name}: ${err.message}`;
	// ensure we have following properties set:
	err.code = err.code || -1;
	err.name = err.name || '';
	err.message = err.message || '';
	// err.index = err.index;
	return err;
};


module.exports =  {
	create
};
