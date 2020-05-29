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
const settings = new Settings();
settings.set(COLUMNS, 1);
settings.set(MARGIN, 1000);

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

		item.getItems().forEach((litem, index) => {
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
		const count = this.getVisibleItemCount(item);

		if (count === 0 || !columns) {
			return false;
		}

		const margin = lsettings.get(MARGIN);
		const width = (box.getWidth() - margin * (columns + 1)) / columns;
		const rows = Math.ceil(count / columns);
		const height = 5100; // (box.getHeight() - ((rows + 1) * margin)) / Math.ceil(count / columns);

		let cnt = 0;

		item.getItems().forEach((litem, index) => {
			if (litem.isVisible()) {
				litem.getBoundingBox(newbox);

				const x = (cnt % columns) * width + ((cnt % columns) + 1) * margin;
				const y = Math.floor(cnt / columns) * height + (Math.floor(cnt / columns) + 1) * margin + 1;
				newbox.setTopLeft(x, y);
				newbox.setBottomRight(x + width, y + height);

				litem.setBoundingBoxTo(newbox);
				cnt += 1;
			}
		});

		box.setHeight(rows * height + (rows + 1) * margin);
		// finally: did something change?
		if (!oldbox.isEqualTo(box, 0.001)) {
			item.setBoundingBoxTo(box, true);
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

	static get Settings() {
		return settings;
	}
};
