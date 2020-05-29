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
import { default as JSG } from '@cedalo/jsg-core';
import ActionHandle from '../../interaction/ActionHandle';

/**
 * A SelectionHandle is a simple data class which provides additional information for a corresponding
 * {{#crossLink "Interaction"}}{{/crossLink}} or a corresponding
 * {{#crossLink "InteractionActivator"}}{{/crossLink}}. The SelectionHandle is defined by the
 * current active {{#crossLink "SelectionHandler"}}{{/crossLink}} and can be globally accessed
 * via the
 * {{#crossLink "SelectionView"}}{{/crossLink}}.
 *
 * @class SelectionHandle
 * @extends ActionHandle
 * @constructor
 * @param {String} [type] The type of this handle. Should be one of the predefined constants.
 * @param {String} [cursor] The cursor style which represents this handle. See {{#crossLink
 *     "Cursor.Style"}}{{/crossLink}}.
 * @param {Number} [index] The point index to use which signals a direction.
 */
class SelectionHandle extends ActionHandle {
	constructor(type, cursor, index) {
		super(type, cursor);
		this._pointIndex = index !== undefined ? index : -1;
	}

	/**
	 * Resets this handle. Should be called before it is reused.<br/>
	 * Note: this cannot reset custom added properties.
	 *
	 * @method reset
	 */
	reset() {
		super.reset();
		this._pointIndex = -1;
	}

	/**
	 * Returns the current point index. A point index of -1 signals that it was not set.
	 *
	 * @method getPointIndex
	 * @return {Number} The current point index.
	 */
	getPointIndex() {
		return this._pointIndex;
	}

	/**
	 * Sets the new point index.
	 *
	 * @method setPointIndex
	 * @param {Number} index The new point index to use.
	 */
	setPointIndex(index) {
		this._pointIndex = index;
	}

	/**
	 * Predefined handle types.
	 *
	 * @class TYPE
	 * @constructor
	 * @static
	 */
	static get TYPE() {
		return {
			/**
			 * Classifies a handle of type move, used e.g. in {{#crossLink
			 * "MoveActivator"}}{{/crossLink}}.
			 *
			 * @property MOVE
			 * @type {String}
			 * @static
			 */
			MOVE: 'move',
			/**
			 * Classifies a handle of type execute, used e.g. in {{#crossLink
			 * "LinkActivator"}}{{/crossLink}}.
			 *
			 * @property EXECUTE
			 * @type {String}
			 * @static
			 */
			EXECUTE: 'execute',
			/**
			 * Classifies a handle of type command.
			 *
			 * @property COMMAND
			 * @type {String}
			 * @static
			 */
			COMMAND: 'command',
			/**
			 * Classifies a handle of type resize, used e.g. in {{#crossLink
			 * "ResizeActivator"}}{{/crossLink}}.
			 *
			 * @property RESIZE
			 * @type {String}
			 * @static
			 */
			RESIZE: 'resize',
			/**
			 * Classifies a handle of type reshape, used e.g. in {{#crossLink
			 * "ReshapeActivator"}}{{/crossLink}}.
			 *
			 * @property RESHAPE
			 * @type {String}
			 * @static
			 */
			RESHAPE: 'reshape',
			/**
			 * Classifies a handle of type rotate, used e.g. in {{#crossLink
			 * "RotateActivator"}}{{/crossLink}}.
			 *
			 * @property ROTATE
			 * @type {String}
			 * @static
			 */
			ROTATE: 'rotate',
			/**
			 * Classifies a handle of type edittext, used e.g. in {{#crossLink
			 * "EditTextActivator"}}{{/crossLink}}.
			 *
			 * @property EDITTEXT
			 * @type {String}
			 * @static
			 */
			EDITTEXT: 'edittext'
		};
	}
	/**
	 * Predefined point indices. These indices can be used to specify a direction. The index is started at north-west and
	 * then counted clockwise up to west.
	 *
	 * @class INDEX
	 * @constructor
	 * @static
	 */
	static get INDEX() {
		return {
			/**
			 * Direction north-west.
			 *
			 * @property NW
			 * @type {Number}
			 * @static
			 */
			NW: 0,
			/**
			 * Direction north.
			 *
			 * @property N
			 * @type {Number}
			 * @static
			 */
			N: 1,
			/**
			 * Direction north-east.
			 *
			 * @property NE
			 * @type {Number}
			 * @static
			 */
			NE: 2,
			/**
			 * Direction east.
			 *
			 * @property E
			 * @type {Number}
			 * @static
			 */
			E: 3,
			/**
			 * Direction south-east.
			 *
			 * @property SE
			 * @type {Number}
			 * @static
			 */
			SE: 4,
			/**
			 * Direction south.
			 *
			 * @property S
			 * @type {Number}
			 * @static
			 */
			S: 5,
			/**
			 * Direction south-west.
			 *
			 * @property SW
			 * @type {Number}
			 * @static
			 */
			SW: 6,
			/**
			 * Direction west.
			 *
			 * @property W
			 * @type {Number}
			 * @static
			 */
			W: 7
		};
	}
}

export default SelectionHandle;
