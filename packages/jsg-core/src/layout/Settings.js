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
const Strings = require('../commons/Strings');

/**
 * A simple object to store key-value pairs.<br/>
 * Instances of this class can be used by {{#crossLink "Layout"}}{{/crossLink}}s to store their layout
 * settings. Values should be registered and retrieved via the provided {{#crossLink
 * "Settings/set:method"}}{{/crossLink}} and {{#crossLink
 * "Settings/get:method"}}{{/crossLink}} methods.<br/> A <code>Settings</code> object can be stored as
 * a layout attribute by wrapping it into a
 * {{#crossLink "ObjectAttribute"}}{{/crossLink}} and then add it to the {{#crossLink
 * "LayoutAttributes"}}{{/crossLink}} list of a {{#crossLink
 * "GraphItem"}}{{/crossLink}}. To customize persistence subclasses can override the {{#crossLink
 * "Settings/saveValue:method"}}{{/crossLink}} and
 * {{#crossLink "Settings/readValue:method"}}{{/crossLink}} methods. Note that a subclass has to
 * override
 * {{#crossLink "Settings/getClassName:method"}}{{/crossLink}} too.<br/>
 * To support sharing of certain settings it is possible to build a simple inheritance hierarchy of
 * <code>Settings</code> objects. A sub-<code>Settings</code> can be created via {{#crossLink
 * "Settings/derive:method"}}{{/crossLink}}.
 *
 * @class Settings
 * @constructor
 * @since 1.6.18
 */
// eslint-disable-next-line func-names
const Settings = function() {
	this._settings = {};
};

