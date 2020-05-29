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
const Port = require('./Port');
const State = require('./State');
const Arrays = require('../../commons/Arrays');
const Coordinate = require('../Coordinate');
const ObjectAttribute = require('../attr/ObjectAttribute');
const Expression = require('../expr/Expression');
const NumberExpression = require('../expr/NumberExpression');
const Event = require('./events/Event');
const NodeEvent = require('./events/NodeEvent');
const RectangleShape = require('./shapes/RectangleShape');

/**
 * The main usage of a node is to represent a {{#crossLink "GraphItem"}}{{/crossLink}} which can be
 * connected to other nodes. The connection between nodes is established by attaching an
 * {{#crossLink "Edge"}}{{/crossLink}} to a {{#crossLink "Port"}}{{/crossLink}}
 * of each node. So every node manages a list of ports to which an edge can connect.</br>
 * The default shape of a node is a {{#crossLink "RectangleShape"}}{{/crossLink}}.
 *
 * @class Node
 * @extends GraphItem
 * @constructor
 * @param {Shape} [shape] The shape to use for visual representation.
 */
class Node extends GraphItem {
	constructor(shape) {
		super(shape || new RectangleShape());

		this._ports = [];
		this._pin.setLocalCoordinate(new NumberExpression(0, 'WIDTH * 0.5'), new NumberExpression(0, 'HEIGHT * 0.5'));
	}

	newInstance() {
		return new Node();
	}

	_assignId() {
		super._assignId();

		// assign ids to ports, if not done already
		this._ports.forEach((port) => {
			port._assignId();
		});
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		this._ports.forEach((port) => {
			copy.addPort(port.copy(deep, ids));
		});

		return copy;
	}

	dispose() {
		super.dispose();

		this._ports.forEach((port) => {
			port.dispose();
		});
	}

	evaluate() {
		// TODO: JSG.idUpdater is set by JSGGlobals
		if (!this._reading && (JSG.idUpdater && !JSG.idUpdater.isActive)) {
			super.evaluate();
			this._ports.forEach((port) => {
				port.evaluate();
			});
		}
	}

	/**
	 * Returns the title of this node or <code>undefined</code>.<br/>
	 * The title of a Node is important for the collapse state, since it is rearranged than. By default the
	 * first inner TextNode instance is used as a title. Subclasses may overwrite this method to return
	 * a different TextNode.
	 *
	 * @method getTitle
	 * @return {TextNode} A TextNode instance representing the title of this Node or
	 * <code>undefined</code> if no title exists.
	 */
	getTitle() {
		let title;
		let i;
		let n;

		for (i = 0, n = this._subItems.length; i < n; i += 1) {
			const item = this._subItems[i];
			if (item.isTextNode() && item.isAssociated()) {
				title = item;
				break;
			}
		}
		return title;
	}

	layout(skipNotify, forceNodeLayout) {
		super.layout(skipNotify, forceNodeLayout);

		const title = this.getTitle();
		if (title) {
			this.layoutTitle(title);
		}
	}

	/**
	 * Arranges the given title TextNode.<br/>
	 * Currently the title is rearranged on collapse and restored to its original position on expand.
	 * Subclasses might overwrite this method to implement a different behaviour.
	 *
	 * @method layoutTitle
	 * @param {TextNode} title The title TextNode to rearrange.
	 */
	layoutTitle(title) {
		let state;

		if (this.isCollapsed()) {
			if (title.getAttribute('expstate') === undefined) {
				const titlepin = title.getPin();
				// first store current state:
				state = new State();
				state.addProperty('angle', title.getAngle().copy(), 'NumberExpression');
				state.addProperty('pin', titlepin.copy(), 'Pin');
				title.addAttribute(new ObjectAttribute('expstate', state));
				// then new position and angle:
				title.setAngle(0);
				titlepin.setCoordinate(
					new NumberExpression(0, 'Parent!WIDTH * 0.5'),
					new NumberExpression(0, 'Parent!HEIGHT * 0.5')
				);
				titlepin.setLocalCoordinate(
					new NumberExpression(0, 'WIDTH * 0.5'),
					new NumberExpression(0, 'HEIGHT * 0.5')
				);
				titlepin.evaluate();
			}
		} else {
			const stateattr = title.getAttribute('expstate');
			if (stateattr) {
				state = stateattr.getValue();
				title.getPin().setTo(state.getProperty('pin'));
				title.getPin().evaluate(title);
				title.setAngle(state.getProperty('angle'));
				title.removeAttribute(stateattr);
			}
		}
	}

	/**
	 * Adds given port to the list of ports this node has.
	 *
	 * @method addPort
	 * @param {Port} port The port to add.
	 * @return {Port} The added port.
	 */
	addPort(port) {
		if (this.getPortIndex(port) < 0) {
			const event = new NodeEvent(Event.PORTADD, port);
			event.source = this;
			this.sendPreEvent(event);
			if (event.doIt === true) {
				this._addPort(port);
				port.evaluate();
				this.sendPostEvent(event);
			}
		}
		return port;
	}

