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
const LineConnection = require('./LineConnection');
const Arrays = require('../../commons/Arrays');
const Coordinate = require('../Coordinate');
const CoordinateProxy = require('../CoordinateProxy');
const GraphUtils = require('../GraphUtils');
const PortCoordinateProxy = require('../PortCoordinateProxy');
const Event = require('./events/Event');
const ShapeEvent = require('./events/ShapeEvent');

/**
 * An edge connects two {{#crossLink "Node"}}{{/crossLink}}s by establishing a
 * connection between selected node {{#crossLink "Port"}}{{/crossLink}}s. These ports
 * are referred to as source and target ports, i.e. an attached edge goes from the source port
 * to its target port. </br>
 * Note: it is not required that an edge has to be attached, i.e. both ports can be <code>undefined</code>.
 *
 *
 * @class Edge
 * @param {Shape} [shape] An optional shape which represents this connection. By default
 *     {{#crossLink "LineShape"}}{{/crossLink}} is used.
 * @extends LineConnection
 * @constructor
 */
class Edge extends LineConnection {
	constructor(shape) {
		super(shape);
		/**
		 * The connected source port or <code>undefined</code> if edge is not attached to a source.
		 *
		 * @property sourcePort
		 * @type {Port}
		 */
		this.sourcePort = undefined;
		/**
		 * The connected target port or <code>undefined</code> if edge is not attached to a target.
		 *
		 * @property targetPort
		 * @type {Port}
		 */
		this.targetPort = undefined;
		/**
		 * Id of connected source port or <code>undefined</code> if edge is not attached to a source.
		 *
		 * @property sourcePortId
		 * @type {String}
		 */
		this.sourcePortId = undefined;
		/**
		 * Id of connected target port or <code>undefined</code> if edge is not attached to a target.
		 *
		 * @property targetPortId
		 * @type {String}
		 */
		this.targetPortId = undefined;
	}

	newInstance() {
		return new Edge();
	}

	isEdge() {
		return true;
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);

		file.writeAttributeString('type', 'edge');

		this.getStartCoordinate().save('start', file);
		this.getEndCoordinate().save('end', file);

