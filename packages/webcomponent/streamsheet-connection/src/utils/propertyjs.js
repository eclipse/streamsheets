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
// const get = (obj, ...path) => path.reduce((parent, part) => (parent != null ? parent[part] : parent), obj);

// const getOrDefault = (obj, def, ...path) => {
// 	const prop = get(obj, ...path);
// 	return prop != null ? prop : def;
// };

const get = (...path) => (obj, def) => {
	const prop = path.reduce((parent, part) => (parent != null ? parent[part] : parent), obj);
	return prop != null ? prop : def;
};

export default { get, /* getOrDefault */ };