	_addPort(port) {
		this._ports.push(port);
		port._parent = this;
		// only create an id if it is not defined => preserves id read from xml
		if (port.getId() === undefined) {
			port.setId(this._createId());
		}
		return port;
	}

	/**
	 * Adds given port to this node at specified location. The location should be given relative to
	 * this nodes origin.</br>
	 * Note: the specified location will be converted to a relative
	 * {{#crossLink "Coordinate"}}{{/crossLink}}. That means that the port location is automatically
	 * adjusted whenever the node size changes.
	 *
	 * @method addPortAtLocation
	 * @param {Port} port The port to add.
	 * @param {Point} location The location to add the port at.
	 * @return {Port} The added port.
	 */
	addPortAtLocation(port, location) {
		const x = this.getWidth().getValue() !== 0 ? location.x / this.getWidth().getValue() : 0.5;
		const y = this.getHeight().getValue() !== 0 ? location.y / this.getHeight().getValue() : 0.5;
		const portCoordinate = new Coordinate(
			new Expression(0, `Parent!WIDTH * ${x}`),
			new Expression(0, `Parent!HEIGHT * ${y}`)
		);

		port.setPinCoordinateTo(portCoordinate);

		return this.addPort(port);
	}

	/**
	 * Adds given port to this node at specified location. The location should be already relative, i.e.
	 * it should contain factors between 0 and 1 for the x and y coordinates.</br>
	 * Note: the specified location will be converted to a relative
	 * {{#crossLink "Coordinate"}}{{/crossLink}}. That means that the port location is automatically
	 * adjusted whenever the node size changes.
	 *
	 * @method addPortAtRelativeLocation
	 * @param {Port} port The port to add.
	 * @param {Point} location The relative location factors to use.
	 * @return {Port} The added port.
	 */
	addPortAtRelativeLocation(port, location) {
		const portCoordinate = new Coordinate(
			new Expression(0, `Parent!WIDTH * ${location.x}`),
			new Expression(0, `Parent!HEIGHT * ${location.y}`)
		);
		port.setPinCoordinateTo(portCoordinate);
		return this.addPort(port);
	}

	/**
	 * Adds given port to this node at specified coordinate.
	 *
	 * @method addPortAtCoordinate
	 * @param {Port} port The port to add.
	 * @param {Coordinate} coordinate The coordinate to add the port at.
	 * @return {Port} The added port.
	 */
	addPortAtCoordinate(port, coordinate) {
		port.setPinCoordinateTo(coordinate);
		return this.addPort(port);
	}

	/**
	 * Returns the port at specified index or <code>undefined</code> if the index is out of range.
	 *
	 * @method getPortAt
	 * @param {Number} index The port index within this node.
	 * @return {Port} The port at specified index or <code>undefined</code> .
	 */
	getPortAt(index) {
		return this._ports[index];
	}

	/**
	 * Returns the index of specified port or -1 if port is not in the nodes port list.
	 *
	 * @method getPortIndex
	 * @param {Port} port The port to get the index for.
	 * @return {Number} The index of specified port or -1 if port is unknown.
	 */
	getPortIndex(port) {
		return this._ports.indexOf(port);
	}

	/**
	 * Returns the list of all ports known to this node.
	 *
	 * @method getPorts
	 * @return {Array} The list of all known ports.
	 */
	getPorts() {
		return this._ports;
	}

	/**
	 * Checks if this node has ports.
	 *
	 * @method hasPorts
	 * @return {Boolean} <code>true</code> if this node has ports, <code>false</code> otherwise.
	 */
	hasPorts() {
		return this._ports.length !== 0;
	}

	/**
	 * Removes all ports from this node.</br>
	 * <b>Note:</b> attached edges should be detached before.
	 *
	 * @method clearPorts
	 */
	clearPorts() {
		const event = new NodeEvent(Event.PORTREMOVEALL);
		event.source = this;
		this.sendPreEvent(event);
		if (event.doIt === true) {
			this._ports = [];
			this.sendPostEvent(event);
		}
	}

	/**
	 * Removes given port from this node.</br>
	 * <b>Note:</b> attached edges should be detached before.
	 *
	 * @method removePort
	 * @param {Port} port The port to remove.
	 */
	removePort(port) {
		const event = new NodeEvent(Event.PORTREMOVE, port);
		event.source = this;
		this.sendPreEvent(event);
		if (event.doIt === true) {
			Arrays.remove(this._ports, port);
			// port.changeParent(undefined); <-- causes additional events...
			port._parent = undefined;
			this.sendPostEvent(event);
		}
	}

	/**
	 * Convenience method to easily add a default port at the center of this node.
	 *
	 * @method addCenterPort
	 * @return {Port} The created and added port.
	 */
	addCenterPort() {
		return this.addPortAtCoordinate(
			new Port(),
			new Coordinate(
				new NumberExpression(0, 'Parent!WIDTH * 0.5'),
				new NumberExpression(0, 'Parent!HEIGHT * 0.5')
			)
		);
	}

