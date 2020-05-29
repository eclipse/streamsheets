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
export const toggle = (set, value) => {
	const copy = new Set([...set]);
	if (copy.has(value)) {
		copy.delete(value);
	} else {
		copy.add(value);
	}
	return copy;
};

export const addAll = (set, values) => new Set([...set, ...values]);

export const deleteAll = (set, values) => {
	const toRemove = new Set(values);
	return new Set([...set].filter((v) => !toRemove.has(v)));
};
