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
const ObjectFactory = require('../../ObjectFactory');
const Strings = require('../../commons/Strings');

/**
 * A simple object to store arbitrary properties.</br>
 * General property types like <code>Boolean</code>, <code>Number</code> or <code>String</code> are
 * persisted automatically. Each other property must provide a <code>save(tagname, xmlwriter)</code>
 * and a <code>read(xmlnode)</code> method to support persistence.<br/>
 * <b>Note:</b>because this class implements <code>getClassName</code>, <code>save</code>
 * and <code>read</code>, it can be used as a value for an {{#crossLink
 * "ObjectExpression"}}{{/crossLink}}.
 *
 * @class State
 * @constructor
 */
class State {
	constructor() {
		this._state = {};
	}

	/**
	 * Returns the complete class String of this state instance. The class String is the name
	 * of the Attribute instance including its complete path, e.g. the class String of this general Attribute is
	 * <code>Attribute</code>.</br>
	 *
	 * @method getClassName
	 * @return {String} The complete class String of this State instance.
	 */
	getClassName() {
		return State.CLASSNAME;
	}

	/**
	 * Adds given property under specified name to this state object.<br/>
	 * If another property was previously stored under same name it will be replaced by given one.<br/>
	 * <b>Note:</b> for a custom object property the optional <code>classname</code> parameter must be provided. The
	 * class name must be fully qualified, i.e. it must include any namespace objects. To restore the
	 * custom property the provided class name will than be called with <code>new</code>.
	 *
	 * @method addProperty
	 * @param {String} name The name to store property under.
	 * @param {Object} property The property to store.
	 * @param {String} [classname] A class name to restore given property from XML.
	 * @return {Object} A formerly stored property or <code>undefined</code>.
	 */
	addProperty(name, property, classname) {
		const old = this.getProperty(name);
		this._state[name] = this._propEntry(name, property, classname);
		return old;
	}

	_propEntry(name, property, classname) {
		return {
			name,
			property,
			classname
		};
	}

	/**
	 * Returns the property which was stored under given name or <code>undefined</code>.
	 *
	 * @method getProperty
	 * @param {String} name The name of the property to look for.
	 * @return {Object} The stored property or <code>undefined</code>.
	 */
	getProperty(name) {
		const old = this._state[name];
		return old ? old.property : undefined;
	}

	/**
	 * Removes the property which is stored under given name.
	 *
	 * @method removeProperty
	 * @param {String} name The name of the property to remove.
	 * @return {Object} The removed property or <code>undefined</code> if none was removed.
	 */
	removeProperty(name) {
		const old = this.getProperty(name);
		if (old) {
			delete this._state[name];
		}
		return old;
	}

	// adds property if no property with given name was added before
	setProperty(name, property, classname) {
		let old = this._state[name];
		if (!old) {
			old = this._propEntry(name, property, classname);
			this._state[name] = old;
		}
		old.property = property;
		old.classname = classname || old.classname;
	}

	/**
	 * Copies this state object.<br/>
	 * <b>Note:</b> if a stored property object provides a <code>copy</code> method it will be copied too!
	 *
	 * @method copy
	 * @return {State} The copied state object.
	 */
	copy() {
		const copy = new State();
		const state = this._state;

		Object.keys(state).forEach((property) => {
			const entry = state[property];
			const propertyC = entry.property && entry.property.copy ? entry.property.copy() : entry.property;
			copy.addProperty(entry.name, propertyC, entry.classname);
		});

		return copy;
	}

	/**
	 * Saves this state object.
	 *
	 * @method save
	 * @param {Writer} writer Writer object to save to.
	 */
	save(writer) {
		const state = this._state;

		Object.keys(state).forEach((property) => {
			this.saveEntry(state[property], writer);
		});
	}

	/**
	 * Saves given state entry.<br/>
	 * The state entry is a tuple of <code>name</code>, <code>property</code> and <code>classname</code>
	 * properties.
	 *
	 * @method saveEntry
	 * @param {Object} entry The state object entry to store.
	 * @param {Writer} writer Writer object to save to.
	 */
	saveEntry(entry, writer) {
		writer.writeStartElement('prop');
		writer.writeAttributeString('n', entry.name);
		if (entry.property) {
			writer.writeAttributeString('t', this.typeFromEntry(entry));
			if (entry.property.save) {
				entry.property.save('v', writer);
			} else {
				writer.writeAttributeString('v', Strings.encode(entry.property.toString()));
			}
		}
		writer.writeEndElement();
	}

	/**
	 * Returns the type of given state object entry.<br/>
	 * The returned type string represents either one of the basic Javascript types like <code>Boolean</code>,
	 * <code>Number</code> or <code>String</code> or it represents a class name.
	 *
	 * @method typeFromEntry
	 * @param {Object} entry The state object entry to store.
	 * @return {String} A type string representing the kind of property given entry contains.
	 */
	typeFromEntry(entry) {
		let type = entry.classname || undefined;
		if (type === undefined) {
			type = typeof entry.property;
			if (type === 'number') {
				type = 'n';
			} else if (type === 'boolean') {
				type = 'b';
			} else {
				type = 's';
			}
		}
		return type;
	}

	/**
	 * Reads the content of this state object from given XML Node.
	 *
	 * @method read
	 * @param {Reader} reader Reader to use for reading.
	 * @param {Object} object Object to read.
	 */
	read(reader, object) {
		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'prop':
					this.readEntry(reader, child);
					break;
				default:
					break;
			}
		});
	}

	/**
	 * Reads an state object entry.
	 *
	 * @method readEntry
	 * @param {Reader} reader Reader to use for reading.
	 * @param {Object} object Object to read.
	 */
	readEntry(reader, object) {
		const name = reader.getAttribute(object, 'n');
		let type = reader.getAttribute(object, 't');
		let prop;

		if (type === 'b') {
			prop = Boolean(reader.getAttribute(object, 'v'));
			type = undefined;
		} else if (type === 'n') {
			prop = Number(reader.getAttribute(object, 'v'));
			type = undefined;
		} else if (type === 's') {
			prop = reader.getAttribute(object, 'v');
			type = undefined;
		} else {
			prop = this.readObject(type, reader, object);
		}
		this.addProperty(name, prop, type);
	}

	/**
	 * Reads a custom object.
	 *
	 * @method readObject
	 * @param {String} classname A fully qualified class name to construct the custom object from.
	 * @param {Reader} reader Reader to use for reading.
	 * @param {Object} object Object to read.
	 */
	readObject(classname, reader, object) {
		const obj = ObjectFactory.create(classname);
		if (obj && obj.read) {
			const child = reader.getObject(object, 'v');
			if (child) {
				obj.read(reader, child);
			}
		}
		return obj;
	}

	/**
	 * The complete class name, i.e. including namespace.
	 *
	 * @property CLASSNAME
	 * @type {String}
	 * @static
	 * @final
	 */
	static get CLASSNAME() {
		return 'State';
	}
}

module.exports = State;
