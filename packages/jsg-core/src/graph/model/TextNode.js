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


const { Operand } = require('@cedalo/parser');

const JSG = require('../../JSG');
const Node = require('./Node');
const Shape = require('./shapes/Shape');
const Paragraph = require('./Paragraph');
const RectangleShape = require('../model/shapes/RectangleShape');
const FormatAttributes = require('../attr/FormatAttributes');
const TextNodeAttributes = require('../attr/TextNodeAttributes');
const TextFormatAttributes = require('../attr/TextFormatAttributes');
const Expression = require('../expr/Expression');
const GraphUtils = require('../GraphUtils');
const Event = require('./events/Event');
const ItemAttributes = require('../attr/ItemAttributes');
const StringExpression = require('../expr/StringExpression');
const Point = require('../../geometry/Point');
const XML = require('../../commons/XML');
const MathUtils = require('../../geometry/MathUtils');

/**
 * The TextNode class extends a Node with Text capabilities. It contains the text itself and some
 * methods for font and text format handling. A text always uses a rectangular shape by default.
 * It is by default not a container, not moveable and does not provide ports, because TextNodes are
 * usually subitems of other nodes.
 *
 * @example
 *     var text = new TextNode()
 *     text.setText("Sample Text");
 *     text.getTextFormat().setFontSize(12);
 *
 * See: {{#crossLink "TextFormatAttributes"}}{{/crossLink}}
 *
 * @class TextNode
 * @extends Node
 * @param {String} [txt] Optional initial text.
 * @constructor
 */
class TextNode extends Node {
	constructor(txt) {
		super(new RectangleShape());

		const format = this.getFormat();
		format.setLineStyle(FormatAttributes.LineStyle.NONE);
		format.setFillStyle(FormatAttributes.FillStyle.NONE);

		this._text = new StringExpression(txt || 'Text');

		this.invalidateSize();

		this._paras = [];
		this._ignoreEvent = false;
		this._sizeText = new Point();

		// replace item attributes with special text node attributes:
		this.addAttribute(new TextNodeAttributes());
		this.addAttribute(new TextFormatAttributes());
	}

	newInstance() {
		return new TextNode();
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);
		copy._text = this.getText().copy();

