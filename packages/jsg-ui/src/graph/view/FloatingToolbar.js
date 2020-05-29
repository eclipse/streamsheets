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
/* global document */

import { default as JSG } from '@cedalo/jsg-core';

/**
 * Abstract Tool to display a single tool.
 *
 * @class Tool
 * @constructor
 * @param {String} id Id of tool.
 * @param {function} callback Function to call, if button is clicked.
 */
class Tool {
	constructor(id, callback) {
		this._id = id;
		this._callback = callback;
	}

	execute() {
		this._callback.call(this);
	}
}

/**
 * View to display a button
 *
 * @class ToolButton
 * @extends Tool
 * @constructor
 * @param {String} id Id of tool.
 * @param {function} callback Function to call, if button is clicked.
 * @param {String} namedImage URL of image to use for display.
 */
class ToolButton extends Tool {
	constructor(id, callback, image) {
		super(id, callback);

		const div = document.createElement('div');

		const onMouseDown = (ev) => {
			ev.preventDefault();
		};

		const onMouseOver = (ev) => {
			div.style.border = '1px solid #CCCCCC';
		};

		const onMouseOut = (ev) => {
			div.style.border = '1px solid #F5F0F0';
		};

		const onMouseUp = (ev) => {
			this._callback.call(this);
		};

		div.id = id;
		div.tabIndex = -1;
		div.style.resize = 'none';
		div.style.border = 'none';
		div.style.border = '1px solid #F5F0F0';
		div.style.backgroundColor = '#F5F0F0';
		div.style.backgroundImage = `url(${JSG.imagePool.getURL(image)})`;
		div.style.backgroundPosition = 'center';
		div.style.backgroundRepeat = 'no-repeat';
		div.style.minHeight = '24px';
		div.style.minWidth = '24px';
		div.style.overflow = '';
		div.style.float = 'left';
		div.style.cursor = 'pointer';
		div.addEventListener('mousedown', onMouseDown, false);
		div.addEventListener('mouseover', onMouseOver, false);
		div.addEventListener('mouseout', onMouseOut, false);
		div.addEventListener('mouseup', onMouseUp, false);
		div.__tool = this;

		this._element = div;
		this._state = ToolButton.State.NORMAL;
	}

	getState() {
		return this._state;
	}

	isSelected() {
		return this._state & ToolButton.State.SELECTED;
	}

	setState(state) {
		this._state = state;
		this._element.style.backgroundColor = this._state & ToolButton.State.SELECTED ? '#CECECE' : '#F5F0F0';
	}

	static get State() {
		return {
			NORMAL: 0,
			SELECTED: 1,
			INDETERMINATE: 2
		};
	}
}

/**
 * Tool to display a separator
 *
 * @class ToolSeparator
 * @extends Tool
 * @constructor
 */
class ToolSeparator extends Tool {
	constructor() {
		super();

		const onMouseDown = (ev) => {
			ev.preventDefault();
		};

		const div = document.createElement('div');

		div.tabIndex = -1;
		div.style.border = 'none';
		div.style.backgroundColor = 'none';
		div.style.float = 'left';
		div.style.height = '24px';
		div.style.margin = '0px 5px 0px 5px';
		div.addEventListener('mousedown', onMouseDown, false);
		div.__tool = this;

		this._element = div;
	}
}

/**
 * Tool to display a break in the toolbar
 *
 * @class ToolBreak
 * @extends Tool
 * @constructor
 */
class ToolBreak extends Tool {
	constructor() {
		super();

		const onMouseDown = (ev) => {
			ev.preventDefault();
		};

		const div = document.createElement('span');

		div.tabIndex = -1;
		div.style.border = 'none';
		div.style.backgroundColor = 'none';
		div.style.margin = '5px 0px 0px 0px';
		div.style.float = 'left';
		div.style.clear = 'left';
		div.addEventListener('mousedown', onMouseDown, false);
		div.__tool = this;

		this._element = div;
	}
}

