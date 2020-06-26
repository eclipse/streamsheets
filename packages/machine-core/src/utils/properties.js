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
const DEF_SHEET_PROPS = require('../../defproperties.json');

const addProperty = (obj = {}, key, value) => {
	obj[key] = value;
	return obj;
};

// TODO remove this!!!
const createPropertiesObject = (propsobj = {}) => {
	if (propsobj.attributes || propsobj.formats) {
		// assume correct structure...
		return propsobj;
	}
	// DEF_SHEET_PROPS
	const text = Object.keys(DEF_SHEET_PROPS.formats.text);
	const styles = Object.keys(DEF_SHEET_PROPS.formats.styles);
	const attributes = Object.keys(DEF_SHEET_PROPS.attributes.cell);
	return Object.entries(propsobj).reduce(
		(props, [key, value]) => {
			if (attributes.includes(key)) {
				props.attributes = addProperty(props.attributes, key, value);
			} else if (styles.includes(key)) {
				props.formats.styles = addProperty(props.formats.styles, key, value);
			} else if (text.includes(key)) {
				props.formats.text = addProperty(props.formats.text, key, value);
			}
			return props;
		},
		{ formats: {} }
	);
};

module.exports = {
	createPropertiesObject
};
