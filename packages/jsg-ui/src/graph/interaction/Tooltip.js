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

const { Point } = require('@cedalo/jsg-core');

class Tooltip {
	constructor() {
		this._timer = undefined;
		this._div = undefined;
		this._pos = new Point(0, 0);
		this._createPos = new Point(0, 0);
		this._delay = 300;
	}

	savePosition(event) {
		this._pos.x = event.event.pageX;
		this._pos.y = event.event.pageY;
	}

	translate(x, y) {
		this._pos.translate(x, y);
	}

	updateContent(text) {
		if (this._div) {
			this._div.innerHTML = text;
		}
	}

	setDelay(delay) {
		this._delay = delay;
	}

	getDelay() {
		return this._delay;
	}

	hasTooltip() {
		return this._div !== undefined && this._timer !== undefined;
	}

	startTooltip(event, content, delay, controller, createCallback) {
		this.removeTooltip();

		if (delay) {
			this._timer = setTimeout(() => {
				this.createTooltip(content, controller, createCallback);
			}, delay || this._delay);
		} else {
			this.createTooltip(content, controller, createCallback);
		}
	}

	createTooltip(content, controller, createCallback) {
		if (this._div !== undefined) {
			return;
		}

		if (createCallback) {
			this._div = createCallback();
		} else {
			this._div = document.createElement('div');
			this._div.innerHTML = content;
			this._div.tabIndex = -1;
			this._div.style.resize = 'none';
			this._div.style.position = 'absolute';
			// on top of everything and content div
			this._div.style.zIndex = 2001;
			this._div.style.border = '1px solid #333333';
			this._div.style.background = '#FFFFFF';
			this._div.style.color = '#333333';
			this._div.style.fontSize = '8pt';
			this._div.style.fontFamily = 'Roboto, Helvetica, Arial, sans-serif';
			if (this._pos.x + 200 > document.body.clientWidth) {
				this._div.style.maxWidth = '200px';
				this._div.style.right = `${document.body.clientWidth - this._pos.x}px`;
			} else {
				this._div.style.left = `${this._pos.x}px`;
			}
			this._div.style.top = `${this._pos.y + 20}px`;
			this._div.style.padding = '5px';
			this._div.style.minWidth = '10px';
			this._div.style.minHeight = '10px';
			this._div.style.overflow = '';
			// this._div.style.boxShadow = '2px 2px 2px #BFBFBF';
			this._div.style.borderRadius = '3px';
		}

		this._createPos = this._pos.copy();

		document.body.appendChild(this._div);
	}

	removeTooltip(event) {
		if (this._timer !== undefined) {
			clearTimeout(this._timer);
			this._timer = undefined;
		}

		if (this._div === undefined) {
			return;
		}

		if (event !== undefined) {
			if (
				Math.abs(this._createPos.x - event.event.pageX) < 20 &&
				Math.abs(this._createPos.y - event.event.pageY) < 20
			) {
				return;
			}
		}

		if (this._div !== undefined) {
			document.body.removeChild(this._div);
			this._div = undefined;
		}
	}
}

export default Tooltip;
