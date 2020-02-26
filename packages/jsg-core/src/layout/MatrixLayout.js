const JSG = require('../JSG');
const Layout = require('./Layout');
const Settings = require('./Settings');

const TYPE = 'jsg.matrix.layout';
const COLUMNS = 'content.columns';
const MARGIN = 'content.margin';
const settings = new Settings();
settings.set(COLUMNS, 2);
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

	_doLayout(item) {
		const lsettings = this.getSettings(item);
		let changed = false;
		const oldbox = item.getBoundingBox(JSG.boxCache.get());
		const box = JSG.boxCache.get().setTo(oldbox);
		const newbox = JSG.boxCache.get();

		if (item.getItemCount() === 0) {
			return false;
		}

		const columns = lsettings.get(COLUMNS);
		const margin = lsettings.get(MARGIN);
		const width = (box.getWidth() - margin * 3) / 2;
		const rows = Math.ceil(item.getItemCount() / columns);
		const height = (box.getHeight() - ((rows + 1) * margin)) / Math.ceil(item.getItemCount() / columns);

		item.getItems().forEach((litem, index) => {
			litem.getBoundingBox(newbox);

			const x = (index % columns) * width + ((index % columns) + 1) * margin;
			const y = Math.floor(index / columns) * height + (Math.floor(index / columns) + 1) * margin + 1;
			newbox.setTopLeft(x, y);
			newbox.setBottomRight(x + width, y + height);

			litem.setBoundingBoxTo(newbox);
		});

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
