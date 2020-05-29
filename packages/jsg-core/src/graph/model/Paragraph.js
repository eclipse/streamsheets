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
const Section = require('./Section');
const TextNodeAttributes = require('../attr/TextNodeAttributes');

const PARAGRAPH = 1;
const LIST_OL = 2;
const LIST_UL = 3;

module.exports = class Paragraph {
	constructor(node, type) {
		this._node = node;
		this._type = type;
		this._sections = [];
	}

	static get PARAGRAPH() {
		return PARAGRAPH;
	}

	static get LIST_OL() {
		return LIST_OL;
	}

	static get LIST_UL() {
		return LIST_UL;
	}

	set(node, paraLast) {
		let i;
		let j;
		const self = this;
		const textNodes = [];
		let section;
		let textNode;
		const cs = JSG.graphics.getCoordinateSystem();

		function createSection(x, y, width, text, domNode) {
			const lsection = new Section(x, y, width, text);
			lsection.assignFormat(self._node, domNode);
			return lsection;
		}

		if (node.nodeName === '#text') {
			textNodes.push(node);
		} else {
			const filter = (lnode) => {
				if (lnode.nodeType === 3 || (lnode.tagName && lnode.tagName.toLowerCase() === 'br')) {
					return NodeFilter.FILTER_ACCEPT;
				}
				return NodeFilter.FILTER_SKIP;
			};

			const walker = document.createTreeWalker(node, NodeFilter.SHOW_ALL, filter, false);

			let currentNode = walker.nextNode();
			while (currentNode !== null) {
				textNodes.push(currentNode);
				currentNode = walker.nextNode();
			}

			if (textNodes.length === 0) {
				return true;
			}
		}

		const limit =
			this._node
				.getItemAttributes()
				.getSizeMode()
				.getValue() & TextNodeAttributes.SizeMode.WIDTH;
		let text;
		let splits;

		// split lines and set formats
		// break lines limited by width

		for (i = 0; i < textNodes.length; i += 1) {
			textNode = textNodes[i];
			text = textNode.nodeValue;

			splits = this.getSplits(textNode, limit);

			for (j = 0; j < splits.length; j += 1) {
				if (text === null) {
					section = createSection(
						cs.deviceToLogX(splits[j].offsetX),
						cs.deviceToLogY(splits[j].offsetY),
						cs.deviceToLogY(splits[j].offsetWidth),
						'',
						textNode
					);
				} else {
					const newtext = text.substring(
						splits[j].pos,
						j === splits.length - 1 ? undefined : splits[j + 1].pos
					);
					section = createSection(
						cs.deviceToLogX(splits[j].offsetX),
						cs.deviceToLogY(splits[j].offsetY),
						cs.deviceToLogY(splits[j].offsetWidth),
						newtext,
						textNode
					);
				}
				// using different layout -> do not use baseline any more
				if (
					(this._sections.length > 0 || paraLast) &&
					this._node._heightLimit &&
					section._yOffset > this._node._heightLimit - 50 /* section._metrics.baseline */
				) {
					if (j === 0 && paraLast) {
						// get last section of last paragraph
						section = paraLast._sections[paraLast._sections.length - 1];
					} else {
						section = this._sections[this._sections.length - 1];
					}
					if (section._xOffset + section._width > this._node._widthLimit) {
						if (section._text[section._text.length - 1] === ' ') {
							section._text = section._text.substring(0, section._text.length - 1);
						}
						const index = section._text.lastIndexOf(' ');
						if (index !== -1) {
							section._text = section._text.substring(0, index);
						}
					}
					//	add ellipsis to text
					section._text += '...';
					section.setFont(JSG.graphics);
					let width = cs.deviceToLogX(JSG.graphics.measureText(section._text).width);
					while (section._xOffset + width > this._node._widthLimit && section._text.length > 3) {
						const { length } = section._text;
						section._text = section._text.slice(0, length - 4) + section._text.slice(length - 3);
						width = cs.deviceToLogX(JSG.graphics.measureText(section._text).width);
					}

					return false;
				}
				this.addSection(section);
			}
		}

		return true;
	}

	// splits given line if space is reached
	getSplits(node, limit) {
		let i;
		const line = node.nodeValue;
		const splits = [];

		function giveMeDOM(html) {
			const div = document.createElement('div');
			const frag = document.createDocumentFragment();

			div.innerHTML = html;

			while (div.firstChild) {
				frag.appendChild(div.firstChild);
			}

			return frag;
		}

		let lastPos;
		const parent = node.parentNode;
		let html;
		let span;
		//	var now = Date.now();
		if (line === null) {
			return splits;
		}

		const range = document.createRange();
		let rects;
		for (i = 0; i < line.length; i += 1) {
			range.setStart(node, i);
			range.setEnd(node, i + 1);
			rects = range.getClientRects();
			// chrome BUG: returns empty list for zero-size characters!
			if (rects.length > 0) {
				if (lastPos === undefined) {
					// create initial section
					lastPos = rects[0].y;
					splits.push({
						pos: i,
						offsetX: rects[0].left,
						offsetY: rects[0].bottom,
						offsetWidth: rects[0].width
					});
				} else {
					// create new section, if new row
					if (lastPos < rects[0].y) {
						splits.push({
							pos: i,
							offsetX: rects[0].left,
							offsetY: rects[0].bottom,
							offsetWidth: rects[0].width
						});
						lastPos = rects[0].y;
					}
					splits[splits.length - 1].offsetX = Math.min(rects[0].x, splits[splits.length - 1].offsetX);
				}
			}
		}
		/*
		if (node.nodeType === 1) {
			html = "<span style='width:auto;float:none;'><span style='width:auto;float:none;'> </span></span>";
		} else if (limit) {
			html = "<span style='width:auto;float:none;'>";
			for (i = 0; i < line.length; i += 1) {
				html += `<span style='width:auto;float:none;'>${line[i]}</span>`;
			}
			html += '</span>';
		} else {
			html = `<span style='width:auto;float:none;'><span style='width:auto;float:none;'>${line}</span></span>`;
		}

		const newNode = giveMeDOM(html);
		const mainSpan = newNode.childNodes[0];
		parent.replaceChild(newNode, node);

		for (i = 0; i < mainSpan.childNodes.length; i += 1) {
			// insert span at current character
			span = mainSpan.childNodes[i];
			if (lastPos !== undefined) {
				// create new section, if new row
				if (lastPos < span.offsetTop) {
					splits.push({
						pos: i,
						offsetY: span.offsetTop,
						offsetX: span.offsetLeft,
						offsetWidth: span.offsetWidth
					});
					lastPos = span.offsetTop;
				}
			} else {
				// create initial section
				lastPos = span.offsetTop;
				splits.push({
					pos: i,
					offsetY: span.offsetTop,
					offsetX: span.offsetLeft,
					offsetWidth: span.offsetWidth
				});
			}
		}

		parent.replaceChild(node, mainSpan);
		// JSG.debug.log("End " + (Date.now() - now) + " ms", true);
		*/
		return splits;
	}

	getType() {
		return this._type;
	}

	getSections() {
		return this._sections;
	}

	addSection(section) {
		this._sections.push(section);
	}
};
