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
const style = {
	/**
	 * Automatic cursor style (usually an arrow).
	 * @property {String} AUTO
	 */
	AUTO: 'auto',
		/**
		 * Crosshair cursor style. E.g. used for polygon editing.
		 * @property {String} CROSSHAIR
		 */
		CROSSHAIR: 'crosshair',
	/**
	 * Move cursor style.
	 * @property {String} MOVE
	 */
	MOVE: 'move',
	/**
	 * Link cursor style. A hand symbol usually used by visual representations of
	 * {{#crossLink "GraphItem"}}{{/crossLink}}s containing a link.
	 * @property {String} LINK
	 */
	EXECUTE: 'pointer',
	/**
	 * Text edit cursor style.
	 * @property {String} TEXT
	 */
	TEXT: 'text',
	/**
	 * Resize cursor style for direction east.
	 * @property {String} RESIZE_E
	 */
	RESIZE_E: 'e-resize',
	/**
	 * Resize cursor style for direction west.
	 * @property {String} RESIZE_W
	 */
	RESIZE_W: 'w-resize',
	/**
	 * Resize cursor style for direction north.
	 * @property {String} RESIZE_N
	 */
	RESIZE_N: 'n-resize',
	/**
	 * Resize cursor style for direction south.
	 * @property {String} RESIZE_S
	 */
	RESIZE_S: 's-resize',
	/**
	 * Resize cursor style for direction north-east.
	 * @property {String} RESIZE_NE
	 */
	RESIZE_NE: 'ne-resize',
	/**
	 * Resize cursor style for direction north-west.
	 * @property {String} RESIZE_NW
	 */
	RESIZE_NW: 'nw-resize',
	/**
	 * Resize cursor style for direction south-east.
	 * @property {String} RESIZE_SE
	 */
	RESIZE_SE: 'se-resize',
	/**
	 * Resize cursor style for direction south-west
	 * @property {String} RESIZE_SW
	 */
	RESIZE_SW: 'sw-resize',
	/**
	 * A small crosshair cursor style.</br>
	 * Note: custom cursor style.
	 * @property {String} CROSS
	 */
	CROSS: 'crosshair',
	/**
	 * Rotation cursor style.</br>
	 * Note: custom cursor style. Defaults to {{#crossLink "Cursor.Style/MOVE:property"}}{{/crossLink}} if
	 * no custom style is present.
	 * @property {String} ROTATION
	 */
	ROTATE: 'move',
	/**
	 * Sheet Cursor.</br>
	 * Note: custom cursor style.
	 * @property {String} SHEET
	 */
	SHEET: 'sheet',
	/**
	 * Sheet Cursor.</br>
	 * Note: custom cursor style.
	 * @property {String} SHEETCOLUMN
	 */
	SHEETCOLUMN: 'sheetcolumn',
	/**
	 * Sheet Cursor.</br>
	 * Note: custom cursor style.
	 * @property {String} SHEETROW
	 */
	SHEETROW: 'sheetrow',
	/**
	 * Sheet Cursor.</br>
	 * Note: custom cursor style.
	 * @property {String} SHEETCOLUMNSIZE
	 */
	SHEETCOLUMNSIZE: 'sheetcolumnsize',
	/**
	 * Sheet Cursor.</br>
	 * Note: custom cursor style.
	 * @property {String} SHEETROWSIZE
	 */
	SHEETROWSIZE: 'sheetrowsize',
	/**
	 * Deny action cursor.</br>
	 * Note: custom cursor style.
	 * @property {String} DENY
	 */
	DENY: 'deny',
	/**
	 * Copy action cursor.</br>
	 * @property {String} COPY
	 * @since 2.1.0.2
	 */
	COPY: 'copy',
	/**
	 * Split action cursor.</br>
	 * Note: custom cursor style.
	 * @property {String} SPLITV
	 */
	SPLITV: 'splitv',
	/**
	 * Split action cursor.</br>
	 * Note: custom cursor style.
	 * @property {String} SPLITH
	 */
	SPLITH: 'splith',

	/**
	 * Format painter action cursor.</br>
	 * Note: custom cursor style.
	 * @property {String} FORMATPAINTER
	 * @since 2.0.21.0
	 */
	FORMATPAINTER: 'formatpainter'
};

/**
 * A simple wrapper object to define cursors used within JSG framework.</br>
 * Currently only styles are defined. More functionality might be added in future versions.
 *
 * @class Cursor
 * @constructor
 */
class Cursor {
	/**
	 * Predefined cursor style types.</br>
	 * Note: some styles exactly match their CSS counter parts while others define custom styles. Custom cursor styles
	 * are loaded during framework initialization in {{#crossLink "JSG/init:method"}}{{/crossLink}}.
	 * @class Style
	 */
	static get Style() {
		return style;
	}
}

export default Cursor;
