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
const GraphItem = require('./GraphItem');
const Arrays = require('../../commons/Arrays');
const Point = require('../../geometry/Point');
const Coordinate = require('../Coordinate');
const GraphUtils = require('../GraphUtils');
const Expression = require('../expr/Expression');
const NumberExpression = require('../expr/NumberExpression');
const RectangleShape = require('./shapes/RectangleShape');

/**
 * A port describes a special connection point of a {{#crossLink "Node"}}{{/crossLink}}.
 * Usually use by {{#crossLink "Edge"}}{{/crossLink}}s to connect to a node.</br>
 * A port can have several incoming and outgoing edges. An edge which has its source attached to a
 * port is called an outgoing edge and an edge which has its target attached to a port is called
 * an incoming edge.
 *
 * @class Port
 * @extends GraphItem
 * @constructor
 */
class Port extends GraphItem {
	constructor() {
		super(new RectangleShape());

		this._outgoingEdges = [];
		this._incomingEdges = [];

		// use a rectangle shape:
		// this.setShapeTo(new RectangleShape());
		// as default we use center coordinate for all in-/outgoing connections
		const xExpr = new Expression(0, 'width * 0.5');
		const yExpr = new Expression(0, 'height * 0.5');
		this._centerCoord = new Coordinate(xExpr, yExpr);

		// defaults:
		this.setSize(200, 200);
		this.getPin().setLocalCoordinate(
			new NumberExpression(0, 'width * 0.5'),
			new NumberExpression(0, 'height * 0.5')
		);
	}

	newInstance() {
		return new Port();
	}

	// copy only data, that can be changed, in this case only the pin of the node, anything else should currently not be
	// changed.
	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		// copy._pin.setTo(this._pin);
		// copy._size = this._size.copy();

		copy._centerCoord.setTo(this._centerCoord);

