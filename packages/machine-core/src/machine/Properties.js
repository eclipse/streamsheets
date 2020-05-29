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
const protoChain = (obj, all) => {
	if (obj) {
		protoChain(Object.getPrototypeOf(obj), all);
		all.push(obj);
	}
	// pop first & second elements because we assume they are Object and fix template values
	return all.slice(2);
};
const getDiffsOf = (subObj) => protoChain(subObj, []).reduce((acc, obj) => {
	Object.entries(obj).forEach(([key, value]) => {
		acc[key] = value;
	});
	return acc;
}, {});

// const removeAll = (props) => Object.keys(props).forEach((key) => delete props[key]);

const merge = (toProps, fromProps) => {
	const changes = {};
	let hasChanged = false;
	Object.entries(fromProps).forEach(([key, value]) => {
		const oldValue = toProps[key];
		// only merge known values...
		if (oldValue !== undefined && oldValue !== value) {
			hasChanged = true;
			if (value == null) delete toProps[key];
			else toProps[key] = value;
			// cannot use value for new, since on removal we might use base!
			let newValue = toProps[key];
			if (newValue === undefined) newValue = null; // ensure newValue !== undefined
			changes[key] = { new: newValue, old: oldValue }; // maybe we don't need the new value...
		}
	});
	return hasChanged ? changes : undefined;
};

class Properties {
	static of({ attributes, formats: { styles, text } }) {
		const attr = Object.create(attributes);
		const formats = {
			text: Object.create(text),
			styles: Object.create(styles)
		};
		return new Properties(attr, formats);
	}


	constructor(attributes, formats) {
		this.attributes = attributes;
		this.formats = formats;
	}

	toJSON() {
		const json = {};
		const formats = {};
		// filter out empty objects...
		if (this.hasAttributes()) json.attributes = this.attributes;
		if (this.hasTextFormats()) formats.text = this.formats.text;
		if (this.hasStyleFormats()) formats.styles = this.formats.styles;
		if (formats.styles || formats.text) json.formats = { ...formats };
		return json;
	}

	initWithJSON(json) {
		const { attributes, formats } = json;
		if (attributes) Object.keys(attributes).forEach(key => this.setAttribute(key, attributes[key]));
		if (formats) {
			const { text, styles } = formats;
			if (text) Object.keys(text).forEach(key => this.setTextFormat(key, text[key]));
			if (styles) Object.keys(styles).forEach(key => this.setStyleFormat(key, styles[key]));
		}
	}

	isEmpty() {
		return !this.hasAttributes() && !this.hasStyleFormats() && !this.hasTextFormats();
	}
	hasAttributes() {
		return !!Object.keys(this.attributes).length;
	}
	hasStyleFormats() {
		return !!Object.keys(this.formats.styles).length;
	}
	hasTextFormats() {
		return !!Object.keys(this.formats.text).length;
	}

	getAttribute(key) {
		return this.attributes[key];
	}
	getStyleFormat(key) {
		return this.formats.styles[key];
	}
	getTextFormat(key) {
		return this.formats.text[key];
	}

	// specify undefined as value to delete attribute
	setAttribute(key, value) {
		if (value == null) delete this.attributes[key];
		else if (this.attributes[key] !== value) this.attributes[key] = value;
	}
	// key, value object or empty/undefined to remove all attributes
	// setAttributes(props = {}) {
	// 	const entries = Object.entries(props);
	// 	if (entries.length) entries.forEach(([key, value]) => this.setAttribute(key, value));
	// 	else removeAll(this.attributes);
	// }

	// specify undefined as value to delete format
	setStyleFormat(key, value) {
		if (value == null) delete this.formats.styles[key];
		else if (this.formats.styles[key] !== value) this.formats.styles[key] = value;
	}
	// setStyleFormats(props = {}) {
	// 	const entries = Object.entries(props);
	// 	if (entries.length) entries.forEach(([key, value]) => this.setStyleFormat(key, value));
	// 	else removeAll(this.formats.styles);
	// }

	// specify undefined as value to delete format
	setTextFormat(key, value) {
		if (value == null) delete this.formats.text[key];
		else if (this.formats.text[key] !== value) this.formats.text[key] = value;
	}
	// setTextFormats(props = {}) {
	// 	const entries = Object.entries(props);
	// 	if (entries.length) entries.forEach(([key, value]) => this.setTextFormat(key, value));
	// 	else removeAll(this.formats.text);
	// }
	// setFormats(props = {}) {
	// 	this.setTextFormats(props.text)
	// 	this.setStyleFormats(props.styles)
	// }
	// setProperties(props = {}) {
	// 	this.setFormats(props.formats);
	// 	this.setAttributes(props.attributes);
	// }

	merge(otherprops) {
		const changes = {};
		const formats = otherprops.formats;
		const changedAttributes = otherprops.attributes && merge(this.attributes, otherprops.attributes);
		if (changedAttributes) changes.attributes = changedAttributes;
		if (formats) {
			const changedText = formats.text && merge(this.formats.text, formats.text);
			const changedStyles = formats.styles && merge(this.formats.styles, formats.styles);
			if (changedText || changedStyles) {
				changes.formats = {};
				if (changedText) changes.formats.text = changedText;
				if (changedStyles) changes.formats.styles = changedStyles;
			}
		}
		// return this;
		return changes;
	}

	// TODO rename
	toDiffsProperties() {
		const formats = {};
		const attributes = getDiffsOf(this.attributes);
		formats.text = getDiffsOf(this.formats.text);
		formats.styles = getDiffsOf(this.formats.styles);
		return new Properties(attributes, formats);
	}
}

module.exports = Properties;
