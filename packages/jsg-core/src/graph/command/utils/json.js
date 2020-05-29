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
const JSG = require('../../../JSG');
const JSONReader = require('../../../commons/JSONReader');
const JSONWriter = require('../../../commons/JSONWriter');
const Pin = require('../../Pin');
const Size = require('../../Size');
const NumberExpression = require('../../expr/NumberExpression');
const ShapeFactory = require('../../model/shapes/ShapeFactory');

const writeJSON = (tag, obj, decimals, cb) => {
	const writer = new JSONWriter();
	writer.writeStartDocument();
	obj.save(tag, writer, decimals);
	writer.writeEndDocument();
	if (cb) cb(writer);
	return writer.flush();
};

const writeObject = (tag, obj) => {
	const writer = new JSONWriter();
	writer.writeStartDocument();
	writer.writeStartElement(tag);
	obj.save(writer);
	writer.writeEndElement();
	writer.writeEndDocument();
	return writer.flush();
};

const readJSON = (tag, json, fn) => {
	const reader = new JSONReader(json);
	const root = reader.getObject(reader.getRoot(), tag);
	return fn({ reader, root });
};
const readObject = (rootTag, json, obj) => {
	const reader = new JSONReader(json);
	const root = reader.getObject(reader.getRoot(), rootTag);
	if (obj) obj.read(reader, root);
	return obj;
};
// readJSON('expression', data.json, (reader, root) => { expr.read(reader, root) });

const readShape = (json, type = 'type') => {
	const reader = new JSONReader(json);
	const root = reader.getObject(reader.getRoot(), 'shape');
	const shapetype = reader.getAttribute(root, 'type');
	const shape = ShapeFactory.createShapeFromString(type);
	if (shape) shape.read(reader, root);
	return shape;
};

const readGraphItem = (json, type = 'type') => {
	const reader = new JSONReader(json);
	const root = reader.getObject(reader.getRoot(), 'graphitem');
	const itemtype = reader.getAttribute(root, type);
	const item = JSG.graphItemFactory.createItemFromString(itemtype);
	if (item) item.read(reader, root);
	return item;
};
const writeGraphItem = (item) => {
	const writer = new JSONWriter();
	writer.writeStartDocument();
	item.save(writer);
	writer.writeEndDocument();
	return writer.flush();
};

const readGroupUndoInfo = (json) => ({
		pin: readObject('pin', json.pin, new Pin()),
		size: readObject('size', json.size, new Size()),
		angle: readObject('angle', json.angle, new NumberExpression()),
		subitems: json.subitems.map(item => readGroupUndoInfo(item))
});
const writeGroupUndoInfo = (group) => ({
	pin: writeJSON('pin', group.getPin()),
	size: writeJSON('size', group.getSize(true)),
	angle: writeJSON('angle', group.getAngle()),
	subitems: group.getItems().map(item => writeGroupUndoInfo(item))
});


module.exports = {
	readJSON,
	readShape,
	readObject,
	readGraphItem,
	readGroupUndoInfo,
	writeJSON,
	writeObject,
	writeGraphItem,
	writeGroupUndoInfo
};
