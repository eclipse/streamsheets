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
const updateArray = (arr, index, count) => {
	const newel = [];
	newel.length = Math.abs(count);
	// ensure idx is set -> important for splice!! if index > arr.length
	if (index >= arr.length) arr[index] = undefined;
	if (count < 0) arr.splice(index, newel.length);
	else arr.splice(index, 0, ...newel);
};

module.exports = {
	updateArray
};
