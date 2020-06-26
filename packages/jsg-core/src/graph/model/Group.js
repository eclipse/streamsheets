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
const BoundingBox = require('../../geometry/BoundingBox');
const MathUtils = require('../../geometry/MathUtils');
const FormatAttributes = require('../../graph/attr/FormatAttributes');
const NumberExpression = require('../expr/NumberExpression');
const BBoxShape = require('./shapes/BBoxShape');

/**
 * This <code>GraphItem</code> subclass is used to group several <code>GraphItem</code>s together. Grouped items can
 * than be resized or formatted simply by resizing or formatting its parent <code>Group</code>.</br>
 * A {{#crossLink "Group/layouter:property"}}{{/crossLink}} property is used to arrange inner
 * <code>Group</code> items. It is allowed to replace this property with a custom layouter.
 *
 * @class Group
 * @extends GraphItem
 * @constructor
 */
class Group extends Node {
	constructor() {
		super(new BBoxShape());
		// init:
		this._pin.setLocalCoordinate(new NumberExpression(0, 'WIDTH * 0.5'), new NumberExpression(0, 'HEIGHT * 0.5'));
		this._pin.lockLocalPin(true);
		this.getFormat().setFillStyle(FormatAttributes.FillStyle.NONE);
		this.getFormat().setLineStyle(FormatAttributes.LineStyle.SOLID);
		this.getItemAttributes().setContainer(false);
	}

	newInstance() {
		return new Group();
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);
		file.writeAttributeString('type', 'group');
	}

	// overwritten to forbid adding label to group...
	isAddLabelAllowed() {
		return false;
	}

	// layout is done if bbox is changed, so...
	layout() {}

	getTopGroup() {
		let startItem = this;

		// retrieve topmost group
		do {
			if (startItem.getParent() instanceof Group) {
				startItem = startItem.getParent();
			} else {
				break;
			}
		} while (startItem);

		return startItem;
	}

	saveUndoInfo() {
		// we store pin, angle and size of each item for later restore...

		const save = (group) => {
			const items = group.getItems();
			const info = {
				pin: group.getPin().copy(),
				size: group.getSize(true).copy(),
				angle: group.getAngle().copy(),
				subitems: []
			};
			let subinfo;

			items.forEach((item) => {
				subinfo = save(item);
				info.subitems.push(subinfo);
			});

			return info;
		};

		const startItem = this.getTopGroup();

		return save(startItem);
	}

	restoreUndoInfo(info) {
		const restore = (group, linfo) => {
			const evEnabled = group.disableEvents();

			group.getPin().setTo(linfo.pin);
			group.setSizeTo(linfo.size);
			group.setAngle(linfo.angle);

			const items = group.getItems();
			let subinfo;

			items.forEach((item, i) => {
				subinfo = linfo.subitems[i];
				restore(item, subinfo);
			});

			group.evaluate();
			group.enableEvents(evEnabled);
		};

		const startItem = this.getTopGroup();
		const graph = this.getGraph();
		if (graph) {
			graph.markDirty();
		}

		restore(startItem, info);
	}

	// overwritten to calculate bounding-box based on bounding-boxes of inner items...
	adaptBoundingBoxFromChildren() {
		if (this.getItemCount() === 0) {
			// nothing to calculate as group is empty
			return false;
		}

		const newbox = this._calcBBox(JSG.boxCache.get());
		const oldPin = this.getPinPoint();
		const oldSize = this.getSizeAsPoint();

		const evEnabled = this.disableEvents();
		let center = newbox.getCenter(undefined, true);

		let pin;
		const pins = [];
		const sizes = [];
		let size;

		this.getItems().forEach((item) => {
			// get pins and sizes
			pin = item.getPinPoint();
			pin.x += oldPin.x - oldSize.x / 2;
			pin.y += oldPin.y - oldSize.y / 2;
			pins.push(pin);

			size = item.getSizeAsPoint();
			sizes.push(size);
		});

		this._bboxcache.setTo(newbox);
		this._origincache.setTo(newbox.getTopLeft());

		center = MathUtils.getRotatedPoint(center, oldPin, this.getAngle().getValue());

		this._pin._pin.set(center.x, center.y);
		this._size.set(newbox.getWidth(), newbox.getHeight());

		const groupWidth = newbox.getWidth();
		const groupHeight = newbox.getHeight();
		const Expression = NumberExpression;

		this.getItems().forEach((item, i) => {
			// get origin
			pin = pins[i];

			const evEnabled2 = item.disableEvents();
			let xExpr = groupWidth !== 0 ? `${(pins[i].x - newbox.getLeft()) / groupWidth} * Parent!WIDTH` : 0;
			let yExpr = groupHeight !== 0 ? `${(pins[i].y - newbox.getTop()) / groupHeight} * Parent!HEIGHT` : 0;

			item.getPin().setCoordinate(new Expression(0, xExpr), new Expression(0, yExpr));

			xExpr = groupWidth !== 0 ? `${sizes[i].x / groupWidth} * Parent!WIDTH` : 0;
			yExpr = groupHeight !== 0 ? `${sizes[i].y / groupHeight} * Parent!HEIGHT` : 0;

			item.setSize(new Expression(0, xExpr), new Expression(0, yExpr));
			item.evaluate();
			item.enableEvents(evEnabled2);
		});

		this.enableEvents(evEnabled);

		JSG.boxCache.release(newbox);

		const parent = this.getParent();
		if (parent) {
			if (parent instanceof Group) {
				parent.adaptBoundingBoxFromChildren();
			}
		}

		return undefined;
	}

	_calcBBox(reusebox) {
		// bounding box is total box of all items:
		const items = this.getItems();
		let i;
		const n = items.length;
		const newbox = reusebox || new BoundingBox();
		const groupPin = this.getPinPoint();
		const groupSize = this.getSizeAsPoint();
		const tmpbox = JSG.boxCache.get();

		if (n < 1) {
			return undefined;
		}

		const getUnrotatedBox = (item, box) => {
			const size = item.getSizeAsPoint();
			const center = item.getCenter();

			center.x += groupPin.x - groupSize.x / 2;
			center.y += groupPin.y - groupSize.y / 2;
			box.setTopLeft(center.x - size.x / 2, center.y - size.y / 2);
			box.setBottomRight(center.x + size.x / 2, center.y + size.y / 2);
			return box;
		};

		getUnrotatedBox(items[0], newbox);

		for (i = 1; i < n; i += 1) {
			newbox.union(getUnrotatedBox(items[i], tmpbox));
		}

		JSG.boxCache.release(tmpbox);

		return newbox;
	}
}

module.exports = Group;
