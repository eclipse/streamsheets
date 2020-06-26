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
const JSG = require('../../JSG');
const Node = require('./Node');
const GraphItem = require('./GraphItem');
const Point = require('../../geometry/Point');
const NumberExpression = require('../expr/NumberExpression');
const RectangleShape = require('./shapes/RectangleShape');

//--------------------------------------------------------------------------------------------------
// INNER MODEL CLASS TO HOLD CONTENT AND SCROLL OFFSET (added to its pin...)
//

/**
 * A default GraphItem model to manage the content of a {{#crossLink "ContentNode"}}{{/crossLink}}.
 *
 * @class ContentPane
 * @extends GraphItem
 * @constructor
 */
class ContentPane extends GraphItem {
	constructor() {
		super(new RectangleShape());

		// use a rectangle shape:
		// this.setShapeTo(new RectangleShape());
		this.getItemAttributes().setSnapTo(false);

		// defaults:
		this.setSize(0, 0);
		// size of content pane is irrelevant...
		// set pin:
		const pin = this.getPin();
		const Expression = NumberExpression;
		pin.setCoordinate(new Expression(0), new Expression(0));
		pin.setLocalCoordinate(new Expression(0), new Expression(0));
	}

	newInstance() {
		return new ContentPane();
	}

	// overwritten to keep pin! => pin should only be changed via scroll!!
	setBoundingBoxTo(newbbox) {
		const oldbbox = this.getBoundingBox();
		if (!oldbbox.isEqualTo(newbbox, 1)) {
			this._bounds.width = newbbox.getWidth();
			this._bounds.height = newbbox.getHeight();
		}
	}

	layoutAll() {
		const notifyLayout = !!this._layout && this._layout.isEnabled(this);

		if (notifyLayout) {
			this._layout.preLayout(this);
		}

		this._subItems.forEach((item) => {
			item.layoutAll();
		});
		this.layout(true);

		if (notifyLayout) {
			this._layout.postLayout(this);
		}
	}

	isAddLabelAllowed() {
		return false;
	}

	isSelectable() {
		return false;
	}

	getPortById(id) {
		let port;
		let i;

		for (i = this._subItems.length - 1; i >= 0; i -= 1) {
			const item = this._subItems[i];
			if (item instanceof Node) {
				port = item.getPortById(id);
				if (port !== undefined) {
					break;
				}
			}
		}
		return port;
	}
}

/**
 * This is a special node instance which has a so called ContentPane as only child item. All
 * {{#crossLink "GraphItem"}}{{/crossLink}}s added to this node will actually be
 * added to this ContentPane. This is useful to manage content which takes more space than the size
 * of this ContentNode provides.</br>
 * Usually a {{#crossLink "ContentNodeView"}}{{/crossLink}} is used as a visual representation
 * which in turn uses a {{#crossLink "ScrollView"}}{{/crossLink}}
 * to display the node content.
 *
 * @class ContentNode
 * @extends Node
 * @constructor
 */
class ContentNode extends Node {
	constructor(shape) {
		super(shape || new RectangleShape());

		// this.setShapeTo((shape !== undefined) ? shape : new RectangleShape());
		this._pin.setLocalCoordinate(new NumberExpression(0, 'WIDTH * 0.5'), new NumberExpression(0, 'HEIGHT * 0.5'));

		// content pane:
		this._contentPane = undefined;
		this.setContentPane(new ContentPane());

		this._hScrollMode = JSG.ScrollBarMode.AUTO;
		this._vScrollMode = JSG.ScrollBarMode.AUTO;

		// do not allow maximizing by default
		this._allowMaximize = false;

		// TODO (ah) flag only used to signal load end... :(
		// NOT NICE => NEED SOMETHING BETTER (e.g. call refresh() with parameter to signal to discard cache...)
		this._changed = false;
	}

	newInstance() {
		const copy = new ContentNode();

		copy.setContentPane(undefined);

		return copy;
	}

	_assignId() {
		super._assignId();
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		copy._contentPane = copy.getItemAt(0);
		copy._hScrollMode = this._hScrollMode;
		copy._vScrollMode = this._vScrollMode;

		return copy;
	}

	saveContent(writer, absolute) {
		super.saveContent(writer, absolute);
		writer.writeAttributeString('type', 'contentnode');
	}

	_saveScrollPosition(writer, pos) {
		writer.writeStartElement('scrollposition');
		writer.writeAttributeString('x', pos.x);
		writer.writeAttributeString('y', pos.y);
		writer.writeEndElement();
	}

	_saveScrollMode(writer, h, v) {
		writer.writeStartElement('scrollmode');
		writer.writeAttributeString('h', h);
		writer.writeAttributeString('v', v);
		writer.writeEndElement();
	}

