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
const Layout = require('./Layout');
const Settings = require('./Settings');
const ItemAttributes = require('../graph/attr/ItemAttributes');

const TYPE = 'jsg.grid.layout';
const DIRECTION = 'content.direction';
const settings = new Settings();
settings.set(DIRECTION, ItemAttributes.Direction.HORIZONTAL);

/**
 * @class GridLayout
 * @extends Layout
 * @constructor
 */
module.exports = class GridLayout extends Layout {
	getType() {
		return TYPE;
	}

	getInitialSettings(graphitem) {
		const lsettings = GridLayout.Settings.derive();
		return lsettings;
	}

	layout(graphitem) {
		const changed = this._doLayout(graphitem);
		if (changed && graphitem.getGraph()) {
			graphitem.getGraph().markDirty();
		}
		return changed;
	}

	_doLayout(item) {
		const lsettings = this.getSettings(item);
		let changed = false;
		const oldbox = item.getBoundingBox(JSG.boxCache.get());
		const box = JSG.boxCache.get().setTo(oldbox);

		if (lsettings.get('direction') === 'vertical') {
			this._layoutVertical(item, box);
		} else {
			this._layoutHorizontal(item, box);
		}
		// finally: did something change?
		if (!oldbox.isEqualTo(box, 0.001)) {
			item.setBoundingBoxTo(box, true);
			changed = true;
		}
		JSG.boxCache.release(oldbox, box);

		return changed;
	}

	_layoutVertical(item, box) {}

	_layoutHorizontal(item, box) {
		let lwidth = 0;
		let cwidth = 0;
		let rwidth = 0;
		const newbox = JSG.boxCache.get();

		// measure total sub item width
		item.getItems().forEach((litem) => {
			const attrH = litem.getItemAttributes().getAttribute('LayoutHorizontal');
			if (attrH !== undefined) {
				const alignH = attrH.getValue();
				switch (alignH) {
					case 'left':
						lwidth += litem.getWidth().getValue();
						break;
					case 'center':
						cwidth += litem.getWidth().getValue();
						break;
					case 'right':
						rwidth += litem.getWidth().getValue();
						break;
					default:
						break;
				}
			}
		});

		let currentlX = 0;
		let currentcX = 0;
		let currentrX = 0;
		const center = box.getCenter();

		currentcX = center.x - cwidth / 2;
		currentrX = box.getWidth() - rwidth;

		item.getItems().forEach((litem) => {
			const attrH = litem.getItemAttributes().getAttribute('LayoutHorizontal');
			const attrV = litem.getItemAttributes().getAttribute('LayoutVertical');

			if (attrH !== undefined) {
				const alignH = attrH.getValue();
				const alignV = attrV ? attrV.getValue() : 'top';

				litem.getBoundingBox(newbox);

				switch (alignH) {
					case 'left':
						newbox.setLeft(currentlX);
						currentlX += newbox.getWidth();
						break;
					case 'center':
						newbox.setLeft(currentcX);
						currentcX += newbox.getWidth();
						break;
					case 'right':
						newbox.setLeft(currentrX);
						currentrX += newbox.getWidth();
						break;
					default:
						break;
				}

				switch (alignV) {
					case 'top':
						newbox.setTop(0);
						break;
					case 'center':
						newbox.setTop(center.y - newbox.getHeight() / 2);
						break;
					case 'bottom':
						newbox.setTop(box.getBottom() - newbox.getHeight());
						break;
					default:
						break;
				}
				litem.setBoundingBoxTo(newbox);
			}
		});

		JSG.boxCache.release(newbox);
	}

	static get TYPE() {
		return TYPE;
	}

	static get DIRECTION() {
		return DIRECTION;
	}

	static get Settings() {
		return settings;
	}
};
