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
const isEmptyCell = (cell) => cell.term == null && cell.value === '';
const isEmptyCellDescriptor = (descr) => !descr || (descr.formula == null && descr.value == null);
const isEmptyObject = (obj) => obj == null || Object.keys(obj).length === 0;
const isEmptyString = (str) => str == null || str === '';

module.exports = {
	isEmptyCell,
	isEmptyCellDescriptor,
	isEmptyObject,
	isEmptyString
};
