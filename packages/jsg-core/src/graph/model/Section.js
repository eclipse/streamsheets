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
/* global document NodeFilter window */

const JSG = require('../../JSG');
const TextFormatAttributes = require('../attr/TextFormatAttributes');

module.exports = class Section {
	constructor(x, y, width, text) {
		this._text = text;
		this._metrics = undefined;
		this._xOffset = x;
		this._yOffset = y;
		this._width = width;
		this._rtl = this.isArabic();
	}

	isRTL() {
		return this._rtl;
	}

	getText() {
		return this._text;
	}

	setText(text) {
		this._text = text;
	}

	assignFormat(textNode, domNode) {
		while (domNode && domNode.parentNode) {
			if (domNode.nodeType !== 3) {
				break;
			}
			domNode = domNode.parentNode;
		}

		if (!domNode) {
			return;
		}

		const compStyle = window.getComputedStyle(domNode, null);
		if (compStyle === undefined) {
			return;
		}

		this._fontSize = Math.round((parseInt(compStyle.fontSize, 10) * 72) / JSG.dpi.y);
		this._fontName = compStyle.fontFamily;
		this._fontStyle = 0;
		this._fontColor = compStyle.color;

		if (compStyle.fontWeight === 'bold' || compStyle.fontWeight === '700') {
			this._fontStyle = TextFormatAttributes.FontStyle.BOLD;
		}

		if (compStyle.fontStyle === 'italic') {
			this._fontStyle |= TextFormatAttributes.FontStyle.ITALIC;
		}

		const tf = textNode.getTextFormat();
		if (tf.getFontStyle().getValue() & TextFormatAttributes.FontStyle.UNDERLINE) {
			this._fontStyle |= TextFormatAttributes.FontStyle.UNDERLINE;
		}

		function isTagType(node, type) {
			return node.tagName.toLowerCase() === type;
		}

		// getCompStyle does not work, instead search for <u> or style setting in parents
		while (domNode) {
			if (isTagType(domNode, 'u')) {
				this._fontStyle |= TextFormatAttributes.FontStyle.UNDERLINE;
				break;
			}
			if (domNode.style.textDecoration.indexOf('underline') !== -1) {
				this._fontStyle |= TextFormatAttributes.FontStyle.UNDERLINE;
			}
			if (isTagType(domNode, 'div')) {
				break;
			}
			domNode = domNode.parentNode;
		}

		this._metrics = textNode._getLogFontMetrics(this._fontName, this._fontSize);
	}

	measureEllipsis(graphics) {
		this.setFont(graphics);
		return graphics.measureText('...').width;
	}

	isArabic() {
		const pattern = /[\u0600-\u06FF\u0750-\u077F]/;
		const result = pattern.test(this._text);
		return result;
	}

	setFont(graphics) {
		if (this._fontStyle !== undefined) {
			graphics.setFontStyle(this._fontStyle);
		}
		if (this._fontSize !== undefined) {
			graphics.setFontSize(this._fontSize);
		}
		if (this._fontName !== undefined) {
			graphics.setFontName(this._fontName);
		}
		graphics.setFont();
	}
};
