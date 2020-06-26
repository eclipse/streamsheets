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
const AbstractItemCommand = require('./AbstractItemCommand');
const AttributeList = require('../attr/AttributeList');
const Dictionary = require('../../commons/Dictionary');
const JSONReader = require('../../commons/JSONReader');
const JSONWriter = require('../../commons/JSONWriter');
const ObjectFactory = require('../../ObjectFactory');

/**
 * Command to apply several attributes to an item.<br/>
 * The attributes to change are specified by the provided map and the corresponding
 * {{#crossLink "AttributeList"}}{{/crossLink}} by the path parameter.
 *
 * @example
 *     // interactionhandler given
 *     var listpath = FormatAttributes.NAME; //"toplevel" AttributeList...
 *     var formatmap = new Dictionary();
 *     formatmap.put(FormatAttributes.FILLCOLOR, "#" + selectedColor);
 *     formatmap.put(FormatAttributes.FILLSTYLE, FormatAttributes.FillStyle.SOLID);
 *     var cmd = new SetAttributesMapCommand(item, formatmap, listpath);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class SetAttributesMapCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item GraphItem to be formatted.
 * @param {Dictionary} map The map with the attribute names and values to apply.
 * @param {String} listpath The complete path to the AttributeList which attributes should be set.
 */
class SetAttributesMapCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		const map = new Dictionary().setMap(data.map);
		return item
			? new SetAttributesMapCommand(item, map, data.path).initWithObject(
					data
			  )
			: undefined;
	}

	constructor(item, map, listpath) {
		super(item);

		function oldMap(attributes) {
			const oldmap = new Dictionary();

			function toOldMap(name) {
				const attr = attributes.getAttribute(name);
				if (attr) {
					oldmap.put(name, attr.getExpression().copy());
				}
			}

			if (attributes instanceof AttributeList) {
				map.iterate(toOldMap);
				return oldmap;
			}
			return undefined;
		}

		this._map = map;
		this._oldMap = oldMap(this._graphItem.getAttributeAtPath(listpath));
		// if oldMap is not defined listpath is not correct...
		this._listpath = this._oldMap ? listpath : undefined;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldMap = new Dictionary();

		const reader = new JSONReader(data.oldmap);
		const root = reader.getRoot();
		reader.iterateObjects(root, (name, child) => {
			const type = reader.getAttribute(child, 'type');
			const expr = ObjectFactory.create(type);
			expr.read(reader, child);
			expr.evaluate(this._graphItem);

			cmd._oldMap.put(name, expr);
		});

		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.path = this._listpath;
		data.map = this._map.getMap();
		// data.oldmap = this._oldMap.getMap();

		const attrlist = this._graphItem.getAttributeAtPath(this._listpath);
		const writer = new JSONWriter();
		writer.writeStartDocument();

		this._oldMap.iterate((name) => {
			const attr = attrlist.getAttribute(name);
			if (attr) {
				const expr = attr.getExpression();
				if (expr) {
					writer.writeStartElement(name);
					writer.writeAttributeString('type', expr.constructor.name);
					expr.save('expression', writer);
					writer.writeEndElement(name);
				}
			}
		});

		writer.writeEndDocument();
		data.oldmap = writer.flush();

		return data;
	}

	/**
	 * Undo the format operation.
	 *
	 * @method undo
	 */
	undo() {
		const attrlist = this._graphItem.getAttributeAtPath(this._listpath);
		if (attrlist) {
			attrlist.applyMap(this._oldMap, this._graphItem);
		}
	}

	/**
	 * Redo the format operation.
	 *
	 * @method redo
	 */
	redo() {
		const attrlist = this._graphItem.getAttributeAtPath(this._listpath);
		if (attrlist) {
			attrlist.applyMap(this._map, this._graphItem);
		}
	}
}

module.exports = SetAttributesMapCommand;
