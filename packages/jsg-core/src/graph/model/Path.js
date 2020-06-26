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

/**
 * A <code>Path</code> is build of several {{#crossLink "GraphItem"}}{{/crossLink}}-IDs and
 * therefore represents a unique <code>GraphItem</code>'s path within its {{#crossLink
 * "Graph"}}{{/crossLink}}. A path can simply be traversed by using {{#crossLink
 * "Path/nextId:method"}}{{/crossLink}}.</br> Note: each <code>GraphItem</code> provides a {{#crossLink
 * "GraphItem/createPath:method"}}{{/crossLink}} method to easily create a new <code>Path</code>
 * instance.
 *
 *
 * @class Path
 * @constructor
 */
class Path {
	constructor() {
		this._path = [];
	}

	/**
	 * Creates a new <code>Path</code> instance from given string.</br>
	 * Note: the passed string should be create by {{#crossLink "Path/toString:method"}}{{/crossLink}}
	 *
	 * @method fromString
	 * @param {String} str A string to create a new <code>Path</code> instance from.
	 * @return {Path} A new <code>Path</code> instance.
	 * @deprecated WORK IN PROGRESS! Don't use, currently returns undefined!
	 * @static
	 */
	static fromString(str) {
		// TODO (ah) parse str...
		return undefined;
	}

	/**
	 * Returns the common prefix <code>Path</code> of given paths. If passed paths have no prefix in common
	 * <code>undefined</code> is returned.
	 *
	 * @method getCommonPrefix
	 * @param {Path} path1 First path to check prefix from.
	 * @param {Path} path2 Second path to check prefix from.
	 * @return {Path} The common prefix or <code>undefined</code>
	 * @static
	 */
	static getCommonPrefix(path1, path2) {
		let prefix;

		if (path1 !== undefined && path2 !== undefined) {
			prefix = new Path();
			const walkingPath = path1._path.length < path2._path.length ? path1 : path2;
			const comparePath = walkingPath === path2 ? path1 : path2;
			let i;

			for (i = 0; i < walkingPath._path.length; i += 1) {
				if (walkingPath._path[i] === comparePath._path[i]) {
					prefix.addId(walkingPath._path[i]);
				} else {
					break;
				}
			}
		}
		return prefix;
	}

	/**
	 * Adds given id to this path.
	 *
	 * @method addId
	 * @param {String} id The id to add.
	 */
	addId(id) {
		this._path.push(id);
	}

	/**
	 * Removes and returns next id from this path, starting at first added id. If no IDs are available
	 * <code>undefined</code> is returned. Returned id is removed from path.
	 * See {{#crossLink "Path/peekNextId:method"}}{{/crossLink}} too.
	 *
	 * @method nextId
	 * @return {String} The next Id within this path or <code>undefined</code> if path has no more IDs.
	 */
	nextId() {
		return this._path.length === 0 ? undefined : this._path.shift();
	}

	/**
	 * Checks if this path has IDs.
	 *
	 * @method hasNextId
	 * @return {Boolean} <code>true</code> if this path has IDs, <code>false</code> otherwise
	 */
	hasNextId() {
		return this._path.length !== 0;
	}

	/**
	 * Returns the next id of this path without removing it from the path.
	 * See {{#crossLink "Path/nextId:method"}}{{/crossLink}} too.
	 *
	 * @method peekNextId
	 * @return {String} The next Id within this path or <code>undefined</code> if path has no more IDs.
	 * @since 2.0.5
	 */
	peekNextId() {
		return this._path.length === 0 ? undefined : this._path[0];
	}

	/**
	 * Checks if this path contains given id.
	 *
	 * @method containsId
	 * @param {String} id The id to check.
	 * @return {Boolean} <code>true</code> if this path contains given id, <code>false</code> otherwise
	 */
	containsId(id) {
		let contained = false;
		let i;
		let n;

		for (i = 0, n = this._path.length; i < n; i += 1) {
			if (this._path[i] === id) {
				contained = true;
				break;
			}
		}
		return contained;
	}

	/**
	 * Returns a string representation of this path. This string can be used to create a new path instance
	 * from. See {{#crossLink "Path/fromString:method"}}{{/crossLink}}
	 *
	 * @method toString
	 * @return {String} A string representation of this path.
	 */
	toString() {
		let str = '';
		const last = this._path.length - 1;
		const delimiter = ':';

		this._path.forEach((path, i) => {
			str += path;
			if (i < last) {
				str += delimiter;
			}
		});

		return str;
	}
}

module.exports = Path;
