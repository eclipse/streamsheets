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
const Strings = require('./Strings');

/**
 * This class provides static XML helper functions.
 *
 * @class XML
 * @constructor
 */
class XML {
	/**
	 * Iterates over all siblings of first child element of given parent node.<br/>
	 * For each visited child node the given callback function is called with provided <code>source</code> parameter and
	 * the current node.
	 *
	 * @method iterateChildren
	 * @param {Object} source The caller of this method which is passed to the callback.
	 * @param {Node} parent Parent node which should provide an element child to start iteration at.
	 * @param {Function} callback A function to call on each visited child node. The caller and the node are passed
	 * as parameters.
	 * @return {boolean} Returns true, of all elements have been iterated, false if the callback interrupted the
	 * enumeration.
	 * @deprecated
	 * @static
	 */
	static iterateChildren(source, parent, callback) {
		let pos = parent.firstElementChild;

		while (pos) {
			if (callback(source, pos) === false) {
				return false;
			}
			pos = pos.nextElementSibling;
		}

		return true;
	}

	/**
	 * Framework internal method to iterate over all siblings of first child element of given parent node in a semi
	 * asynchronous way.<br/>
	 * For each visited child node the given callback function is called with provided <code>source</code> parameter and
	 * the current node.
	 *
	 * @method iterateChildrenAsync
	 * @param {Object} source The caller of this method which is passed to the callback.
	 * @param {Node} parent Parent node which should provide an element child to start iteration at.
	 * @param {Function} callback A function to call on each visited child node. The caller and the node are passed
	 * as parameters.
	 * @param {Object} opts An option object with following properties:
	 * <ul>
	 *     <li><code>interval</code> - timeout interval in milliseconds</li>
	 *     <li><code>done</code> - the function to call after iteration finishes</li>
	 * </ul>
	 * @static
	 * @since 2.2.9
	 * @deprecated currently marked as EXPERIMENTAL
	 */
	static iterateChildrenAsync(source, parent, callback, opts) {
		let pos;
		const interval = opts.interval || 0;
		let timeout = Date.now() + interval;

		/* eslint-disable no-use-before-define */
		const iterate = () => {
			pos = pos ? pos.nextElementSibling : parent.firstElementChild;
			if (pos) {
				callback(source, pos);
				next();
			} else if (opts.done) {
				opts.done();
			}
		};
		const next = () => {
			if (interval && Date.now() < timeout) {
				iterate();
			} else {
				timeout = interval ? Date.now() + interval : 0;
				setTimeout(iterate);
			}
		};
		next();
		/* eslint-enable no-use-before-define */
	}

	static iterateChildNodes(source, parent, callback) {
		let i;
		let n;
		let item;

		for (i = 0, n = parent.childNodes.length; i < n; i += 1) {
			item = parent.childNodes.item(i);
			if (callback(source, item) === false) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Returns the first child element with given <code>tagname</code> (a.k.a. node name) of specified XML node or
	 * <code>undefined</code> if none could be found.
	 *
	 * @method findElementByTagName
	 * @param {Node} xmlnode The XML node to traverse the child nodes of.
	 * @param {String} tagname The element name to look for.
	 * @return {Node} A matching child node or <code>undefined</code>.
	 * @static
	 */
	static findElementByTagName(xmlnode, tagname) {
		let i;
		let n;
		let item;

		// returns the first element which matches given tagname or undefined if none could be found
		if (xmlnode && xmlnode.hasChildNodes()) {
			for (i = 0, n = xmlnode.childNodes.length; i < n; i += 1) {
				item = xmlnode.childNodes.item(i);
				if (Strings.areEqualIgnoreCase(item.nodeName, tagname)) {
					return item;
				}
			}
		}
		return undefined;
	}

	/**
	 * Returns a list of child elements of specified XML node which match the given <code>tagname</code> (a.k.a. node
	 * name).
	 *
	 * @method findAllElementsByTagName
	 * @param {Node} xmlnode The XML node to traverse the child nodes of.
	 * @param {String} tagname The element name to look for.
	 * @return {Array} A list of matching child nodes.
	 * @static
	 */
	static findAllElementsByTagName(xmlnode, tagname) {
		let i;
		let n;
		let item;
		const elements = [];

		if (xmlnode && xmlnode.hasChildNodes()) {
			for (i = 0, n = xmlnode.childNodes.length; i < n; i += 1) {
				item = xmlnode.childNodes.item(i);
				if (Strings.areEqualIgnoreCase(item.nodeName, tagname)) {
					elements.push(item);
				}
			}
		}
		return elements;
	}

	/**
	 * Utility method to read an attribute from given node. If attribute is not present an optional default value
	 * is returned.
	 *
	 * @method readAttributeNumber
	 * @param {Node} xmlnode The XML node to read the attribute of.
	 * @param {String} name The attribute name to look for.
	 * @param {Number} [defvalue] An optional number to return if specified attribute is not present.
	 * @return {Number} Either the specified number attribute or given default value or <code>undefined</code>
	 * @static
	 * @deprecated
	 * @since 1.6.43
	 */
	static readAttributeNumber(xmlnode, name, defvalue) {
		const nrstr = xmlnode.getAttribute(name);
		return nrstr !== null ? Number(nrstr) : defvalue;
	}
}

module.exports = XML;