	/**
	 * Convenience method which adds 4 default ports on each node side.
	 *
	 * @method addDefaultPorts
	 */
	addDefaultPorts() {
		const self = this;
		const WIDTH = 'Parent!WIDTH';
		const HEIGHT = 'Parent!HEIGHT';

		function addPortAt(xExpr, yExpr) {
			self.addPortAtCoordinate(new Port(), new Coordinate(xExpr, yExpr));
		}

		// default ports:
		addPortAt(new NumberExpression(0, `${WIDTH} * 0.5`), new NumberExpression(0));
		addPortAt(new NumberExpression(0, WIDTH), new NumberExpression(0, `${HEIGHT} * 0.5`));
		addPortAt(new NumberExpression(0, `${WIDTH} * 0.5`), new NumberExpression(0, HEIGHT));
		addPortAt(new NumberExpression(0), new NumberExpression(0, `${HEIGHT} * 0.5`));
	}

	/**
	 * Gets the port at specified location or <code>undefined</code> if this node has no port at given
	 * location.</br>
	 * Note: location must be given relative to this nodes origin.
	 *
	 * @method getPortAtLocation
	 * @param {Point} location The location to look at relative to nodes origin.
	 * @return {Port} The port at given location or <code>undefined</code> if none could be found.
	 */
	getPortAtLocation(location) {
		let port;
		const pinpoint = JSG.ptCache.get();
		let i;
		let n;

		for (i = 0, n = this._ports.length; i < n; i += 1) {
			port = this._ports[i];
			port.getPinPoint(pinpoint);
			if (Math.abs(pinpoint.x - location.x) < 100 && Math.abs(pinpoint.y - location.y) < 100) {
				break;
			} else {
				port = undefined;
			}
		}
		JSG.ptCache.release(pinpoint);
		return port;
	}

	/**
	 * Returns the port which corresponds to the given id. </br>
	 * <b>Note:</b> if this node has no port with specified id, the nodes within subitems are traversed
	 * until a port is found. If no port could be found <code>undefined</code> is returned.
	 *
	 * @method getPortById
	 * @param {Number} id The id of the port to look for.
	 * @return {Port} The corresponding port or <code>undefined</code> if none could be found.
	 */
	getPortById(id) {
		const item = this.getItemById(id);
		return item && item instanceof Port ? item : undefined;
	}

	// overwritten to check ports too...
	getItemById(id) {
		let port;
		const ports = this._ports;
		let i;
		const n = ports.length;

		for (i = 0; i < n; i += 1) {
			port = ports[i];
			if (port.getId() === id) {
				return port;
			}
		}
		return super.getItemById(id);
	}

	/**
	 * Returns a list of edges attached to this nodes, i.e. each edge is either an incoming or outgoing
	 * edge and registered to a port of this node.
	 *
	 * @method getAttachedEdges
	 * @return {Array} A list of attached edges.
	 */
	getAttachedEdges() {
		let edges = [];
		this._ports.forEach((port) => {
			edges = edges.concat(port.getEdges());
		});
		return edges;
	}

	setRefreshNeeded(flag) {
		super.setRefreshNeeded(flag);

		if (this._ports) {
			this._ports.forEach((port) => {
				port.setRefreshNeeded(flag);
			});
		}
	}

	_doRefresh(force) {
		super._doRefresh(force);
		// refresh ports too...

		this._ports.forEach((port) => {
			port.refresh(force);
		});
	}

	pathChanged() {
		// notify ports:

		this._ports.forEach((port) => {
			port.pathChanged();
		});
		super.pathChanged();
	}

	read(reader, object) {
		super.read(reader, object);

		// read ports:
		const ports = reader.getObject(object, 'ports');
		if (ports === undefined) {
			return;
		}
		reader.iterateObjects(ports, (name, child) => {
			switch (name) {
				case 'graphitem':
				case 'gi': {
					const type = reader.getAttribute(child, 'type');
					const port = JSG.graphItemFactory.createItemFromString(type || 'port', true);
					if (port) {
						this._addPort(port);
						port.read(reader, child);
					}
					break;
				}
				default:
					break;
			}
		});
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);

		file.writeAttributeString('type', 'node');
		// save ports:
		const ports = this._ports;

		if (ports.length !== 0) {
			file.writeStartElement('ports');
			file.writeStartArray('graphitem');
			ports.forEach((port) => {
				port.save(file, absolute);
			});
			file.writeEndArray('graphitem');
			file.writeEndElement();
		}
	}

	sendPostEvent(event) {
		switch (event.id) {
			case Event.ANGLE:
			case Event.SHAPEPOINTS: {
				const edges = this.getAttachedEdges();
				edges.forEach((edge) => {
					edge.getShape().invalidateVisiblePoints();
				});
				break;
			}
			default:
				break;
		}

		super.sendPostEvent(event);
	}
}

module.exports = Node;
