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
export default class Utils {
	static deepCopy(o) {
		const output = Array.isArray(o) ? [] : {};
		Object.keys(o).forEach((key) => {
			const v = o[key];
			output[key] = (typeof v === 'object') ? Utils.deepCopy(v) : v;
		});
		return output;
	}

	static formatDateString(s = '') {
		if(!Number.isNaN(Date.parse(s))) {
			const d = new Date(s);
			return `${d.toLocaleDateString()}:${d.toLocaleTimeString()}`;
		}
		return '';
	};
}
