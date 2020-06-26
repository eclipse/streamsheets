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
const Node = require('../model/Node');
const PolygonShape = require('../model/shapes/PolygonShape');
const ItemAttributes = require('../attr/ItemAttributes');

/**
 * A LineNode is simply a {{#crossLink "Node"}}{{/crossLink}} with a
 * {{#crossLink "PolygonShape"}}{{/crossLink}}. But in contrast to a normal node a LineNode
 * behaves more like a {{#crossLink "LineConnection"}}{{/crossLink}} for resize and selection. However,
 * the nature of a LineNode is still node driven.
 *
 * @class LineNode
 * @extends Node
 * @constructor
 */
class LineNode extends Node {
	constructor() {
		super(new PolygonShape());
		// this.setShapeTo(new PolygonShape());
		this.setItemAttribute(ItemAttributes.CLOSED, false);
		this.setItemAttribute(ItemAttributes.PORTMODE, ItemAttributes.PortMode.NONE);
	}

	newInstance() {
		return new LineNode();
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);
		return copy;
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);
		file.writeAttributeString('type', 'linenode');
	}

	getMinSize(size) {
		return 0;
	}

	containsPoint(point, findFlag) {
		let contained = false;
		const loc = JSG.ptCache.get();
		const tmppoint = JSG.ptCache.get();
		const bbox = this.getBoundingBox(JSG.boxCache.get());
		const threshold = this.getGraph().getFindRadius();

		if (point) {
			loc.setTo(point);
			loc.subtract(bbox.getTopLeft(tmppoint));
			bbox.rotateLocalPointInverse(loc);
			contained = this._shape.containsPoint(loc, findFlag, threshold);
		}
		JSG.boxCache.release(bbox);
		JSG.ptCache.release(loc, tmppoint);
		return contained;
	}
}

module.exports = LineNode;