/**
 * Tool to display a list
 *
 * @class ToolList
 * @extends Tool
 * @constructor
 * @param {String} id Id of tool.
 * @param {function} callback Function to call, if button is clicked.
 * @param {Array} listNames String Array with items to display in the list.
 * @param {Array} listValues String Array with values associated to the names. The value will be delivered with the
 *     callback, when an item in the list is selected.
 * @param {Number} size Width of the list in pixek
 * @param {String} value Current value selected in the list.
 */
class ToolList extends Tool {
	constructor(id, callback, listNames, listValues, size, value) {
		super(id, callback);

		const selectList = document.createElement('select');
		let i;

		selectList.id = id;
		selectList.style.minWidth = `${size}px`;
		selectList.style.overflow = '';
		selectList.style.float = 'left';
		selectList.style.fontSize = '8pt';
		selectList.style.minHeight = '24px';
		selectList.__tool = this;

		// Create and append the options
		for (i = 0; i < listNames.length; i += 1) {
			const option = document.createElement('option');
			option.value = listValues[i];
			option.text = listNames[i];
			selectList.appendChild(option);
		}

		selectList.addEventListener(
			'change',
			(ev) => {
				selectList.__tool._callback.call(selectList.__tool, ev.target.value);
				return false;
			},
			false
		);

		this._element = selectList;
	}

	setValue(value) {
		this._element.value = value;
	}

	getValue() {
		return this._element.value;
	}
}

/**
 * Tool to display a color selector
 *
 * @class ToolColor
 * @extends Tool
 * @constructor
 * @param {String} id Id of tool.
 * @param {function} callback Function to call, if button is clicked.
 * @param {String} value Current value selected in the list.
 */
class ToolColor extends Tool {
	constructor(id, callback, image, value) {
		super(id, callback);

		const onMouseDown = (ev) => {
			if (this._colorElement === undefined) {
				this.showColors();
			} else {
				this.hideColors();
			}
			ev.preventDefault();
			ev.stopPropagation();
		};

		function OnMouseOver(ev) {
			this.style.border = '1px solid #CCCCCC';
		}

		function OnMouseOut(ev) {
			this.style.border = '1px solid #F5F0F0';
		}

		function OnMouseUp(ev) {
			//    this.__tool._callback.call(this.__tool);
		}

		const div = document.createElement('div');

		div.id = id;
		div.tabIndex = -1;
		div.style.resize = 'none';
		div.style.border = '1px solid #F5F0F0';
		div.style.backgroundColor = '#F5F0F0';
		div.style.backgroundImage = `url(${JSG.imagePool.getURL(image)})`;
		div.style.backgroundPosition = 'center';
		div.style.backgroundRepeat = 'no-repeat';
		div.style.minHeight = '24px';
		div.style.minWidth = '24px';
		div.style.overflow = '';
		div.style.float = 'left';
		div.style.cursor = 'pointer';
		div.addEventListener('mousedown', onMouseDown, false);
		div.addEventListener('mouseover', OnMouseOver, false);
		div.addEventListener('mouseout', OnMouseOut, false);
		div.addEventListener('mouseup', OnMouseUp, false);
		div.__tool = this;

		this._element = div;
		this._colorElement = undefined;
	}

