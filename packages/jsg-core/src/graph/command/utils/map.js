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
const Expression = require('../../expr/Expression');
const Dictionary = require('../../../commons/Dictionary');

const createRetainMap = (format, map) => {
	const retain = new Dictionary();
	const formatMap = format ? format.toMap(true) : new Dictionary();
	map.iterate(key => retain.put(key, formatMap.get(key)));
	return retain;
};

const mapExpressionValue = (value) => {
	if (value === undefined) return null;
	return value instanceof Expression ? value.getValue() : value
};
const toValuesMap = map => map ? map.map(mapExpressionValue) : new Dictionary();

// removes attributes from given format if corresponding value is not set!
const applyValueMap = (map, toFormat) => {
	if (map && toFormat) {
		map.iterate((key, value) => {
			const attribute = toFormat.getAttribute(key);
			if (value == null && toFormat.hasAttribute(key, false)) {
				toFormat.removeAttribute(attribute);
			} else {
				toFormat.setAttributeValue(attribute, value);
			}
		});
	}
};



module.exports = {
	applyValueMap,
	createRetainMap,
	toValuesMap
};
