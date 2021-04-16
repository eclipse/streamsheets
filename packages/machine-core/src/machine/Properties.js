/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const VALID_PROPS = require('../../validproperties.json');

const hasProperties = (obj) => (obj ? Object.keys(obj).length > 0 : false);

const merge = (fromProps, toProps, defprops, validprops) => {
	const changes = {};
	Object.entries(fromProps).forEach(([key, value]) => {
		const isValid = validprops.includes(key);
		if (isValid) {
			const oldValue = toProps[key];
			// either delete property or use default one if specified
			value = value == null && defprops ? defprops[key] : value;
			if (value == null) delete toProps[key];
			else toProps[key] = value;
			// in case of undefined use null to keep change on serialize
			changes[key] = oldValue !== undefined ? oldValue : null;
		}
	});
	return hasProperties(changes) ? changes : undefined;
};

class Properties {
	constructor({ attributes = {}, formats = {}, textFormats = {} } = {}) {
		this.attributes = { ...attributes };
		this.formats = { ...formats };
		this.textFormats = { ...textFormats };
		this.cleared = false;
	}

	toJSON() {
		const json = {};
		if (this.cleared) json.cleared = true;
		// filter out empty objects...
		if (hasProperties(this.attributes)) json.attributes = { ...this.attributes };
		if (hasProperties(this.formats)) json.formats = { ...this.formats };
		if (hasProperties(this.textFormats)) json.textFormats = { ...this.textFormats };
		return json;
	}

	isEmpty() {
		return (
			!this.cleared &&
			!hasProperties(this.attributes) &&
			!hasProperties(this.formats) &&
			!hasProperties(this.textFormats)
		);
	}

	clear() {
		const changes = this.toJSON();
		this.attributes = {};
		this.formats = {};
		this.textFormats = {};
		this.cleared = true;
		return changes;
	}

	merge(props = {}, defprops = {}) {
		const changes = {};
		const { attributes, formats, textFormats } = props;
		this.cleared = false;
		if (attributes) {
			changes.attributes = merge(attributes, this.attributes, defprops.attributes, VALID_PROPS.attributes);
		}
		if (formats) changes.formats = merge(formats, this.formats, defprops.formats, VALID_PROPS.formats);
		if (textFormats) {
			changes.textFormats = merge(textFormats, this.textFormats, defprops.text, VALID_PROPS.textFormats);
		}
		return changes;
	}
}

module.exports = Properties;