		return copy;
	}

	/**
	 * Associates or disassociates a text node to the parent node. If a text node is
	 * associated to its parent (which is the default), it behaves differently. If not associated is not aligned
	 * within the parent and and the selection behavior is comparable to a default node.
	 *
	 * @method associate
	 * @param {boolean} flag True to associate, false to separate from parent.
	 */
	associate(flag) {
		this.getItemAttributes().setAssociated(flag);
		const tf = this.getTextFormat();
		if (flag) {
			tf.setVerticalPosition(TextFormatAttributes.VerticalTextPosition.CENTER);
			tf.setHorizontalPosition(TextFormatAttributes.HorizontalTextPosition.CENTER);
		} else {
			tf.setVerticalPosition(TextFormatAttributes.VerticalTextPosition.CUSTOM);
			tf.setHorizontalPosition(TextFormatAttributes.HorizontalTextPosition.CUSTOM);
			this.getItemAttributes().setSizeMode(TextNodeAttributes.SizeMode.WIDTH);
			this.getItemAttributes().setPortMode(ItemAttributes.PortMode.DEFAULT);
		}
	}

	isAssociated() {
		return this.getItemAttributes()
			.getAssociated()
			.getValue();
	}

	containsPoint(point, findFlag) {
		return super.containsPoint(point, Shape.FindFlags.AREA);
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);
		file.writeAttributeString('type', 'text');

		this._text.save('text', file, absolute ? this : undefined);
	}

	_assignName(id) {
		const name = this.getGraph().getUniqueName('Label');
		this.setName(name);
	}

	read(reader, object) {
		super.read(reader, object);

		const text = reader.getObject(object, 'text');
		if (text !== undefined) {
			this._text.read(reader, text);
		}
	}

	readAttributes(reader, object) {
		// overwritten to handle old diagrams...
		super.readAttributes(reader, object);

		// ensure we have node attributes!!
		const itemattributes = this.getItemAttributes();
		if (!(itemattributes instanceof TextNodeAttributes)) {
			// replace item attributes with special text node attributes:
			const nodeattributes = new TextNodeAttributes();
			this.addAttribute(nodeattributes);
		}
	}

	getParas() {
		return this._paras;
	}

	getTextSize() {
		return this._sizeText;
	}

	/**
	 * Get current text content expression.
	 *
	 * @method getText
	 * @return {BooleanExpression} Returns current text expression.
	 */
	getText() {
		return this._text;
	}

	/**
	 * Assign new text or text expression to TextNode.
	 *
	 * @method setText
	 * @param {BooleanExpression|String} text New text or text expression.
	 */
	setText(text) {
		let changed = false;

		function getReferencedAttribute(term) {
			const operand = term && term.operand;
			return operand && operand.type === Operand.TYPE.REFERENCE ? operand.getAttribute() : undefined;
		}

		if (text instanceof Expression) {
			// simply apply new expression
			changed = this._text.setExpressionOrValue(text);
		} else if (text !== undefined) {
			// we might have to change an attribute value:
			const attribute = getReferencedAttribute(this._text.getTerm());
			if (attribute !== undefined) {
				attribute.setExpressionOrValue(text);
				changed = true;
			} else {
				changed = this._text.setExpressionOrValue(text);
			}
		}

		this.invalidateSize();

		if (changed) {
			this.refresh();
			const graph = this.getGraph();
			if (graph !== undefined) {
				graph.markDirty();
			}
		}
	}

	/**
	 * Resets precalculated and cached text infos. This is necessary, if the content or the formatting of the text
	 * changed.
	 *
	 * @method invalidateSize
	 */
	invalidateSize() {
		// reset the status of the text during last text section parse
		this._lastUpdateInfo = {
			fontColor: undefined,
			fontSize: undefined,
			fontName: undefined,
			fontStyle: undefined,
			text: undefined,
			textSize: new Point(0, 0)
		};
	}

	/**
	 * Updates the size of this text node to fit the current text.</br>
	 * If the size was adjusted the label positions of the text node's parent are updated too.
	 *
	 * @method updateSize
	 */
	updateSize(force) {
		if (this._text === undefined || JSG.graphics === undefined) {
			return;
		}
		if (force !== true && this._isFeedback) {
			return;
		}

		force = false;

		let text = this._text.getValue().toString();
		const attributes = this.getItemAttributes();
		const tf = this.getTextFormat();
		const sizeMode = attributes.getSizeMode().getValue();

		if (
			sizeMode & TextNodeAttributes.SizeMode.WIDTH &&
			Math.abs(
				this._lastUpdateInfo.textSize.x -
					this.getSize()
						.getWidth()
						.getValue()
			) > 1
		) {
			force = true;
		}

		if (
			sizeMode & TextNodeAttributes.SizeMode.HEIGHT &&
			Math.abs(
				this._lastUpdateInfo.textSize.y -
					this.getSize()
						.getHeight()
						.getValue()
			) > 1
		) {
			force = true;
		}

		// if an icon is defined, use that and force recalc
		if (tf.getIcon().getValue() !== 0) {
			force = true;
			text = String.fromCharCode(tf.getIcon().getValue());
		}

		if (force !== true) {
			if (this._lastUpdateInfo.text === text && this._lastUpdateInfo.fontColor === tf.getFontColor().getValue()) {
				return;
			}
			if (text.length === 0) {
				return;
			}
		}

		if (text === '#[LocalDate]') {
			const d = new Date();
			text = `${d.toLocaleDateString(undefined, {year: '2-digit', month: '2-digit', day: '2-digit'})} ${d.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'})}`;
		}

		this._paras = this._splitParas(text);

		let width = this._sizeText.x;
		let height = this._sizeText.y;
		let p;

		if (sizeMode !== TextNodeAttributes.SizeMode.NONE) {
			if (sizeMode === TextNodeAttributes.SizeMode.TEXT) {
				if (this._parent !== undefined) {
					const hAlign = tf.getHorizontalAlignment().getValue();
					const vAlign = tf.getVerticalAlignment().getValue();
					if (
						this.getSize()
							.getWidth()
							.hasFormula()
					) {
						width = this.getSize().getWidth();
					}
					if (
						this.getSize()
							.getHeight()
							.hasFormula()
					) {
						height = this.getSize().getHeight();
					}
					const oldWidth = this.getWidth().getValue();
					const oldHeight = this.getHeight().getValue();
					if (oldWidth !== this._sizeText.x) {
						switch (hAlign) {
							case TextFormatAttributes.TextAlignment.LEFT:
								p = this.getPinPoint();
								p.x -= (oldWidth - this._sizeText.x) / 2;
								break;
							case TextFormatAttributes.TextAlignment.RIGHT:
								p = this.getPinPoint();
								p.x += (oldWidth - this._sizeText.x) / 2;
								break;
							default:
								break;
						}
					}
					if (oldHeight !== this._sizeText.y) {
						switch (vAlign) {
							case TextFormatAttributes.VerticalTextAlignment.TOP:
								if (p === undefined) {
									p = this.getPinPoint();
								}
								p.y -= (oldHeight - this._sizeText.y) / 2;
								break;
							case TextFormatAttributes.VerticalTextAlignment.BOTTOM:
								if (p === undefined) {
									p = this.getPinPoint();
								}
								p.y += (oldHeight - this._sizeText.y) / 2;
								break;
							default:
								break;
						}
					}
				}
			} else {
				if (this._parent !== undefined) {
					if (
						this.getSize()
							.getWidth()
							.hasFormula() ||
						sizeMode & TextNodeAttributes.SizeMode.WIDTH
					) {
						width = this.getSize().getWidth();
						const vAlign = tf.getVerticalAlignment().getValue();
						const oldHeight = this.getHeight().getValue();
						if (oldHeight !== this._sizeText.y) {
							switch (vAlign) {
								case TextFormatAttributes.VerticalTextAlignment.TOP:
									p = this.getPinPoint();
									p.y -= (oldHeight - this._sizeText.y) / 2;
									break;
								case TextFormatAttributes.VerticalTextAlignment.BOTTOM:
									p = this.getPinPoint();
									p.y += (oldHeight - this._sizeText.y) / 2;
									break;
								default:
									break;
							}
						}
					}
				}
				if (
					this.getSize()
						.getHeight()
						.hasFormula() ||
					sizeMode & TextNodeAttributes.SizeMode.HEIGHT
				) {
					height = this.getSize().getHeight();
				}
			}

			if (
				!this.getSize()
					.getHeight()
					.hasFormula()
			) {
				height = Math.max(attributes.getMinimumHeight().getValue(), height);
			}
			if (
				!this.getSize()
					.getHeight()
					.hasFormula() &&
				attributes.getMaximumHeight().getValue() > 0
			) {
				height = Math.min(attributes.getMaximumHeight().getValue(), height);
			}

			if (!this._size.isEqualTo(width, height)) {
				this._ignoreEvent = true;
				this.setSize(width, height);
				if (p !== undefined) {
					this._pin.setPoint(p.x, p.y);
				}

				this._ignoreEvent = false;

				if (this.getParent() && this.isAssociated()) {
					this.getParent().updateLabelPositions();
				}
			}
		}
		this._lastUpdateInfo.textSize.x = this.getSize()
			.getWidth()
			.getValue();
		this._lastUpdateInfo.textSize.y = this.getSize()
			.getHeight()
			.getValue();
		this._lastUpdateInfo.fontColor = tf.getFontColor().getValue();
		this._lastUpdateInfo.fontSize = tf.getFontSize().getValue();
		this._lastUpdateInfo.fontName = tf.getFontName().getValue();
		this._lastUpdateInfo.fontStyle = tf.getFontStyle().getValue();
	}

	_splitParas(text) {
		const self = this;
		const tf = this.getTextFormat();
		const { graphics } = JSG;
		const cs = graphics.getCoordinateSystem();
		const paras = [];
		let para;
		const attributes = this.getItemAttributes();

		this._lastUpdateInfo.text = text;

		if (text === '') {
			const metrics = this._getLogFontMetrics(tf.getFontName().getValue(), tf.getFontSize().getValue());
			if (attributes.getSizeMode().getValue() & TextNodeAttributes.SizeMode.WIDTH) {
				this._sizeText.x = this.getSize()
					.getWidth()
					.getValue();
			} else {
				this._sizeText.x = 200;
			}
			this._sizeText.y = metrics.lineheight + metrics.descent;
			return undefined;
		}

		text = this.repair(text);

		// set up div with formatting

		let div = document.getElementById('jsgTextEditSplit');
		if (!div) {
			div = document.createElement('div');
			div.style.visibility = 'hidden';
			div.contentEditable = 'true';
			div.id = 'jsgTextEditSplit';
			div.tabIndex = '5';
			div.style.position = 'absolute';
			div.style.minHeight = '5px';
			div.style.minWidth = '5px';
			div.style.left = '0px';
			div.style.overflow = 'visible';
			div.style.cssFloat = 'none';
			div.style.boxSizing = 'border-box';
			div.style.display = 'inline-block';
			div.style.top = '0px';
			div.style.left = '0px';
			div.style.whiteSpace = 'normal';
			// add to body to enable retrievement of css style infos
			document.body.appendChild(div);
		}

		if (attributes.getSizeMode().getValue() & TextNodeAttributes.SizeMode.WIDTH) {
			div.style.wordWrap = 'break-word';
		}

		div.innerHTML = text.length ? text : ' ';
		div.style.fontSize = `${tf.getFontSize().getValue()}pt`;
		div.style.fontFamily = tf.getFontName().getValue();
		div.style.fontWeight = tf.getFontStyle().getValue() & TextFormatAttributes.FontStyle.BOLD ? 'bold' : 'normal';
		div.style.fontStyle =
			tf.getFontStyle().getValue() & TextFormatAttributes.FontStyle.ITALIC ? 'italic' : 'normal';
		div.style.color = tf.getFontColor().getValue();
		div.style.textDecoration =
			tf.getFontStyle().getValue() & TextFormatAttributes.FontStyle.UNDERLINE ? 'underline' : 'none';
		div.style.textAlign = this.getTextAlign();
		div.style.lineHeight = tf.getLineHeight().getValue();

		div.style.paddingLeft = `${cs.logToDeviceXNoZoom(attributes.getLeftMargin().getValue())}px`;
		div.style.paddingTop = `${cs.logToDeviceYNoZoom(attributes.getTopMargin().getValue())}px`;
		div.style.paddingRight = `${cs.logToDeviceXNoZoom(attributes.getRightMargin().getValue())}px`;
		div.style.paddingBottom = `${cs.logToDeviceYNoZoom(attributes.getBottomMargin().getValue())}px`;

		if (attributes.getSizeMode().getValue() & TextNodeAttributes.SizeMode.WIDTH) {
			const width = Math.ceil(
				cs.logToDeviceXNoZoom(
					this.getSize()
						.getWidth()
						.getValue(), false
				)
			);
			// add border width
			div.style.width = `${width}px`;
			div.style.maxWidth = `${width}px`;
		} else {
			div.style.width = '';
			div.style.maxWidth = '';
		}

		this._sizeText.x = cs.deviceToLogXNoZoom(div.getBoundingClientRect().width, false);
		this._sizeText.y = cs.deviceToLogYNoZoom(div.getBoundingClientRect().height, false);
		// this._sizeText.x = cs.deviceToLogXNoZoom(div.clientWidth);
		// this._sizeText.y = cs.deviceToLogYNoZoom(div.clientHeight);
		this._heightLimit = this.getHeightLimit();
		this._widthLimit = this.getWidthLimit();

		let quit = false;
		let paraLast;

		XML.iterateChildNodes(this, div, (source, subnode) => {
			switch (subnode.nodeName.toLowerCase()) {
				case 'u':
				case 'em':
				case 'p':
				case '#text':
					para = new Paragraph(self, Paragraph.PARAGRAPH);
					quit = para.set(subnode, paraLast);
					if (para._sections.length) {
						paras.push(para);
						paraLast = para;
					}
					break;
				case 'ul':
				case 'ol':
					XML.iterateChildren(this, subnode, (child, listnode) => {
						switch (listnode.nodeName.toLowerCase()) {
							case 'li':
								para = new Paragraph(
									self,
									subnode.nodeName.toLowerCase() === 'ul' ? Paragraph.LIST_UL : Paragraph.LIST_OL
								);
								quit = para.set(listnode, paraLast);
								if (para._sections.length) {
									paras.push(para);
									paraLast = para;
								}
								break;
							default:
								break;
						}
						return quit;
					});
					break;
				default:
					break;
			}
			return quit;
		});

		// document.body.removeChild(div);

		return paras;
	}

	repair(text) {
		if (text.indexOf('<p>') === -1 && text.indexOf('<ul>') === -1 && text.indexOf('<ol>') === -1) {
			if (text.length) {
				text = `<p>${text}</p>`;
			} else {
				text = '<p>&nbsp</p>';
			}
		}
		// replace old line breaks
		if (text.indexOf('\n') !== -1) {
			text = text.replace(/\n/g, '<br>');
		}

		return text;
	}

	_getLogEm(graphics, tf) {
		// get em size in pixel based on text node global font
		const empx = (tf.getFontSize().getValue() / 72) * JSG.dpi.y;
		// get em size in log units
		return graphics.getCoordinateSystem().deviceToLogYNoZoom(empx);
	}

	_getLogFontMetrics(name, size) {
		const metrics = GraphUtils.getFontMetricsEx(name, size);

		return metrics;
	}

	/**
	 * Convenience method to access the current horizontal text alignment as String.
	 *
	 * @method getTextAlign
	 * @return {String} The horizontal text align as string, i.e. either "center", "left" or "right".
	 */
	getTextAlign() {
		switch (
			this.getTextFormat()
				.getHorizontalAlignment()
				.getValue()
		) {
			case TextFormatAttributes.TextAlignment.CENTER:
				return 'center';
			case TextFormatAttributes.TextAlignment.RIGHT:
				return 'right';
			default:
				break;
		}
		return 'left';
	}

	evaluate() {
		// TODO: JSG.idUpdater is set by JSGGlobals
		if (!this._reading && (JSG.idUpdater && !JSG.idUpdater.isActive)) {
			super.evaluate();
			this.getTextFormat().evaluate(this);
			this._text.evaluate(this);
		}
	}

	invalidateTerms() {
		super.invalidateTerms();
		this._text.invalidateTerm();
	}

	// overwritten to handle text format changes...
	sendPostEvent(event) {
		const ID = Event;

		if (!this.areEventsEnabled()) {
			return;
		}

		switch (event.id) {
			case ID.SIZE:
			case ID.BBOX:
				if (this._ignoreEvent === false) {
					this.invalidateSize();
				}
				break;
			case ID.ATTRIBUTE:
				// text attribute event ?
				if (event.isCategory(TextFormatAttributes.NAME)) {
					this.invalidateSize();
				}
				if (event._attribute) {
					const name = event._attribute.getName();
					switch (name) {
						case 'sizemode':
						case 'marginleft':
						case 'marginright':
						case 'margintop':
						case 'marginbottom':
							this.invalidateSize();
							break;
						default:
							break;
					}
				}
				break;
			default:
				break;
		}

		super.sendPostEvent(event);
	}

	_doRefresh(force) {
		super._doRefresh(force);
		this.updateSize();
	}

	getHeightLimit() {
		const attributes = this.getItemAttributes();

		if (attributes.getSizeMode().getValue() & TextNodeAttributes.SizeMode.HEIGHT) {
			return this.getSize()
				.getHeight()
				.getValue();
		}

		if (attributes.getMaximumHeight().getValue()) {
			return attributes.getMaximumHeight().getValue();
		}

		return undefined;
	}

	getWidthLimit() {
		let margin;
		const attributes = this.getItemAttributes();

		if (attributes.getSizeMode().getValue() & TextNodeAttributes.SizeMode.WIDTH) {
			margin = attributes.getLeftMargin().getValue() + attributes.getTopMargin().getValue();
			return (
				this.getSize()
					.getWidth()
					.getValue() - margin
			);
		}

		return undefined;
	}

}

module.exports = TextNode;