		return copy;
	}

	saveContent(file, absolute) {
		// no saving of local pin. why? never set? always default for sure?
		if (absolute === true) {
			const absPin = this._pin._pin.copy();
			let absPoint = this._pin._pin.toPoint(JSG.ptCache.get());
			absPoint = this.getTranslatedPoint(absPoint, this.getGraph());
			// set value directly to preserve Expression formula:
			absPin.getX().setValue(absPoint.x);
			absPin.getY().setValue(absPoint.y);
			absPin.save('pin', file);
			JSG.ptCache.release(absPoint);
		} else {
			this._pin.save('pin', file);
		}

		if (this._size.getWidth().getValue() !== 200 || this._size.getHeight().getValue() !== 200) {
			this._size.save('size', file);
		}
	}

	evaluate() {
		if (!this._reading && !JSG.idUpdater.isActive) {
			super.evaluate();
			this._centerCoord.evaluate(this);
		}
	}

	/**
	 * Returns the Point to which an edge may connect, relative to specified parent.</br>
	 * Note: if no parent item is specified the Graph itself is used, i.e. the return point is relative
	 * to the origin of the outer {{#crossLink "Graph"}}{{/crossLink}}.</br>
	 *
	 * @method getConnectionPoint
	 * @param {GraphItem} [parent] The optional parent item to which returned point is relative to.
	 * @param {Point} [reusepoint] An optional point instance to reuse. If not provided a new one will be
	 *     created.
	 * @return {Point} The point to which an edge may connect.
	 */
	getConnectionPoint(parent, reusepoint) {
		const point = reusepoint || new Point();
		this.getPinPoint(point);
		parent = parent !== undefined ? parent : this.getGraph();
		GraphUtils.traverseItemUp(this.getParent(), parent, (item) => {
			item.translateToParent(point);
		});
		return point;
	}

	/**
	 * Returns a coordinate to which an edge may connect.</br>
	 * <b>Note:</b> the coordinate is relative to the origin of this port.
	 *
	 * @method getConnectionCoordinate
	 * @return {Coordinate} The coordinate to use for connection.
	 */
	getConnectionCoordinate() {
		// REQUIRED BECAUSE THIS COORDINATE IS MOVED BY LAYOUT!!!
		// NOT NECESSARILY THE SAME FOR DIFFERENT EDGEs ATTACHED TO THIS PORT!!!! => THEREFORE WE HAVE TO COPY IT!
		return this._centerCoord.copy();
		// REVIEW => THINK ABOUT DEPRECATING THIS METHOD...
	}

	/**
	 * Returns the center point of this port.</br>
	 * <b>Note:</b> the center point is relative to the origin of this port.
	 *
	 * @method getCenter
	 * @param {Point} [reusepoint] An optional point instance to reuse. If not provided a new one will be
	 *     created.
	 * @return {Point} The center point of this port.
	 */
	getCenter(reusepoint) {
		return this._shape.getPointList().getCenter(reusepoint);
	}

	/**
	 * Registers given {{#crossLink "Edge"}}{{/crossLink}} to this port.</br>
	 * The edge is either registered as outgoing or incoming edge to this port. An edge can never be
	 * registered as both in- and outgoing edge.</br>
	 * <b>Note:</b> mostly it should never be required to call this method outside the API. To attach an edge
	 * to a port use {{#crossLink "Edge/setSourcePort:method"}}{{/crossLink}} or
	 * {{#crossLink "Edge/setTargetPort:method"}}{{/crossLink}}.
	 *
	 * @method addEdge
	 * @param {Edge} edge The edge to register.
	 */
	addEdge(edge) {
		if (edge.getSourcePort() === this) {
			this._outgoingEdges.push(edge);
			Arrays.remove(this._incomingEdges, edge);
		}
		if (edge.getTargetPort() === this) {
			this._incomingEdges.push(edge);
			Arrays.remove(this._outgoingEdges, edge);
		}
	}

	/**
	 * Unregisters given {{#crossLink "Edge"}}{{/crossLink}} from this port.</br>
	 * <b>Note:</b> mostly it should never be required to call this method outside the API. To detach an edge
	 * from a port use {{#crossLink "Edge/detachPort:method"}}{{/crossLink}}.
	 *
	 * @method remvoeEdge
	 * @param {Edge} edge The edge to unregister.
	 * @return {Boolean} <code>true</code> if edge was removed, <code>false</code> otherwise
	 */
	removeEdge(edge) {
		const ret = Arrays.remove(this._outgoingEdges, edge) ? true : Arrays.remove(this._incomingEdges, edge);
		return ret;
	}

	/**
	 * Returns an <code>Array</code> of {{#crossLink "Edge"}}{{/crossLink}}s which are
	 * currently registered to this port.
	 *
	 * @method getEdges
	 * @return {Array} An array of all registered edges.
	 */
	getEdges() {
		const edges = [];
		this._incomingEdges.forEach((edge) => {
			edges.push(edge);
		});
		this._outgoingEdges.forEach((edge) => {
			edges.push(edge);
		});
		return edges;
	}

	anyEdgeSelected() {
		let sel = false;
		this._incomingEdges.forEach((edge) => {
			if (
				edge
					.getItemAttributes()
					.getSelected()
					.getValue()
			) {
				sel = true;
			}
		});
		this._outgoingEdges.forEach((edge) => {
			if (
				edge
					.getItemAttributes()
					.getSelected()
					.getValue()
			) {
				sel = true;
			}
		});

		return sel;
	}

	/**
	 * Returns the number of all {{#crossLink "Edge"}}{{/crossLink}}s which are
	 * currently registered to this port.
	 *
	 * @method getEdgesCount
	 * @return {Number} The number of all registered edges.
	 */
	getEdgesCount() {
		return this._incomingEdges.length + this._outgoingEdges.length;
	}

	/**
	 * Returns all {{#crossLink "Edge"}}{{/crossLink}}s which are currently registered
	 * as incoming edges to this port.
	 *
	 * @method getIncomingEdges
	 * @return {Array} An array of all incoming edges.
	 */
	getIncomingEdges() {
		return this._incomingEdges.slice();
	}

	/**
	 * Returns all {{#crossLink "Edge"}}{{/crossLink}}s which are currently registered
	 * as outgoing edges to this port.
	 *
	 * @method getOutgoingEdges
	 * @return {Array} An array of all outgoing edges.
	 */
	getOutgoingEdges() {
		return this._outgoingEdges.slice();
	}
}

module.exports = Port;
