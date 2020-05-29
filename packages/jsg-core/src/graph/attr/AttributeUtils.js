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


/**
 *
 * @class AttributeUtils
 * @constructor
 */
class AttributeUtils {
	/**
	 * Creates an Attribute path for the given attribute name. The returned path references an ItemAttribute
	 * and therefore the passed name should be a defined name of an ItemAttribute.<br/>
	 * See {{#crossLink "ItemAttributes"}}{{/crossLink}}
	 *
	 * @method createItemAttributePath
	 * @param {String} attrname The name of the item Attribute to create the Attribute path for.
	 * @return {String} An Attribute path.
	 * @static
	 */
	static createItemAttributePath(attrname) {
		/* eslint-disable global-require */
		return (
			require('./ItemAttributes').NAME +
			require('./Attribute').PATH_DELIMITER +
			attrname
		);
		/* eslint-enable global-require */
	}

	/**
	 * Creates an Attribute path for the given attribute name. The returned path references an TextFormatAttribute
	 * and therefore the passed name should be a defined name of a TextFormatAttribute.<br/>
	 * See {{#crossLink "TextFormatAttributes"}}{{/crossLink}}
	 *
	 * @method createTextAttributePath
	 * @param {String} attrname The name of the item text format Attribute to create the Attribute path for.
	 * @return {String} An Attribute path.
	 * @static
	 */
	static createTextAttributePath(attrname) {
		/* eslint-disable global-require */
		return (
			require('./TextFormatAttributes').NAME +
			require('./Attribute').PATH_DELIMITER +
			attrname
		);
		/* eslint-enable global-require */
	}

	/**
	 * Creates an Attribute path from given path strings. The strings should be given either as an
	 * Array or as an enumeration?
	 *
	 * @method createPath
	 * @param {Array | String...} parts The parts to create the Attribute path from.
	 * @return {String} An Attribute path.
	 * @static
	 */
	static createPath(...args) {
		let path = '';

		if (args.length > 1) {
			const elements = Array.isArray(args[0])
				? args[0]
				: Array.prototype.slice.call(args);
			/* eslint-disable global-require */
			path = elements.join(require('./Attribute').PATH_DELIMITER);
			/* eslint-enable global-require */
		}
		return path;
	}

	/**
	 * Looks up an Attribute specified by the given path starting at given AttributeList. That means
	 * the path must be relative to the AttributeList.
	 *
	 * @method findAttributeByPath
	 * @param {String} path An Attribute path.
	 * @param {AttributeList} inAttributes The AttributeList to start the look up at.
	 * @return {Attribute} The referenced Attribute or <code>undefined</code> if none
	 * could be found.
	 * @static
	 */
	static findAttributeByPath(path, inAttributes) {
		/* eslint-disable global-require */
		const parts = path
			? path.split(require('./Attribute').PATH_DELIMITER)
			: [];
		/* eslint-enable global-require */
		return parts.length > 0
			? this._lookUpAttribute(parts, inAttributes)
			: undefined;
	}

	/**
	 * Looks up the Attribute specified by given path array, starting at given AttributeList.
	 *
	 * @method _lookUpAttribute
	 * @param {Array} path Path parts.
	 * @param {Boolean} [addAll] An optional flag to indicate that an <code>AttributeList</code> should be created for
	 *     each part of the path which does not exist.
	 * @return {Attribute} The referenced Attribute or <code>undefined</code> if none was found.
	 * @private
	 */
	static _lookUpAttribute(path, attributes, addAll) {
		if (path.length === 0 || attributes === undefined) {
			return attributes;
		}
		const name = path.shift();
		/* eslint-disable global-require */
		const AttributeList = require('./AttributeList');
		/* eslint-enable global-require */

		let attr;

		if (this._same(name, attributes.getName())) {
			attr = attributes;
		} else {
			attr =
				attributes instanceof AttributeList
					? attributes.getAttribute(name)
					: undefined;
		}

		if (!attr && addAll) {
			attr = attributes.addAttribute(new AttributeList(name));
		}
		return this._lookUpAttribute(path, attr, addAll);
	}