Settings.prototype = {
	/**
	 * The base inner settings object. Should always be empty and never be changed.
	 * @type {Object}
	 * @private
	 */
	_settings: {}, // empty settings object just to prevent checking for existing...
	/**
	 * Calls the <code>get</code> method of the parent <code>Settings</code> object.
	 * @method _get
	 * @param {String} key The key to get the value for.
	 * @return {Object} The value which was registered for given key or <code>undefined</code>.
	 * @private
	 * @since 2.0.7
	 */
	_get(key) {
		const base = Object.getPrototypeOf(this);
		return base.get && base.get(key);
	},
	/**
	 * Calls the parent <code>keys</code>.
	 * @method _keys
	 * @return {Array} A list of all currently used keys.
	 * @private
	 * @since 2.0.7
	 */
	_keys() {
		const base = Object.getPrototypeOf(this);
		return base.keys && base.keys();
	},
	_has(key) {
		const base = Object.getPrototypeOf(this);
		return !!(base.has && base.has(key));
	},
	/**
	 * Checks if given key is registered.
	 * @method has
	 * @param {String} key The key to check for.
	 * @return {Boolean} <code>True</code> if a value for given key is registered, <code>false</code> otherwise.
	 * @since 2.1.0.8
	 */
	has(key) {
		return this._settings.hasOwnProperty(key) || this._has(key);
	},
	/**
	 * Retrieves the value for given key. If no value was stored under given key the optional default value is returned.
	 * @method get
	 * @param {String} key The key to get the value for.
	 * @param {Object} [defval] An optional value to return if no value was stored under given key.
	 * @return {Object} The value for given key or <code>undefined</code>.
	 */
	get(key, defval) {
		let val = this._settings[key];
		// check prototype:
		val = val === undefined ? this._get(key) : val;
		return val === undefined ? defval : val;
	},
	/**
	 * Stores given value for specified key.<br/>
	 * <b>Note:</b> values of type <code>Object</code> should provide a <code>copy</code> method in order to make
	 * {{#crossLink "Settings/copy:method"}}{{/crossLink}} work.
	 * @method set
	 * @param {String} key The key under which the value should be stored.
	 * @param {Object} value The value to store.
	 * @return {Settings} This settings instance as convenience.
	 */
	set(key, value) {
		if (key != null) {
			// check if value is stored in prototype already:
			if (value === this._get(key)) {
				delete this._settings[key];
			} else {
				this._settings[key] = value;
			}
		}
		return this;
	},
	/**
	 * Returns all currently used keys. This includes all keys defined in an optional parent <code>Settings</code>
	 * object.
	 * @method keys
	 * @return {Array} A list of all currently used keys.
	 * @since 2.0.7
	 */
	keys() {
		const keys = [];
		const basekeys = this._keys();
		if (basekeys) {
			keys.push(...basekeys);
		}
		Object.keys(this._settings).forEach((prop) => {
			if (keys.indexOf(prop) < 0) {
				keys.push(prop);
			}
		});
		return keys;
	},
	/**
	 * Adds all key-value pairs from given settings object. Note that this will replace any previously stored values for
	 * matching keys.
	 * @method addAll
	 * @param {Settings} settings A <code>Settings</code> object to add.
	 * @return {Settings} This settings instance as convenience.
	 */
	addAll(settings) {
		const keys = settings.keys();
		keys.forEach((key) => {
			this.set(key, settings.get(key));
		});
		return this;
	},
	/**
	 * Creates a copy of this settings instance.<br/>
	 * <b>Note:</b> the returned <code>Settings</code> object has the same parent as this instance. Furthermore
	 * note that the values of type <code>Object</code> are only copied if they provide a <code>copy</code> method.
	 * @method copy
	 * @return {Settings} A new settings instance.
	 */
	copy() {
		const base = Object.getPrototypeOf(this);
		const copy = base.derive();
		// copy.addAll(this);
		Object.keys(this._settings).forEach((prop) => {
			let val = this._settings[prop];
			if (val) {
				val = typeof val.copy === 'function' ? val.copy() : val;
				copy.set(prop, val);
			}
		});

		return copy;
	},
	/**
	 * Creates a new <code>Settings</code> object based on this instance, i.e. this <code>Settings</code> object is the
	 * parent of the created <code>Settings</code> object and all its key/value pairs are visible within returned
	 * <code>Settings</code>.F<br/>
	 * @method derive
	 * @return {Object}
	 * @since 2.0.7
	 */
	derive() {
		const sub = Object.create(this);
		sub._settings = {};
		return sub;
	},
	// /**
	//  * Checks if this settings instance equals given one. Note: the comparison of each value is done via
	//  * {{#crossLink "Settings/isEqual:method"}}{{/crossLink}} work.
	//  *
	//  * @method equalsTo
	//  * @param {Settings} other The settings instance to check against.
	//  * @return {Boolean} Returns <code>true</code> if both instances have the same keys and values,
	// <code>false</code> otherwise. */ equalsTo: function (other) { var prop, isEqual = false; for (prop in
	// this._settings) { if (this._settings.hasOwnProperty(prop)) { if (!(isEqual = this.isEqual(prop,
	// this._settings[prop], other))) { break; } } } return isEqual; },
	/**
	 * Returns the complete name of this class, i.e. with its complete namespace.<br/>
	 * Method required by {{#crossLink "ObjectExpression"}}{{/crossLink}} in order to use and store a
	 * <code>Settings</code> object as an {{#crossLink "ObjectAttribute"}}{{/crossLink}} for an
	 * {{#crossLink "AttributeList"}}{{/crossLink}}. Subclasses must override this method to return their
	 * correct class-name.
	 *
	 * @method getClassName
	 * @return {String} The complete class name.
	 */
	getClassName() {
		return 'Settings';
	},
	/**
	 * Stores keys and values of this settings object to XML.<br/>
	 * Method required by {{#crossLink "ObjectExpression"}}{{/crossLink}} in order to use and store a
	 * <code>Settings</code> object as an {{#crossLink "ObjectAttribute"}}{{/crossLink}} for an
	 * {{#crossLink "AttributeList"}}{{/crossLink}}.<br/>
	 * To customize saving and loading of values it is recommended to override
	 * {{#crossLink "Settings/saveValue:method"}}{{/crossLink}}
	 * and {{#crossLink "Settings/readValue:method"}}{{/crossLink}}.
	 *
	 * @method save
	 * @param {Writer} writer Writer object to save to.
	 */
	save(writer) {
		Object.keys(this._settings).forEach((prop) => {
			const value = this._settings[prop];
			if (value !== undefined) {
				// specify type => save key, value as string and type...
				const valtype = this._typeOf(value);
				if (valtype) {
					writer.writeStartElement('vl');
					writer.writeAttributeString('k', prop);
					writer.writeAttributeString('t', valtype);
					writer.writeAttributeString('v', Strings.encode(this.saveValue(prop, value)));
					writer.writeEndElement();
				}
			}
		});
	},
	// /**
	//  * Checks if a value is equal to a corresponding value of another given <code>Settings</code> object. Comparison
	// is done * by <code>===</code>.<br/> * Subclasses can override to customize this behaviour. * * @method isEqual *
	// @param {String} key The key for the value to compare. * @param {Object} value The value to compare. * @param
	// {Settings} other A <code>Settings</code> object which defines the other value to compare. *
	// @return {Boolean} Returns <code>true</code> if both values are equal or <code>false</code> otherwise. */
	// isEqual: function (key, value, other) { return value === (other ? other.get(key) : undefined); },
	/**
	 * Returns a character which classifies the type of given value.
	 *
	 * @method _typeOf
	 * @param {Object} value The value to classify..
	 * @return {String} A corresponding character or <code>undefined</code>
	 * @private
	 */
	_typeOf(value) {
		let type = typeof value;
		if (type === 'number') {
			type = 'n';
		} else if (type === 'boolean') {
			type = 'b';
		} else if (type === 'string') {
			type = 's';
		} else if (type === 'object') {
			type = 'o';
		} else {
			type = undefined;
		}
		return type;
	},
	/**
	 * Called by {{#crossLink "Settings/save:method"}}{{/crossLink}} to get a string representation of
	 * given value. Please note that it is not required to encode returned string since this is done by calling method.
	 *
	 * @method saveValue
	 * @param {String} key The key under which given value is registered for this <code>Settings</code> object.
	 * @param {Object} value The value to stringify.
	 * @return {String} A string representation of given value.
	 */
	saveValue(key, value) {
		return value.toString();
	},

	/**
	 * Reads keys and values from given Node.<br/>
	 * To customize saving and loading of values it is recommended to override {{#crossLink
	 * "Settings/saveValue:method"}}{{/crossLink}} and {{#crossLink
	 * "Settings/readValue:method"}}{{/crossLink}}.<br/> Method required by {{#crossLink
	 * "ObjectExpression"}}{{/crossLink}} in order to use and store a
	 * <code>Settings</code> object as an {{#crossLink "ObjectAttribute"}}{{/crossLink}} for an
	 * {{#crossLink "AttributeList"}}{{/crossLink}}.
	 *
	 * @method read
	 * @param {Reader} reader Reader to use for reading.
	 * @param {Object} object Object to read.
	 */
	read(reader, object) {
		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'vl':
					this.readSetting(reader, child);
					break;
				default:
					break;
			}
		});
	},
	/**
	 * Reads key and value and adds them to this <code>Settings</code> object.
	 *
	 * @method readSetting
	 * @param {Node} node Node to read from.
	 */
	readSetting(reader, object) {
		const key = reader.getAttribute(object, 'k');
		const type = reader.getAttribute(object, 't');
		let value = reader.getAttribute(object, 'v');
		value = value ? Strings.decode(value) : value;
		value = this.readValue(key, value, type);
		this.set(key, value);
	},
	/**
	 * Called by {{#crossLink "Settings/readSetting:method"}}{{/crossLink}} to restore a value from
	 * given string and key. Please note that it is not required to decode passed string since this is done by calling
	 * method.
	 *
	 * @method readValue
	 * @param {String} key The key under which returned value should be registered to this <code>Settings</code>
	 *     object.
	 * @param {String} valuestr The string representation of the value to restore.
	 * @param {String} valuetype A value type hint like <code>b</code> for <code>Boolean</code>, <code>n</code> for
	 *     <code>Number</code>,
	 * <code>s</code> for <code>String</code> or <code>o</code> for general <code>Object</code>.
	 * @return {Object} The restored value.
	 */
	readValue(key, valuestr, valuetype) {
		let value = valuestr;
		if (valuetype === 'b') {
			value = Boolean(valuestr);
		} else if (valuetype === 'n') {
			value = Number(valuestr);
		}
		return value;
	}
};

module.exports = Settings;