	showColors() {
		const self = this;
		const rect = this._element.getBoundingClientRect();

		const table = document.createElement('table');

		table.tabIndex = -1;
		table.style.resize = 'none';
		table.style.position = 'absolute';
		table.style.border = '1px solid #CCCCCC';
		table.style.background = '#F5F0F0';
		table.style.left = `${rect.left}px`;
		table.style.top = `${rect.bottom}px`;
		table.style.padding = '2px';
		table.style.zIndex = 102;
		table.style.minHeight = '100px';
		table.style.minWidth = '100px';
		table.style.overflow = '';
		table.style.boxShadow = '3px 3px 3px #BFBFBF';
		table.style.borderRadius = '3px';

		this.onMouseDown = (ev) => {
			this.hideColors();
			ev.preventDefault();
			ev.stopPropagation();
		};

		const OnColorMouseDown = (ev) => {
			ev.preventDefault();
			ev.stopPropagation();
		};

		function OnColorMouseUp(ev) {
			const color = this.style.backgroundColor;
			self.hideColors();
			self._callback.call(self, color);
			ev.preventDefault();
			ev.stopPropagation();
		}

		function OnColorMouseOver(ev) {
			this.style.border = '1px solid #AAAAAA';
		}

		function OnColorMouseOut(ev) {
			this.style.border = `1px solid ${this.style.backgroundColor}`;
		}

		let i;
		let tr;
		let td;

		for (i = 0; i < JSG.colors.length; i += 1) {
			if (i % 9 === 0) {
				tr = table.insertRow();
				tr.style.height = '18px';
			}

			td = tr.insertCell();
			td.style.width = '18px';
			td.style.height = '18px';
			td.style.cursor = 'pointer';
			td.addEventListener('mousedown', OnColorMouseDown, false);
			td.addEventListener('mouseup', OnColorMouseUp, false);
			td.addEventListener('mouseover', OnColorMouseOver, false);
			td.addEventListener('mouseout', OnColorMouseOut, false);
			td.style.backgroundColor = `#${JSG.colors[i]}`;
			td.style.border = `1px solid #${JSG.colors[i]}`;
		}

		document.addEventListener('mousedown', this.onMouseDown, false);
		document.body.appendChild(table);

		this._colorElement = table;
	}

	hideColors() {
		if (this._colorElement !== undefined) {
			document.body.removeChild(this._colorElement);
			document.removeEventListener('mousedown', this.onMouseDown, false);
			this._colorElement = undefined;
		}
	}

	setValue(value) {
		this._element.value = value;
	}

	getValue() {
		return this._element.value;
	}
}

/**
 * Under development
 *
 * @class FloatingToolbar
 * @constructor
 * @param {String} id Id for DIV that is created
 * @param {Point} pos Initial position of toolbar.
 */
class FloatingToolbar {
	constructor(id, pos) {
		const onMouseDown = (ev) => {
			if (ev.target.tagName.toLowerCase() !== 'select') {
				ev.preventDefault();
			}
		};

		this._div = document.createElement('div');

		this._div.id = id;
		this._div.tabIndex = -1;
		this._div.style.resize = 'none';
		this._div.style.position = 'absolute';
		this._div.style.zIndex = 101; // on top of everything and content div
		this._div.style.border = '1px solid #CCCCCC';
		this._div.style.background = '#F5F0F0';
		this._div.style.left = pos.x;
		this._div.style.padding = '2px';
		this._div.style.top = pos.y;
		this._div.style.minHeight = '10px';
		this._div.style.minWidth = '10px';
		this._div.style.overflow = '';
		this._div.style.boxShadow = '3px 3px 3px #BFBFBF';
		this._div.style.borderRadius = '3px';

		this._div.addEventListener('mousedown', onMouseDown, false);

		document.body.appendChild(this._div);

		this._break = false;
	}

	remove() {
		if (this._div !== undefined) {
			document.body.removeChild(this._div);
			this._div = undefined;
		}
	}

	/**
	 * Add a tool to the list of tools in the view
	 *
	 * @method _addTool
	 * @param {Tool} tool Tool to add to toolbar.
	 */
	addTool(tool) {
		if (this._break) {
			tool._element.style.clear = 'left';
			this._break = false;
		}

		if (tool instanceof ToolBreak) {
			this._break = true;
		}

		this._div.appendChild(tool._element);
	}

	getItemById(id) {
		let i;
		let n;
		let item;

		if (this._div && this._div.hasChildNodes()) {
			for (i = 0, n = this._div.childNodes.length; i < n; i += 1) {
				item = this._div.childNodes.item(i);
				if (item.id === id) {
					return item.__tool;
				}
			}
		}
		return undefined;
	}

	place(rect) {
		this._div.style.left = `${rect.left}px`;
		this._div.style.top = `${rect.top - this._div.clientHeight - 10}px`;
	}
}

export { Tool, ToolBreak, ToolButton, ToolColor, ToolList, ToolSeparator, FloatingToolbar };
