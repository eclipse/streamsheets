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

const isDefined = (value) => value != null;
const isDefinedNonEmpty = (value) => value != null && value !== '';

const isObject = (value) => value != null && typeof value === 'object';
const hasKeys = (object, keys, isDefinedFn = isDefined) =>
	isObject(object) ? keys.every((key) => isDefinedFn(object[key])) : false;
const hasKeysNonEmpty = (object, keys) => hasKeys(object, keys, isDefinedNonEmpty);

module.exports = {
	hasKeys,
	hasKeysNonEmpty,
	isObject
};
