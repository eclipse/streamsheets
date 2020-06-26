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
const Properties = require('./Properties');

class ImmutableProperties extends Properties {
	static of(props) {
		// handles = 
		const attributes = Object.freeze(Object.create(props.attributes));
		const formats = {
			text: Object.freeze(Object.create(props.formats.text)),
			styles: Object.freeze(Object.create(props.formats.styles))
		};
		return new ImmutableProperties(attributes, formats);
	}
}

module.exports = ImmutableProperties;
