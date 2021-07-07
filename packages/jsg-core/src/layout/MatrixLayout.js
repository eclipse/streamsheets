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

const TYPE = 'jsg.matrix.layout';
const COLUMNS = 'content.columns';
const MARGIN = 'content.margin';
const EXPANDABLE = 'content.expandable';
const settings = new Settings();
settings.set(COLUMNS, 1);
settings.set(MARGIN, 1000);
settings.set(EXPANDABLE, false);

/**
 * @class MatrixLayout
 * @extends Layout
 * @constructor
 */
module.exports = class MatrixLayout extends Layout {
	getType() {
		return TYPE;
	}

	getInitialSettings(graphitem) {
		return MatrixLayout.Settings.derive();
	}

	layout(graphitem) {
		const changed = this._doLayout(graphitem);
		if (changed && graphitem.getGraph()) {
			graphitem.getGraph().markDirty();
		}
		return changed;
	}

	getVisibleItemCount(item) {
		let cnt = 0;

		item.subItems.forEach((litem, index) => {
			if (litem.isVisible()) {
				cnt += 1;
			}
		});

		return cnt;
	}

	_doLayout(item) {
		const lsettings = this.getSettings(item);
		let changed = false;
		const oldbox = item.getBoundingBox(JSG.boxCache.get());
		const box = JSG.boxCache.get().setTo(oldbox);
		const newbox = JSG.boxCache.get();
		const columns = lsettings.get(COLUMNS);
		const extraTopSpace = lsettings.get(EXPANDABLE) ? 600 : 0;
		const count = this.getVisibleItemCount(item);

		if (count === 0 || !columns) {
			item._layoutHeight = 2000;
			return false;
		}

		const margin = lsettings.get(MARGIN);
		const width = (box.getWidth() - margin * (columns + 1)) / columns;
		const rows = Math.ceil(count / columns);
		const height = 5100;
		let cnt = 0;

		item.subItems.forEach((litem, index) => {
			if (litem.isVisible()) {
				litem.getBoundingBox(newbox);

				const x = (cnt % columns) * width + ((cnt % columns) + 1) * margin;
				const y = Math.floor(cnt / columns) * height + (Math.floor(cnt / columns) + 1) * margin + 1 + extraTopSpace;
				newbox.setTopLeft(x, y);
				newbox.setBottomRight(x + width, y + height);

				litem.setBoundingBoxTo(newbox);
				cnt += 1;
			}
		});

		item._layoutHeight = rows * height + (rows + 1) * margin;
		// box.setHeight(rows * height + (rows + 1) * margin + extraTopSpace);
		// finally: did something change?
		if (!oldbox.isEqualTo(box, 0.001)) {
			// only change, if no formula in geometry
			// if (!item.getWidth().hasFormula()) {
			// 	item.setWidth(box.getWidth());
			// }
			// if (!item.getHeight().hasFormula()) {
			// 	item.setHeight(box.getHeight());
			// }
			// const origin = oldbox.getTopLeft();
			// const pin = item.getPin();
			// if (!pin.getX().hasFormula()) {
			// 	pin.setX(new JSG.NumberExpression(origin.x + box.getWidth() / 2));
			// }
			// if (!pin.getY().hasFormula()) {
			// 	pin.setY(new JSG.NumberExpression(origin.y + box.getHeight() / 2));
			// }
			changed = true;
		}
		JSG.boxCache.release(oldbox, box, newbox);

		return changed;
	}

	static get TYPE() {
		return TYPE;
	}

	static get COLUMNS() {
		return COLUMNS;
	}

	static get MARGIN() {
		return MARGIN;
	}

	static get EXPANDABLE() {
		return EXPANDABLE;
	}

	static get Settings() {
		return settings;
	}
};
