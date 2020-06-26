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
const celljson = json => ({
	// eslint-disable-next-line
	isEqualTo: other => json.formula === other.formula && json.value === other.value && json.type === other.type && json.reference === other.reference
});

const description = cell => ({
	isEqualTo: (other) => {
		const descr = cell.description();
		return descr.formula === other.formula && descr.value === other.value;
	}
});


module.exports = {
	celljson,
	description
};