	static _same(name1, name2) {
		return name1 === name2 || name1.toUpperCase() === name2.toUpperCase();
	}

	static _getParentPath(path, attribute) {
		const name = attribute.getName();
		const cutIndex = path.indexOf(name, path.length - name.length);
		if (cutIndex !== -1) {
			// cut off attribute name...
			path = path.substring(0, cutIndex - 1);
		}
		return path;
	}

	/**
	 * Removes the Attribute specified by given path within given AttributeList.
	 *
	 * @method removeAttributeAtPath
	 * @param {String} path A complete Attribute path, i.e. path includes Attribute name.
	 * @param {AttributeList} inAttributes The AttributeList to start the parent look up at.
	 * @return {Attribute} The removed Attribute or <code>undefined</code>
	 * @static
	 */
	static removeAttributeAtPath(path, inAttributes) {
		const attribute = this.findAttributeByPath(path, inAttributes);
		return this.removeAttribute(attribute);
	}

	/**
	 * Removes specified Attribute.
	 *
	 * @method removeAttribute
	 * @param {Attribute} attribute The Attribute to remove.
	 * @return {Attribute} The removed Attribute or <code>undefined</code>
	 * @static
	 */
	static removeAttribute(attribute) {
		const list = attribute !== undefined ? attribute._list : undefined;
		return list !== undefined ? list.removeAttribute(attribute) : undefined;
	}

	// =================================================================================================
	// API INTERNAL METHODS
	//

	/**
	 * Adds all attributes of given <code>fromList</code> to given <code>toList</code> without sending an event.</br>
	 * <b>Note: this is an API internal method!</b> Its usage is discouraged.
	 *
	 * @method addAll
	 * @param {AttributeList} fromList The list which provides the attributes to add.
	 * @param {AttributeList} toList The list to add the attributes to.
	 * @return {Boolean} <code>true</code> if at least one attribute was added.
	 * @static
	 * @private
	 */
	static addAll(fromList, toList) {
		let changed = false;
		const toValue = toList._value;

		function visit(id, attr) {
			const newAttribute = attr.copy();
			const oldAttribute = toValue.putElement(
				newAttribute.getName(),
				newAttribute
			);
			if (oldAttribute !== undefined && oldAttribute !== attr) {
				changed = true;
				oldAttribute._list = undefined;
			}
		}

		fromList._value.iterate(visit);
		return changed;
	}

	static readAttribute(reader, name, object, list) {
		let attribute;

		if (name === 'at' || name === 'al') {
			attribute = this._createAttributeFrom(reader, name, object, list);
			if (attribute !== undefined) {
				attribute.read(reader, object);
			}
		}
		return attribute;
	}

	static _createAttributeFrom(reader, name, object, list) {
		let attribute;
		const classname = reader.getAttribute(object, 'cl');

		if (classname) {
			attribute = ObjectFactory.create(classname);
		} else if (list) {
			attribute = list.getAttribute(reader.getAttribute(object, 'n'));
			// read-in/overwrite a parent/template attribute, so:
			if (attribute) {
				attribute = attribute.isConst
					? attribute.toAttribute()
					: attribute.copy(); // toList();
			}
		}
		if (attribute === undefined) {
			name = reader.getObject(object, 'vl') ? 'at' : 'al';
			attribute = this._createDefaultAttribute(name);
		}

		return attribute;
	}

	static _createDefaultAttribute(name) {
		/* eslint-disable global-require */
		let classname;

		if (name === 'at') {
			classname = require('./Attribute').CLASSNAME;
		} else {
			classname =
				name === 'al'
					? require('./AttributeList').CLASSNAME
					: undefined;
		}
		/* eslint-enable global-require */
		return classname ? ObjectFactory.create(classname) : undefined;
	}

	//
	// ~ API INTERNAL METHODS
	// =================================================================================================
}

module.exports = AttributeUtils;
