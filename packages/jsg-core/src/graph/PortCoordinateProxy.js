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
const JSG = require('../JSG');
const CoordinateProxy = require('./CoordinateProxy');
const Coordinate = require('./Coordinate');
const GraphUtils = require('./GraphUtils');

/**
 * Use setToPoint() to change this coordinate!
 *
 * @class PortCoordinateProxy
 * @constructor
 * @since 2.0.7
 */
class PortCoordinateProxy extends CoordinateProxy {
	constructor(port, edge) {
		// initial coordinate:
		const coordinate = port.getPin().getLocalCoordinate(); // so we use getLocalCoordinate() instead...
		super(coordinate);

		this._port = port;
		this._edge = edge;
	}

	// override copy to return a normal coordinate, otherwise it might could be that original coordinate could be
	// changed!!:
	copy() {
		const copy = new Coordinate();
		copy.setToPoint(this.toPoint());
		return copy;
	}

	save(name, writer) {
		// have to save last value! because we use it if we cannot restore this proxy! (e.g. edge/port)
		const point = this._coordinate.toPoint(JSG.ptCache.get());
		this._coordinate.getX().setValue(point.x);
		this._coordinate.getY().setValue(point.y);
		this._coordinate.save(name, writer);
		JSG.ptCache.release(point);
	}

	evaluate(item) {
		// evaluation must be done in scope of port...
		this._coordinate.evaluate(this._port);
	}

	// don't allow to change original coordinate:
	setX(value) {}

	setY(value) {}

	translate(dx, dy) {}

	getPortPoint(reusepoint) {
		const port = this._port;
		const graph = port.getGraph();
		const portloc = port.getPinPoint(reusepoint);
		GraphUtils.translatePointUp(portloc, port.getParent(), graph);
		GraphUtils.translatePointDown(portloc, graph, this._edge);
		return portloc;
	}

	// translate between different parents:
	toPoint(reusepoint) {
		const graph = this._port.getGraph();
		const point = this._coordinate.toPoint(reusepoint);
		GraphUtils.translatePointUp(point, this._port, graph);
		GraphUtils.translatePointDown(point, graph, this._edge);
		return point;
	}

	setToPoint(point) {
		const graph = this._edge.getGraph();
		const newpt = JSG.ptCache.get().setTo(point);
		GraphUtils.translatePointUp(newpt, this._edge, graph);
		GraphUtils.translatePointDown(newpt, graph, this._port);
		this._coordinate.setToPoint(newpt);
		JSG.ptCache.release(newpt);
	}
}

module.exports = PortCoordinateProxy;
