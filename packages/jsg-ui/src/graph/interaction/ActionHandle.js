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
import Cursor from '../../ui/Cursor';

/**
 * An ActionHandle simply defines a relationship between a cursor style and a custom type string. Its typically used
 * during a user interaction to decide which cursor should be shown as feedback.<br/>
 * For predefined type constants please refer to its subclasses, e.g. {{#crossLink
 * "SelectionHandle"}}{{/crossLink}}. And for predefined cursor styles see {{#crossLink
 * "Cursor.Style"}}{{/crossLink}}.
 *
 * @class ActionHandle
 * @constructor
 * @param {String} [type] An optional handle type. Passing <code>undefined</code> is allowed
 * @param {String} [cursor] An optional cursor, as defined by {{#crossLink "Cursor.Style"}}{{/crossLink}}.
 * If not defined {{#crossLink "Cursor.Style/AUTO:property"}}{{/crossLink}} is used.
 */
class ActionHandle {
	constructor(type, cursor) {
		this._type = type;
		this._cursor = cursor || Cursor.Style.AUTO;
	}

	/**
	 * Resets this handle. That means the the type is set to <code>undefined</code> and the cursor to
	 * {{#crossLink "Cursor.Style/AUTO:property"}}{{/crossLink}}.
	 *
	 * @method reset
	 */
	reset() {
		this._type = undefined;
		this._cursor = Cursor.Style.AUTO;
	}

	/**
	 * Returns the handle type.
	 *
	 * @method getType
	 * @return {String} The current handle type or <code>undefined</code> if no type is set.
	 */
	getType() {
		return this._type;
	}

	/**
	 * Sets the handle type. For predefined type constants please refer to subclasses, e.g.
	 * {{#crossLink "SelectionHandle"}}{{/crossLink}}.
	 *
	 * @method setType
	 * @param {String} type The new handle type.
	 */
	setType(type) {
		this._type = type;
	}

	/**
	 * Returns the current cursor style.
	 *
	 * @method getCursor
	 * @return {String} The current cursor style or <code>undefined</code> if not set.
	 */
	getCursor() {
		return this._cursor;
	}

	/**
	 * Sets a new cursor style. For predefined style constants please refer to {{#crossLink
	 * "Cursor.Style"}}{{/crossLink}}.
	 *
	 * @method setCursor
	 * @param {String} cursor The new cursor style.
	 */
	setCursor(cursor) {
		this._cursor = cursor;
	}

	/**
	 * Predefined action handle types.
	 *
	 * @class TYPE
	 * @constructor
	 */
	static get TYPE() {
		return {
			/**
			 * Classifies a handle of type link, used e.g. to activate a link execution.
			 *
			 * @property LINK
			 * @type {String}
			 * @static
			 */
			LINK: 'link',
			/**
			 * Classifies a handle of type edit, used e.g. in {{#crossLink
			 * "EditTextActivator"}}{{/crossLink}} to activate text editing.
			 *
			 * @property EDIT
			 * @type {String}
			 * @static
			 */
			EDIT: 'edit'
		}
	}
}

export default ActionHandle;