	_saveSubItems(writer) {
		// save scroll position...
		this._saveScrollPosition(writer, this._contentPane.getPinPoint());
		this._saveScrollMode(writer, this._hScrollMode, this._vScrollMode);

		writer.writeStartArray('graphitem');
		this._contentPane.getItems().forEach((item) => {
			item.save(writer);
		});
		writer.writeEndArray('graphitem');
	}

	read(reader, object) {
		// to ensure that items, created in the constructor are removed
		this._contentPane._subItems = [];

		super.read(reader, object);

		function readScrollPosition() {
			const pos = new Point(0, 0);
			const subnode = reader.getObject(object, 'scrollposition');
			if (subnode !== undefined) {
				let x = reader.getAttribute(subnode, 'x');
				let y = reader.getAttribute(subnode, 'y');
				x = x !== undefined ? Number(x) : 0;
				y = y !== undefined ? Number(y) : 0;
				pos.set(x, y);
			}
			return pos;
		}

		const subnode = reader.getObject(object, 'scrollmode');
		if (subnode !== undefined) {
			let h = reader.getAttribute(subnode, 'h');
			let v = reader.getAttribute(subnode, 'v');
			h = h !== undefined ? Number(h) : JSG.ScrollBarMode.AUTO;
			v = v !== undefined ? Number(v) : JSG.ScrollBarMode.AUTO;
			this.setHorizontalScrollbarMode(h);
			this.setVerticalScrollbarMode(v);
		}

		this._contentPane.setPinPointTo(readScrollPosition());

		this._changed = true;
	}

	/**
	 * Returns the GraphItem model which manages the node content.
	 *
	 * @method getContentPane
	 * @return {GraphItem} The content model.
	 */
	getContentPane() {
		return this._contentPane;
	}

	/**
	 * Sets the GraphItem model to use for managing node content.
	 *
	 * @method setContentPane
	 * @param {GraphItem} cp The content model to use.
	 */
	setContentPane(cp) {
		// remove old content pane:
		if (this._contentPane !== undefined) {
			super.removeItem(this._contentPane);
		}
		// add new content pane:
		this._contentPane = cp;
		if (this._contentPane !== undefined) {
			super.addItem(this._contentPane);
		}
	}

	// overwritten to directly pass new item to inner content pane...
	addItem(item, atIndex) {
		// have to adjust origin, to meet contentpane coordinate system...
		const origin = item.getOrigin();
		this._contentPane.translateFromParent(origin);
		item.setOriginTo(origin);
		return this._contentPane.addItem(item, atIndex);
	}

	// overwritten to directly remove item from inner content pane...
	removeItem(item) {
		this._contentPane.removeItem(item);
	}

	_doRefresh(force) {
		super._doRefresh(force);
		// refresh content pane too...
		if (this._contentPane !== undefined) {
			this._contentPane.refresh(force);
		}
		this._changed = false;
	}

	_update() {
		const changed = super._update();
		return changed || this._changed;
	}

	evaluate() {
		if (!this._reading && !JSG.idUpdater.isActive) {
			super.evaluate();
			// evaluate content pane too...
			if (this._contentPane !== undefined) {
				this._contentPane.evaluate();
			}
		}
	}

	isAddLabelAllowed() {
		return false;
	}

	/**
	 * Define the scrollbar mode for the horizontal Scrollbar.
	 *
	 * @method setHorizontalScrollbarMode
	 * @param {JSG.ScrollBarMode.} mode New mode to use.
	 * @since 1.6.0
	 */
	setHorizontalScrollbarMode(mode) {
		this._hScrollMode = mode;
	}

	/**
	 * Get the scrollbar mode of the horizontal Scrollbar.
	 *
	 * @method getHorizontalScrollbarMode
	 * @return {JSG.ScrollBarMode.} Current scrollbar mode.
	 * @since 1.6.0
	 */
	getHorizontalScrollbarMode() {
		return this._hScrollMode;
	}

	/**
	 * Define the scrollbar mode for the vertical Scrollbar.
	 *
	 * @method setVerticalScrollbarMode
	 * @param {JSG.ScrollBarMode.} mode New mode to use.
	 * @since 1.6.0
	 */
	setVerticalScrollbarMode(mode) {
		this._vScrollMode = mode;
	}

	/**
	 * Get the scrollbar mode of the vertical Scrollbar.
	 *
	 * @method getVerticalScrollbarMode
	 * @return {JSG.ScrollBarMode.} Current scrollbar mode.
	 * @since 1.6.0
	 */
	getVerticalScrollbarMode() {
		return this._vScrollMode;
	}

	// overwritten because we have to run through content pane subitems...
	getPortById(id) {
		const port = super.getPortById(id);
		return port !== undefined ? port : this._contentPane.getPortById(id);
	}

	// overwritten because we don't take subitems into account...
	getTotalBoundingRect(target, reuserect) {
		target = target !== undefined ? target : this;
		return this.getTranslatedBoundingBox(target).getBoundingRectangle(reuserect);
	}
}

module.exports = ContentNode;
