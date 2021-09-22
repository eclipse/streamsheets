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

const hasKeys = (object, keys, isDefinedFn = isDefined) => keys.every((key) => isDefinedFn(object[key]));
const hasKeysNonEmpty = (object, keys) => hasKeys(object, keys, isDefinedNonEmpty);
const isObject = (value) => value == null && typeof value === 'object';

module.exports = {
	hasKeys,
	hasKeysNonEmpty,
	isObject
};