		if (this.sourcePort || this.targetPort) {
			file.writeStartElement('connection');
			if (this.sourcePort) {
				if (this.sourcePort.isMapper) {
					file.writeAttributeString('sourceid', this.sourcePort.getMappedItemPortId(this.getId()));
					file.writeAttributeString('srcmp', this.sourcePort.getId());
				} else {
					file.writeAttributeString('sourceid', this.sourcePort.getId());
				}
			}
			if (this.targetPort) {
				if (this.targetPort.isMapper) {
					file.writeAttributeString('targetid', this.targetPort.getMappedItemPortId(this.getId()));
					file.writeAttributeString('trgtmp', this.targetPort.getId());
				} else {
					file.writeAttributeString('targetid', this.targetPort.getId());
				}
			}
			file.writeEndElement();
		}
	}

	read(reader, object) {
		super.read(reader, object);

		const getPortIdFrom = (lnode, id, mpid) => {
			const portid = reader.getAttributeNumber(lnode, id);
			const mappedid = reader.getAttributeNumber(lnode, mpid);
			// 0 means undefined so:
			return mappedid !== undefined ? mappedid : portid !== undefined ? portid : undefined;
		};

		if (JSG.idUpdater.isActive) {
			JSG.idUpdater.addEdge(this);
		}

		let node = reader.getObject(object, 'start');
		this.getStartCoordinate().read(reader, node);
		node = reader.getObject(object, 'end');
		this.getEndCoordinate().read(reader, node);

		node = reader.getObject(object, 'connection');
		if (node) {
			this.sourcePortId = getPortIdFrom(node, 'sourceid', 'srcmp');
			this.targetPortId = getPortIdFrom(node, 'targetid', 'trgtmp');
		}
	}

	/**
	 * Restores the target and source port ids of this edge. This method is usually called after a
	 * copy and paste action to correctly attach copied edge to its copied node and ports.</br>
	 *
	 * @method _restoreConnections
	 * @param {Graph} graph The graph model required to access port models by id.
	 * @private
	 */
	_restoreConnections(graph) {
		let port;
		const shape = this.getShape();

		shape.disableRefresh();
		// disable refresh until both ports are set...
		if (this.sourcePortId) {
			port = graph.getPortById(this.sourcePortId);
			if (port) {
				this.setSourcePort(port);
			}
		}
		if (this.targetPortId) {
			port = graph.getPortById(this.targetPortId);
			if (port) {
				this.setTargetPort(port);
			}
		}
		shape.enableRefresh();
		// cannot call enableRefresh(true) because Nodes and therefore Ports are not correctly initialized here...
		super._restoreConnections(graph);
	}

	/**
	 * Returns the connected source port or <code>undefined</code> if this edge is not attached to a source.
	 *
	 * @method getSourcePort
	 * @return {Port} the connected source port or <code>undefined</code>
	 */
	getSourcePort() {
		return this.sourcePort;
	}

	/**
	 * Returns <code>true</code> if this edge has an attached source port, <code>false</code> otherwise. <br/>
	 * <b>Note:</b> attach means that either the sourcePortId or the sourcePort itself is defined (or both).
	 * That is because during loading of an edge's sourcePortId could have been set whereas the actual
	 * source port is not connected yet and therefore the edge sourcePort field is undefined.
	 *
	 * @method hasSourceAttached
	 * @return {Boolean} <code>true</code> if this edge has an attached source, <code>false</code> otherwise
	 */
	hasSourceAttached() {
		return !!this.sourcePortId || !!this.sourcePort;
	}

	/**
	 * Returns the connected target port or <code>undefined</code> if this edge is not attached to a target.
	 *
	 * @method getTargetPort
	 * @return {Port} the connected target port or <code>undefined</code>
	 */
	getTargetPort() {
		return this.targetPort;
	}

	/**
	 * Returns <code>true</code> if this edge has an attached target port, <code>false</code> otherwise. <br/>
	 * <b>Note:</b> attach means that either the targetPortId or the targetPort itself is defined (or both).
	 * That is because during loading an edge's targetPortId could have been set whereas the actual
	 * target port is not connected yet and therefore the edge targetPort field is undefined.
	 *
	 * @method hasSourceAttached
	 * @return {Boolean} <code>true</code> if this edge has an attached target, <code>false</code> otherwise
	 */
	hasTargetAttached() {
		return !!this.targetPortId || !!this.targetPort;
	}

	/**
	 * Connects this edge to the given source port.</br>
	 * Refer to {{#crossLink "Edge/detachPort:method"}}{{/crossLink}} to see how to detach from a port.
	 *
	 * @method setSourcePort
	 * @param {Port} port The source port to attach this edge to.
	 */
	setSourcePort(port) {
		if (port !== this.sourcePort) {
			const oldport = this.sourcePort;
			const event = this._createAttachOrDetachEvent(port, oldport);
			this.sendPreEvent(event);
			if (event.doIt === true) {
				this.sourcePort = this._registerPort(port, this.sourcePort, 'sourceNode');
				if (this.sourcePort) {
					this.sourcePortId = this.sourcePort.getId();
					this.sourcePort.addEdge(this);
					this.setStartCoordinateTo(this._createCoordinateFromPort(port, this.getStartCoordinate()));
				} else {
					this.sourcePortId = undefined;
					// we might have to set coordinate back...
					this._replaceCoordinateProxy(this.getStartCoordinate(), this.setStartCoordinateTo);
				}
				this.sendPostEvent(event);
			}
		}
	}

	/**
	 * Connects this edge to the given target port.</br>
	 * Refer to {{#crossLink "Edge/detachPort:method"}}{{/crossLink}} to see how to detach from a port.
	 *
	 * @method setTargetPort
	 * @param {Port} port The target port to attach this edge to.
	 */
	setTargetPort(port) {
		if (port !== this.targetPort) {
			const oldport = this.targetPort;
			const event = this._createAttachOrDetachEvent(port, oldport);
			this.sendPreEvent(event);
			if (event.doIt === true) {
				this.targetPort = this._registerPort(port, this.targetPort, 'targetNode');
				if (this.targetPort) {
					this.targetPortId = this.targetPort.getId();
					this.targetPort.addEdge(this);
					this.setEndCoordinateTo(this._createCoordinateFromPort(port, this.getEndCoordinate()));
				} else {
					this.targetPortId = undefined;
					// we might have to set coordinate back...
					this._replaceCoordinateProxy(this.getEndCoordinate(), this.setEndCoordinateTo);
				}
				this.sendPostEvent(event);
			}
		}
	}

	/**
	 * Creates an attach or detach event depending on specified port parameter. If it is undefined a
	 * detach event will be generated, otherwise an attach event.
	 *
	 * @method _createAttachOrDetachEvent
	 * @param {Port} port
	 * @param {Port} oldport
	 * @return {Event}
	 * @private
	 */
	_createAttachOrDetachEvent(port, oldport) {
		const event = port ? new Event(Event.EDGEATTACHED, port) : new Event(Event.EDGEDETACHED, oldport);
		event.source = this;
		return event;
	}

	/**
	 * Register this edge to specified port.
	 *
	 * @method _registerPort
	 * @param {Port} port The new port to register at.
	 * @param {Port} oldport The port to remove from.
	 * @param {String} node The edge source or target node field name.
	 * @private
	 */
	_registerPort(port, oldport, node) {
		const removeFromPort = (lport) => {
			if (lport) {
				lport.removeEdge(this);
			}
		};

		removeFromPort(oldport);
		this[node] = port ? port.getParent() : undefined;
		return port;
	}

	/**
	 * Creates a new coordinate to use as a replacement for specified old coordinate. If a port is given
	 * the new coordinate will be a {{#crossLink "CoordinateProxy"}}{{/crossLink}}, which
	 * takes care of converting the port location to the edge parent coordinate system. If the port is
	 * undefined the returned coordinate simply points to the location specified by passed old coordinate.
	 *
	 * @method _createCoordinateFromPort
	 * @param {Port} [port] The attached port. If not defined the returned coordinate point to same
	 *     location as provided oldcoordinate.
	 * @param {Coordinate} oldcoordinate The old coordinate which will be replaced by the created one.
	 * @return {Coordinate|CoordinateProxy} A new coordinate to replace the old coordinate with.
	 * @private
	 */
	_createCoordinateFromPort(port, oldcoordinate) {
		let portCoord;
		if (!port) {
			const point = oldcoordinate.toPoint(JSG.ptCache.get());
			portCoord = Coordinate.fromPoint(point);
			JSG.ptCache.release(point);
		} else {
			portCoord = new PortCoordinateProxy(port, this);
		}
		return portCoord;
	}

	_replaceCoordinateProxy(coordProxy, setter) {
		if (coordProxy instanceof CoordinateProxy) {
			setter.call(this, coordProxy.createNewCoordinate());
		}
	}

	// overwritten to preserve connected start/end coordinate proxies
	setPoints(points) {
		const shape = this._shape;
		// remove start/end coordinate: they may be connected
		const last = shape.getCoordinatesCount() - 1;

		const setPointsOf = () => {
			const event = new JSG.ShapeEvent(ShapeEvent.REPLACEPOINTS, points);
			event.source = this;
			this.sendPreEvent(event);
			if (event.doIt === true) {
				const tmppoint = JSG.ptCache.get(0, 0);
				points.forEach((point, i) => {
					tmppoint.setTo(point);
					this.translateFromParent(tmppoint);
					shape._coordinates[i].set(tmppoint.x, tmppoint.y);
				});
				// have to call layout() & refresh() because layout not necessarily calls shape.refresh()!!
				this.layout();
				shape.refresh();
				this.sendPostEvent(event);
				JSG.ptCache.release(tmppoint);
			}
		};

		// shape.disableRefresh();
		shape.disableNotification();
		// remove start- & end-coordinate if attached to remove CoordinateProxy. will be set after insert...
		const endcoord = this.hasTargetAttached() ? shape.removeCoordinateAt(last) : undefined;
		const startcoord = this.hasSourceAttached() ? shape.removeCoordinateAt(0) : undefined;
		shape.keepCoordinates(points.length);
		setPointsOf();
		if (endcoord) {
			shape.setEndCoordinateTo(endcoord);
		}
		if (startcoord) {
			shape.setStartCoordinateTo(startcoord);
		}
		// shape.enableRefresh();
		shape.enableNotification();
	}

	// overwritten to preserve start/end coordinate if any...
	_setShapeTo(newshape) {
		let coordinates;
		let startCoordinate;
		let endCoordinate;

		if (this._shape) {
			coordinates = this._shape.getCoordinates();
			if (this.hasSourceAttached()) {
				startCoordinate = Arrays.removeAt(coordinates, 0);
			}
			if (this.hasTargetAttached()) {
				endCoordinate = Arrays.removeAt(coordinates, coordinates.length - 1);
			}
			this._shape.setItem(undefined);
		}
		this._shape = newshape;
		this._shape.setItem(this);

		coordinates = this._shape.getCoordinates();
		// set start/end coordinate:
		if (startCoordinate) {
			coordinates[0] = startCoordinate;
		}
		if (endCoordinate) {
			coordinates[coordinates.length - 1] = endCoordinate;
		}
	}

	/**
	 * Disconnects this edge from specified port. The port should either be the source or target port
	 * of this edge, otherwise calling this method has no effect.
	 *
	 * @method detachPort
	 * @param {Port} port The port to detach this edge from.
	 */
	detachPort(port) {
		if (port) {
			if (port === this.sourcePort) {
				this.setSourcePort(undefined);
			} else if (port === this.targetPort) {
				this.setTargetPort(undefined);
			}
		}
	}

	getLength() {
		let pt1 = JSG.ptCache.get();
		let pt2 = JSG.ptCache.get();
		let length = 0;

		for (let i = 0, n = this.getPointsCount() - 1; i < n; i += 1) {
			pt1 = i === 0 && !!this.sourcePort ? this.getPortLocation(this.sourcePort, pt1) : this.getPointAt(i, pt1);
			pt2 =
				i + 1 === n && !!this.targetPort
					? this.getPortLocation(this.targetPort, pt2)
					: this.getPointAt(i + 1, pt2);
			length += pt2.subtract(pt1).length();
		}
		JSG.ptCache.release(pt1, pt2);
		return length;
	}

	/**
	 * Returns the center location of given port as <code>Point</code> relative to edge parent.
	 * @method getPortLocation
	 * @param {Port} port The port to get the location of.
	 * @param {Point} {reusepoint} An optional point to reuse.
	 * @return {Point} The port location relative to edge parent.
	 */
	getPortLocation(port, reusepoint) {
		const graph = this.getGraph();
		const center = port.getCenter(reusepoint);
		GraphUtils.translatePointUp(center, port, graph);
		GraphUtils.translatePointDown(center, graph, this.getParent());
		return center;
	}
}

module.exports = Edge;
