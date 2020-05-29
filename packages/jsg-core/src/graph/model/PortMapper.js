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
const Port = require('./Port');
const Dictionary = require('../../commons/Dictionary');

/**
 * A PortMapper is a special Port which used to map one or several other Ports.<br/>
 * The mapped Port can be a PortMapper too, so it is possible to create a path of PortMappers.
 *
 * @example:
 *     var edge = getMeAnEdge();
 *     var mp1 = new PortMapper();
 *     var mp2 = new PortMapper();
 *     mp1.mapPort(edge, edge.getSourcePort());
 *     edge.setSourcePort(mp1); //mapped path for edge: mp1->sourcePort
 *     mp2.mapPort(edge, edge.getSourcePort());
 *     edge.setSourcePort(mp2); //mapped path for edge: mp2->mp1->sourcePort
 *     //get mapped source port:
 *     var srcPort = mp2.getMappedItemPort(edge);
 *
 * @class PortMapper
 * @extends Port
 * @constructor
 */
class PortMapper extends Port {
	constructor() {
		super();
		this.isMapper = true;
		this._mappedPorts = new Dictionary();
	}

	/**
	 * Maps specified port for given GraphItem.<br/>
	 * This method is a shortcut for calling {{#crossLink "PortMapper/mapPortId:method"}}{{/crossLink}}
	 * with the IDs of given GraphItem and Port.
	 *
	 * @method mapPort
	 * @param {GraphItem} item The GraphItem whose ID is used as key.
	 * @param {Port} port The Port whose ID is used as mapped ID.
	 */
	mapPort(item, port) {
		this.mapPortId(item.getId(), port.getId());
	}

	/**
	 * Maps specified port ID under given key.<br/>
	 * This will replace any previously mapped port ID for the same key.
	 *
	 * @method mapPortId
	 * @param {String} key A key to identify mapped port ID.
	 * @param {String} id The port ID to map.
	 */
	mapPortId(key, id) {
		this._mappedPorts.put(key, id);
	}

	/**
	 * Returns the mapped Port for given key.<br/>
	 * <b>Note:</b> the returned Port can be a PortMapper as well. To get the first mapped Port which
	 * is not a PortMapper use {{#crossLink "PortMapper/getMappedItemPort:method"}}{{/crossLink}}.
	 *
	 * @method getMappedPort
	 * @param {String} key A key to identify mapped port.
	 * @return {Port} The mapped port instance or <code>undefined</code> if none exists.
	 */
	getMappedPort(key) {
		const id = this._mappedPorts.get(key);
		return id !== undefined ? this.getParent().getPortById(id) : undefined;
	}

	/**
	 * Returns the ID of a mapped Port for given key.<br/>
	 * <b>Note:</b> the returned ID can be a PortMapper ID as well. To get the first mapped ID which
	 * is not a PortMapper ID use {{#crossLink "PortMapper/getMappedItemPortId:method"}}{{/crossLink}}.
	 *
	 * @method getMappedPortId
	 * @param {String} key A key to identify mapped port ID.
	 * @return {String} The mapped port ID or <code>undefined</code> if none exists.
	 */
	getMappedPortId(key) {
		return this._mappedPorts.get(key);
	}

	/**
	 * Returns the first mapped Port for given key which is not a PortMapper.<br/>
	 * That means this method will traverse the path defined by connected PortMappers until a Port is
	 * found which is not a PortMapper. If no Port could be found <code>undefined</code> is returned.
	 *
	 * @method getMappedItemPort
	 * @param {String} key A key to identify mapped port.
	 * @return {Port} The mapped port instance or <code>undefined</code> if none exists.
	 */
	getMappedItemPort(key) {
		const port = this.getMappedPort(key);
		return port !== undefined ? (port.isMapper ? port.getMappedItemPort(key) : port) : undefined;
	}

	/**
	 * Returns the first mapped port ID for given key which is not the ID of a PortMapper.<br/>
	 * That means this method will traverse the path defined by connected PortMappers until a Port ID is
	 * found which is not the ID of a PortMapper. If no such ID could be found <code>undefined</code> is
	 * returned.
	 *
	 * @method getMappedItemPortId
	 * @param {String} key A key to identify mapped port ID.
	 * @return {String} The mapped port ID or <code>undefined</code> if none exists.
	 */
	getMappedItemPortId(key) {
		const port = this.getMappedItemPort(key);
		return port !== undefined ? port.getId() : undefined;
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);
		file.writeAttributeString('type', PortMapper.TYPE);
		// save mapped ports:
		file.writeStartArray('mp');

		this._mappedPorts.iterate((key, id) => {
			file.writeStartElement('mp');
			file.writeAttributeString('key', key);
			file.writeAttributeString('id', id);
			file.writeEndElement();
		});

		file.writeEndArray('mp');
	}

	read(reader, object) {
		super.read(reader, object);

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'mp': {
					const id = reader.getAttribute(child, 'id');
					const key = reader.getAttribute(child, 'key');
					if (key !== undefined && id !== undefined) {
						this.mapPortId(key, id);
					}
					break;
				}
				default:
					break;
			}
		});
	}

	/**
	 * Type constant. Used for saving and reading to and from XML.
	 *
	 * @property TYPE
	 * @type {String}
	 * @static
	 */
	static get TYPE() {
		return 'portmapper';
	}
}

module.exports = PortMapper;
